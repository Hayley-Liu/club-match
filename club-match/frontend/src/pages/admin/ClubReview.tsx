import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import { ArrowLeft, CheckCircle, XCircle, ChevronDown, ChevronUp, Clock, Users } from 'lucide-react';
import type { Club } from '../../types';

export default function ClubReview() {
  const navigate = useNavigate();
  const clubs = useStore(s => s.clubs);
  const updateClub = useStore(s => s.updateClub);
  const addSystemNotification = useStore(s => s.addSystemNotification);
  const showToast = useStore(s => s.showToast);

  const [filter, setFilter] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [selected, setSelected] = useState<string[]>([]);
  const [rejectModal, setRejectModal] = useState<{ id: string | null; reason: string }>({ id: null, reason: '' });
  const [batchRejectModal, setBatchRejectModal] = useState(false);
  const [batchReason, setBatchReason] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);

  const filteredClubs = clubs.filter(c => c.status === filter);
  const pendingCount = clubs.filter(c => c.status === 'pending').length;

  const toggleSelect = (id: string) => {
    setSelected(s => s.includes(id) ? s.filter(i => i !== id) : [...s, id]);
  };

  const selectAll = () => {
    if (selected.length === filteredClubs.length) {
      setSelected([]);
    } else {
      setSelected(filteredClubs.map(c => c.id));
    }
  };

  const handleApprove = (club: Club) => {
    updateClub(club.id, { status: 'approved' });
    addSystemNotification(
      club.presidentId,
      '✅ 你的社团入驻申请已通过！',
      `恭喜！${club.name} 的入驻申请已通过审核。你现在可以完善社团信息，发布招新活动了。`,
      'club'
    );
    showToast(`${club.name} 已通过审核 ✓`);
  };

  const handleReject = () => {
    if (!rejectModal.reason.trim()) {
      showToast('请填写驳回原因', 'error');
      return;
    }
    const club = clubs.find(c => c.id === rejectModal.id);
    if (!club) return;
    updateClub(club.id, { status: 'rejected', rejectReason: rejectModal.reason });
    addSystemNotification(
      club.presidentId,
      `❌ ${club.name} 入驻申请未通过`,
      `很遗憾，${club.name} 的入驻申请未通过审核。驳回原因：${rejectModal.reason}。你可以修改后重新提交申请。`,
      'club'
    );
    showToast('已驳回，已通知社长');
    setRejectModal({ id: null, reason: '' });
  };

  const handleBatchApprove = () => {
    selected.forEach(id => {
      const club = clubs.find(c => c.id === id);
      if (club) handleApprove(club);
    });
    showToast(`已批量通过 ${selected.length} 个社团 ✓`);
    setSelected([]);
  };

  const handleBatchReject = () => {
    if (!batchReason.trim()) {
      showToast('请填写驳回原因', 'error');
      return;
    }
    selected.forEach(id => {
      const club = clubs.find(c => c.id === id);
      if (!club) return;
      updateClub(id, { status: 'rejected', rejectReason: batchReason });
      addSystemNotification(
        club.presidentId,
        `❌ ${club.name} 入驻申请未通过`,
        `很遗憾，${club.name} 的入驻申请未通过审核。驳回原因：${batchReason}。`,
        'club'
      );
    });
    showToast(`已批量驳回 ${selected.length} 个社团`);
    setSelected([]);
    setBatchRejectModal(false);
    setBatchReason('');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/admin/dashboard')} className="p-2 rounded-xl hover:bg-gray-100 text-gray-500">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">社团审核</h1>
          <p className="text-sm text-gray-400">
            {pendingCount > 0 ? `${pendingCount} 个社团待审核` : '暂无待审核社团'}
          </p>
        </div>
      </div>

      {/* Tab */}
      <div className="flex gap-2 mb-6">
        {([
          { value: 'pending', label: `待审核 (${clubs.filter(c => c.status === 'pending').length})` },
          { value: 'approved', label: `已通过 (${clubs.filter(c => c.status === 'approved').length})` },
          { value: 'rejected', label: `已驳回 (${clubs.filter(c => c.status === 'rejected').length})` },
        ] as const).map(tab => (
          <button
            key={tab.value}
            onClick={() => { setFilter(tab.value); setSelected([]); }}
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

      {/* Batch operations for pending */}
      {filter === 'pending' && filteredClubs.length > 0 && (
        <div className="bg-purple-50 border border-purple-200 rounded-2xl p-3 mb-4 flex items-center justify-between flex-wrap gap-2">
          <label className="flex items-center gap-2 cursor-pointer text-sm text-purple-700">
            <input
              type="checkbox"
              checked={selected.length === filteredClubs.length && filteredClubs.length > 0}
              onChange={selectAll}
              className="rounded accent-purple-600"
            />
            全选 ({filteredClubs.length})
          </label>
          {selected.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-purple-600">已选 {selected.length} 项</span>
              <button onClick={handleBatchApprove} className="px-3 py-1.5 bg-green-500 text-white rounded-xl text-sm font-medium">
                批量通过
              </button>
              <button onClick={() => setBatchRejectModal(true)} className="px-3 py-1.5 bg-red-500 text-white rounded-xl text-sm font-medium">
                批量驳回
              </button>
            </div>
          )}
        </div>
      )}

      {/* Club list */}
      {filteredClubs.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <div className="text-4xl mb-3">
            {filter === 'pending' ? '🎉' : '📭'}
          </div>
          <p>{filter === 'pending' ? '没有待审核的社团' : '暂无记录'}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredClubs.map(club => (
            <div key={club.id} className={`bg-white rounded-2xl shadow-sm card-shadow overflow-hidden ${selected.includes(club.id) ? 'ring-2 ring-purple-400' : ''}`}>
              <div className="p-5">
                <div className="flex items-start gap-3">
                  {filter === 'pending' && (
                    <input
                      type="checkbox"
                      checked={selected.includes(club.id)}
                      onChange={() => toggleSelect(club.id)}
                      className="mt-1 rounded accent-purple-600 shrink-0"
                    />
                  )}
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${club.coverColor} flex items-center justify-center text-2xl shrink-0`}>
                    {club.coverEmoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-gray-800">{club.name}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${club.categoryColor}`}>{club.category}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                      <span>负责人：{club.presidentName}</span>
                      <span>手机：{club.phone}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                      <span className="flex items-center gap-1"><Clock size={12} /> 申请时间：{club.createdAt}</span>
                      <span className="flex items-center gap-1"><Users size={12} /> 招新 {club.maxMembers} 人</span>
                    </div>
                  </div>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {club.tags.map(tag => (
                    <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{tag}</span>
                  ))}
                </div>

                {/* Reject reason for rejected clubs */}
                {club.status === 'rejected' && club.rejectReason && (
                  <div className="mt-3 bg-red-50 rounded-xl p-3 text-sm text-red-600">
                    <p className="font-medium mb-1">驳回原因</p>
                    <p>{club.rejectReason}</p>
                  </div>
                )}

                {/* Expand details button */}
                <button
                  onClick={() => setExpanded(expanded === club.id ? null : club.id)}
                  className="mt-2 text-xs text-gray-400 flex items-center gap-1 hover:text-gray-600"
                >
                  {expanded === club.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  {expanded === club.id ? '收起' : '查看详细申请资料'}
                </button>

                {expanded === club.id && (
                  <div className="mt-3 bg-gray-50 rounded-xl p-4 text-sm text-gray-600 animate-fade-in">
                    <p className="text-xs text-gray-400 mb-2">社团简介</p>
                    <p className="leading-relaxed">{club.description}</p>
                    {club.requirements && (
                      <div className="mt-3">
                        <p className="text-xs text-gray-400 mb-1">招新要求</p>
                        <p>{club.requirements}</p>
                      </div>
                    )}
                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-white rounded-lg p-2">
                        <p className="text-gray-400">截止日期</p>
                        <p className="font-medium text-gray-700">{club.deadline}</p>
                      </div>
                      <div className="bg-white rounded-lg p-2">
                        <p className="text-gray-400">招新人数</p>
                        <p className="font-medium text-gray-700">{club.maxMembers} 人</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Actions */}
                {club.status === 'pending' && (
                  <div className="flex gap-3 mt-4">
                    <button
                      onClick={() => handleApprove(club)}
                      className="flex-1 py-3 bg-green-50 text-green-700 border border-green-200 rounded-xl text-sm font-medium hover:bg-green-100 transition flex items-center justify-center gap-1.5"
                    >
                      <CheckCircle size={16} /> 通过
                    </button>
                    <button
                      onClick={() => setRejectModal({ id: club.id, reason: '' })}
                      className="flex-1 py-3 bg-red-50 text-red-600 border border-red-200 rounded-xl text-sm font-medium hover:bg-red-100 transition flex items-center justify-center gap-1.5"
                    >
                      <XCircle size={16} /> 驳回
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reject modal */}
      {rejectModal.id && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm animate-slide-in-up">
            <h3 className="text-lg font-bold text-gray-800 mb-1">填写驳回原因</h3>
            <p className="text-sm text-gray-500 mb-4">该原因将通知社长</p>
            <textarea
              value={rejectModal.reason}
              onChange={e => setRejectModal(m => ({ ...m, reason: e.target.value }))}
              placeholder="请详细说明驳回原因..."
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-red-400 focus:outline-none text-sm resize-none mb-4"
              autoFocus
            />
            <div className="flex gap-3">
              <button onClick={() => setRejectModal({ id: null, reason: '' })} className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-2xl font-medium">
                取消
              </button>
              <button onClick={handleReject} className="flex-1 py-3 bg-red-500 text-white rounded-2xl font-medium">
                确认驳回
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Batch reject modal */}
      {batchRejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm animate-slide-in-up">
            <h3 className="text-lg font-bold text-gray-800 mb-1">批量驳回 {selected.length} 个社团</h3>
            <p className="text-sm text-gray-500 mb-4">所有被选中的社团将使用相同的驳回原因</p>
            <textarea
              value={batchReason}
              onChange={e => setBatchReason(e.target.value)}
              placeholder="批量驳回原因..."
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-red-400 focus:outline-none text-sm resize-none mb-4"
              autoFocus
            />
            <div className="flex gap-3">
              <button onClick={() => setBatchRejectModal(false)} className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-2xl font-medium">
                取消
              </button>
              <button onClick={handleBatchReject} className="flex-1 py-3 bg-red-500 text-white rounded-2xl font-medium">
                确认批量驳回
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
