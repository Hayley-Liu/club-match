import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import { ArrowLeft, CheckCircle, XCircle, ChevronDown } from 'lucide-react';
import type { Application } from '../../types';

export default function ClubApplications() {
  const user = useStore(s => s.currentUser);
  const clubs = useStore(s => s.clubs);
  const applications = useStore(s => s.applications);
  const updateApplicationStatus = useStore(s => s.updateApplicationStatus);
  const showToast = useStore(s => s.showToast);
  const navigate = useNavigate();

  const club = useMemo(
    () => user ? clubs.find(c => c.presidentId === user.id) : undefined,
    [clubs, user]
  );

  const apps = useMemo(
    () => club ? applications.filter(a => a.clubId === club.id) : [],
    [applications, club]
  );

  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [selected, setSelected] = useState<string[]>([]);
  const [rejectModal, setRejectModal] = useState<{ id: string | null; reason: string }>({ id: null, reason: '' });
  const [batchRejectModal, setBatchRejectModal] = useState(false);
  const [batchReason, setBatchReason] = useState('');
  const [sortBy, setSortBy] = useState<'time' | 'score'>('time');

  const filteredApps = useMemo(() =>
    apps
      .filter(a => filter === 'all' || a.status === filter)
      .sort((a, b) => {
        if (sortBy === 'score') return b.matchScore - a.matchScore;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }),
    [apps, filter, sortBy]
  );

  const pendingApps = useMemo(() => apps.filter(a => a.status === 'pending'), [apps]);

  const toggleSelect = (id: string) => {
    setSelected(s => s.includes(id) ? s.filter(i => i !== id) : [...s, id]);
  };

  const selectAll = () => {
    const pendingInView = filteredApps.filter(a => a.status === 'pending').map(a => a.id);
    if (selected.length === pendingInView.length) {
      setSelected([]);
    } else {
      setSelected(pendingInView);
    }
  };

  const handleApprove = (id: string) => {
    updateApplicationStatus(id, 'approved');
    showToast('已通过，已通知学生 ✓');
  };

  const handleReject = () => {
    if (!rejectModal.reason.trim()) { showToast('请填写驳回原因', 'error'); return; }
    updateApplicationStatus(rejectModal.id!, 'rejected', rejectModal.reason);
    showToast('已驳回，已通知学生');
    setRejectModal({ id: null, reason: '' });
  };

  const handleBatchApprove = () => {
    selected.forEach(id => updateApplicationStatus(id, 'approved'));
    showToast(`已批量通过 ${selected.length} 份申请 ✓`);
    setSelected([]);
  };

  const handleBatchReject = () => {
    if (!batchReason.trim()) { showToast('请填写驳回原因', 'error'); return; }
    selected.forEach(id => updateApplicationStatus(id, 'rejected', batchReason));
    showToast(`已批量驳回 ${selected.length} 份申请`);
    setSelected([]);
    setBatchRejectModal(false);
    setBatchReason('');
  };

  if (!club || club.status !== 'approved') {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center text-gray-400">
        <div className="text-4xl mb-3">🔒</div>
        <p>社团审核通过后才能管理报名</p>
        <button onClick={() => navigate('/club/dashboard')} className="mt-4 text-purple-600 underline">返回仪表盘</button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/club/dashboard')} className="p-2 rounded-xl hover:bg-gray-100 text-gray-500">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-800">报名管理</h1>
          <p className="text-sm text-gray-400">{club.name} · 共 {apps.length} 份申请</p>
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: '待审核', count: apps.filter(a => a.status === 'pending').length, color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
          { label: '已通过', count: apps.filter(a => a.status === 'approved').length, color: 'bg-green-50 text-green-700 border-green-200' },
          { label: '已驳回', count: apps.filter(a => a.status === 'rejected').length, color: 'bg-red-50 text-red-600 border-red-200' },
        ].map(s => (
          <div key={s.label} className={`rounded-2xl p-4 text-center border ${s.color}`}>
            <div className="text-2xl font-bold">{s.count}</div>
            <div className="text-xs">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filter & Sort */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="flex gap-2 overflow-x-auto">
          {(['all', 'pending', 'approved', 'rejected'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                filter === f ? 'gradient-primary text-white shadow-sm' : 'bg-white text-gray-600 border border-gray-200'
              }`}
            >
              {f === 'all' ? `全部(${apps.length})` :
               f === 'pending' ? `待审(${pendingApps.length})` :
               f === 'approved' ? `通过(${apps.filter(a => a.status === 'approved').length})` :
               `驳回(${apps.filter(a => a.status === 'rejected').length})`}
            </button>
          ))}
        </div>
        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value as 'time' | 'score')}
          className="px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 bg-white"
        >
          <option value="time">按时间排序</option>
          <option value="score">按匹配度排序</option>
        </select>
      </div>

      {/* Batch operations */}
      {filter !== 'rejected' && filteredApps.filter(a => a.status === 'pending').length > 0 && (
        <div className="bg-purple-50 border border-purple-200 rounded-2xl p-3 mb-4 flex items-center justify-between flex-wrap gap-2">
          <label className="flex items-center gap-2 cursor-pointer text-sm text-purple-700">
            <input
              type="checkbox"
              checked={selected.length === filteredApps.filter(a => a.status === 'pending').length && selected.length > 0}
              onChange={selectAll}
              className="rounded accent-purple-600"
            />
            全选待审核 ({filteredApps.filter(a => a.status === 'pending').length})
          </label>
          {selected.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-purple-600">已选 {selected.length} 项</span>
              <button onClick={handleBatchApprove} className="px-3 py-1.5 bg-green-500 text-white rounded-xl text-sm font-medium">批量通过</button>
              <button onClick={() => setBatchRejectModal(true)} className="px-3 py-1.5 bg-red-500 text-white rounded-xl text-sm font-medium">批量驳回</button>
            </div>
          )}
        </div>
      )}

      {/* Application list */}
      {filteredApps.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <div className="text-4xl mb-3">📭</div>
          <p>暂无报名记录</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredApps.map(app => (
            <ApplicationCard
              key={app.id}
              app={app}
              isSelected={selected.includes(app.id)}
              onSelect={() => app.status === 'pending' && toggleSelect(app.id)}
              onApprove={() => handleApprove(app.id)}
              onReject={() => setRejectModal({ id: app.id, reason: '' })}
            />
          ))}
        </div>
      )}

      {/* Reject modal */}
      {rejectModal.id && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm animate-slide-in-up">
            <h3 className="text-lg font-bold text-gray-800 mb-4">填写驳回原因</h3>
            <textarea
              value={rejectModal.reason}
              onChange={e => setRejectModal(m => ({ ...m, reason: e.target.value }))}
              placeholder="请填写驳回原因，将通知学生..."
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-red-400 focus:outline-none text-sm resize-none mb-4"
              autoFocus
            />
            <div className="flex gap-3">
              <button onClick={() => setRejectModal({ id: null, reason: '' })} className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-2xl font-medium">取消</button>
              <button onClick={handleReject} className="flex-1 py-3 bg-red-500 text-white rounded-2xl font-medium">确认驳回</button>
            </div>
          </div>
        </div>
      )}

      {/* Batch reject modal */}
      {batchRejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm animate-slide-in-up">
            <h3 className="text-lg font-bold text-gray-800 mb-1">批量驳回 {selected.length} 份申请</h3>
            <p className="text-sm text-gray-500 mb-4">所有被选中的申请将使用相同的驳回原因</p>
            <textarea
              value={batchReason}
              onChange={e => setBatchReason(e.target.value)}
              placeholder="本次批量驳回原因..."
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-red-400 focus:outline-none text-sm resize-none mb-4"
              autoFocus
            />
            <div className="flex gap-3">
              <button onClick={() => setBatchRejectModal(false)} className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-2xl font-medium">取消</button>
              <button onClick={handleBatchReject} className="flex-1 py-3 bg-red-500 text-white rounded-2xl font-medium">确认批量驳回</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ApplicationCard({ app, isSelected, onSelect, onApprove, onReject }: {
  app: Application;
  isSelected: boolean;
  onSelect: () => void;
  onApprove: () => void;
  onReject: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const statusColor = { pending: 'bg-yellow-100 text-yellow-700', approved: 'bg-green-100 text-green-700', rejected: 'bg-red-100 text-red-600' }[app.status];
  const statusLabel = { pending: '待审核', approved: '已通过', rejected: '已驳回' }[app.status];

  return (
    <div className={`bg-white rounded-2xl shadow-sm card-shadow overflow-hidden transition-all ${isSelected ? 'ring-2 ring-purple-400' : ''}`}>
      <div className="p-5">
        <div className="flex items-start gap-3">
          {app.status === 'pending' && (
            <input type="checkbox" checked={isSelected} onChange={onSelect} className="mt-1 rounded accent-purple-600 shrink-0" />
          )}
          <div className="w-11 h-11 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center text-white font-bold text-lg shrink-0">
            {app.studentName[0]}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-gray-800">{app.studentName}</h3>
              {app.studentMajor && (
                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{app.studentMajor}</span>
              )}
            </div>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-sm font-bold text-purple-600">{app.matchScore}% 匹配</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${statusColor}`}>{statusLabel}</span>
              <span className="text-xs text-gray-400">{app.createdAt}</span>
            </div>
          </div>
        </div>

        {app.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {app.tags.map(tag => (
              <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-purple-50 text-purple-600">{tag}</span>
            ))}
          </div>
        )}

        {(app.introduction || app.rejectReason) && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="mt-2 text-xs text-gray-400 flex items-center gap-1 hover:text-gray-600"
          >
            <ChevronDown size={14} className={`transition-transform ${expanded ? 'rotate-180' : ''}`} />
            {expanded ? '收起' : '查看详情'}
          </button>
        )}

        {expanded && (
          <div className="mt-2 animate-fade-in">
            {app.introduction && (
              <div className="bg-gray-50 rounded-xl p-3 text-sm text-gray-600">
                <p className="text-xs text-gray-400 mb-1">自我介绍</p>
                {app.introduction}
              </div>
            )}
            {app.rejectReason && (
              <div className="bg-red-50 rounded-xl p-3 mt-2 text-sm text-red-600">
                <p className="text-xs text-red-400 mb-1">驳回原因</p>
                {app.rejectReason}
              </div>
            )}
          </div>
        )}

        {app.status === 'pending' && (
          <div className="flex gap-2 mt-4">
            <button
              onClick={onApprove}
              className="flex-1 py-2.5 bg-green-50 text-green-700 border border-green-200 rounded-xl text-sm font-medium hover:bg-green-100 transition flex items-center justify-center gap-1.5"
            >
              <CheckCircle size={16} /> 通过
            </button>
            <button
              onClick={onReject}
              className="flex-1 py-2.5 bg-red-50 text-red-600 border border-red-200 rounded-xl text-sm font-medium hover:bg-red-100 transition flex items-center justify-center gap-1.5"
            >
              <XCircle size={16} /> 驳回
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
