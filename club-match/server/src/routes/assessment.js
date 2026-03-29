const Router = require('koa-router');
const db = require('../db');

const router = new Router();

// 8道测评题目（固定题库）
const QUESTIONS = [
  {
    id: 1, dim: '兴趣方向', question: '你对哪些活动感兴趣？（可多选）',
    options: ['文艺创作', '体育运动', '学术科技', '公益实践']
  },
  {
    id: 2, dim: '细分兴趣', question: '你喜欢哪些具体形式？（可多选）',
    depends_on: 1,
    options_map: {
      '文艺创作': ['绘画', '音乐', '舞蹈', '摄影', '写作', '戏剧'],
      '体育运动': ['球类', '健身', '游泳', '跑步', '武术', '瑜伽'],
      '学术科技': ['编程', '辩论', '数学', '机器人', '创业', '外语'],
      '公益实践': ['志愿服务', '环保', '支教', '扶贫', '动物保护', '社区服务'],
      'default': ['绘画', '音乐', '舞蹈', '摄影', '球类', '健身', '编程', '辩论', '志愿服务', '环保']
    }
  },
  {
    id: 3, dim: '核心特长', question: '你在这些活动上是什么水平？（可多选）',
    options: ['完全新手', '有点基础', '比较熟练', '专业水平']
  },
  {
    id: 4, dim: '时间投入', question: '你每周愿意为社团投入多少时间？（可多选）',
    options: ['5小时以上', '2-5小时', '1-2小时', '随缘参与']
  },
  {
    id: 5, dim: '空闲时段', question: '你一般什么时候有空？（可多选）',
    options: ['周中晚上', '周末全天', '周末半天', '节假日']
  },
  {
    id: 6, dim: '社交偏好', question: '你喜欢什么样的团队氛围？（可多选）',
    options: ['大团队热闹', '小圈子亲密', '独立行动多', '无所谓']
  },
  {
    id: 7, dim: '目标导向', question: '你加入社团主要想获得什么？（可多选）',
    options: ['提升技能', '结交朋友', '丰富经历', '综测加分']
  },
  {
    id: 8, dim: '参与方式', question: '你更想担任什么角色？（可多选）',
    options: ['组织者/leader', '执行者/参与者', '创意提供者', '看情况']
  }
];

// 根据测评答案生成用户标签
function generateTags(answers) {
  const tags = [];

  // 兴趣标签（来自Q1+Q2）
  const q1 = answers['1'] || [];
  const q2 = answers['2'] || [];
  tags.push(...q2);

  // 时间标签（来自Q4+Q5）
  const q4 = answers['4'] || [];
  const q5 = answers['5'] || [];
  tags.push(...q4, ...q5);

  // 其他标签（来自Q3+Q6+Q7+Q8）
  const q3 = answers['3'] || [];
  const q6 = answers['6'] || [];
  const q7 = answers['7'] || [];
  const q8 = answers['8'] || [];

  // 技能水平简化
  if (q3.includes('专业水平')) tags.push('专业水平');
  else if (q3.includes('比较熟练')) tags.push('熟练');
  else tags.push('新手/基础');

  tags.push(...q6.filter(t => t !== '无所谓'));
  tags.push(...q7);
  tags.push(...q8.filter(t => t !== '看情况'));

  return [...new Set(tags)].filter(Boolean);
}

// 获取题目列表
router.get('/questions', async ctx => {
  ctx.body = { code: 0, data: QUESTIONS };
});

// 保存草稿
router.post('/draft', async ctx => {
  if (!ctx.state.user) ctx.throw(401, '请先登录');
  const { answers, step } = ctx.request.body;

  const existing = db.prepare(
    'SELECT id FROM assessments WHERE user_id=? AND status=\'draft\''
  ).get(ctx.state.user.id);

  const expires = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();

  if (existing) {
    db.prepare(
      'UPDATE assessments SET answers=?, draft_step=?, expires_at=? WHERE id=?'
    ).run(JSON.stringify(answers), step || 0, expires, existing.id);
  } else {
    db.prepare(
      'INSERT INTO assessments (user_id,answers,draft_step,expires_at) VALUES (?,?,?,?)'
    ).run(ctx.state.user.id, JSON.stringify(answers), step || 0, expires);
  }

  ctx.body = { code: 0, message: '草稿已保存' };
});

// 获取草稿
router.get('/draft', async ctx => {
  if (!ctx.state.user) ctx.throw(401, '请先登录');

  const draft = db.prepare(
    'SELECT * FROM assessments WHERE user_id=? AND status=\'draft\' ORDER BY created_at DESC LIMIT 1'
  ).get(ctx.state.user.id);

  if (!draft) { ctx.body = { code: 0, data: null }; return; }

  // 检查是否过期（48h）
  if (draft.expires_at && new Date(draft.expires_at) < new Date()) {
    db.prepare('DELETE FROM assessments WHERE id=?').run(draft.id);
    ctx.body = { code: 0, data: null, expired: true };
    return;
  }

  ctx.body = { code: 0, data: { ...draft, answers: JSON.parse(draft.answers || '{}'), tags: JSON.parse(draft.tags || '[]') } };
});

// 提交测评
router.post('/submit', async ctx => {
  if (!ctx.state.user) ctx.throw(401, '请先登录');

  // 每天限制1次
  const today = new Date().toISOString().slice(0, 10);
  const todayCompleted = db.prepare(
    'SELECT id FROM assessments WHERE user_id=? AND status=\'completed\' AND date(completed_at)=date(\'now\',\'localtime\')'
  ).get(ctx.state.user.id);
  if (todayCompleted) ctx.throw(429, '今天已经测评过了，明天再来吧~');

  const { answers } = ctx.request.body;
  if (!answers) ctx.throw(400, '答题数据不能为空');

  const tags = generateTags(answers);
  const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  const now = new Date().toISOString();

  // 清除旧草稿
  db.prepare('DELETE FROM assessments WHERE user_id=? AND status=\'draft\'').run(ctx.state.user.id);

  // 保存完成的测评
  const result = db.prepare(
    'INSERT INTO assessments (user_id,answers,tags,status,draft_step,completed_at,expires_at) VALUES (?,?,?,?,?,?,?)'
  ).run(ctx.state.user.id, JSON.stringify(answers), JSON.stringify(tags), 'completed', 8, now, expires);

  ctx.body = { code: 0, data: { id: result.lastInsertRowid, tags, completed_at: now } };
});

// 获取最新测评结果
router.get('/result', async ctx => {
  if (!ctx.state.user) ctx.throw(401, '请先登录');

  const result = db.prepare(
    'SELECT * FROM assessments WHERE user_id=? AND status=\'completed\' ORDER BY completed_at DESC LIMIT 1'
  ).get(ctx.state.user.id);

  if (!result) { ctx.body = { code: 0, data: null }; return; }

  // 检查是否30天过期
  if (result.expires_at && new Date(result.expires_at) < new Date()) {
    ctx.body = { code: 0, data: null, expired: true };
    return;
  }

  ctx.body = {
    code: 0,
    data: {
      ...result,
      answers: JSON.parse(result.answers || '{}'),
      tags: JSON.parse(result.tags || '[]')
    }
  };
});

module.exports = router;
