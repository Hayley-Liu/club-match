const Router = require('koa-router');
const db = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const router = new Router();

// 注册
router.post('/register', async ctx => {
  const { username, password, role = 'student', name, student_id, major, phone } = ctx.request.body;
  if (!username || !password) ctx.throw(400, '用户名和密码不能为空');
  if (!['student', 'leader'].includes(role)) ctx.throw(400, '注册角色只能是student或leader');

  const exists = db.prepare('SELECT id FROM users WHERE username=?').get(username);
  if (exists) ctx.throw(400, '用户名已被占用');

  const hash = bcrypt.hashSync(password, 10);
  const result = db.prepare(
    'INSERT INTO users (username,password,role,name,student_id,major,phone) VALUES (?,?,?,?,?,?,?)'
  ).run(username, hash, role, name || username, student_id || '', major || '', phone || '');

  const user = db.prepare('SELECT id,username,role,name,student_id,major,phone,avatar_url FROM users WHERE id=?').get(result.lastInsertRowid);
  const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });

  ctx.body = { code: 0, data: { token, user } };
});

// 登录
router.post('/login', async ctx => {
  const { username, password } = ctx.request.body;
  if (!username || !password) ctx.throw(400, '请输入用户名和密码');

  const user = db.prepare('SELECT * FROM users WHERE username=?').get(username);
  if (!user) ctx.throw(401, '用户名或密码错误');

  const valid = bcrypt.compareSync(password, user.password);
  if (!valid) ctx.throw(401, '用户名或密码错误');

  const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
  const { password: _, ...safeUser } = user;

  ctx.body = { code: 0, data: { token, user: safeUser } };
});

// 获取当前用户信息
router.get('/profile', async ctx => {
  if (!ctx.state.user) ctx.throw(401, '请先登录');
  const user = db.prepare('SELECT id,username,role,name,student_id,major,phone,avatar_url,created_at FROM users WHERE id=?').get(ctx.state.user.id);
  if (!user) ctx.throw(404, '用户不存在');
  ctx.body = { code: 0, data: user };
});

// 更新用户资料
router.put('/profile', async ctx => {
  if (!ctx.state.user) ctx.throw(401, '请先登录');
  const { name, phone, student_id, major, avatar_url } = ctx.request.body;
  db.prepare(
    'UPDATE users SET name=COALESCE(?,name), phone=COALESCE(?,phone), student_id=COALESCE(?,student_id), major=COALESCE(?,major), avatar_url=COALESCE(?,avatar_url), updated_at=datetime(\'now\',\'localtime\') WHERE id=?'
  ).run(name, phone, student_id, major, avatar_url, ctx.state.user.id);
  const user = db.prepare('SELECT id,username,role,name,student_id,major,phone,avatar_url FROM users WHERE id=?').get(ctx.state.user.id);
  ctx.body = { code: 0, data: user };
});

module.exports = router;
