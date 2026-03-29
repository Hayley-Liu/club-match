require('dotenv').config();
const Koa = require('koa');
const Router = require('koa-router');
const { koaBody } = require('koa-body');
const cors = require('@koa/cors');
const jwt = require('jsonwebtoken');
const path = require('path');

const app = new Koa();

// ============ 中间件 ============
app.use(cors({ origin: '*', allowHeaders: 'Content-Type,Authorization', allowMethods: 'GET,POST,PUT,DELETE,PATCH,OPTIONS' }));
app.use(koaBody({ multipart: true, formidable: { uploadDir: path.join(__dirname, '../uploads'), keepExtensions: true } }));

// 静态文件服务（上传文件）- 使用 koa-mount 挂载路径前缀
const serve = require('koa-static');
const mount = require('koa-mount');
app.use(mount('/uploads', serve(path.join(__dirname, '../uploads'))));

// JWT 鉴权中间件
app.use(async (ctx, next) => {
  const token = ctx.headers.authorization?.replace('Bearer ', '');
  if (token) {
    try {
      ctx.state.user = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      ctx.state.user = null;
    }
  }
  await next();
});

// 请求日志
app.use(async (ctx, next) => {
  const start = Date.now();
  await next();
  console.log(`${ctx.method} ${ctx.path} - ${ctx.status} (${Date.now() - start}ms)`);
});

// 统一错误处理
app.use(async (ctx, next) => {
  try {
    await next();
  } catch (err) {
    ctx.status = err.status || 500;
    ctx.body = { code: ctx.status, message: err.message || '服务器内部错误' };
    console.error(err);
  }
});

// ============ 路由注册 ============
const authRoutes = require('./routes/auth');
const assessmentRoutes = require('./routes/assessment');
const clubRoutes = require('./routes/clubs');
const applicationRoutes = require('./routes/applications');
const notificationRoutes = require('./routes/notifications');
const adminRoutes = require('./routes/admin');

const router = new Router({ prefix: '/api' });

router.use('/auth', authRoutes.routes());
router.use('/assessment', assessmentRoutes.routes());
router.use('/clubs', clubRoutes.routes());
router.use('/applications', applicationRoutes.routes());
router.use('/notifications', notificationRoutes.routes());
router.use('/admin', adminRoutes.routes());

// 健康检查
router.get('/health', ctx => { ctx.body = { code: 0, message: 'ok', time: new Date().toISOString() }; });

app.use(router.routes());
app.use(router.allowedMethods());

// ============ 启动 ============
const PORT = process.env.PORT || 3000;

// 初始化种子数据
require('./seed');

app.listen(PORT, () => {
  console.log(`\n🚀 社团招新平台后端服务已启动`);
  console.log(`   地址: http://localhost:${PORT}`);
  console.log(`   环境: ${process.env.NODE_ENV || 'development'}\n`);
});
