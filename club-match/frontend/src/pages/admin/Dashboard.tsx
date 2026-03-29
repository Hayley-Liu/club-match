import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import { ClipboardList, Megaphone, Settings, ArrowRight } from 'lucide-react';

export default function AdminDashboard() {
  const user = useStore(s => s.currentUser);
  const clubs = useStore(s => s.clubs);
  const applications = useStore(s => s.applications);
  const navigate = useNavigate();

  const pendingClubs = useMemo(() => clubs.filter(c => c.status === 'pending'), [clubs]);
  const approvedClubs = useMemo(() => clubs.filter(c => c.status === 'approved'), [clubs]);
  const approvedApps = useMemo(() => applications.filter(a => a.status === 'approved'), [applications]);

  const stats = [
    { label: '待审核社团', value: pendingClubs.length, color: 'from-yellow-400 to-orange-400', icon: '⏳', path: '/admin/club-review', alert: pendingClubs.length > 0 },
    { label: '已入驻社团', value: approvedClubs.length, color: 'from-purple-500 to-indigo-500', icon: '🏆', path: '/admin/club-manage', alert: false },
    { label: '总报名人数', value: applications.length, color: 'from-blue-500 to-cyan-500', icon: '📋', path: null, alert: false },
    { label: '成功加入', value: approvedApps.length, color: 'from-green-500 to-emerald-500', icon: '🎉', path: null, alert: false },
  ];

  const menuItems = [
    {
      path: '/admin/club-review',
      icon: <ClipboardList size={24} />,
      label: '社团审核',
      desc: `${pendingClubs.length} 个待审核`,
      color: 'bg-yellow-50 text-yellow-600',
      badge: pendingClubs.length,
    },
    {
      path: '/admin/announcements',
      icon: <Megaphone size={24} />,
      label: '通知管理',
      desc: '发布官方通知',
      color: 'bg-purple-50 text-purple-600',
      badge: 0,
    },
    {
      path: '/admin/club-manage',
      icon: <Settings size={24} />,
      label: '社团管理',
      desc: `管理 ${approvedClubs.length} 个社团`,
      color: 'bg-blue-50 text-blue-600',
      badge: 0,
    },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">管理员控制台</h1>
        <p className="text-gray-500 text-sm mt-1">你好，{user?.name}，欢迎回来</p>
      </div>

      {pendingClubs.length > 0 && (
        <div
          onClick={() => navigate('/admin/club-review')}
          className="bg-gradient-to-r from-yellow-400 to-orange-400 rounded-2xl p-4 mb-6 text-white cursor-pointer hover:shadow-lg transition flex items-center gap-3"
        >
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-xl">⚡</div>
          <div className="flex-1">
            <p className="font-bold">有 {pendingClubs.length} 个社团待审核</p>
            <p className="text-sm text-white/80">点击前往审核页面处理</p>
          </div>
          <ArrowRight size={20} className="text-white/80" />
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {stats.map(s => (
          <div
            key={s.label}
            onClick={() => s.path && navigate(s.path)}
            className={`bg-gradient-to-br ${s.color} rounded-2xl p-4 text-white relative overflow-hidden ${s.path ? 'cursor-pointer hover:shadow-lg transition' : ''}`}
          >
            <div className="absolute -right-2 -bottom-2 text-5xl opacity-20">{s.icon}</div>
            <div className="text-2xl font-bold mb-1">{s.value}</div>
            <div className="text-xs text-white/80">{s.label}</div>
            {s.alert && s.value > 0 && (
              <div className="absolute top-2 right-2 w-3 h-3 bg-white rounded-full animate-pulse" />
            )}
          </div>
        ))}
      </div>

      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        {menuItems.map(item => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className="bg-white rounded-2xl p-5 shadow-sm card-shadow hover:card-shadow-hover transition club-card text-left"
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${item.color}`}>
                {item.icon}
              </div>
              {item.badge > 0 && (
                <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-medium">
                  {item.badge}
                </span>
              )}
            </div>
            <p className="font-bold text-gray-800">{item.label}</p>
            <p className="text-sm text-gray-500 mt-0.5">{item.desc}</p>
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl p-5 shadow-sm card-shadow">
        <h3 className="font-bold text-gray-800 mb-4">近期社团动态</h3>
        <div className="space-y-3">
          {[...clubs]
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 5)
            .map(club => (
              <div key={club.id} className="flex items-center gap-3 py-2 border-b border-gray-100 last:border-0">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${club.coverColor} flex items-center justify-center text-xl shrink-0`}>
                  {club.coverEmoji}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-800 text-sm">{club.name}</p>
                  <p className="text-xs text-gray-400">{club.category} · {club.createdAt}</p>
                </div>
                <StatusBadge status={club.status} />
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; color: string }> = {
    pending: { label: '待审核', color: 'bg-yellow-100 text-yellow-700' },
    approved: { label: '已通过', color: 'bg-green-100 text-green-700' },
    rejected: { label: '已驳回', color: 'bg-red-100 text-red-600' },
    offline: { label: '已下架', color: 'bg-gray-100 text-gray-500' },
  };
  const s = map[status] || { label: status, color: 'bg-gray-100 text-gray-600' };
  return (
    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${s.color}`}>{s.label}</span>
  );
}
