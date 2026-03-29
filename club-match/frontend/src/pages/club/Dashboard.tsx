import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import { Users, TrendingUp, CheckCircle, XCircle, Clock, AlertCircle, ArrowRight } from 'lucide-react';

export default function ClubDashboard() {
  const user = useStore(s => s.currentUser);
  const clubs = useStore(s => s.clubs);
  const applications = useStore(s => s.applications);
  const navigate = useNavigate();

  const club = useMemo(
    () => user ? clubs.find(c => c.presidentId === user.id) : undefined,
    [clubs, user]
  );

  const apps = useMemo(
    () => club ? applications.filter(a => a.clubId === club.id) : [],
    [applications, club]
  );

  if (!club) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center animate-fade-in">
        <div className="text-5xl mb-4">🏠</div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">还没有社团</h2>
        <p className="text-gray-500 mb-6">提交社团入驻申请，开始招新之旅</p>
        <button
          onClick={() => navigate('/club/register')}
          className="px-6 py-3 gradient-primary text-white rounded-2xl font-semibold shadow-md"
        >
          申请入驻 →
        </button>
      </div>
    );
  }

  const pendingApps = apps.filter(a => a.status === 'pending');
  const approvedApps = apps.filter(a => a.status === 'approved');
  const rejectedApps = apps.filter(a => a.status === 'rejected');
  const avgMatchScore = apps.length > 0
    ? Math.round(apps.reduce((sum, a) => sum + a.matchScore, 0) / apps.length)
    : 0;

  const statusInfo = {
    pending: { label: '审核中', icon: <Clock size={16} /> },
    approved: { label: '已通过', icon: <CheckCircle size={16} /> },
    rejected: { label: '已驳回', icon: <XCircle size={16} /> },
    offline: { label: '已下架', icon: <AlertCircle size={16} /> },
  };
  const si = statusInfo[club.status];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">社团管理</h1>
        <p className="text-gray-500 text-sm">管理你的社团，招募志同道合的伙伴</p>
      </div>

      {/* Club status card */}
      <div className={`bg-gradient-to-r ${club.coverColor} rounded-3xl p-6 mb-6 text-white relative overflow-hidden`}>
        <div className="absolute right-4 bottom-4 text-8xl opacity-10">{club.coverEmoji}</div>
        <div className="relative">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center text-3xl">
                {club.coverEmoji}
              </div>
              <div>
                <h2 className="text-xl font-bold">{club.name}</h2>
                <span className="text-sm text-white/80">{club.category}</span>
              </div>
            </div>
            <span className="flex items-center gap-1.5 text-sm px-3 py-1 rounded-full font-medium bg-white/20 text-white">
              {si.icon} {si.label}
            </span>
          </div>

          {club.status === 'pending' && (
            <div className="bg-white/20 rounded-xl p-3 text-sm text-white/90">
              ⏳ 你的入驻申请正在审核中，请耐心等待管理员审核（通常24小时内）
            </div>
          )}
          {club.status === 'rejected' && club.rejectReason && (
            <div className="bg-white/20 rounded-xl p-3 text-sm text-white/90">
              ❌ 驳回原因：{club.rejectReason}
              <button className="ml-2 underline" onClick={() => navigate('/club/register')}>修改后重新提交</button>
            </div>
          )}
          {club.status === 'approved' && (
            <div className="grid grid-cols-3 gap-3 mt-3">
              <div className="bg-white/20 rounded-xl p-3 text-center">
                <div className="text-2xl font-bold">{apps.length}</div>
                <div className="text-xs text-white/70">总报名</div>
              </div>
              <div className="bg-white/20 rounded-xl p-3 text-center">
                <div className="text-2xl font-bold">{pendingApps.length}</div>
                <div className="text-xs text-white/70">待审核</div>
              </div>
              <div className="bg-white/20 rounded-xl p-3 text-center">
                <div className="text-2xl font-bold">{avgMatchScore}%</div>
                <div className="text-xs text-white/70">平均匹配</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {club.status === 'approved' && (
        <>
          <div className="grid grid-cols-2 gap-3 mb-6">
            <button
              onClick={() => navigate('/club/applications')}
              className="bg-white rounded-2xl p-5 shadow-sm card-shadow hover:card-shadow-hover transition club-card text-left"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                  <Users size={20} className="text-purple-600" />
                </div>
                {pendingApps.length > 0 && (
                  <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-medium">
                    {pendingApps.length} 待审
                  </span>
                )}
              </div>
              <p className="font-bold text-gray-800">报名管理</p>
              <p className="text-sm text-gray-500 mt-0.5">{apps.length} 份申请</p>
            </button>

            <button
              onClick={() => navigate('/club/notifications')}
              className="bg-white rounded-2xl p-5 shadow-sm card-shadow hover:card-shadow-hover transition club-card text-left"
            >
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center mb-2">
                <TrendingUp size={20} className="text-blue-600" />
              </div>
              <p className="font-bold text-gray-800">消息通知</p>
              <p className="text-sm text-gray-500 mt-0.5">查看平台通知</p>
            </button>
          </div>

          {/* Application stats */}
          <div className="bg-white rounded-2xl p-5 shadow-sm card-shadow mb-6">
            <h3 className="font-bold text-gray-800 mb-4">报名统计</h3>
            <div className="space-y-3">
              {[
                { label: '待审核', count: pendingApps.length, color: 'bg-yellow-400', textColor: 'text-yellow-700' },
                { label: '已通过', count: approvedApps.length, color: 'bg-green-400', textColor: 'text-green-700' },
                { label: '已驳回', count: rejectedApps.length, color: 'bg-red-400', textColor: 'text-red-600' },
              ].map(item => (
                <div key={item.label} className="flex items-center gap-3">
                  <span className="text-sm text-gray-600 w-16">{item.label}</span>
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${item.color} rounded-full transition-all`}
                      style={{ width: apps.length > 0 ? `${(item.count / apps.length) * 100}%` : '0%' }}
                    />
                  </div>
                  <span className={`text-sm font-medium w-8 text-right ${item.textColor}`}>{item.count}</span>
                </div>
              ))}
            </div>
          </div>

          {pendingApps.length > 0 && (
            <div className="bg-white rounded-2xl p-5 shadow-sm card-shadow">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-800">待审核申请</h3>
                <button onClick={() => navigate('/club/applications')} className="text-sm text-purple-600">
                  查看全部 →
                </button>
              </div>
              <div className="space-y-3">
                {pendingApps.slice(0, 3).map(app => (
                  <div key={app.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-bold text-sm">
                        {app.studentName[0]}
                      </div>
                      <div>
                        <p className="font-medium text-gray-800 text-sm">{app.studentName}</p>
                        <p className="text-xs text-gray-400">{app.studentMajor}</p>
                      </div>
                    </div>
                    <span className="text-sm font-bold text-purple-600">{app.matchScore}% 匹配</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
