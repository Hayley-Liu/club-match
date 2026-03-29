import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import { ArrowLeft, AlertTriangle, CheckCircle, RotateCcw, Search } from 'lucide-react';

export default function ClubManage() {
  const navigate = useNavigate();
  const clubs = useStore(s => s.clubs);
  const updateClub = useStore(s => s.updateClub);
  const applications = useStore(s => s.applications);
  const addSystemNotification = useStore(s => s.addSystemNotification);
  const showToast = useStore(s => s.showToast);

  const [filter, setFilter] = useState<'approved' | 'offline'>('approved');
  const [search, setSearch] = useState('');
  const [offlineModal, setOfflineModal] = useState<{ id: string | null; reason: string }>({ id: null, reason: '' });

  const filteredClubs = clubs
    .filter(c => c.status === filter)
    .filter(c => search === '' || c.name.includes(search) || c.category.includes(search));

  const handleOffline = () => {
    if (!offlineModal.reason.trim()) {
      showToast('请填写下架原因', 'error');
      return;
    }
    const club = clubs.find(c => c.id === offlineModal.id);
    if (!club) return;

    updateClub(club.id, { status: 'offline', rejectReason: offlineModal.reason });

    // Notify club president
    addSystemNotification(
      club.presidentId,
      `🚫 ${club.name} 已被下架`,
      `你管理的 ${club.name} 因违规已被管理员下架。下架原因：${offlineModal.reason}。如有疑问请联系学生工作处。`,
      'club'
    );

    // Find students with pending/approved applications and notify them
    const affectedApps = applications.filter(
      a => a.clubId === club.id && (a.status === 'pending' || a.status === 'approved')
    );
    const notifiedStudents = new Set<string>();
    affectedApps.forEach(app => {
      if (!notifiedStudents.has(app.studentId)) {
        addSystemNotification(
          app.studentId,
          `😔 你报名的 ${club.name} 已下架`,
          `由于管理员处理，${club.name} 已下架，你的报名申请已自动取消。建议重新浏览其他社团报名。`,
          'student'
        );
        notifiedStudents.add(app.studentId);
      }
    });

    showToast(`${club.name} 已下架，已通知相关用户`);
    setOfflineModal({ id: null, reason: '' });
  };

  const handleRestore = (club: { id: string; name: string }) => {
    updateClub(club.id, { status: 'approved', rejectReason: undefined });
    addSystemNotification(
      clubs.find(c => c.id === club.id)?.presidentId || '',
      `✅ ${club.name} 已恢复上架`,
      `你管理的 ${club.name} 已由管理员恢复上架，学生可正常浏览和报名。`,
      'club'
    );
    showToast(`${club.name} 已恢复上架 ✓`);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/admin/dashboard')} className="p-2 rounded-xl hover:bg-gray-100 text-gray-500">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">社团管理</h1>
          <p className="text-sm text-gray-400">
            管理在线社团，处理违规下架情况
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="搜索社团名称..."
          className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 bg-white focus:border-purple-400 focus:outline-none text-sm"
        />
      </div>

      {/* Tab */}
      <div className="flex gap-2 mb-6">
        {([
          { value: 'approved', label: `在线社团 (${clubs.filter(c => c.status === 'approved').length})` },
          { value: 'offline', label: `已下架 (${clubs.filter(c => c.status === 'offline').length})` },
        ] as const).map(tab => (
          <button
            key={tab.value}
            onClick={() => setFilter(tab.value)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              filter === tab.value
                ? 'gradient-primary text-white shadow-md'
                : 'bg-white text-gray-600 border border-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Club list */}
      {filteredClubs.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <div className="text-4xl mb-3">🔍</div>
          <p>{search ? '没有找到匹配的社团' : '暂无记录'}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredClubs.map(club => {
            const clubApps = applications.filter(a => a.clubId === club.id);
            const approvedAppsCount = clubApps.filter(a => a.status === 'approved').length;
            const pendingAppsCount = clubApps.filter(a => a.status === 'pending').length;

            return (
              <div
                key={club.id}
                className={`bg-white rounded-2xl p-5 shadow-sm card-shadow ${club.status === 'offline' ? 'opacity-70' : ''}`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${club.coverColor} flex items-center justify-center text-2xl shrink-0 ${club.status === 'offline' ? 'grayscale' : ''}`}>
                    {club.coverEmoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="font-bold text-gray-800">{club.name}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${club.categoryColor}`}>{club.category}</span>
                      {club.status === 'offline' && (
                        <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">已下架</span>
                      )}
                    </div>
                    <div className="text-sm text-gray-500">
                      负责人：{club.presidentName} · {club.phone}
                    </div>
                    <div className="flex gap-4 mt-2 text-xs text-gray-400">
                      <span>入驻于 {club.createdAt}</span>
                      <span>最多 {club.maxMembers} 人</span>
                      <span>申请 {club.applicationCount} 人</span>
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-2 mt-4">
                  <div className="bg-gray-50 rounded-xl p-2 text-center">
                    <div className="text-lg font-bold text-gray-700">{clubApps.length}</div>
                    <div className="text-xs text-gray-400">总报名</div>
                  </div>
                  <div className="bg-green-50 rounded-xl p-2 text-center">
                    <div className="text-lg font-bold text-green-600">{approvedAppsCount}</div>
                    <div className="text-xs text-gray-400">已通过</div>
                  </div>
                  <div className="bg-yellow-50 rounded-xl p-2 text-center">
                    <div className="text-lg font-bold text-yellow-600">{pendingAppsCount}</div>
                    <div className="text-xs text-gray-400">待审核</div>
                  </div>
                </div>

                {/* Offline reason */}
                {club.status === 'offline' && club.rejectReason && (
                  <div className="mt-3 bg-gray-100 rounded-xl p-3 text-sm text-gray-500">
                    <p className="font-medium mb-0.5">下架原因</p>
                    <p>{club.rejectReason}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 mt-4">
                  {club.status === 'approved' && (
                    <button
                      onClick={() => setOfflineModal({ id: club.id, reason: '' })}
                      className="flex items-center gap-1.5 px-4 py-2.5 bg-red-50 text-red-600 border border-red-200 rounded-xl text-sm font-medium hover:bg-red-100 transition"
                    >
                      <AlertTriangle size={16} /> 下架社团
                    </button>
                  )}
                  {club.status === 'offline' && (
                    <button
                      onClick={() => handleRestore(club)}
                      className="flex items-center gap-1.5 px-4 py-2.5 bg-green-50 text-green-700 border border-green-200 rounded-xl text-sm font-medium hover:bg-green-100 transition"
                    >
                      <RotateCcw size={16} /> 恢复上架
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Offline confirm modal */}
      {offlineModal.id && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm animate-slide-in-up">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle size={20} className="text-red-500" />
              <h3 className="text-lg font-bold text-gray-800">确认下架社团？</h3>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              下架后该社团将对学生不可见，相关报名申请将被通知取消。
            </p>
            <textarea
              value={offlineModal.reason}
              onChange={e => setOfflineModal(m => ({ ...m, reason: e.target.value }))}
              placeholder="请填写下架原因（将通知社长和相关学生）..."
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-red-400 focus:outline-none text-sm resize-none mb-4"
              autoFocus
            />
            <div className="flex gap-3">
              <button onClick={() => setOfflineModal({ id: null, reason: '' })} className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-2xl font-medium">
                取消
              </button>
              <button onClick={handleOffline} className="flex-1 py-3 bg-red-500 text-white rounded-2xl font-medium">
                确认下架
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
