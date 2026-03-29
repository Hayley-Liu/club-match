// 种子数据初始化脚本
const db = require('./db');
const bcrypt = require('bcryptjs');

function seed() {
  // 检查是否已初始化
  const existing = db.prepare('SELECT COUNT(*) as cnt FROM users').get();
  if (existing.cnt > 0) {
    console.log('种子数据已存在，跳过初始化');
    return;
  }

  // 创建管理员账号
  const adminPwd = bcrypt.hashSync('admin123', 10);
  db.prepare(`INSERT INTO users (username,password,role,name) VALUES (?,?,?,?)`).run('admin', adminPwd, 'admin', '王老师');

  // 创建测试学生账号
  const studentPwd = bcrypt.hashSync('student123', 10);
  db.prepare(`INSERT INTO users (username,password,role,name,student_id,major) VALUES (?,?,?,?,?,?)`).run('xiaolin', studentPwd, 'student', '小林', '2024001', '计算机科学');
  db.prepare(`INSERT INTO users (username,password,role,name,student_id,major) VALUES (?,?,?,?,?,?)`).run('student2', studentPwd, 'student', '李明', '2024002', '艺术设计');
  db.prepare(`INSERT INTO users (username,password,role,name,student_id,major) VALUES (?,?,?,?,?,?)`).run('student3', studentPwd, 'student', '王芳', '2024003', '新闻传播');

  // 创建社团社长账号
  const leaderPwd = bcrypt.hashSync('leader123', 10);
  db.prepare(`INSERT INTO users (username,password,role,name,phone) VALUES (?,?,?,?,?)`).run('ajie', leaderPwd, 'leader', '阿杰', '13800138001');
  db.prepare(`INSERT INTO users (username,password,role,name,phone) VALUES (?,?,?,?,?)`).run('leader2', leaderPwd, 'leader', '林晓', '13800138002');
  db.prepare(`INSERT INTO users (username,password,role,name,phone) VALUES (?,?,?,?,?)`).run('leader3', leaderPwd, 'leader', '张涛', '13800138003');
  db.prepare(`INSERT INTO users (username,password,role,name,phone) VALUES (?,?,?,?,?)`).run('leader4', leaderPwd, 'leader', '陈静', '13800138004');

  // 获取各社长ID
  const ajie = db.prepare('SELECT id FROM users WHERE username=?').get('ajie');
  const leader2 = db.prepare('SELECT id FROM users WHERE username=?').get('leader2');
  const leader3 = db.prepare('SELECT id FROM users WHERE username=?').get('leader3');
  const leader4 = db.prepare('SELECT id FROM users WHERE username=?').get('leader4');

  // 创建示例社团（已通过审核，正在招新）
  const clubs = [
    {
      name: '摄影社', category: 'art', description: '摄影社成立于2010年，是全校最具活力的文艺社团之一。我们专注于摄影技术的学习与交流，定期举办外拍活动、摄影展览和技术分享会。无论你是摄影新手还是资深玩家，这里都有你的一席之地！',
      tags: JSON.stringify(['摄影', '周末空闲', '轻度参与']), leader_id: ajie.id, max_members: 30, current_count: 18,
      cover_image: 'https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=800',
      photos: JSON.stringify(['https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400','https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=400','https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=400']),
      contact_info: JSON.stringify({ wechat: 'ajie_photo', qq: '123456789', phone: '13800138001' }),
      status: 'active', is_recruiting: 1, recruit_end_at: '2024-10-31 23:59:59',
    },
    {
      name: '街舞社', category: 'art', description: '街舞社是一个充满激情与活力的舞蹈社团，涵盖Breaking、Popping、Locking等多种街舞风格。每周定期练习，每学期举办专场演出。加入我们，用舞蹈释放你的能量！',
      tags: JSON.stringify(['舞蹈', '周中晚上', '高度参与']), leader_id: leader2.id, max_members: 40, current_count: 25,
      cover_image: 'https://images.unsplash.com/photo-1547153760-18fc86324498?w=800',
      photos: JSON.stringify(['https://images.unsplash.com/photo-1508700929628-666bc8bd84ea?w=400','https://images.unsplash.com/photo-1535525153412-5a42439a210d?w=400']),
      contact_info: JSON.stringify({ wechat: 'dance_club', qq: '987654321', phone: '13800138002' }),
      status: 'active', is_recruiting: 1, recruit_end_at: '2024-10-31 23:59:59',
    },
    {
      name: '编程俱乐部', category: 'academic', description: '编程俱乐部专注于算法竞赛、软件开发和人工智能方向，每年参加ACM、蓝桥杯等多项重要赛事，获奖无数。我们有资深学长带队，提供完整的学习体系，助你在技术道路上快速成长！',
      tags: JSON.stringify(['编程', '周末全天', '高度参与']), leader_id: leader3.id, max_members: 50, current_count: 32,
      cover_image: 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=800',
      photos: JSON.stringify(['https://images.unsplash.com/photo-1504639725590-34d0984388bd?w=400','https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400']),
      contact_info: JSON.stringify({ wechat: 'code_club', qq: '111222333', phone: '13800138003' }),
      status: 'active', is_recruiting: 1, recruit_end_at: '2024-11-15 23:59:59',
    },
    {
      name: '志愿者协会', category: 'public', description: '志愿者协会是全校最大的公益社团，每年组织各类志愿服务活动，包括敬老院探访、山区支教、社区服务等。加入我们，用行动传递温暖，让世界因你而更美好！',
      tags: JSON.stringify(['志愿', '节假日', '中度参与']), leader_id: leader4.id, max_members: 100, current_count: 67,
      cover_image: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=800',
      photos: JSON.stringify(['https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?w=400','https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=400']),
      contact_info: JSON.stringify({ wechat: 'volunteer_assoc', qq: '444555666', phone: '13800138004' }),
      status: 'active', is_recruiting: 1, recruit_end_at: '2024-11-30 23:59:59',
    },
    {
      name: '篮球社', category: 'sport', description: '篮球社成立多年，拥有专业的训练场地和完善的培训体系。每周三、五定期训练，每学期举办联赛和友谊赛。无论你是篮球小白还是校队水平，来这里都能找到属于你的位置！',
      tags: JSON.stringify(['球类', '周中晚上', '2-5小时']), leader_id: ajie.id, max_members: 60, current_count: 45,
      cover_image: 'https://images.unsplash.com/photo-1546519638405-a9f16f3f9c30?w=800',
      photos: JSON.stringify(['https://images.unsplash.com/photo-1608245449230-4ac19066d2d0?w=400']),
      contact_info: JSON.stringify({ wechat: 'basketball_club', qq: '777888999', phone: '13800138001' }),
      status: 'active', is_recruiting: 1, recruit_end_at: '2024-11-10 23:59:59',
    },
    {
      name: '吉他社', category: 'art', description: '吉他社专注于吉他弹奏技艺的学习与交流，每周定期社课，不定期举办校园音乐会和街头演唱活动。从指弹到弹唱，从民谣到摇滚，在这里找到属于你的音乐故事。',
      tags: JSON.stringify(['音乐', '周中晚上', '轻度参与']), leader_id: leader2.id, max_members: 35, current_count: 20,
      cover_image: 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=800',
      photos: JSON.stringify(['https://images.unsplash.com/photo-1525201548942-d8732f6617a0?w=400']),
      contact_info: JSON.stringify({ wechat: 'guitar_club', qq: '321654987', phone: '13800138002' }),
      status: 'active', is_recruiting: 1, recruit_end_at: '2024-11-20 23:59:59',
    },
    {
      name: '辩论队', category: 'academic', description: '辩论队每年参加全国大学生辩论赛，培养了一批出色的辩手。在这里，你将学会批判性思维、逻辑论证和公众演讲，成为一个既能说服人又能打动人的优秀辩手！',
      tags: JSON.stringify(['辩论', '周末半天', '中度参与']), leader_id: leader3.id, max_members: 20, current_count: 12,
      cover_image: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=800',
      photos: JSON.stringify(['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400']),
      contact_info: JSON.stringify({ wechat: 'debate_team', qq: '159753468', phone: '13800138003' }),
      status: 'active', is_recruiting: 1, recruit_end_at: '2024-11-05 23:59:59',
    },
    {
      name: '环保协会', category: 'public', description: '环保协会致力于校园环保文化推广，定期开展垃圾分类宣传、绿色出行倡议、环保创意市集等活动。在这里，你将成为绿色生活方式的传播者和践行者！',
      tags: JSON.stringify(['环保', '节假日', '轻度参与']), leader_id: leader4.id, max_members: 80, current_count: 55,
      cover_image: 'https://images.unsplash.com/photo-1542601906897-d4c3e702e1f7?w=800',
      photos: JSON.stringify(['https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=400']),
      contact_info: JSON.stringify({ wechat: 'eco_club', qq: '246813579', phone: '13800138004' }),
      status: 'active', is_recruiting: 1, recruit_end_at: '2024-11-25 23:59:59',
    },
    {
      name: '健身社', category: 'sport', description: '健身社提供系统的健身指导和伙伴陪练，涵盖力量训练、有氧运动、瑜伽等多种运动形式，帮助你科学塑形、提升体能！',
      tags: JSON.stringify(['健身', '周末全天', '中度参与']), leader_id: leader2.id, max_members: 50, current_count: 38,
      cover_image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800',
      photos: JSON.stringify(['https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400']),
      contact_info: JSON.stringify({ wechat: 'fitness_club', qq: '135792468', phone: '13800138002' }),
      status: 'active', is_recruiting: 1, recruit_end_at: '2024-11-15 23:59:59',
    },
    {
      name: '绘画社', category: 'art', description: '绘画社涵盖素描、水彩、油画、国画等多种绘画形式，定期举办展览和外出写生活动，是艺术爱好者的精神家园！',
      tags: JSON.stringify(['绘画', '周末半天', '轻度参与']), leader_id: leader3.id, max_members: 30, current_count: 22,
      cover_image: 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=800',
      photos: JSON.stringify(['https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=400']),
      contact_info: JSON.stringify({ wechat: 'paint_club', qq: '864213579', phone: '13800138003' }),
      status: 'active', is_recruiting: 1, recruit_end_at: '2024-11-28 23:59:59',
    },
  ];

  const insertClub = db.prepare(`
    INSERT INTO clubs (name,category,description,cover_image,photos,tags,leader_id,max_members,current_count,contact_info,status,is_recruiting,recruit_end_at,view_count)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  `);

  clubs.forEach(c => {
    insertClub.run(c.name, c.category, c.description, c.cover_image, c.photos, c.tags, c.leader_id, c.max_members, c.current_count, c.contact_info, c.status, c.is_recruiting, c.recruit_end_at, Math.floor(Math.random() * 500 + 100));
  });

  // 添加官方通知
  db.prepare(`INSERT INTO notifications (type,title,content,target_type,is_top) VALUES (?,?,?,?,?)`).run(
    'system', '🎉 欢迎使用社团招新智能匹配平台', '亲爱的同学们，社团招新智能匹配平台正式上线！完成兴趣测评，获取个性化社团推荐，找到最适合你的社团归宿。本次招新截止时间为2024年11月30日，请大家把握机会，积极报名！', 'all', 1
  );
  db.prepare(`INSERT INTO notifications (type,title,content,target_type,is_top) VALUES (?,?,?,?,?)`).run(
    'system', '📢 关于社团招新截止时间的通知', '各位同学、各社团负责人注意：本学期社团招新统一截止日期为2024年11月30日24:00，请各社团在截止日期前完成招新审核工作。逾期未审核的报名将自动失效，请相互转告。', 'all', 0
  );
  db.prepare(`INSERT INTO notifications (type,title,content,target_type,is_top) VALUES (?,?,?,?,?)`).run(
    'system', '社团负责人须知：招新规范说明', '各社团负责人，为规范招新工作，请注意以下事项：1. 招新简介需如实描述社团活动，不得夸大；2. 联系方式须保持畅通；3. 审核报名需在48小时内完成；4. 如有违规行为将予以下架处理。', 'leaders', 0
  );

  console.log('✅ 种子数据初始化完成');
  console.log('账号信息：');
  console.log('  管理员：admin / admin123');
  console.log('  学生：xiaolin / student123');
  console.log('  社长：ajie / leader123');
}

seed();
