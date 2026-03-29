import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import { ArrowLeft, Heart, Users, Clock } from 'lucide-react';

export default function Favorites() {
  const user = useStore(s => s.currentUser);
  const clubs = useStore(s => s.clubs);
  const toggleFavorite = useStore(s => s.toggleFavorite);
  const showToast = useStore(s => s.showToast);
  const navigate = useNavigate();

  const favoriteClubs = useMemo(
    () => user ? clubs.filter(c => user.favorites.includes(c.id)) : [],
    [clubs, user]
  );

  if (favoriteClubs.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <div className="text-5xl mb-4">💝</div>
        <h2 className="text-xl font-bold text-gray-700 mb-2">还没有收藏的社团</h2>
        <p className="text-gray-400 mb-6">在社团详情页点击 ♡ 收藏喜欢的社团</p>
        <button onClick={() => navigate('/student/results')} className="px-6 py-3 gradient-primary text-white rounded-2xl font-semibold shadow-md">
          去浏览社团
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
        <h1 className="text-2xl font-bold text-gray-800">我的收藏</h1>
        <span className="text-sm text-gray-400 ml-auto">{favoriteClubs.length} 个社团</span>
      </div>

      <div className="space-y-4">
        {favoriteClubs.map(club => {
          const isOffline = club.status === 'offline';
          const isDeadlinePassed = new Date(club.deadline) < new Date();
          return (
            <div
              key={club.id}
              className="bg-white rounded-2xl p-5 shadow-sm card-shadow club-card cursor-pointer"
              onClick={() => !isOffline && navigate(`/student/club/${club.id}`)}
            >
              <div className="flex items-start gap-3">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${club.coverColor} flex items-center justify-center text-3xl shrink-0 ${isOffline ? 'opacity-50 grayscale' : ''}`}>
                  {club.coverEmoji}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-gray-800">{club.name}</h3>
                    {isOffline && (
                      <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">已下架</span>
                    )}
                    {isDeadlinePassed && !isOffline && (
                      <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full">已截止</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 line-clamp-2 mb-2">{club.description}</p>
                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    <span className="flex items-center gap-1"><Users size={12} /> {club.applicationCount} 人</span>
                    <span className="flex items-center gap-1"><Clock size={12} /> 截止 {club.deadline}</span>
                  </div>
                </div>
                <button
                  onClick={e => {
                    e.stopPropagation();
                    toggleFavorite(club.id);
                    showToast('已取消收藏', 'success');
                  }}
                  className="p-2 text-pink-500 hover:bg-pink-50 rounded-xl transition"
                >
                  <Heart size={20} fill="currentColor" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
