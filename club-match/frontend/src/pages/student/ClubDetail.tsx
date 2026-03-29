import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import { ArrowLeft, CheckCircle, Heart, Users, Clock, AlertCircle, Phone } from 'lucide-react';

export default function ClubDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = useStore(s => s.currentUser);
  const clubs = useStore(s => s.clubs);
  const applications = useStore(s => s.applications);
  const toggleFavorite = useStore(s => s.toggleFavorite);
  const showToast = useStore(s => s.showToast);

  const club = clubs.find(c => c.id === id);
  const isFav = user?.favorites.includes(id!) ?? false;
  const myApp = user ? applications.find(a => a.clubId === id && a.studentId === user.id) : undefined;

  const matchScore = React.useMemo(() => {
    if (!club || !user?.assessmentTags) return 0;
    const userTags = user.assessmentTags.all;
    const interestMatches = club.interestTags.filter(t => userTags.includes(t)).length;
    const interestScore = club.interestTags.length > 0 ? (interestMatches / club.interestTags.length) * 100 : 50;
    const timeMatches = club.timeTags.filter(t => userTags.includes(t)).length;
    const timeScore = club.timeTags.length > 0 ? (timeMatches / club.timeTags.length) * 100 : 50;
    const skillMatches = club.skillTags.filter(t => userTags.includes(t)).length;
    const skillScore = club.skillTags.length > 0 ? (skillMatches / club.skillTags.length) * 100 : 50;
    return Math.min(99, Math.max(30, Math.round(interestScore * 0.5 + timeScore * 0.3 + skillScore * 0.2)));
  }, [club, user]);

  const hasAssessment = !!user?.assessmentTags;

  if (!club) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center text-gray-400">
        <div className="text-4xl mb-3">😢</div>
        <p>社团不存在或已下架</p>
        <button onClick={() => navigate(-1)} className="mt-4 text-purple-600 underline">返回</button>
      </div>
    );
  }

  if (club.status === 'offline') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center text-gray-400">
        <div className="text-4xl mb-3">🚫</div>
        <p className="font-medium">该社团已下架，报名自动取消</p>
        <button onClick={() => navigate('/student/results')} className="mt-4 text-purple-600 underline">
          看看其他社团
        </button>
      </div>
    );
  }

  const isDeadlinePassed = new Date(club.deadline) < new Date();
  const isFull = club.currentMembers >= club.maxMembers;
  const spotsLeft = club.maxMembers - club.currentMembers;

  const getApplyStatus = () => {
    if (myApp) {
      if (myApp.status === 'pending') return { type: 'already', label: '已报名（待审核）', color: 'bg-yellow-100 text-yellow-700' };
      if (myApp.status === 'approved') return { type: 'approved', label: '已通过 ✓', color: 'bg-green-100 text-green-700' };
      if (myApp.status === 'rejected') return { type: 'rejected', label: '已驳回', color: 'bg-red-100 text-red-600' };
    }
    if (isDeadlinePassed) return { type: 'closed', label: '招新已结束', color: 'bg-gray-100 text-gray-500' };
    if (isFull) return { type: 'full', label: '名额已满', color: 'bg-red-100 text-red-500' };
    return { type: 'open', label: '立即报名', color: 'gradient-primary' };
  };

  const applyStatus = getApplyStatus();

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 animate-fade-in">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-4 transition">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        <span className="text-sm">返回</span>
      </button>

      {/* Cover */}
      <div className={`bg-gradient-to-br ${club.coverColor} rounded-3xl p-8 text-white mb-6 relative overflow-hidden`}>
        <div className="absolute inset-0 opacity-10 text-[200px] flex items-center justify-center pointer-events-none select-none">
          {club.coverEmoji}
        </div>
        <div className="relative">
          <div className="text-5xl mb-3">{club.coverEmoji}</div>
          <h1 className="text-2xl font-bold mb-1">{club.name}</h1>
          <span className="text-sm bg-white/20 px-3 py-1 rounded-full">{club.category}</span>
          <div className="flex items-center gap-4 mt-4 text-sm text-white/80">
            <span className="flex items-center gap-1"><Users size={14} /> {club.applicationCount} 人报名</span>
            <span className="flex items-center gap-1"><Clock size={14} /> 截止 {club.deadline}</span>
          </div>
        </div>
      </div>

      {/* Match score */}
      {hasAssessment && (
        <div className="bg-white rounded-2xl p-4 mb-4 shadow-sm card-shadow flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">与你的匹配度</p>
            <p className="text-xs text-gray-400 mt-0.5">基于兴趣测评结果</p>
          </div>
          <div className="text-center">
            <div className={`text-3xl font-bold ${matchScore >= 80 ? 'gradient-text' : 'text-gray-700'}`}>
              {matchScore}%
            </div>
            <div className="text-xs text-gray-400">
              {matchScore >= 85 ? '非常匹配 🎯' : matchScore >= 70 ? '比较匹配 👍' : matchScore >= 50 ? '有点匹配 🤔' : '一般匹配'}
            </div>
          </div>
        </div>
      )}

      {/* Spots warning */}
      {!isFull && !isDeadlinePassed && spotsLeft <= 5 && spotsLeft > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 mb-4 flex items-center gap-2 text-sm text-orange-700">
          <AlertCircle size={16} />
          <span>仅剩 <strong>{spotsLeft}</strong> 个名额，快抓紧！</span>
        </div>
      )}

      {/* Info cards */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-white rounded-2xl p-4 shadow-sm card-shadow">
          <p className="text-xs text-gray-400 mb-1">招新人数</p>
          <p className="text-lg font-bold text-gray-800">{club.currentMembers} / {club.maxMembers}</p>
          <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full gradient-primary rounded-full" style={{ width: `${Math.min(100, (club.currentMembers / club.maxMembers) * 100)}%` }} />
          </div>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm card-shadow">
          <p className="text-xs text-gray-400 mb-1">招新截止</p>
          <p className="text-lg font-bold text-gray-800">{club.deadline}</p>
          {isDeadlinePassed && <p className="text-xs text-red-500 mt-1">已截止</p>}
        </div>
      </div>

      {/* Description */}
      <div className="bg-white rounded-2xl p-5 mb-4 shadow-sm card-shadow">
        <h2 className="font-bold text-gray-800 mb-3">关于我们</h2>
        <p className="text-sm text-gray-600 leading-relaxed">{club.detailDescription}</p>
      </div>

      {/* Activities */}
      <div className="bg-white rounded-2xl p-5 mb-4 shadow-sm card-shadow">
        <h2 className="font-bold text-gray-800 mb-3">社团活动</h2>
        <div className="grid grid-cols-2 gap-2">
          {club.activities.map((activity, i) => (
            <div key={i} className="flex items-center gap-2 text-sm text-gray-600">
              <CheckCircle size={14} className="text-purple-500 shrink-0" />
              {activity}
            </div>
          ))}
        </div>
      </div>

      {/* Requirements */}
      {club.requirements && (
        <div className="bg-white rounded-2xl p-5 mb-4 shadow-sm card-shadow">
          <h2 className="font-bold text-gray-800 mb-3">招新要求</h2>
          <p className="text-sm text-gray-600 leading-relaxed">{club.requirements}</p>
        </div>
      )}

      {/* Tags */}
      <div className="bg-white rounded-2xl p-5 mb-4 shadow-sm card-shadow">
        <h2 className="font-bold text-gray-800 mb-3">社团标签</h2>
        <div className="flex flex-wrap gap-2">
          {[...club.tags, ...club.interestTags].filter((t, i, arr) => arr.indexOf(t) === i).map(tag => (
            <span key={tag} className="text-sm px-3 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* President contact (if approved) */}
      {myApp?.status === 'approved' && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-5 mb-4">
          <h2 className="font-bold text-green-700 mb-3 flex items-center gap-2">
            <CheckCircle size={18} /> 报名已通过！联系社长
          </h2>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-200 flex items-center justify-center text-green-700 font-bold">
              {club.presidentName[0]}
            </div>
            <div>
              <p className="font-medium text-gray-800">{club.presidentName}</p>
              <p className="text-sm text-gray-500 flex items-center gap-1"><Phone size={12} /> {club.phone}</p>
            </div>
          </div>
        </div>
      )}

      {/* Reject reason */}
      {myApp?.status === 'rejected' && myApp.rejectReason && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-4 text-sm text-red-700">
          <p className="font-medium mb-1">😔 驳回原因</p>
          <p>{myApp.rejectReason}</p>
        </div>
      )}

      {/* Bottom action bar */}
      <div className="sticky bottom-0 bg-white/90 backdrop-blur border-t border-gray-100 p-4 -mx-4 flex gap-3">
        <button
          onClick={() => toggleFavorite(id!)}
          className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all border-2 ${
            isFav ? 'border-pink-500 bg-pink-50 text-pink-500' : 'border-gray-200 text-gray-400 hover:border-pink-300'
          }`}
        >
          <Heart size={20} fill={isFav ? 'currentColor' : 'none'} />
        </button>
        <button
          onClick={() => {
            if (applyStatus.type === 'open') navigate(`/student/apply/${id}`);
            else if (applyStatus.type === 'already' || applyStatus.type === 'approved') navigate('/student/my-applications');
            else if (applyStatus.type === 'full') showToast('名额已满，建议关注其他相似社团', 'info');
            else if (applyStatus.type === 'closed') showToast('招新已结束，看看其他在招社团吧', 'info');
          }}
          className={`flex-1 py-3.5 rounded-2xl font-bold text-sm transition-all btn-click ${
            applyStatus.type === 'open'
              ? 'gradient-primary text-white shadow-md hover:shadow-lg'
              : `${applyStatus.color} cursor-default`
          }`}
        >
          {applyStatus.label}
        </button>
      </div>
    </div>
  );
}
