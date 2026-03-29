const Router = require('koa-router');
const db = require('../db');

const router = new Router();

// 提交报名
router.post('/', async ctx => {
  if (!ctx.state.user) ctx.throw(401, '请先登录');
  const { club_id, name, student_id, phone, major, introduction, skill_tags } = ctx.request.body;
  if (!club_id || !phone) ctx.throw(400, '社团ID和手机号不能为空');

  const club = db.prepare('SELECT * FROM clubs WHERE id=?').get(club_id);
  if (!club) ctx.throw(404, '社团不存在');
  if (club.status !== 'active') ctx.throw(400, '该社团暂不接受报名');
  if (!club.is_recruiting) ctx.throw(400, '该社团招新已暂停');
  if (club.recruit_end_at && new Date(club.recruit_end_at) < new Date()) ctx.throw(400, '招新已结束');
  if (club.current_count >= club.max_members) ctx.throw(400, '名额已满');

  // 检查重复报名
  const exists = db.prepare(
    'SELECT id,status FROM applications WHERE user_id=? AND club_id=?'
  ).get(ctx.state.user.id, club_id);
  if (exists && exists.status !== 'cancelled') ctx.throw(400, '已报名该社团，无需重复报名');

  // 获取用户测评标签，计算匹配度
  const assessment = db.prepare(
    'SELECT tags FROM assessments WHERE user_id=? AND status=\'completed\' ORDER BY completed_at DESC LIMIT 1'
  ).get(ctx.state.user.id);

  let matchScore = 0;
  let matchReasons = [];
  if (assessment) {
    const userTags = JSON.parse(assessment.tags || '[]');
    const clubTags = JSON.parse(club.tags || '[]');
    const matched = userTags.filter(t => clubTags.includes(t));
    matchScore = clubTags.length > 0 ? Math.round(matched.length / clubTags.length * 100) : 0;
    matchReasons = matched.slice(0, 3);
  }

  const user = db.prepare('SELECT * FROM users WHERE id=?').get(ctx.state.user.id);

  if (exists && exists.status === 'cancelled') {
    // 重新报名（之前已取消）
    db.prepare(
      'UPDATE applications SET name=?,student_id=?,phone=?,major=?,introduction=?,skill_tags=?,match_score=?,match_reasons=?,status=\'pending\',updated_at=datetime(\'now\',\'localtime\') WHERE id=?'
    ).run(name || user.name, student_id || user.student_id, phone, major || user.major, introduction || '', JSON.stringify(skill_tags || []), matchScore, JSON.stringify(matchReasons), exists.id);
  } else {
    db.prepare(
      'INSERT INTO applications (user_id,club_id,name,student_id,phone,major,introduction,skill_tags,match_score,match_reasons) VALUES (?,?,?,?,?,?,?,?,?,?)'
    ).run(ctx.state.user.id, club_id, name || user.name, student_id || user.student_id, phone, major || user.major, introduction || '', JSON.stringify(skill_tags || []), matchScore, JSON.stringify(matchReasons));
  }

  // 创建系统通知给社长
  const leaderNotif = db.prepare(
    'INSERT INTO notifications (type,title,content,target_type,target_id) VALUES (?,?,?,?,?)'
  );
  leaderNotif.run('apply_review', `新报名通知`, `${user.name || '同学'} 申请加入 ${club.name}，请及时审核。`, 'user', club.leader_id);

  ctx.body = { code: 0, message: '报名成功！请耐心等待审核~' };
});

// 获取我的报名列表
router.get('/my', async ctx => {
  if (!ctx.state.user) ctx.throw(401, '请先登录');
  const { status } = ctx.query;
  let where = 'WHERE a.user_id=? AND a.status!=\'cancelled\'';
  const params = [ctx.state.user.id];
  if (status) { where += ' AND a.status=?'; params.push(status); }

  const list = db.prepare(
    `SELECT a.*,c.name as club_name,c.cover_image,c.category,c.tags as club_tags,c.contact_info,c.status as club_status
     FROM applications a JOIN clubs c ON a.club_id=c.id ${where} ORDER BY a.created_at DESC`
  ).all(...params).map(a => ({
    ...a,
    skill_tags: JSON.parse(a.skill_tags || '[]'),
    match_reasons: JSON.parse(a.match_reasons || '[]'),
    club_tags: JSON.parse(a.club_tags || '[]'),
    contact_info: a.status === 'approved' ? JSON.parse(a.contact_info || '{}') : null
  }));

  ctx.body = { code: 0, data: list };
});

// 取消报名（仅pending状态）
router.delete('/:id', async ctx => {
  if (!ctx.state.user) ctx.throw(401, '请先登录');
  const app = db.prepare('SELECT * FROM applications WHERE id=?').get(ctx.params.id);
  if (!app) ctx.throw(404, '报名记录不存在');
  if (app.user_id !== ctx.state.user.id) ctx.throw(403, '无权限操作');
  if (app.status !== 'pending') ctx.throw(400, '只能取消待审核的报名');

  db.prepare('UPDATE applications SET status=\'cancelled\',updated_at=datetime(\'now\',\'localtime\') WHERE id=?').run(app.id);
  ctx.body = { code: 0, message: '已取消报名' };
});

// 社团端：获取本社团报名列表
router.get('/club/:club_id', async ctx => {
  if (!ctx.state.user) ctx.throw(401, '请先登录');
  const club = db.prepare('SELECT * FROM clubs WHERE id=?').get(ctx.params.club_id);
  if (!club) ctx.throw(404, '社团不存在');
  if (club.leader_id !== ctx.state.user.id && ctx.state.user.role !== 'admin') ctx.throw(403, '无权限');

  const { status, sort = 'match' } = ctx.query;
  let where = 'WHERE a.club_id=? AND a.status!=\'cancelled\'';
  const params = [ctx.params.club_id];
  if (status) { where += ' AND a.status=?'; params.push(status); }

  const orderBy = sort === 'time' ? 'ORDER BY a.created_at DESC' : 'ORDER BY a.match_score DESC, a.created_at ASC';

  const list = db.prepare(
    `SELECT a.*,u.major FROM applications a JOIN users u ON a.user_id=u.id ${where} ${orderBy}`
  ).all(...params).map(a => ({
    ...a,
    skill_tags: JSON.parse(a.skill_tags || '[]'),
    match_reasons: JSON.parse(a.match_reasons || '[]'),
  }));

  ctx.body = { code: 0, data: list };
});

// 社团端：审核报名
router.put('/:id/review', async ctx => {
  if (!ctx.state.user) ctx.throw(401, '请先登录');
  const app = db.prepare('SELECT a.*,c.leader_id,c.name as club_name FROM applications a JOIN clubs c ON a.club_id=c.id WHERE a.id=?').get(ctx.params.id);
  if (!app) ctx.throw(404, '报名记录不存在');
  if (app.leader_id !== ctx.state.user.id && ctx.state.user.role !== 'admin') ctx.throw(403, '无权限');

  const { action, reject_reason } = ctx.request.body;
  if (!['approve', 'reject'].includes(action)) ctx.throw(400, '无效的操作');
  if (action === 'reject' && !reject_reason) ctx.throw(400, '驳回需要填写原因');

  const newStatus = action === 'approve' ? 'approved' : 'rejected';
  db.prepare('UPDATE applications SET status=?,reject_reason=COALESCE(?,\'\'),updated_at=datetime(\'now\',\'localtime\') WHERE id=?').run(newStatus, reject_reason || null, app.id);

  // 如果通过，更新社团当前报名人数
  if (action === 'approve') {
    db.prepare('UPDATE clubs SET current_count=current_count+1 WHERE id=?').run(app.club_id);
  }

  // 发送通知给学生
  const title = action === 'approve' ? `恭喜！你的报名已通过审核` : `报名结果通知`;
  const content = action === 'approve'
    ? `你报名的【${app.club_name}】已通过审核，快去联系社长吧！`
    : `你报名的【${app.club_name}】未通过审核。原因：${reject_reason}`;
  db.prepare('INSERT INTO notifications (type,title,content,target_type,target_id) VALUES (?,?,?,?,?)').run('apply_review', title, content, 'user', app.user_id);

  ctx.body = { code: 0, message: action === 'approve' ? '已通过' : '已驳回' };
});

// 社团端：批量审核
router.post('/batch-review', async ctx => {
  if (!ctx.state.user) ctx.throw(401, '请先登录');
  const { ids, action, reject_reason } = ctx.request.body;
  if (!ids?.length || !action) ctx.throw(400, '参数错误');
  if (action === 'reject' && !reject_reason) ctx.throw(400, '批量驳回需填写原因');

  const newStatus = action === 'approve' ? 'approved' : 'rejected';
  const placeholders = ids.map(() => '?').join(',');
  const apps = db.prepare(
    `SELECT a.*,c.leader_id,c.name as club_name FROM applications a JOIN clubs c ON a.club_id=c.id WHERE a.id IN (${placeholders})`
  ).all(...ids);

  // 权限校验
  apps.forEach(app => {
    if (app.leader_id !== ctx.state.user.id && ctx.state.user.role !== 'admin') ctx.throw(403, '无权限操作某些报名');
  });

  const updateBatch = db.transaction(() => {
    apps.forEach(app => {
      db.prepare('UPDATE applications SET status=?,reject_reason=COALESCE(?,\'\'),updated_at=datetime(\'now\',\'localtime\') WHERE id=?').run(newStatus, reject_reason || null, app.id);
      if (action === 'approve') {
        db.prepare('UPDATE clubs SET current_count=current_count+1 WHERE id=?').run(app.club_id);
      }
      const title = action === 'approve' ? '恭喜！你的报名已通过审核' : '报名结果通知';
      const content = action === 'approve'
        ? `你报名的【${app.club_name}】已通过审核！`
        : `你报名的【${app.club_name}】未通过审核。原因：${reject_reason}`;
      db.prepare('INSERT INTO notifications (type,title,content,target_type,target_id) VALUES (?,?,?,?,?)').run('apply_review', title, content, 'user', app.user_id);
    });
  });
  updateBatch();

  ctx.body = { code: 0, message: `已批量${action === 'approve' ? '通过' : '驳回'} ${apps.length} 条报名` };
});

module.exports = router;
