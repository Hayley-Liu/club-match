import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import { ArrowLeft, Clock, CheckCircle, XCircle, Trash2, ChevronRight } from 'lucide-react';

export default function MyApplications() {
  const user = useStore(s => s.currentUser);
  const applications = useStore(s => s.applications);
  const clubs = useStore(s => s.clubs);
  const cancelApplication = useStore(s => s.cancelApplication);
  const showToast = useStore(s => s.showToast);
  const navigate = useNavigate();

  const [cancelId, setCancelId] = React.useState<string | null>(null);

  const myApps = useMemo(
    () => user ? applications.filter(a => a.studentId === user.id) : [],
    [applications, user]
  );

  const handleCancel = (id: string) => {
    cancelApplication(id);
    showToast('已取消报名', 'success');
    setCancelId(null);
  };

  if (myApps.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <div className="text-5xl mb-4">📋</div>
        <h2 className="text-xl font-bold text-gray-700 mb-2">还没有报名记录</h2>
        <p className="text-gray-400 mb-6">去找找感兴趣的社团吧！</p>
        <button onClick={() => navigate('/student/results')} className="px-6 py-3 gradient-primary text-white rounded-2xl font-semibold shadow-md">
          浏览社团
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/')} className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 transition">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        </button>
        <h1 className="text-2xl font-bold text-gray-800">我的报名</h1>
        <span className="text-sm text-gray-400 ml-auto">{myApps.length} 条记录</span>
      </div>

      <div className="space-y-4">
        {[...myApps].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(app => {
          const club = clubs.find(c => c.id === app.clubId);
          const isOffline = club?.status === 'offline';
          return (
            <div key={app.id} className="bg-white rounded-2xl p-5 shadow-sm card-shadow">
              <div className="flex items-start gap-3 mb-3">
                {club && (
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${club.coverColor} flex items-center justify-center text-2xl shrink-0`}>
                    {club.coverEmoji}
                  </div>
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h3 className="font-bold text-gray-800">{app.clubName}</h3>
                    {isOffline && (
                      <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">已下架</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400">申请于 {app.createdAt}</p>
                </div>
                <StatusBadge status={app.status} />
              </div>

              {app.status === 'rejected' && app.rejectReason && (
                <div className="bg-red-50 rounded-xl p-3 mb-3 text-sm text-red-600">
                  <p className="font-medium mb-0.5">驳回原因：</p>
                  <p>{app.rejectReason}</p>
                </div>
              )}

              {app.status === 'approved' && club && (
                <div className="bg-green-50 rounded-xl p-3 mb-3 flex items-center justify-between">
                  <div className="text-sm text-green-700">
                    <p className="font-medium">🎉 审核通过！</p>
                    <p className="text-xs mt-0.5">社长联系方式：{club.phone}</p>
                  </div>
                  <button
                    onClick={() => navigate(`/student/club/${app.clubId}`)}
                    className="text-green-600 text-xs flex items-center gap-1"
                  >
                    查看详情 <ChevronRight size={14} />
                  </button>
                </div>
              )}

              {app.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {app.tags.map(tag => (
                    <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-purple-50 text-purple-600">{tag}</span>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                <button onClick={() => navigate(`/student/club/${app.clubId}`)} className="text-sm text-purple-600 hover:text-purple-700 font-medium">
                  查看社团
                </button>
                {app.status === 'pending' && !isOffline && (
                  <button onClick={() => setCancelId(app.id)} className="text-sm text-red-400 hover:text-red-600 flex items-center gap-1">
                    <Trash2 size={14} /> 取消报名
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {cancelId && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm animate-slide-in-up">
            <h3 className="text-lg font-bold text-gray-800 mb-2">确认取消报名？</h3>
            <p className="text-gray-500 text-sm mb-6">取消后需重新提交报名申请</p>
            <div className="flex gap-3">
              <button onClick={() => setCancelId(null)} className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-2xl font-medium">再想想</button>
              <button onClick={() => handleCancel(cancelId)} className="flex-1 py-3 bg-red-500 text-white rounded-2xl font-medium">确认取消</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    pending: { label: '待审核', color: 'bg-yellow-100 text-yellow-700', icon: <Clock size={12} /> },
    approved: { label: '已通过', color: 'bg-green-100 text-green-700', icon: <CheckCircle size={12} /> },
    rejected: { label: '已驳回', color: 'bg-red-100 text-red-600', icon: <XCircle size={12} /> },
  };
  const s = map[status] || { label: '未知', color: 'bg-gray-100 text-gray-600', icon: null };
  return (
    <span className={`flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${s.color}`}>
      {s.icon} {s.label}
    </span>
  );
}
