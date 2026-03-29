import React from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { ArrowRight, Users } from 'lucide-react';

export default function Home() {
  const user = useStore(s => s.currentUser);

  if (!user) {
    return <LandingPage />;
  }

  if (user.role === 'student') {
    return <StudentHome />;
  }
  if (user.role === 'club') {
    return <Navigate to="/club/dashboard" replace />;
  }
  if (user.role === 'admin') {
    return <Navigate to="/admin/dashboard" replace />;
  }
  return null;
}

function LandingPage() {
  const navigate = useNavigate();
  const allClubs = useStore(s => s.clubs);
  const clubs = React.useMemo(() => allClubs.filter(c => c.status === 'approved'), [allClubs]);

  const stats = [
    { value: `${clubs.length}+`, label: '在校社团', emoji: '🏆' },
    { value: '3分钟', label: '完成匹配', emoji: '⚡' },
    { value: '92%', label: '满意度', emoji: '😊' },
    { value: '千+', label: '成功加入', emoji: '🎉' },
  ];

  const features = [
    { emoji: '🧠', title: '智能测评匹配', desc: '8道趣味题目，分析兴趣偏好，精准匹配最适合你的社团' },
    { emoji: '📊', title: '匹配度可视化', desc: '清晰展示每个社团与你的契合程度，让选择不再困难' },
    { emoji: '📱', title: '一键报名管理', desc: '在线提交报名，实时查看审核进度，告别加群潜水' },
    { emoji: '🔔', title: '即时消息通知', desc: '审核结果直达通知，不错过任何重要信息' },
  ];

  return (
    <div className="overflow-hidden">
      {/* Hero Section */}
      <div className="relative min-h-screen flex items-center justify-center text-center px-4 py-20">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-64 h-64 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-pulse" />
          <div className="absolute bottom-20 right-10 w-72 h-72 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30" />
        </div>

        <div className="relative z-10 animate-slide-in-up">
          <div className="text-6xl mb-4">🎓</div>
          <h1 className="text-5xl md:text-6xl font-bold mb-4">
            <span className="gradient-text">3分钟</span>
            <span className="text-gray-800">找到</span>
            <br />
            <span className="text-gray-800">你的社团归宿</span>
          </h1>
          <p className="text-xl text-gray-500 mb-10 max-w-xl mx-auto">
            告别信息茫然，智能测评精准匹配，让每个新生都找到属于自己的圈子
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/login')}
              className="px-8 py-4 gradient-primary text-white rounded-2xl font-bold text-lg shadow-lg hover:shadow-xl transition-shadow btn-click flex items-center gap-2 justify-center"
            >
              开始测评 <ArrowRight size={20} />
            </button>
            <button
              onClick={() => navigate('/login')}
              className="px-8 py-4 bg-white text-purple-600 rounded-2xl font-bold text-lg shadow-md hover:shadow-lg transition-shadow btn-click border border-purple-100"
            >
              浏览社团
            </button>
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
            {stats.map(s => (
              <div key={s.label} className="bg-white/70 backdrop-blur rounded-2xl p-4 shadow-sm">
                <div className="text-2xl mb-1">{s.emoji}</div>
                <div className="text-2xl font-bold gradient-text">{s.value}</div>
                <div className="text-sm text-gray-500">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-3">为什么选择我们？</h2>
          <p className="text-gray-500 text-center mb-12">专为高校新生设计，解决社团招新的三大痛点</p>
          <div className="grid md:grid-cols-2 gap-6">
            {features.map(f => (
              <div key={f.title} className="bg-white rounded-2xl p-6 shadow-sm card-shadow hover:card-shadow-hover transition-shadow club-card">
                <div className="text-3xl mb-3">{f.emoji}</div>
                <h3 className="text-lg font-bold text-gray-800 mb-2">{f.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Preview clubs */}
      <div className="py-16 px-4 bg-white/50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-gray-800 mb-3">热门社团</h2>
          <p className="text-gray-500 text-center mb-8">登录后查看完整社团列表和匹配度</p>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
            {clubs.slice(0, 6).map(club => (
              <div key={club.id} className="bg-white rounded-2xl p-5 shadow-sm card-shadow club-card cursor-pointer" onClick={() => navigate('/login')}>
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${club.coverColor} flex items-center justify-center text-2xl mb-3`}>
                  {club.coverEmoji}
                </div>
                <h3 className="font-semibold text-gray-800 mb-1">{club.name}</h3>
                <p className="text-sm text-gray-500 line-clamp-2 mb-3">{club.description}</p>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <Users size={12} />
                  <span>{club.applicationCount} 人报名</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="py-20 px-4 text-center">
        <div className="max-w-lg mx-auto">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">准备好了吗？</h2>
          <p className="text-gray-500 mb-8">3分钟完成测评，立即获得专属社团推荐</p>
          <button
            onClick={() => navigate('/login')}
            className="px-10 py-4 gradient-primary text-white rounded-2xl font-bold text-lg shadow-lg hover:shadow-xl transition-shadow btn-click"
          >
            立即开始 →
          </button>
        </div>
      </div>
    </div>
  );
}

function StudentHome() {
  const user = useStore(s => s.currentUser);
  const navigate = useNavigate();

  // 从 store 中直接读取原始数据，在组件内计算派生数据
  const notifications = useStore(s => s.notifications);
  const applications = useStore(s => s.applications);
  const clubs = useStore(s => s.clubs);

  const officialNotices = React.useMemo(() =>
    notifications.filter(n =>
      n.type === 'official' &&
      n.isPinned &&
      !n.isWithdrawn &&
      (n.targetRole === 'all' || n.targetRole === 'student')
    ), [notifications]);

  const myApps = React.useMemo(() =>
    user ? applications.filter(a => a.studentId === user.id) : [],
    [applications, user]);

  const recommendedClubs = React.useMemo(() => {
    if (!user?.assessmentTags) {
      return clubs
        .filter(c => c.status === 'approved')
        .sort((a, b) => b.applicationCount - a.applicationCount)
        .slice(0, 4);
    }
    const userTags = user.assessmentTags.all;
    return clubs
      .filter(c => c.status === 'approved')
      .map(club => {
        const interestMatches = club.interestTags.filter(t => userTags.includes(t)).length;
        const interestScore = club.interestTags.length > 0
          ? (interestMatches / club.interestTags.length) * 100 : 50;
        const timeMatches = club.timeTags.filter(t => userTags.includes(t)).length;
        const timeScore = club.timeTags.length > 0
          ? (timeMatches / club.timeTags.length) * 100 : 50;
        const skillMatches = club.skillTags.filter(t => userTags.includes(t)).length;
        const skillScore = club.skillTags.length > 0
          ? (skillMatches / club.skillTags.length) * 100 : 50;
        const score = Math.min(99, Math.max(30, Math.round(interestScore * 0.5 + timeScore * 0.3 + skillScore * 0.2)));
        return { ...club, matchScore: score };
      })
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 4);
  }, [clubs, user]);

  const hasAssessment = !!user?.assessmentTags;
  const hasDraft = !!user?.assessmentDraft;
  const lastAssessmentDate = user?.lastAssessmentDate;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Welcome */}
      <div className="mb-8 animate-fade-in">
        <h1 className="text-2xl font-bold text-gray-800">
          你好，{user?.name} 👋
        </h1>
        <p className="text-gray-500 mt-1">
          {hasAssessment ? '你的专属推荐已准备好！' : '完成测评，获取专属社团推荐'}
        </p>
      </div>

      {/* Pinned notice */}
      {officialNotices.length > 0 && (
        <div
          className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-2xl p-4 mb-6 cursor-pointer hover:shadow-lg transition-shadow animate-fade-in"
          onClick={() => navigate('/student/notifications')}
        >
          <div className="flex items-center gap-2 mb-1">
            <span className="text-yellow-300">📌</span>
            <span className="text-xs font-semibold bg-white/20 px-2 py-0.5 rounded-full">官方置顶</span>
          </div>
          <p className="font-semibold text-sm">{officialNotices[0].title}</p>
          <p className="text-xs opacity-80 mt-0.5 line-clamp-1">{officialNotices[0].content}</p>
        </div>
      )}

      {/* Assessment CTA or Status */}
      {!hasAssessment ? (
        <div className="bg-gradient-to-r from-purple-600 to-pink-500 rounded-3xl p-6 mb-8 text-white animate-slide-in-up">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h2 className="text-xl font-bold mb-2">🎯 开始兴趣测评</h2>
              <p className="text-white/80 text-sm mb-4">
                {hasDraft
                  ? `已完成部分题目，点击继续完成测评`
                  : '8道小题，3分钟完成，获取专属社团推荐'}
              </p>
              <button
                onClick={() => navigate('/student/assessment')}
                className="bg-white text-purple-600 px-6 py-2.5 rounded-xl font-bold text-sm hover:shadow-md transition-shadow btn-click"
              >
                {hasDraft ? '继续测评 →' : '开始测评 →'}
              </button>
            </div>
            <div className="text-6xl opacity-30">🧠</div>
          </div>
          {hasDraft && (
            <div className="mt-3 bg-white/20 rounded-xl px-4 py-2 text-sm">
              💡 你有未完成的测评草稿，继续答题吧~
            </div>
          )}
        </div>
      ) : (
        <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-3xl p-5 mb-8 text-white flex items-center justify-between animate-fade-in">
          <div>
            <p className="text-sm opacity-80 mb-0.5">测评于 {lastAssessmentDate} 完成</p>
            <p className="font-bold">已找到你的社团匹配结果！</p>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {user?.assessmentTags?.interests.slice(0, 3).map(tag => (
                <span key={tag} className="bg-white/20 text-white text-xs px-2 py-0.5 rounded-full">{tag}</span>
              ))}
            </div>
          </div>
          <button
            onClick={() => navigate('/student/results')}
            className="bg-white text-emerald-600 px-5 py-2.5 rounded-xl font-bold text-sm whitespace-nowrap ml-4 hover:shadow-md transition btn-click"
          >
            查看推荐
          </button>
        </div>
      )}

      {/* My recent applications */}
      {myApps.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-800">我的报名</h2>
            <button onClick={() => navigate('/student/my-applications')} className="text-purple-600 text-sm flex items-center gap-1">
              查看全部 <ArrowRight size={14} />
            </button>
          </div>
          <div className="space-y-3">
            {myApps.slice(0, 3).map(app => (
              <div key={app.id} className="bg-white rounded-2xl p-4 shadow-sm card-shadow flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-800">{app.clubName}</p>
                  <p className="text-xs text-gray-400 mt-0.5">申请于 {app.createdAt}</p>
                </div>
                <StatusBadge status={app.status} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommended clubs */}
      {hasAssessment && recommendedClubs.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-800">推荐社团</h2>
            <button onClick={() => navigate('/student/results')} className="text-purple-600 text-sm flex items-center gap-1">
              查看全部 <ArrowRight size={14} />
            </button>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {recommendedClubs.map((club) => (
              <div
                key={club.id}
                onClick={() => navigate(`/student/club/${club.id}`)}
                className="bg-white rounded-2xl p-5 shadow-sm card-shadow club-card cursor-pointer"
              >
                <div className="flex items-start gap-3">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${club.coverColor} flex items-center justify-center text-2xl shrink-0`}>
                    {club.coverEmoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="font-semibold text-gray-800 truncate">{club.name}</p>
                      {'matchScore' in club && (club as any).matchScore >= 80 && (
                        <span className="shrink-0 text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">
                          {(club as any).matchScore}% 匹配
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 line-clamp-2">{club.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; color: string }> = {
    pending: { label: '待审核', color: 'bg-yellow-100 text-yellow-700' },
    approved: { label: '已通过', color: 'bg-green-100 text-green-700' },
    rejected: { label: '已驳回', color: 'bg-red-100 text-red-600' },
  };
  const s = map[status] || { label: '未知', color: 'bg-gray-100 text-gray-600' };
  return (
    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${s.color}`}>{s.label}</span>
  );
}
