import React, { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import { ArrowLeft } from 'lucide-react';

export default function Apply() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = useStore(s => s.currentUser);
  const clubs = useStore(s => s.clubs);
  const applications = useStore(s => s.applications);
  const submitApplication = useStore(s => s.submitApplication);
  const showToast = useStore(s => s.showToast);

  const club = clubs.find(c => c.id === id);
  const existingApp = useMemo(
    () => user ? applications.find(a => a.clubId === id && a.studentId === user.id) : undefined,
    [applications, id, user]
  );

  const matchScore = useMemo(() => {
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

  // 表单状态：所有字段均必填
  const [form, setForm] = useState({
    name: user?.name || '',
    studentId: user?.studentId || '',
    major: user?.major || '',
    phone: user?.phone || '',
    introduction: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  if (!club || !user) return null;

  if (existingApp) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <div className="text-4xl mb-3">📋</div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">已报名该社团</h2>
        <p className="text-gray-500 mb-6">无需重复报名，请在"我的报名"中查看审核进度。</p>
        <button
          onClick={() => navigate('/student/my-applications')}
          className="px-6 py-3 gradient-primary text-white rounded-2xl font-semibold"
        >
          查看我的报名
        </button>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center animate-slide-in-up">
        <div className="text-6xl mb-4">🎉</div>
        <h2 className="text-2xl font-bold gradient-text mb-2">报名成功！</h2>
        <p className="text-gray-500 mb-2">你的报名申请已提交</p>
        <p className="text-gray-400 text-sm mb-8">社长将在24小时内审核，请关注通知</p>
        <div className="flex flex-col gap-3 max-w-xs mx-auto">
          <button
            onClick={() => navigate('/student/my-applications')}
            className="px-6 py-3.5 gradient-primary text-white rounded-2xl font-semibold shadow-md"
          >
            查看我的报名
          </button>
          <button
            onClick={() => navigate('/student/results')}
            className="px-6 py-3.5 bg-white text-gray-700 rounded-2xl font-medium border border-gray-200"
          >
            继续浏览社团
          </button>
        </div>
      </div>
    );
  }

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = '请填写姓名';
    if (!form.studentId.trim()) errs.studentId = '请填写学号';
    if (!form.major.trim()) errs.major = '请填写专业';
    if (!form.phone.trim()) errs.phone = '请填写联系方式';
    else if (!/^1[3-9]\d{9}$/.test(form.phone.trim())) errs.phone = '请输入正确的手机号';
    if (!form.introduction.trim()) errs.introduction = '请填写自我介绍';
    return errs;
  };

  const handleSubmit = () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    const ok = submitApplication({
      clubId: id!,
      clubName: club.name,
      studentId: user.id,
      studentName: form.name.trim(),
      studentMajor: form.major.trim(),
      phone: form.phone.trim(),
      introduction: form.introduction.trim(),
      tags: [],
      matchScore,
      status: 'pending',
    });

    if (ok) {
      setSubmitted(true);
    } else {
      showToast('已报名该社团，无需重复报名', 'info');
    }
  };

  // 输入框样式
  const inputCls = (field: string) =>
    `w-full px-4 py-3 rounded-xl border text-sm transition focus:outline-none focus:ring-2 focus:ring-purple-100 ${
      errors[field] ? 'border-red-400 bg-red-50' : 'border-gray-200 focus:border-purple-400'
    }`;

  return (
    <div className="max-w-xl mx-auto px-4 py-6 animate-fade-in">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-5 transition"
      >
        <ArrowLeft size={20} /> <span className="text-sm">返回</span>
      </button>

      <h1 className="text-2xl font-bold text-gray-800 mb-1">报名申请</h1>
      <p className="text-gray-500 text-sm mb-6">
        申请加入 <span className="text-purple-600 font-medium">{club.name}</span>
      </p>

      {/* 社团卡片 */}
      <div className={`bg-gradient-to-r ${club.coverColor} rounded-2xl p-4 mb-6 text-white flex items-center gap-3`}>
        <div className="text-3xl">{club.coverEmoji}</div>
        <div className="flex-1">
          <p className="font-bold">{club.name}</p>
          <p className="text-sm text-white/80">{club.category}</p>
        </div>
        {user.assessmentTags && (
          <div className="text-center">
            <div className="text-xl font-bold">{matchScore}%</div>
            <div className="text-xs text-white/70">匹配度</div>
          </div>
        )}
      </div>

      <p className="text-xs text-gray-400 mb-4 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
        📝 以下信息已自动填充，请确认后提交。所有字段均为必填。
      </p>

      <div className="space-y-4">
        {/* 姓名 */}
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1.5">
            姓名 <span className="text-red-400">*</span>
          </label>
          <input
            value={form.name}
            onChange={e => { setForm(f => ({ ...f, name: e.target.value })); setErrors(v => ({ ...v, name: '' })); }}
            placeholder="请输入真实姓名"
            className={inputCls('name')}
          />
          {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
        </div>

        {/* 学号 */}
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1.5">
            学号 <span className="text-red-400">*</span>
          </label>
          <input
            value={form.studentId}
            onChange={e => { setForm(f => ({ ...f, studentId: e.target.value })); setErrors(v => ({ ...v, studentId: '' })); }}
            placeholder="请输入学号"
            className={inputCls('studentId')}
          />
          {errors.studentId && <p className="text-xs text-red-500 mt-1">{errors.studentId}</p>}
        </div>

        {/* 专业 */}
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1.5">
            专业 <span className="text-red-400">*</span>
          </label>
          <input
            value={form.major}
            onChange={e => { setForm(f => ({ ...f, major: e.target.value })); setErrors(v => ({ ...v, major: '' })); }}
            placeholder="请输入专业，如：计算机科学与技术"
            className={inputCls('major')}
          />
          {errors.major && <p className="text-xs text-red-500 mt-1">{errors.major}</p>}
        </div>

        {/* 联系方式 */}
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1.5">
            联系方式 <span className="text-red-400">*</span>
          </label>
          <input
            value={form.phone}
            onChange={e => {
              const v = e.target.value.replace(/\D/g, '').slice(0, 11);
              setForm(f => ({ ...f, phone: v }));
              setErrors(prev => ({ ...prev, phone: '' }));
            }}
            placeholder="请输入手机号"
            maxLength={11}
            className={inputCls('phone')}
          />
          {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
        </div>

        {/* 自我介绍（100字以内，必填） */}
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1.5">
            自我介绍 <span className="text-red-400">*</span>
            <span className="text-gray-400 font-normal ml-1">（100字以内）</span>
          </label>
          <textarea
            value={form.introduction}
            onChange={e => {
              const v = e.target.value.slice(0, 100);
              setForm(f => ({ ...f, introduction: v }));
              setErrors(prev => ({ ...prev, introduction: '' }));
            }}
            placeholder="简单介绍一下自己，以及为什么想加入这个社团？"
            rows={4}
            maxLength={100}
            className={`resize-none ${inputCls('introduction')}`}
          />
          <div className="flex items-center justify-between mt-1">
            {errors.introduction
              ? <p className="text-xs text-red-500">{errors.introduction}</p>
              : <span />
            }
            <span className={`text-xs ml-auto ${form.introduction.length >= 90 ? 'text-orange-500' : 'text-gray-400'}`}>
              {form.introduction.length}/100
            </span>
          </div>
        </div>

        <button
          onClick={handleSubmit}
          className="w-full py-4 gradient-primary text-white rounded-2xl font-bold text-base shadow-lg hover:shadow-xl transition-shadow btn-click"
        >
          提交报名申请
        </button>
        <p className="text-xs text-gray-400 text-center">
          提交后将通知社长审核，审核结果会通过站内消息通知你
        </p>
      </div>
    </div>
  );
}
