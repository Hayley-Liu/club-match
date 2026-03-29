import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import { ArrowLeft, Bell, CheckCheck, Pin } from 'lucide-react';
import type { Notification } from '../../types';

export function NotificationsPage() {
  const user = useStore(s => s.currentUser);
  const notifications = useStore(s => s.notifications);
  const markNotificationRead = useStore(s => s.markNotificationRead);
  const markAllRead = useStore(s => s.markAllRead);
  const navigate = useNavigate();

  const userNotifications = useMemo(() => {
    if (!user) return [];
    return notifications.filter(n => {
      if (n.isWithdrawn) return false;
      if (n.targetUserId) return n.targetUserId === user.id;
      if (n.targetRole === 'all') return true;
      if (n.targetRole === 'student' && user.role === 'student') return true;
      if (n.targetRole === 'club' && user.role === 'club') return true;
      return false;
    }).sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [notifications, user]);

  const unreadCount = useMemo(
    () => userNotifications.filter(n => !n.readBy.includes(user?.id || '')).length,
    [userNotifications, user]
  );

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 transition">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Bell size={22} /> 通知中心
          </h1>
          {unreadCount > 0 && (
            <p className="text-sm text-purple-600">{unreadCount} 条未读</p>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="flex items-center gap-1 text-sm text-purple-600 hover:text-purple-800"
          >
            <CheckCheck size={16} /> 全部已读
          </button>
        )}
      </div>

      {userNotifications.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <div className="text-5xl mb-4">🔔</div>
          <p>暂无通知</p>
        </div>
      ) : (
        <div className="space-y-3">
          {userNotifications.map(notif => {
            const isRead = notif.readBy.includes(user?.id || '');
            return (
              <div
                key={notif.id}
                onClick={() => markNotificationRead(notif.id)}
                className={`bg-white rounded-2xl p-5 shadow-sm cursor-pointer transition-all ${
                  !isRead ? 'card-shadow border-l-4 border-l-purple-500' : 'opacity-80'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-lg ${
                    notif.type === 'official'
                      ? 'bg-gradient-to-br from-purple-500 to-indigo-500 text-white'
                      : 'bg-gradient-to-br from-blue-500 to-cyan-500 text-white'
                  }`}>
                    {notif.type === 'official' ? '📢' : '🔔'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {notif.isPinned && <Pin size={12} className="text-purple-500 shrink-0" />}
                      <h3 className={`font-semibold text-sm ${isRead ? 'text-gray-600' : 'text-gray-800'} flex-1`}>
                        {notif.title}
                      </h3>
                      {!isRead && <div className="w-2 h-2 bg-purple-500 rounded-full shrink-0" />}
                    </div>
                    <p className="text-sm text-gray-500 line-clamp-2 mb-1.5">{notif.content}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">{notif.createdAt}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        notif.type === 'official'
                          ? 'bg-purple-100 text-purple-600'
                          : 'bg-blue-100 text-blue-600'
                      }`}>
                        {notif.type === 'official' ? '官方通知' : '系统消息'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function StudentNotifications() {
  return <NotificationsPage />;
}
