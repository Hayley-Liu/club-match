const Router = require('koa-router');
const db = require('../db');

const router = new Router();

// 权限中间件
const requireAdmin = async (ctx, next) => {
  if (!ctx.state.user || ctx.state.user.role !== 'admin') ctx.throw(403, '需要管理员权限');
  await next();
};

// ========== 数据看板 ==========
router.get('/dashboard', requireAdmin, async ctx => {
  const today = new Date().toISOString().slice(0, 10);

  const stats = {
    today_assessments: db.prepare('SELECT COUNT(*) as cnt FROM assessments WHERE status=\'completed\' AND date(completed_at)=date(\'now\',\'localtime\')').get().cnt,
    today_applications: db.prepare('SELECT COUNT(*) as cnt FROM applications WHERE date(created_at)=date(\'now\',\'localtime\')').get().cnt,
    total_clubs: db.prepare('SELECT COUNT(*) as cnt FROM clubs WHERE status NOT IN (\'rejected\')').get().cnt,
    active_clubs: db.prepare('SELECT COUNT(*) as cnt FROM clubs WHERE status=\'active\' AND is_recruiting=1').get().cnt,
    pending_applications: db.prepare('SELECT COUNT(*) as cnt FROM applications WHERE status=\'pending\'').get().cnt,
    pending_clubs: db.prepare('SELECT COUNT(*) as cnt FROM clubs WHERE status=\'pending\'').get().cnt,
    total_students: db.prepare('SELECT COUNT(*) as cnt FROM users WHERE role=\'student\'').get().cnt,
    total_leaders: db.prepare('SELECT COUNT(*) as cnt FROM users WHERE role=\'leader\'').get().cnt,
    // 各分类社团分布
    category_distribution: db.prepare('SELECT category, COUNT(*) as count FROM clubs WHERE status=\'active\' GROUP BY category').all(),
    // 近7天报名趋势
    weekly_trend: db.prepare('SELECT date(created_at) as date, COUNT(*) as count FROM applications WHERE created_at >= datetime(\'now\',\'-7 days\') GROUP BY date(created_at) ORDER BY date').all(),
    // 热门社团TOP10
    top_clubs: db.prepare('SELECT c.id,c.name,c.category,c.cover_image,c.current_count,c.max_members,(SELECT COUNT(*) FROM applications WHERE club_id=c.id) as app_count FROM clubs c WHERE c.status=\'active\' ORDER BY app_count DESC LIMIT 10').all(),
  };

  ctx.body = { code: 0, data: stats };
});

// ========== 社团审核管理 ==========

// 待审核社团列表
router.get('/clubs/pending', requireAdmin, async ctx => {
  const list = db.prepare(
    'SELECT c.*,u.name as leader_name,u.phone as leader_phone FROM clubs c LEFT JOIN users u ON c.leader_id=u.id WHERE c.status=\'pending\' ORDER BY c.created_at DESC'
  ).all().map(c => ({ ...c, tags: JSON.parse(c.tags || '[]'), photos: JSON.parse(c.photos || '[]'), contact_info: JSON.parse(c.contact_info || '{}') }));
  ctx.body = { code: 0, data: list };
});

// 审核社团（单个）
router.put('/clubs/:id/review', requireAdmin, async ctx => {
  const { action, reject_reason } = ctx.request.body;
  if (!['approve', 'reject'].includes(action)) ctx.throw(400, '无效操作');
  if (action === 'reject' && !reject_reason) ctx.throw(400, '驳回需填写理由');

  const club = db.prepare('SELECT * FROM clubs WHERE id=?').get(ctx.params.id);
  if (!club) ctx.throw(404, '社团不存在');
  if (club.status !== 'pending') ctx.throw(400, '该社团不在待审核状态');

  const newStatus = action === 'approve' ? 'active' : 'rejected';
  db.prepare('UPDATE clubs SET status=?,reject_reason=COALESCE(?,\'\'),updated_at=datetime(\'now\',\'localtime\') WHERE id=?').run(newStatus, reject_reason || null, club.id);

  // 通知社长
  const title = action === 'approve' ? '🎉 社团入驻申请已通过！' : '社团入驻申请未通过';
  const content = action === 'approve'
    ? `你的社团【${club.name}】入驻申请已通过审核，现在可以完善社团信息并发布招新了！`
    : `你的社团【${club.name}】入驻申请未通过审核。原因：${reject_reason}。请修改后重新提交。`;
  db.prepare('INSERT INTO notifications (type,title,content,target_type,target_id) VALUES (?,?,?,?,?)').run('club_review', title, content, 'user', club.leader_id);

  ctx.body = { code: 0, message: action === 'approve' ? '已通过' : '已驳回' };
});

// 批量审核社团
router.post('/clubs/batch-review', requireAdmin, async ctx => {
  const { ids, action, reject_reason } = ctx.request.body;
  if (!ids?.length || !action) ctx.throw(400, '参数错误');
  if (action === 'reject' && !reject_reason) ctx.throw(400, '批量驳回需填写理由');

  const newStatus = action === 'approve' ? 'active' : 'rejected';
  const placeholders = ids.map(() => '?').join(',');
  const clubs = db.prepare(`SELECT * FROM clubs WHERE id IN (${placeholders}) AND status='pending'`).all(...ids);

  const batchUpdate = db.transaction(() => {
    clubs.forEach(club => {
      db.prepare('UPDATE clubs SET status=?,reject_reason=COALESCE(?,\'\'),updated_at=datetime(\'now\',\'localtime\') WHERE id=?').run(newStatus, reject_reason || null, club.id);
      const title = action === 'approve' ? '🎉 社团入驻申请已通过！' : '社团入驻申请未通过';
      const content = action === 'approve'
        ? `你的社团【${club.name}】入驻申请已通过审核！`
        : `你的社团【${club.name}】入驻申请未通过。原因：${reject_reason}`;
      db.prepare('INSERT INTO notifications (type,title,content,target_type,target_id) VALUES (?,?,?,?,?)').run('club_review', title, content, 'user', club.leader_id);
    });
  });
  batchUpdate();

  ctx.body = { code: 0, message: `已批量${action === 'approve' ? '通过' : '驳回'} ${clubs.length} 个社团` };
});

// 获取全部社团列表（管理端）
router.get('/clubs', requireAdmin, async ctx => {
  const { status, keyword, page = 1, pageSize = 20 } = ctx.query;
  let where = 'WHERE 1=1';
  const params = [];
  if (status) { where += ' AND c.status=?'; params.push(status); }
  if (keyword) { where += ' AND (c.name LIKE ? OR u.name LIKE ?)'; params.push(`%${keyword}%`, `%${keyword}%`); }

  const total = db.prepare(`SELECT COUNT(*) as cnt FROM clubs c LEFT JOIN users u ON c.leader_id=u.id ${where}`).get(...params).cnt;
  const offset = (parseInt(page) - 1) * parseInt(pageSize);
  const list = db.prepare(
    `SELECT c.*,u.name as leader_name,u.phone as leader_phone FROM clubs c LEFT JOIN users u ON c.leader_id=u.id ${where} ORDER BY c.created_at DESC LIMIT ? OFFSET ?`
  ).all(...params, parseInt(pageSize), offset).map(c => ({ ...c, tags: JSON.parse(c.tags || '[]') }));

  ctx.body = { code: 0, data: { list, total, page: parseInt(page), pageSize: parseInt(pageSize) } };
});

// 下架社团
router.put('/clubs/:id/offline', requireAdmin, async ctx => {
  const club = db.prepare('SELECT * FROM clubs WHERE id=?').get(ctx.params.id);
  if (!club) ctx.throw(404, '社团不存在');

  const { reason } = ctx.request.body;
  db.prepare('UPDATE clubs SET status=\'offline\',reject_reason=COALESCE(?,\'违规下架\'),is_recruiting=0,updated_at=datetime(\'now\',\'localtime\') WHERE id=?').run(reason, club.id);

  // 通知社长
  db.prepare('INSERT INTO notifications (type,title,content,target_type,target_id) VALUES (?,?,?,?,?)').run(
    'system', '社团已被下架', `你的社团【${club.name}】已被管理员下架。原因：${reason || '违规操作'}。请联系管理员了解详情。`, 'user', club.leader_id
  );

  ctx.body = { code: 0, message: '已下架' };
});

// 恢复上架
router.put('/clubs/:id/online', requireAdmin, async ctx => {
  const club = db.prepare('SELECT * FROM clubs WHERE id=?').get(ctx.params.id);
  if (!club) ctx.throw(404, '社团不存在');

  db.prepare('UPDATE clubs SET status=\'active\',updated_at=datetime(\'now\',\'localtime\') WHERE id=?').run(club.id);
  ctx.body = { code: 0, message: '已恢复上架' };
});

// ========== 通知管理 ==========

// 发布通知
router.post('/notifications', requireAdmin, async ctx => {
  // 支持 target_role 或 target_type（兼容前端两种传参）
  const { title, content, type = 'system', is_top = 0, is_urgent = 0 } = ctx.request.body;
  const target_type = ctx.request.body.target_role || ctx.request.body.target_type || 'all';
  if (!title || !content) ctx.throw(400, '通知标题和内容不能为空');

  const result = db.prepare(
    'INSERT INTO notifications (type,title,content,sender_id,target_type,is_top,is_urgent) VALUES (?,?,?,?,?,?,?)'
  ).run(type, title, content, ctx.state.user.id, target_type, is_top ? 1 : 0, is_urgent ? 1 : 0);

  // 返回新建的完整通知对象
  const notif = db.prepare('SELECT * FROM notifications WHERE id=?').get(result.lastInsertRowid);
  ctx.body = { code: 0, data: notif, message: '通知已发布' };
});

// 获取通知列表（管理端）
router.get('/notifications', requireAdmin, async ctx => {
  const list = db.prepare(
    'SELECT n.*,u.name as sender_name FROM notifications n LEFT JOIN users u ON n.sender_id=u.id ORDER BY n.is_top DESC,n.created_at DESC LIMIT 100'
  ).all();
  ctx.body = { code: 0, data: { list, total: list.length } };
});

// 撤回/删除通知
router.delete('/notifications/:id', requireAdmin, async ctx => {
  const notif = db.prepare('SELECT * FROM notifications WHERE id=?').get(ctx.params.id);
  if (!notif) ctx.throw(404, '通知不存在');

  db.prepare('DELETE FROM notifications WHERE id=?').run(ctx.params.id);
  db.prepare('DELETE FROM notification_reads WHERE notification_id=?').run(ctx.params.id);

  ctx.body = { code: 0, message: '已删除通知' };
});

module.exports = router;
