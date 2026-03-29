import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import { Search, Users, Clock, Star } from 'lucide-react';
import { ArrowLeft } from 'lucide-react';

export default function Results() {
  const user = useStore(s => s.currentUser);
  const clubs = useStore(s => s.clubs);
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('全部');

  const hasAssessment = !!user?.assessmentTags;

  const recommendedClubs = useMemo(() => {
    const approvedClubs = clubs.filter(c => c.status === 'approved');
    if (!user?.assessmentTags) {
      return approvedClubs
        .sort((a, b) => b.applicationCount - a.applicationCount)
        .map(c => ({ ...c, matchScore: 0 }));
    }
    const userTags = user.assessmentTags.all;
    return approvedClubs.map(club => {
      const interestMatches = club.interestTags.filter(t => userTags.includes(t)).length;
      const interestScore = club.interestTags.length > 0 ? (interestMatches / club.interestTags.length) * 100 : 50;
      const timeMatches = club.timeTags.filter(t => userTags.includes(t)).length;
      const timeScore = club.timeTags.length > 0 ? (timeMatches / club.timeTags.length) * 100 : 50;
      const skillMatches = club.skillTags.filter(t => userTags.includes(t)).length;
      const skillScore = club.skillTags.length > 0 ? (skillMatches / club.skillTags.length) * 100 : 50;
      const score = Math.min(99, Math.max(30, Math.round(interestScore * 0.5 + timeScore * 0.3 + skillScore * 0.2)));
      return { ...club, matchScore: score };
    }).sort((a, b) => b.matchScore - a.matchScore);
  }, [clubs, user]);

  const categories = ['全部', '文艺创作', '体育运动', '学术科技', '公益实践'];

  const filteredClubs = useMemo(() =>
    recommendedClubs
      .filter(c => filterCat === '全部' || c.category === filterCat)
      .filter(c =>
        search === '' ||
        c.name.includes(search) ||
        c.description.includes(search) ||
        c.tags.some(t => t.includes(search))
      ),
    [recommendedClubs, filterCat, search]
  );

  const topMatch = filteredClubs[0];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6 animate-fade-in">
        <div className="flex items-center gap-3 mb-2">
          <button onClick={() => navigate('/')} className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 transition">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-2xl font-bold text-gray-800">
            {hasAssessment ? '🎯 为你推荐的社团' : '🌟 热门社团'}
          </h1>
        </div>
        {hasAssessment ? (
          <p className="text-gray-500 ml-11">根据你的测评结果，为你精准匹配了以下社团</p>
        ) : (
          <p className="text-gray-500 ml-11">
            完成<button onClick={() => navigate('/student/assessment')} className="text-purple-600 font-medium">兴趣测评</button>，获取专属匹配推荐
          </p>
        )}
      </div>

      {/* Top match highlight */}
      {hasAssessment && topMatch && topMatch.matchScore >= 80 && (
        <div
          onClick={() => navigate(`/student/club/${topMatch.id}`)}
          className={`bg-gradient-to-r ${topMatch.coverColor} rounded-3xl p-6 mb-6 text-white cursor-pointer hover:shadow-xl transition-shadow animate-slide-in-up`}
        >
          <div className="flex items-center gap-2 mb-2">
            <Star size={16} className="text-yellow-300" fill="currentColor" />
            <span className="text-sm font-semibold text-yellow-200">最佳匹配</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-4xl">
              {topMatch.coverEmoji}
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold mb-1">{topMatch.name}</h2>
              <p className="text-white/80 text-sm line-clamp-2">{topMatch.description}</p>
              <div className="flex items-center gap-3 mt-2 text-sm text-white/70">
                <span className="flex items-center gap-1"><Users size={14} /> {topMatch.applicationCount} 人报名</span>
                <span>截止 {topMatch.deadline}</span>
              </div>
            </div>
            <div className="text-center shrink-0">
              <div className="text-3xl font-bold text-yellow-300">{topMatch.matchScore}%</div>
              <div className="text-xs text-white/70">匹配度</div>
            </div>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="搜索社团名称或标签..."
            className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 bg-white focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-100 text-sm"
          />
        </div>
      </div>

      {/* Category filter */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setFilterCat(cat)}
            className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${
              filterCat === cat
                ? 'gradient-primary text-white shadow-md'
                : 'bg-white text-gray-600 border border-gray-200 hover:border-purple-300'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* No results */}
      {filteredClubs.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <div className="text-4xl mb-3">🔍</div>
          <p>没有找到匹配的社团</p>
        </div>
      )}

      {!hasAssessment && filteredClubs.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-5 text-sm text-amber-700">
          ⚡ 暂无完美匹配的社团，为你推荐热门社团~
          <button onClick={() => navigate('/student/assessment')} className="ml-2 underline font-medium">
            完成测评获取个性化推荐
          </button>
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        {filteredClubs.map((club, index) => (
          <ClubCard
            key={club.id}
            club={club}
            rank={index + 1}
            hasAssessment={hasAssessment}
            onClick={() => navigate(`/student/club/${club.id}`)}
          />
        ))}
      </div>
    </div>
  );
}

function ClubCard({ club, rank, hasAssessment, onClick }: {
  club: any;
  rank: number;
  hasAssessment: boolean;
  onClick: () => void;
}) {
  const getMatchColor = (score: number) => {
    if (score >= 85) return 'text-purple-700 bg-purple-100';
    if (score >= 70) return 'text-blue-700 bg-blue-100';
    if (score >= 55) return 'text-green-700 bg-green-100';
    return 'text-gray-600 bg-gray-100';
  };

  const isDeadlineSoon = () => {
    const deadline = new Date(club.deadline);
    const today = new Date();
    const diff = (deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
    return diff <= 7 && diff >= 0;
  };

  const isFull = club.currentMembers >= club.maxMembers;

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-2xl p-5 shadow-sm card-shadow club-card cursor-pointer"
    >
      <div className="flex items-start gap-3 mb-3">
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${club.coverColor} flex items-center justify-center text-2xl shrink-0`}>
          {club.coverEmoji}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-gray-800 truncate">{club.name}</h3>
            {rank <= 3 && hasAssessment && (
              <span className="shrink-0 text-xs font-semibold bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded">
                TOP{rank}
              </span>
            )}
          </div>
          <span className={`text-xs px-2 py-0.5 rounded-full ${club.categoryColor}`}>{club.category}</span>
        </div>
        {hasAssessment && club.matchScore > 0 && (
          <div className={`shrink-0 text-sm font-bold px-2.5 py-1 rounded-xl ${getMatchColor(club.matchScore)}`}>
            {club.matchScore}%
          </div>
        )}
      </div>

      <p className="text-sm text-gray-500 line-clamp-2 mb-3">{club.description}</p>

      <div className="flex flex-wrap gap-1.5 mb-3">
        {club.tags.slice(0, 3).map((tag: string) => (
          <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
            {tag}
          </span>
        ))}
      </div>

      <div className="flex items-center justify-between text-xs text-gray-400 pt-2 border-t border-gray-100">
        <div className="flex items-center gap-1">
          <Users size={12} />
          <span>{club.applicationCount} 人报名</span>
          {isFull && <span className="text-red-400 ml-1">（名额已满）</span>}
        </div>
        <div className={`flex items-center gap-1 ${isDeadlineSoon() ? 'text-orange-500' : ''}`}>
          <Clock size={12} />
          <span>截止 {club.deadline}</span>
          {isDeadlineSoon() && <span className="text-orange-500">⚡</span>}
        </div>
      </div>
    </div>
  );
}
