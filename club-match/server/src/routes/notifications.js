const Router = require('koa-router');
const db = require('../db');

const router = new Router();

// 获取通知列表（含未读数）
router.get('/', async ctx => {
  if (!ctx.state.user) ctx.throw(401, '请先登录');
  const userId = ctx.state.user.id;
  const userRole = ctx.state.user.role;

  // 查询该用户可见的通知
  const list = db.prepare(`
    SELECT n.*,
      CASE WHEN nr.read_at IS NOT NULL THEN 1 ELSE 0 END as is_read,
      CASE WHEN nr.is_deleted=1 THEN 1 ELSE 0 END as is_deleted_by_user
    FROM notifications n
    LEFT JOIN notification_reads nr ON n.id=nr.notification_id AND nr.user_id=?
    WHERE (n.target_type='all'
      OR (n.target_type='students' AND ?='student')
      OR (n.target_type='leaders' AND ?='leader')
      OR (n.target_type='user' AND n.target_id=?))
    AND (nr.is_deleted IS NULL OR nr.is_deleted=0)
    ORDER BY n.is_top DESC, n.created_at DESC
    LIMIT 50
  `).all(userId, userRole, userRole, userId);

  const unreadCount = list.filter(n => !n.is_read).length;

  ctx.body = { code: 0, data: { list, unread_count: unreadCount } };
});

// 标记已读
router.put('/:id/read', async ctx => {
  if (!ctx.state.user) ctx.throw(401, '请先登录');
  const exists = db.prepare('SELECT 1 FROM notification_reads WHERE user_id=? AND notification_id=?').get(ctx.state.user.id, ctx.params.id);
  if (exists) {
    db.prepare('UPDATE notification_reads SET read_at=datetime(\'now\',\'localtime\') WHERE user_id=? AND notification_id=?').run(ctx.state.user.id, ctx.params.id);
  } else {
    db.prepare('INSERT INTO notification_reads (user_id,notification_id,read_at) VALUES (?,?,datetime(\'now\',\'localtime\'))').run(ctx.state.user.id, ctx.params.id);
  }
  ctx.body = { code: 0, message: '已标记已读' };
});

// 标记全部已读
router.put('/read-all', async ctx => {
  if (!ctx.state.user) ctx.throw(401, '请先登录');
  const userId = ctx.state.user.id;
  const userRole = ctx.state.user.role;
  const notifs = db.prepare(`
    SELECT n.id FROM notifications n
    LEFT JOIN notification_reads nr ON n.id=nr.notification_id AND nr.user_id=?
    WHERE (n.target_type='all' OR (n.target_type='students' AND ?='student') OR (n.target_type='leaders' AND ?='leader') OR (n.target_type='user' AND n.target_id=?))
    AND (nr.read_at IS NULL)
  `).all(userId, userRole, userRole, userId);

  const insertOrUpdate = db.transaction(() => {
    notifs.forEach(n => {
      const exists = db.prepare('SELECT 1 FROM notification_reads WHERE user_id=? AND notification_id=?').get(userId, n.id);
      if (exists) {
        db.prepare('UPDATE notification_reads SET read_at=datetime(\'now\',\'localtime\') WHERE user_id=? AND notification_id=?').run(userId, n.id);
      } else {
        db.prepare('INSERT INTO notification_reads (user_id,notification_id,read_at) VALUES (?,?,datetime(\'now\',\'localtime\'))').run(userId, n.id);
      }
    });
  });
  insertOrUpdate();
  ctx.body = { code: 0, message: '全部已读' };
});

// 删除通知（软删除）
router.delete('/:id', async ctx => {
  if (!ctx.state.user) ctx.throw(401, '请先登录');
  const exists = db.prepare('SELECT 1 FROM notification_reads WHERE user_id=? AND notification_id=?').get(ctx.state.user.id, ctx.params.id);
  if (exists) {
    db.prepare('UPDATE notification_reads SET is_deleted=1 WHERE user_id=? AND notification_id=?').run(ctx.state.user.id, ctx.params.id);
  } else {
    db.prepare('INSERT INTO notification_reads (user_id,notification_id,is_deleted) VALUES (?,?,1)').run(ctx.state.user.id, ctx.params.id);
  }
  ctx.body = { code: 0, message: '已删除' };
});

module.exports = router;
