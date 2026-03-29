import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import { ASSESSMENT_QUESTIONS, Q2_OPTIONS_MAP } from '../../data/mockData';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { AssessmentTags } from '../../types';

// Q2 "其他" 选项的 value 集合（需要显示文本输入框）
const OTHER_VALUES = new Set([
  'art_other', 'sport_other', 'tech_other', 'welfare_other', 'exp_other',
]);

export default function Assessment() {
  const user = useStore(s => s.currentUser);
  const saveAssessmentDraft = useStore(s => s.saveAssessmentDraft);
  const completeAssessment = useStore(s => s.completeAssessment);
  const showToast = useStore(s => s.showToast);
  const navigate = useNavigate();

  const today = new Date().toISOString().split('T')[0];
  const hasAssessedToday = user?.lastAssessmentDate === today;

  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string[]>>(
    user?.assessmentDraft?.answers || {}
  );
  // Q2 "其他" 自定义输入
  const [otherTexts, setOtherTexts] = useState<Record<string, string>>({});
  const [showComplete, setShowComplete] = useState(false);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    if (hasAssessedToday && !user?.assessmentDraft) {
      showToast('今天已经测评过了，明天再来吧~', 'info');
    }
  }, []);

  // ── Q2 动态选项：根据 Q1 的答案生成 ──────────────────────────────────
  const q2Options = useMemo(() => {
    const q1Selected = answers[1] || [];
    if (q1Selected.length === 0) return [];
    // 合并 Q1 所有选中类别对应的 Q2 选项，去重
    const merged: typeof Q2_OPTIONS_MAP['art'] = [];
    const seen = new Set<string>();
    q1Selected.forEach(cat => {
      const opts = Q2_OPTIONS_MAP[cat] || [];
      opts.forEach(opt => {
        if (!seen.has(opt.value)) {
          seen.add(opt.value);
          merged.push(opt);
        }
      });
    });
    return merged;
  }, [answers]);

  // 当前题目（Q2 用动态 options）
  const rawQuestion = ASSESSMENT_QUESTIONS[currentQ];
  const question = useMemo(() => {
    if (rawQuestion.id === 2) {
      return { ...rawQuestion, options: q2Options };
    }
    return rawQuestion;
  }, [rawQuestion, q2Options]);

  const totalQ = ASSESSMENT_QUESTIONS.length;
  const currentAnswers = answers[currentQ + 1] || [];

  const toggleOption = (value: string) => {
    const curr = answers[currentQ + 1] || [];
    const maxSelect = question.maxSelect;
    if (curr.includes(value)) {
      setAnswers(prev => ({
        ...prev,
        [currentQ + 1]: curr.filter(v => v !== value),
      }));
    } else {
      if (maxSelect && curr.length >= maxSelect) {
        showToast(`此题最多选${maxSelect}项`, 'info');
        return;
      }
      const newAnswers = { ...answers, [currentQ + 1]: [...curr, value] };
      setAnswers(newAnswers);
      saveAssessmentDraft(newAnswers);
    }
  };

  const goNext = () => {
    const curr = answers[currentQ + 1] || [];
    // Q2 如果 Q1 没选，直接跳过 Q2
    if (currentQ === 1 && q2Options.length === 0) {
      setAnimating(true);
      setTimeout(() => { setCurrentQ(q => q + 1); setAnimating(false); }, 200);
      return;
    }
    if (curr.length === 0) {
      showToast('请至少选择一项', 'info');
      return;
    }
    if (currentQ < totalQ - 1) {
      setAnimating(true);
      setTimeout(() => { setCurrentQ(q => q + 1); setAnimating(false); }, 200);
    } else {
      handleComplete();
    }
  };

  const goPrev = () => {
    if (currentQ > 0) {
      setAnimating(true);
      setTimeout(() => { setCurrentQ(q => q - 1); setAnimating(false); }, 200);
    }
  };

  const handleComplete = () => {
    const allTags: string[] = [];
    const interestTags: string[] = [];
    const skillTags: string[] = [];
    const timeTags: string[] = [];
    const socialTags: string[] = [];
    const goalTags: string[] = [];

    const addUniq = (arr: string[], tags: string[]) => {
      tags.forEach(t => { if (!arr.includes(t)) arr.push(t); });
    };

    Object.entries(answers).forEach(([qIdStr, selectedValues]) => {
      const qId = parseInt(qIdStr);
      let questionDef = ASSESSMENT_QUESTIONS.find(q => q.id === qId);
      if (!questionDef) return;

      // Q2 用动态 options
      const opts = qId === 2 ? q2Options : questionDef.options;

      selectedValues.forEach(val => {
        // 处理"其他"选项：将用户输入的文字作为标签
        if (OTHER_VALUES.has(val)) {
          const customText = otherTexts[val]?.trim();
          if (customText) {
            addUniq(allTags, [customText]);
            addUniq(interestTags, [customText]);
          }
          return;
        }
        const opt = opts.find(o => o.value === val);
        if (!opt) return;
        addUniq(allTags, opt.tags);
        if (qId === 1 || qId === 2) addUniq(interestTags, opt.tags);
        else if (qId === 3) addUniq(skillTags, opt.tags);
        else if (qId === 4 || qId === 5) addUniq(timeTags, opt.tags);
        else if (qId === 6) addUniq(socialTags, opt.tags);
        else if (qId === 7 || qId === 8) addUniq(goalTags, opt.tags);
      });
    });

    const assessmentTags: AssessmentTags = {
      interests: interestTags,
      skills: skillTags,
      time: timeTags,
      social: socialTags,
      goals: goalTags,
      all: allTags,
    };

    completeAssessment(assessmentTags);
    setShowComplete(true);
    setTimeout(() => { navigate('/student/results'); }, 2000);
  };

  if (showComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center animate-slide-in-up">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold gradient-text mb-2">测评完成！</h2>
          <p className="text-gray-500">正在为你生成专属推荐...</p>
          <div className="mt-4 flex justify-center gap-1">
            {[0, 1, 2].map(i => (
              <div
                key={i}
                className="w-2 h-2 rounded-full gradient-primary"
                style={{ animation: 'pulse 1s ease-in-out infinite', animationDelay: `${i * 0.2}s` }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const isQ2NoOptions = currentQ === 1 && q2Options.length === 0;
  const isMaxSelect = question.maxSelect === 1;
  const hintText = isMaxSelect ? '单选' : '可多选';

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-purple-600">兴趣测评</span>
          <span className="text-sm text-gray-400">{currentQ + 1} / {totalQ}</span>
        </div>
        <div className="h-2 bg-purple-100 rounded-full overflow-hidden">
          <div
            className="h-full gradient-primary rounded-full transition-all duration-500"
            style={{ width: `${((currentQ + 1) / totalQ) * 100}%` }}
          />
        </div>
        <div className="flex justify-between mt-2">
          {ASSESSMENT_QUESTIONS.map((_, i) => (
            <div
              key={i}
              className={`w-6 h-6 rounded-full text-xs flex items-center justify-center font-medium transition-all ${
                i < currentQ
                  ? 'gradient-primary text-white'
                  : i === currentQ
                  ? 'bg-purple-200 text-purple-700 ring-2 ring-purple-400'
                  : 'bg-gray-200 text-gray-400'
              }`}
            >
              {i < currentQ ? '✓' : i + 1}
            </div>
          ))}
        </div>
      </div>

      {/* Question card */}
      <div className={`bg-white rounded-3xl p-7 shadow-lg card-shadow mb-6 transition-all duration-200 ${
        animating ? 'opacity-0 translate-x-4' : 'opacity-100 translate-x-0'
      }`}>
        <div className="mb-2">
          <span className="text-xs font-semibold text-purple-500 bg-purple-50 px-2 py-1 rounded-lg">
            {question.dimension}
          </span>
          {currentQ === 1 && (
            <span className="ml-2 text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-lg">
              根据第1题动态生成
            </span>
          )}
        </div>
        <h2 className="text-xl font-bold text-gray-800 mb-1">{question.question}</h2>
        <p className="text-sm text-gray-400 mb-6">
          {question.maxSelect === 1 ? '单选' : '可多选'}
        </p>

        {/* Q2 无选项提示（Q1 未选任何选项） */}
        {isQ2NoOptions ? (
          <div className="text-center py-8 text-gray-400">
            <div className="text-3xl mb-2">⬆️</div>
            <p className="text-sm">请先完成第1题，此题会自动生成对应选项</p>
            <button
              onClick={goPrev}
              className="mt-4 px-5 py-2.5 bg-purple-100 text-purple-700 rounded-xl text-sm font-medium"
            >
              返回第1题
            </button>
          </div>
        ) : (
          <div className={`grid gap-3 ${question.options.length <= 4 ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-3'}`}>
            {question.options.map(opt => {
              const selected = currentAnswers.includes(opt.value);
              const isOther = OTHER_VALUES.has(opt.value);
              return (
                <div key={opt.value} className="flex flex-col gap-2">
                  <button
                    onClick={() => {
                      toggleOption(opt.value);
                      // 单选时自动前进
                      if (question.maxSelect === 1 && !selected) {
                        setTimeout(() => {
                          setAnswers(prev => {
                            const newAnswers = { ...prev, [currentQ + 1]: [opt.value] };
                            saveAssessmentDraft(newAnswers);
                            if (currentQ < totalQ - 1) {
                              setAnimating(true);
                              setTimeout(() => { setCurrentQ(q => q + 1); setAnimating(false); }, 300);
                            } else {
                              handleComplete();
                            }
                            return newAnswers;
                          });
                        }, 150);
                      }
                    }}
                    className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all text-left btn-click ${
                      selected
                        ? 'border-purple-500 bg-purple-50 text-purple-800'
                        : 'border-gray-200 text-gray-700 hover:border-purple-300 hover:bg-purple-50/50'
                    }`}
                  >
                    <span className="text-2xl">{opt.emoji}</span>
                    <div className="flex-1">
                      <div className="font-medium text-sm">{opt.label}</div>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                      selected ? 'border-purple-500 bg-purple-500' : 'border-gray-300'
                    }`}>
                      {selected && <div className="w-2.5 h-2.5 bg-white rounded-full" />}
                    </div>
                  </button>
                  {/* 其他选项：显示文字输入 */}
                  {isOther && selected && (
                    <input
                      value={otherTexts[opt.value] || ''}
                      onChange={e => setOtherTexts(prev => ({ ...prev, [opt.value]: e.target.value }))}
                      placeholder="请填写具体内容（选填）"
                      maxLength={20}
                      className="w-full px-3 py-2 rounded-xl border border-purple-300 bg-purple-50 text-sm focus:outline-none focus:ring-2 focus:ring-purple-200"
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex gap-3">
        <button
          onClick={goPrev}
          disabled={currentQ === 0}
          className={`flex items-center gap-2 px-5 py-3.5 rounded-2xl font-medium text-sm transition-all ${
            currentQ === 0
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-white text-gray-700 shadow-sm hover:shadow-md border border-gray-200'
          }`}
        >
          <ChevronLeft size={18} /> 上一题
        </button>
        {!isMaxSelect && (
          <button
            onClick={goNext}
            className="flex-1 flex items-center justify-center gap-2 px-5 py-3.5 gradient-primary text-white rounded-2xl font-bold shadow-md hover:shadow-lg transition-shadow btn-click"
          >
            {currentQ === totalQ - 1 ? '完成测评 🎉' : '下一题'}
            {currentQ < totalQ - 1 && <ChevronRight size={18} />}
          </button>
        )}
        {isMaxSelect && (
          <div className="flex-1 flex items-center justify-center text-sm text-gray-400 bg-gray-50 rounded-2xl">
            单选题 · 点击选项自动进入下一题
          </div>
        )}
      </div>

      <p className="text-center text-xs text-gray-400 mt-4">
        答题进度自动保存，可随时退出后继续
      </p>
    </div>
  );
}
