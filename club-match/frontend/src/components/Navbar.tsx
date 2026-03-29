import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useStore } from '../store/useStore';
import {
  Home, Search, BookOpen, Heart, Bell, LogOut, Users, ClipboardList,
  Settings, ChevronRight, Menu, X, Star, Megaphone
} from 'lucide-react';

export default function Navbar() {
  const user = useStore(s => s.currentUser);
  const logout = useStore(s => s.logout);
  const notifications = useStore(s => s.notifications);
  const unreadCount = React.useMemo(() => {
    if (!user) return 0;
    return notifications.filter(n => {
      if (n.isWithdrawn) return false;
      if (!n.readBy.includes(user.id)) {
        if (n.targetUserId) return n.targetUserId === user.id;
        if (n.targetRole === 'all') return true;
        if (n.targetRole === user.role) return true;
      }
      return false;
    }).length;
  }, [notifications, user]);
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');

  if (!user) {
    return (
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-purple-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
            <span className="text-2xl">🎓</span>
            <span className="font-bold text-xl bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              社团招新平台
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/login')}
              className="px-5 py-2 rounded-full text-purple-600 font-medium hover:bg-purple-50 transition-colors"
            >
              登录
            </button>
            <button
              onClick={() => navigate('/login?tab=register')}
              className="px-5 py-2 rounded-full gradient-primary text-white font-medium shadow-md hover:shadow-lg transition-shadow btn-click"
            >
              注册
            </button>
          </div>
        </div>
      </nav>
    );
  }

  const studentNav = [
    { path: '/', icon: <Home size={18} />, label: '首页' },
    { path: '/student/assessment', icon: <BookOpen size={18} />, label: '兴趣测评' },
    { path: '/student/results', icon: <Search size={18} />, label: '推荐社团' },
    { path: '/student/my-applications', icon: <ClipboardList size={18} />, label: '我的报名' },
    { path: '/student/favorites', icon: <Heart size={18} />, label: '我的收藏' },
  ];

  const clubNav = [
    { path: '/club/dashboard', icon: <Home size={18} />, label: '社团主页' },
    { path: '/club/applications', icon: <Users size={18} />, label: '报名管理' },
    { path: '/club/notifications', icon: <Bell size={18} />, label: '通知' },
  ];

  const adminNav = [
    { path: '/admin/dashboard', icon: <Home size={18} />, label: '控制台' },
    { path: '/admin/club-review', icon: <ClipboardList size={18} />, label: '社团审核' },
    { path: '/admin/announcements', icon: <Megaphone size={18} />, label: '通知管理' },
    { path: '/admin/club-manage', icon: <Settings size={18} />, label: '社团管理' },
  ];

  const navItems = user.role === 'student' ? studentNav :
    user.role === 'club' ? clubNav : adminNav;

  const roleLabel = user.role === 'student' ? '学生' :
    user.role === 'club' ? '社长' : '管理员';
  const roleBg = user.role === 'student' ? 'bg-purple-100 text-purple-700' :
    user.role === 'club' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700';

  return (
    <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-purple-100 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
          <span className="text-2xl">🎓</span>
          <span className="font-bold text-xl bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent hidden sm:block">
            社团招新平台
          </span>
        </div>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-1">
          {navItems.map(item => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                isActive(item.path)
                  ? 'bg-purple-100 text-purple-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>

        {/* Right section */}
        <div className="flex items-center gap-2">
          {user.role !== 'admin' && (
            <button
              onClick={() => navigate(user.role === 'student' ? '/student/notifications' : '/club/notifications')}
              className="relative p-2 rounded-xl text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="notification-badge">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>
          )}

          <div className="flex items-center gap-2">
            <div className={`text-xs px-2 py-0.5 rounded-full font-medium ${roleBg}`}>
              {roleLabel}
            </div>
            <span className="text-sm font-medium text-gray-700 hidden sm:block">{user.name}</span>
          </div>

          <button
            onClick={handleLogout}
            className="p-2 rounded-xl text-gray-500 hover:bg-red-50 hover:text-red-500 transition-colors"
            title="退出登录"
          >
            <LogOut size={18} />
          </button>

          {/* Mobile menu button */}
          <button
            className="p-2 rounded-xl text-gray-600 hover:bg-gray-100 md:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-purple-100 animate-slide-in-down">
          {navItems.map(item => (
            <button
              key={item.path}
              onClick={() => { navigate(item.path); setMobileOpen(false); }}
              className={`w-full flex items-center gap-3 px-6 py-3 text-sm font-medium transition-colors ${
                isActive(item.path)
                  ? 'bg-purple-50 text-purple-700'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {item.icon}
              {item.label}
              <ChevronRight size={16} className="ml-auto text-gray-400" />
            </button>
          ))}
        </div>
      )}
    </nav>
  );
}
