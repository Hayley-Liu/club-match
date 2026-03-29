import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import { ArrowLeft, Plus, Pin, Eye, EyeOff, Trash2, Send, RotateCcw } from 'lucide-react';
import type { NotificationTarget } from '../../types';

export default function Announcements() {
  const navigate = useNavigate();
  const user = useStore(s => s.currentUser);
  const notifications = useStore(s => s.notifications);
  const addNotification = useStore(s => s.addNotification);
  const withdrawNotification = useStore(s => s.withdrawNotification);
  const deleteNotification = useStore(s => s.deleteNotification);
  const showToast = useStore(s => s.showToast);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: '',
    content: '',
    targetRole: 'all' as NotificationTarget,
    isPinned: false,
  });

  const officialNotifications = notifications
    .filter(n => n.type === 'official')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const handleSubmit = () => {
    if (!form.title.trim()) { showToast('请填写通知标题', 'error'); return; }
    if (!form.content.trim()) { showToast('请填写通知内容', 'error'); return; }

    addNotification({
      title: form.title,
      content: form.content,
      type: 'official',
      targetRole: form.targetRole,
      isPinned: form.isPinned,
      createdBy: user?.id || 'admin',
    });

    showToast('通知已发布 ✓');
    setForm({ title: '', content: '', targetRole: 'all', isPinned: false });
    setShowForm(false);
  };

  const targetLabels: Record<string, string> = {
    all: '全部用户',
    student: '仅学生',
    club: '仅社长',
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/admin/dashboard')} className="p-2 rounded-xl hover:bg-gray-100 text-gray-500">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-800">通知管理</h1>
          <p className="text-sm text-gray-400">发布官方通知，直达学生和社长</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2.5 gradient-primary text-white rounded-2xl font-medium shadow-md hover:shadow-lg transition btn-click"
        >
          <Plus size={18} /> 发布通知
        </button>
      </div>

      {/* Publish form */}
      {showForm && (
        <div className="bg-white rounded-3xl p-6 shadow-lg card-shadow mb-6 animate-slide-in-down">
          <h2 className="font-bold text-gray-800 mb-5">发布新通知</h2>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-2">
                通知标题 <span className="text-red-400">*</span>
              </label>
              <input
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="请输入通知标题"
                maxLength={50}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-100 text-sm"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 block mb-2">
                通知内容 <span className="text-red-400">*</span>
              </label>
              <textarea
                value={form.content}
                onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                placeholder="请输入通知内容..."
                rows={5}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-100 text-sm resize-none"
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">接收范围</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['all', 'student', 'club'] as const).map(role => (
                    <button
                      key={role}
                      onClick={() => setForm(f => ({ ...f, targetRole: role }))}
                      className={`py-2 rounded-xl text-sm font-medium border-2 transition-all ${
                        form.targetRole === role
                          ? 'border-purple-500 bg-purple-50 text-purple-700'
                          : 'border-gray-200 text-gray-600 hover:border-purple-300'
                      }`}
                    >
                      {targetLabels[role]}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">置顶设置</label>
                <button
                  onClick={() => setForm(f => ({ ...f, isPinned: !f.isPinned }))}
                  className={`w-full py-2 rounded-xl text-sm font-medium border-2 transition-all flex items-center justify-center gap-2 ${
                    form.isPinned
                      ? 'border-purple-500 bg-purple-50 text-purple-700'
                      : 'border-gray-200 text-gray-600 hover:border-purple-300'
                  }`}
                >
                  <Pin size={16} /> {form.isPinned ? '已设置置顶' : '设为置顶'}
                </button>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowForm(false)}
                className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-2xl font-medium"
              >
                取消
              </button>
              <button
                onClick={handleSubmit}
                className="flex-1 py-3 gradient-primary text-white rounded-2xl font-bold shadow-md flex items-center justify-center gap-2"
              >
                <Send size={18} /> 发布通知
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notification list */}
      {officialNotifications.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <div className="text-4xl mb-3">📢</div>
          <p>还没有发布任何通知</p>
          <button onClick={() => setShowForm(true)} className="mt-4 text-purple-600 underline text-sm">
            发布第一条通知
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {officialNotifications.map(notif => (
            <div
              key={notif.id}
              className={`bg-white rounded-2xl p-5 shadow-sm card-shadow ${notif.isWithdrawn ? 'opacity-50' : ''}`}
            >
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    {notif.isPinned && <Pin size={14} className="text-purple-500 shrink-0" />}
                    <h3 className={`font-bold text-gray-800 ${notif.isWithdrawn ? 'line-through text-gray-400' : ''}`}>
                      {notif.title}
                    </h3>
                    {notif.isWithdrawn && (
                      <span className="text-xs bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full">已撤回</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 line-clamp-2 mb-3">{notif.content}</p>
                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    <span>发布于 {notif.createdAt}</span>
                    <span className="bg-gray-100 px-2 py-0.5 rounded-full">
                      {targetLabels[notif.targetRole]}
                    </span>
                    {notif.isPinned && (
                      <span className="bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full">置顶</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              {!notif.isWithdrawn && (
                <div className="flex gap-2 mt-4 pt-3 border-t border-gray-100">
                  <button
                    onClick={() => {
                      withdrawNotification(notif.id);
                      showToast('通知已撤回');
                    }}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm text-orange-600 bg-orange-50 hover:bg-orange-100 transition"
                  >
                    <RotateCcw size={14} /> 撤回
                  </button>
                  <button
                    onClick={() => {
                      deleteNotification(notif.id);
                      showToast('通知已删除');
                    }}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm text-red-600 bg-red-50 hover:bg-red-100 transition"
                  >
                    <Trash2 size={14} /> 删除
                  </button>
                </div>
              )}
              {notif.isWithdrawn && (
                <div className="flex gap-2 mt-4 pt-3 border-t border-gray-100">
                  <button
                    onClick={() => {
                      deleteNotification(notif.id);
                      showToast('通知已删除');
                    }}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm text-red-600 bg-red-50 hover:bg-red-100 transition"
                  >
                    <Trash2 size={14} /> 删除
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
