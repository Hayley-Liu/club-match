import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import { ArrowLeft, Upload } from 'lucide-react';

const CATEGORIES = ['文艺创作', '体育运动', '学术科技', '公益实践'];
const TAGS_OPTIONS = [
  '摄影', '舞蹈', '音乐', '绘画', '书法', '视频创作', '戏剧',
  '篮球', '足球', '游泳', '健身', '武术', '乒乓球', '羽毛球',
  '编程', '机器人', '辩论', '演讲', '英语', '数学建模',
  '志愿服务', '支教', '环保', '养老', '公益活动',
];

export default function ClubRegister() {
  const user = useStore(s => s.currentUser);
  const clubs = useStore(s => s.clubs);
  const submitClubApplication = useStore(s => s.submitClubApplication);
  const updateUser = useStore(s => s.updateUser);
  const showToast = useStore(s => s.showToast);
  const navigate = useNavigate();

  const existingClub = useMemo(
    () => user ? clubs.find(c => c.presidentId === user.id) : undefined,
    [clubs, user]
  );

  const [form, setForm] = useState({
    name: '',
    category: '',
    tags: [] as string[],
    description: '',
    presidentName: user?.name || '',
    phone: user?.phone || '',
    maxMembers: 30,
    deadline: '',
    requirements: '',
  });
  const [submitted, setSubmitted] = useState(false);

  if (existingClub) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center animate-fade-in">
        <div className="text-5xl mb-4">
          {existingClub.status === 'approved' ? '✅' :
           existingClub.status === 'pending' ? '⏳' : '❌'}
        </div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">
          {existingClub.status === 'approved' ? '社团已入驻' :
           existingClub.status === 'pending' ? '审核中...' : '入驻申请被驳回'}
        </h2>
        {existingClub.status === 'pending' && (
          <p className="text-gray-500 mb-2">你的申请正在审核中，请耐心等待</p>
        )}
        {existingClub.status === 'rejected' && existingClub.rejectReason && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4 text-sm text-red-700 text-left">
            <p className="font-medium mb-1">驳回原因：</p>
            <p>{existingClub.rejectReason}</p>
          </div>
        )}
        {existingClub.status === 'approved' && (
          <button onClick={() => navigate('/club/dashboard')} className="px-6 py-3 gradient-primary text-white rounded-2xl font-semibold mt-4 shadow-md">
            进入社团管理
          </button>
        )}
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center animate-slide-in-up">
        <div className="text-6xl mb-4">📝</div>
        <h2 className="text-2xl font-bold gradient-text mb-2">申请已提交！</h2>
        <p className="text-gray-500 mb-2">管理员将在24小时内审核</p>
        <p className="text-gray-400 text-sm mb-8">审核结果会通过站内消息通知你</p>
        <button onClick={() => navigate('/club/dashboard')} className="px-6 py-3 gradient-primary text-white rounded-2xl font-semibold shadow-md">
          查看申请状态
        </button>
      </div>
    );
  }

  const toggleTag = (tag: string) => {
    if (form.tags.includes(tag)) {
      setForm(f => ({ ...f, tags: f.tags.filter(t => t !== tag) }));
    } else if (form.tags.length < 3) {
      setForm(f => ({ ...f, tags: [...f.tags, tag] }));
    } else {
      showToast('最多选择3个标签', 'info');
    }
  };

  const handleSubmit = () => {
    if (!form.name) { showToast('请填写社团名称', 'error'); return; }
    if (!form.category) { showToast('请选择兴趣分类', 'error'); return; }
    if (!form.description) { showToast('请填写社团简介', 'error'); return; }
    if (!form.presidentName || !form.phone) { showToast('请填写负责人信息', 'error'); return; }
    if (!form.deadline) { showToast('请填写招新截止日期', 'error'); return; }

    const clubId = submitClubApplication({
      ...form,
      presidentId: user?.id,
      status: 'pending',
    });
    updateUser({ clubId });
    setSubmitted(true);
    showToast('申请已提交，等待审核');
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-6 animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 transition">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">社团入驻申请</h1>
          <p className="text-sm text-gray-400">填写社团信息，等待管理员审核</p>
        </div>
      </div>

      <div className="space-y-5">
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-2">社团名称 <span className="text-red-400">*</span></label>
          <input
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="请输入社团名称（唯一）"
            maxLength={20}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-100 text-sm"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 block mb-2">兴趣分类 <span className="text-red-400">*</span></label>
          <div className="grid grid-cols-2 gap-2">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setForm(f => ({ ...f, category: cat }))}
                className={`py-3 rounded-xl border-2 text-sm font-medium transition-all ${
                  form.category === cat
                    ? 'border-purple-500 bg-purple-50 text-purple-700'
                    : 'border-gray-200 text-gray-600 hover:border-purple-300'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 block mb-2">招新标签 <span className="text-gray-400 font-normal">（最多3个）</span></label>
          <div className="flex flex-wrap gap-2">
            {TAGS_OPTIONS.map(tag => (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                  form.tags.includes(tag)
                    ? 'gradient-primary text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-purple-50 hover:text-purple-600'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 block mb-2">社团简介 <span className="text-red-400">*</span></label>
          <textarea
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            placeholder="介绍你的社团，吸引志同道合的同学..."
            rows={4}
            maxLength={200}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-100 text-sm resize-none"
          />
          <p className="text-xs text-gray-400 text-right">{form.description.length}/200</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">负责人姓名 <span className="text-red-400">*</span></label>
            <input
              value={form.presidentName}
              onChange={e => setForm(f => ({ ...f, presidentName: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-purple-400 focus:outline-none text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">手机号 <span className="text-red-400">*</span></label>
            <input
              value={form.phone}
              onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
              maxLength={11}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-purple-400 focus:outline-none text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">招新人数</label>
            <input
              type="number"
              value={form.maxMembers}
              onChange={e => setForm(f => ({ ...f, maxMembers: parseInt(e.target.value) || 30 }))}
              min={1}
              max={200}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-purple-400 focus:outline-none text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">招新截止 <span className="text-red-400">*</span></label>
            <input
              type="date"
              value={form.deadline}
              onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-purple-400 focus:outline-none text-sm"
            />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 block mb-2">招新要求（选填）</label>
          <textarea
            value={form.requirements}
            onChange={e => setForm(f => ({ ...f, requirements: e.target.value }))}
            placeholder="对有意向加入的同学有什么要求？"
            rows={3}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-purple-400 focus:outline-none text-sm resize-none"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 block mb-2">社团资质证明（选填）</label>
          <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center text-gray-400 hover:border-purple-400 transition cursor-pointer">
            <Upload size={24} className="mx-auto mb-2" />
            <p className="text-sm">点击上传社团证明照片</p>
            <p className="text-xs mt-1">（Demo模式，点击无效）</p>
          </div>
        </div>

        <button
          onClick={handleSubmit}
          className="w-full py-4 gradient-primary text-white rounded-2xl font-bold text-base shadow-lg hover:shadow-xl transition-shadow btn-click"
        >
          提交入驻申请
        </button>
      </div>
    </div>
  );
}
