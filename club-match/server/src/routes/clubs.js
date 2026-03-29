const Router = require('koa-router');
const db = require('../db');

const router = new Router();

// ========== 匹配算法 ==========
function calcMatchScore(userTags, clubTagsStr) {
  const clubTags = JSON.parse(clubTagsStr || '[]');
  if (!clubTags.length || !userTags.length) return 0;

  // 分类用户标签
  const timeKeywords = ['5小时以上','2-5小时','1-2小时','随缘参与','周中晚上','周末全天','周末半天','节假日'];
  const skillKeywords = ['完全新手','有点基础','比较熟练','专业水平','新手/基础','熟练','大团队热闹','小圈子亲密','独立行动多'];

  const userInterestTags = userTags.filter(t => !timeKeywords.includes(t) && !skillKeywords.includes(t));
  const userTimeTags = userTags.filter(t => timeKeywords.includes(t));
  const userSkillTags = userTags.filter(t => skillKeywords.includes(t));

  const clubInterestTags = clubTags.filter(t => !timeKeywords.includes(t) && !skillKeywords.includes(t));
  const clubTimeTags = clubTags.filter(t => timeKeywords.includes(t));
  const clubSkillTags = clubTags.filter(t => skillKeywords.includes(t));

  const matchCount = (a, b) => {
    if (!b.length) return 1;
    return a.filter(t => b.includes(t)).length / b.length;
  };

  const interestScore = matchCount(userInterestTags, clubInterestTags);
  const timeScore = matchCount(userTimeTags, clubTimeTags);
  const skillScore = matchCount(userSkillTags, clubSkillTags);

  return Math.round((interestScore * 0.5 + timeScore * 0.3 + skillScore * 0.2) * 100);
}

function calcMatchReasons(userTags, clubTagsStr) {
  const clubTags = JSON.parse(clubTagsStr || '[]');
  return userTags.filter(t => clubTags.includes(t)).slice(0, 3);
}

// ========== 接口 ==========

// 智能推荐社团
router.get('/recommend', async ctx => {
  if (!ctx.state.user) ctx.throw(401, '请先登录');

  const assessment = db.prepare(
    'SELECT tags FROM assessments WHERE user_id=? AND status=\'completed\' ORDER BY completed_at DESC LIMIT 1'
  ).get(ctx.state.user.id);

  const page = parseInt(ctx.query.page) || 1;
  const pageSize = parseInt(ctx.query.pageSize) || 10;

  const activeClubs = db.prepare(
    'SELECT c.*,u.name as leader_name FROM clubs c LEFT JOIN users u ON c.leader_id=u.id WHERE c.status=\'active\' AND c.is_recruiting=1'
  ).all();

  let clubsWithScore = [];

  if (!assessment) {
    // 未测评，返回热门社团
    clubsWithScore = activeClubs.map(c => ({ ...c, match_score: 0, match_reasons: [], is_hot: true }));
    clubsWithScore.sort((a, b) => b.current_count - a.current_count);
  } else {
    const userTags = JSON.parse(assessment.tags || '[]');
    clubsWithScore = activeClubs.map(c => {
      const score = calcMatchScore(userTags, c.tags);
      const reasons = calcMatchReasons(userTags, c.tags);
      return { ...c, match_score: score, match_reasons: reasons };
    });
    clubsWithScore.sort((a, b) => b.match_score - a.match_score);

    // 降级：如果最高匹配度<50%，标记为热门推荐
    if (clubsWithScore.length && clubsWithScore[0].match_score < 50) {
      clubsWithScore = clubsWithScore.sort((a, b) => b.current_count - a.current_count).map(c => ({ ...c, is_hot: true }));
    }
  }

  const total = clubsWithScore.length;
  const list = clubsWithScore.slice((page - 1) * pageSize, page * pageSize).map(c => ({
    ...c,
    tags: JSON.parse(c.tags || '[]'),
    photos: JSON.parse(c.photos || '[]'),
    contact_info: JSON.parse(c.contact_info || '{}'),
  }));

  ctx.body = { code: 0, data: { list, total, page, pageSize, has_assessment: !!assessment } };
});

// 获取社团列表（支持分类、搜索、分页）
router.get('/', async ctx => {
  const { category, keyword, page = 1, pageSize = 12, sort = 'default' } = ctx.query;
  let where = "WHERE c.status='active'";
  const params = [];

  if (category) { where += ' AND c.category=?'; params.push(category); }
  if (keyword) { where += ' AND (c.name LIKE ? OR c.description LIKE ?)'; params.push(`%${keyword}%`, `%${keyword}%`); }

  let orderBy = 'ORDER BY c.is_recruiting DESC, c.current_count DESC';
  if (sort === 'new') orderBy = 'ORDER BY c.created_at DESC';
  if (sort === 'hot') orderBy = 'ORDER BY c.current_count DESC';

  const total = db.prepare(`SELECT COUNT(*) as cnt FROM clubs c LEFT JOIN users u ON c.leader_id=u.id ${where}`).get(...params).cnt;
  const offset = (parseInt(page) - 1) * parseInt(pageSize);
  const list = db.prepare(
    `SELECT c.*,u.name as leader_name FROM clubs c LEFT JOIN users u ON c.leader_id=u.id ${where} ${orderBy} LIMIT ? OFFSET ?`
  ).all(...params, parseInt(pageSize), offset).map(c => ({
    ...c,
    tags: JSON.parse(c.tags || '[]'),
    photos: JSON.parse(c.photos || '[]'),
    contact_info: JSON.parse(c.contact_info || '{}'),
  }));

  ctx.body = { code: 0, data: { list, total, page: parseInt(page), pageSize: parseInt(pageSize) } };
});

// 获取社团详情
router.get('/:id', async ctx => {
  const club = db.prepare(
    'SELECT c.*,u.name as leader_name,u.phone as leader_phone FROM clubs c LEFT JOIN users u ON c.leader_id=u.id WHERE c.id=?'
  ).get(ctx.params.id);
  if (!club) ctx.throw(404, '社团不存在');

  // 增加浏览量
  db.prepare('UPDATE clubs SET view_count=view_count+1 WHERE id=?').run(club.id);

  // 检查收藏状态
  let isFavorite = false;
  if (ctx.state.user) {
    isFavorite = !!db.prepare('SELECT 1 FROM club_favorites WHERE user_id=? AND club_id=?').get(ctx.state.user.id, club.id);
  }

  ctx.body = {
    code: 0, data: {
      ...club,
      tags: JSON.parse(club.tags || '[]'),
      photos: JSON.parse(club.photos || '[]'),
      contact_info: JSON.parse(club.contact_info || '{}'),
      is_favorite: isFavorite
    }
  };
});

// 提交入驻申请（社长）
router.post('/apply', async ctx => {
  if (!ctx.state.user) ctx.throw(401, '请先登录');
  if (ctx.state.user.role !== 'leader') ctx.throw(403, '只有社长账号可以申请社团入驻');

  const { name, category, description, tags, max_members, contact_info, recruit_end_at } = ctx.request.body;
  if (!name || !category) ctx.throw(400, '社团名称和分类不能为空');

  const exists = db.prepare('SELECT id FROM clubs WHERE name=?').get(name);
  if (exists) ctx.throw(400, '该社团名称已被使用');

  // 检查该社长是否已有社团（非驳回状态）
  const existing = db.prepare(
    'SELECT id FROM clubs WHERE leader_id=? AND status NOT IN (\'rejected\')'
  ).get(ctx.state.user.id);
  if (existing) ctx.throw(400, '你已有社团，不能重复申请');

  const result = db.prepare(
    'INSERT INTO clubs (name,category,description,tags,leader_id,max_members,contact_info,recruit_end_at,status) VALUES (?,?,?,?,?,?,?,?,\'pending\')'
  ).run(name, category, description || '', JSON.stringify(tags || []), ctx.state.user.id, max_members || 30, JSON.stringify(contact_info || {}), recruit_end_at || null);

  ctx.body = { code: 0, data: { id: result.lastInsertRowid }, message: '申请已提交，等待审核' };
});

// 更新社团信息（社长）
router.put('/:id', async ctx => {
  if (!ctx.state.user) ctx.throw(401, '请先登录');
  const club = db.prepare('SELECT * FROM clubs WHERE id=?').get(ctx.params.id);
  if (!club) ctx.throw(404, '社团不存在');
  if (club.leader_id !== ctx.state.user.id && ctx.state.user.role !== 'admin') ctx.throw(403, '无权限修改此社团');
  if (club.status === 'pending') ctx.throw(400, '审核中，暂不可编辑');

  const { description, tags, max_members, contact_info, recruit_end_at, cover_image, photos } = ctx.request.body;
  db.prepare(
    'UPDATE clubs SET description=COALESCE(?,description),tags=COALESCE(?,tags),max_members=COALESCE(?,max_members),contact_info=COALESCE(?,contact_info),recruit_end_at=COALESCE(?,recruit_end_at),cover_image=COALESCE(?,cover_image),photos=COALESCE(?,photos),updated_at=datetime(\'now\',\'localtime\') WHERE id=?'
  ).run(description, tags ? JSON.stringify(tags) : null, max_members, contact_info ? JSON.stringify(contact_info) : null, recruit_end_at, cover_image, photos ? JSON.stringify(photos) : null, club.id);

  const updated = db.prepare('SELECT * FROM clubs WHERE id=?').get(club.id);
  ctx.body = { code: 0, data: { ...updated, tags: JSON.parse(updated.tags || '[]'), photos: JSON.parse(updated.photos || '[]') } };
});

// 开启/暂停招新
router.put('/:id/recruit', async ctx => {
  if (!ctx.state.user) ctx.throw(401, '请先登录');
  const club = db.prepare('SELECT * FROM clubs WHERE id=?').get(ctx.params.id);
  if (!club) ctx.throw(404, '社团不存在');
  if (club.leader_id !== ctx.state.user.id) ctx.throw(403, '无权限操作');
  if (club.status !== 'active') ctx.throw(400, '社团未激活，无法操作招新状态');

  const { is_recruiting, recruit_end_at } = ctx.request.body;
  db.prepare('UPDATE clubs SET is_recruiting=?,recruit_end_at=COALESCE(?,recruit_end_at),updated_at=datetime(\'now\',\'localtime\') WHERE id=?').run(is_recruiting ? 1 : 0, recruit_end_at, club.id);

  ctx.body = { code: 0, message: is_recruiting ? '已开启招新' : '已暂停招新' };
});

// 收藏/取消收藏
router.post('/:id/favorite', async ctx => {
  if (!ctx.state.user) ctx.throw(401, '请先登录');
  const exists = db.prepare('SELECT 1 FROM club_favorites WHERE user_id=? AND club_id=?').get(ctx.state.user.id, ctx.params.id);
  if (exists) {
    db.prepare('DELETE FROM club_favorites WHERE user_id=? AND club_id=?').run(ctx.state.user.id, ctx.params.id);
    ctx.body = { code: 0, data: { is_favorite: false }, message: '已取消收藏' };
  } else {
    db.prepare('INSERT INTO club_favorites (user_id,club_id) VALUES (?,?)').run(ctx.state.user.id, ctx.params.id);
    ctx.body = { code: 0, data: { is_favorite: true }, message: '已收藏' };
  }
});

// 我的收藏列表
router.get('/my/favorites', async ctx => {
  if (!ctx.state.user) ctx.throw(401, '请先登录');
  const list = db.prepare(
    'SELECT c.*,u.name as leader_name FROM club_favorites f JOIN clubs c ON f.club_id=c.id LEFT JOIN users u ON c.leader_id=u.id WHERE f.user_id=? ORDER BY f.created_at DESC'
  ).all(ctx.state.user.id).map(c => ({
    ...c, tags: JSON.parse(c.tags || '[]'), photos: JSON.parse(c.photos || '[]')
  }));
  ctx.body = { code: 0, data: list };
});

// 社团端：获取我的社团信息
router.get('/my/club', async ctx => {
  if (!ctx.state.user) ctx.throw(401, '请先登录');
  const club = db.prepare(
    'SELECT c.*,u.name as leader_name FROM clubs c LEFT JOIN users u ON c.leader_id=u.id WHERE c.leader_id=? ORDER BY c.created_at DESC LIMIT 1'
  ).get(ctx.state.user.id);
  if (!club) { ctx.body = { code: 0, data: null }; return; }
  ctx.body = { code: 0, data: { ...club, tags: JSON.parse(club.tags || '[]'), photos: JSON.parse(club.photos || '[]'), contact_info: JSON.parse(club.contact_info || '{}') } };
});

// 社团端：数据统计
router.get('/:id/stats', async ctx => {
  if (!ctx.state.user) ctx.throw(401, '请先登录');
  const club = db.prepare('SELECT * FROM clubs WHERE id=?').get(ctx.params.id);
  if (!club || (club.leader_id !== ctx.state.user.id && ctx.state.user.role !== 'admin')) ctx.throw(403, '无权限');

  const totalApps = db.prepare('SELECT COUNT(*) as cnt FROM applications WHERE club_id=?').get(ctx.params.id).cnt;
  const approvedApps = db.prepare('SELECT COUNT(*) as cnt FROM applications WHERE club_id=? AND status=\'approved\'').get(ctx.params.id).cnt;
  const pendingApps = db.prepare('SELECT COUNT(*) as cnt FROM applications WHERE club_id=? AND status=\'pending\'').get(ctx.params.id).cnt;

  // 近7天报名趋势
  const trend = db.prepare(
    'SELECT date(created_at) as date, COUNT(*) as count FROM applications WHERE club_id=? AND created_at >= datetime(\'now\',\'-7 days\') GROUP BY date(created_at) ORDER BY date'
  ).all(ctx.params.id);

  // 学生标签分布
  const apps = db.prepare('SELECT skill_tags FROM applications WHERE club_id=? AND status!=\'cancelled\'').all(ctx.params.id);
  const tagCount = {};
  apps.forEach(a => {
    JSON.parse(a.skill_tags || '[]').forEach(t => { tagCount[t] = (tagCount[t] || 0) + 1; });
  });

  ctx.body = {
    code: 0, data: {
      view_count: club.view_count,
      total_applications: totalApps,
      approved_count: approvedApps,
      pending_count: pendingApps,
      pass_rate: totalApps > 0 ? Math.round(approvedApps / totalApps * 100) : 0,
      trend, tag_distribution: tagCount
    }
  };
});

module.exports = router;
