import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { Eye, EyeOff, UserCircle, Users, ShieldCheck, Phone, Lock, MessageSquare, ChevronLeft } from 'lucide-react';
import type { UserRole } from '../types';

// ─────────────────────────────────────────────
// 工具函数
// ─────────────────────────────────────────────
const isValidPhone = (v: string) => /^1[3-9]\d{9}$/.test(v);
const isValidPassword = (v: string) => v.length >= 6 && v.length <= 20;

// Mock 验证码（Demo 固定为 123456）
const MOCK_CODE = '123456';

// ─────────────────────────────────────────────
// 主组件
// ─────────────────────────────────────────────
export default function Login() {
  const [searchParams] = useSearchParams();
  const [tab, setTab] = useState<'login' | 'register'>(
    searchParams.get('tab') === 'register' ? 'register' : 'login'
  );

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🎓</div>
          <h1 className="text-2xl font-bold gradient-text mb-1">社团招新平台</h1>
          <p className="text-gray-500 text-sm">3分钟找到你的社团归宿</p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl card-shadow overflow-hidden">
          {/* Tab bar */}
          <div className="flex bg-gray-50 border-b border-gray-100">
            {(['login', 'register'] as const).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 py-4 text-sm font-semibold transition-all ${
                  tab === t
                    ? 'text-purple-700 border-b-2 border-purple-600 bg-white'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                {t === 'login' ? '登录' : '注册'}
              </button>
            ))}
          </div>

          <div className="p-8">
            {tab === 'login' ? (
              <LoginForm onSwitchToRegister={() => setTab('register')} />
            ) : (
              <RegisterForm onSwitchToLogin={() => setTab('login')} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// 登录表单
// ─────────────────────────────────────────────
function LoginForm({ onSwitchToRegister }: { onSwitchToRegister: () => void }) {
  const navigate = useNavigate();
  const loginByPhone = useStore(s => s.loginByPhone);
  const loginByPassword = useStore(s => s.login);
  const showToast = useStore(s => s.showToast);

  const [loginMode, setLoginMode] = useState<'code' | 'password'>('code');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [codeSent, setCodeSent] = useState(false);

  // 实时错误
  const [phoneError, setPhoneError] = useState('');
  const [codeError, setCodeError] = useState('');
  const [pwdError, setPwdError] = useState('');
  const [formError, setFormError] = useState('');

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  // 手机号实时校验
  const handlePhoneChange = (v: string) => {
    const cleaned = v.replace(/\D/g, '').slice(0, 11);
    setPhone(cleaned);
    if (cleaned.length > 0 && !isValidPhone(cleaned)) {
      setPhoneError('请输入正确的手机号');
    } else {
      setPhoneError('');
    }
    setFormError('');
  };

  // 获取验证码
  const handleGetCode = () => {
    if (!isValidPhone(phone)) {
      setPhoneError('请输入正确的手机号');
      return;
    }
    setCodeSent(true);
    setCountdown(60);
    showToast(`验证码已发送（Demo: ${MOCK_CODE}）`, 'info');
    timerRef.current = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) {
          clearInterval(timerRef.current!);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
  };

  // 验证码实时校验
  const handleCodeChange = (v: string) => {
    const cleaned = v.replace(/\D/g, '').slice(0, 6);
    setCode(cleaned);
    setCodeError('');
    setFormError('');
  };

  const goHome = (user: any) => {
    showToast(`欢迎回来，${user.name}！`);
    if (user.role === 'student') navigate('/');
    else if (user.role === 'club') navigate('/club/dashboard');
    else navigate('/admin/dashboard');
  };

  const handleLogin = () => {
    setFormError('');
    if (!isValidPhone(phone)) { setPhoneError('请输入正确的手机号'); return; }

    if (loginMode === 'code') {
      if (!code) { setCodeError('请输入验证码'); return; }
      if (code !== MOCK_CODE) { setCodeError('验证码错误，请重新输入'); return; }
      const result = loginByPhone(phone);
      if (result === 'not_found') {
        // 未注册 → 跳注册
        showToast('该手机号未注册，请先注册', 'info');
        onSwitchToRegister();
        return;
      }
      const user = useStore.getState().currentUser;
      if (user) goHome(user);
    } else {
      if (!password) { setPwdError('请输入密码'); return; }
      // 用手机号+密码登录
      const result = loginByPhone(phone, password);
      if (result === 'not_found') {
        showToast('该手机号未注册，请先注册', 'info');
        onSwitchToRegister();
        return;
      }
      if (result === 'wrong_password') {
        setPwdError('密码有误，请重新输入');
        return;
      }
      const user = useStore.getState().currentUser;
      if (user) goHome(user);
    }
  };

  // Demo 快速登录
  const quickLogin = (username: string, pwd: string) => {
    const ok = loginByPassword(username, pwd);
    if (ok) {
      const user = useStore.getState().currentUser;
      if (user) goHome(user);
    }
  };

  return (
    <div className="space-y-5">
      {/* Phone */}
      <div>
        <label className="text-sm font-medium text-gray-700 block mb-1.5">手机号</label>
        <div className="relative">
          <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={phone}
            onChange={e => handlePhoneChange(e.target.value)}
            placeholder="请输入手机号"
            maxLength={11}
            className={`w-full pl-10 pr-4 py-3 rounded-xl border text-sm transition focus:outline-none focus:ring-2 focus:ring-purple-100 ${
              phoneError ? 'border-red-400 bg-red-50' : 'border-gray-200 focus:border-purple-400'
            }`}
          />
        </div>
        {phoneError && <p className="text-xs text-red-500 mt-1">{phoneError}</p>}
      </div>

      {/* Login mode switch */}
      <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
        <button
          onClick={() => { setLoginMode('code'); setFormError(''); setPwdError(''); }}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1.5 ${
            loginMode === 'code' ? 'bg-white text-purple-700 shadow-sm' : 'text-gray-500'
          }`}
        >
          <MessageSquare size={14} /> 验证码登录
        </button>
        <button
          onClick={() => { setLoginMode('password'); setFormError(''); setCodeError(''); }}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1.5 ${
            loginMode === 'password' ? 'bg-white text-purple-700 shadow-sm' : 'text-gray-500'
          }`}
        >
          <Lock size={14} /> 密码登录
        </button>
      </div>

      {/* Code input */}
      {loginMode === 'code' && (
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1.5">验证码</label>
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <input
                value={code}
                onChange={e => handleCodeChange(e.target.value)}
                placeholder="请输入6位验证码"
                maxLength={6}
                className={`w-full px-4 py-3 rounded-xl border text-sm transition focus:outline-none focus:ring-2 focus:ring-purple-100 ${
                  codeError ? 'border-red-400 bg-red-50' : 'border-gray-200 focus:border-purple-400'
                }`}
              />
            </div>
            <button
              onClick={handleGetCode}
              disabled={countdown > 0 || !isValidPhone(phone)}
              className={`shrink-0 px-4 py-3 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                countdown > 0 || !isValidPhone(phone)
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-purple-600 text-white hover:bg-purple-700'
              }`}
            >
              {countdown > 0 ? `${countdown}s` : codeSent ? '重新获取' : '获取验证码'}
            </button>
          </div>
          {codeError && <p className="text-xs text-red-500 mt-1">{codeError}</p>}
        </div>
      )}

      {/* Password input */}
      {loginMode === 'password' && (
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1.5">密码</label>
          <div className="relative">
            <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type={showPwd ? 'text' : 'password'}
              value={password}
              onChange={e => { setPassword(e.target.value); setPwdError(''); setFormError(''); }}
              placeholder="请输入密码"
              className={`w-full pl-10 pr-11 py-3 rounded-xl border text-sm transition focus:outline-none focus:ring-2 focus:ring-purple-100 ${
                pwdError ? 'border-red-400 bg-red-50' : 'border-gray-200 focus:border-purple-400'
              }`}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
            />
            <button
              type="button"
              onClick={() => setShowPwd(!showPwd)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {pwdError && <p className="text-xs text-red-500 mt-1">{pwdError}</p>}
        </div>
      )}

      {formError && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-2.5 text-sm text-red-600">
          ❌ {formError}
        </div>
      )}

      <button
        onClick={handleLogin}
        className="w-full py-3.5 gradient-primary text-white rounded-xl font-semibold shadow-md hover:shadow-lg transition-shadow btn-click"
      >
        登录 / 注册
      </button>

      {/* Demo quick login */}
      <div className="pt-4 border-t border-gray-100">
        <p className="text-xs text-gray-400 text-center mb-3">🎮 Demo 快速登录</p>
        <div className="grid grid-cols-3 gap-2">
          {[
            { username: 'student1', label: '学生小林', emoji: '🎓' },
            { username: 'club1', label: '社长阿杰', emoji: '📸' },
            { username: 'admin', label: '王老师', emoji: '🛡️' },
          ].map(d => (
            <button
              key={d.username}
              onClick={() => quickLogin(d.username, '123456')}
              className="flex flex-col items-center gap-1 p-2.5 rounded-xl bg-gray-50 hover:bg-purple-50 border border-gray-200 hover:border-purple-300 text-xs transition-all"
            >
              <span className="text-lg">{d.emoji}</span>
              <span className="text-gray-600 font-medium">{d.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// 注册表单
// ─────────────────────────────────────────────
function RegisterForm({ onSwitchToLogin }: { onSwitchToLogin: () => void }) {
  const navigate = useNavigate();
  const register = useStore(s => s.register);
  const users = useStore(s => s.users);
  const showToast = useStore(s => s.showToast);

  const [role, setRole] = useState<UserRole>('student');
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);

  const [form, setForm] = useState({
    name: '',
    studentId: '',    // 学号 / 工号
    major: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });

  // 字段级错误
  const [errors, setErrors] = useState<Record<string, string>>({});

  const roles: { value: UserRole; label: string; emoji: string; desc: string }[] = [
    { value: 'student', label: '学生', emoji: '🎓', desc: '加入社团' },
    { value: 'club', label: '社长', emoji: '🏆', desc: '管理招新' },
    { value: 'admin', label: '管理员', emoji: '🛡️', desc: '学校老师 / 部门' },
  ];

  // 实时更新单个字段错误
  const setFieldError = (field: string, msg: string) => {
    setErrors(prev => ({ ...prev, [field]: msg }));
  };
  const clearFieldError = (field: string) => {
    setErrors(prev => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const handlePhoneChange = (v: string) => {
    const cleaned = v.replace(/\D/g, '').slice(0, 11);
    setForm(f => ({ ...f, phone: cleaned }));
    if (cleaned.length > 0 && !isValidPhone(cleaned)) {
      setFieldError('phone', '请输入正确的手机号');
    } else {
      clearFieldError('phone');
    }
  };

  const handlePasswordChange = (v: string) => {
    setForm(f => ({ ...f, password: v }));
    if (v.length > 0 && !isValidPassword(v)) {
      setFieldError('password', '密码须为6～20位');
    } else {
      clearFieldError('password');
    }
    // 实时校验确认密码
    if (form.confirmPassword && v !== form.confirmPassword) {
      setFieldError('confirmPassword', '两次密码不一致');
    } else {
      clearFieldError('confirmPassword');
    }
  };

  const handleConfirmPwdChange = (v: string) => {
    setForm(f => ({ ...f, confirmPassword: v }));
    if (v && v !== form.password) {
      setFieldError('confirmPassword', '两次密码不一致');
    } else {
      clearFieldError('confirmPassword');
    }
  };

  const handleStudentIdChange = (v: string) => {
    setForm(f => ({ ...f, studentId: v }));
    if (v) {
      // 唯一性校验
      const exists = users.some(u => u.studentId === v);
      if (exists) {
        setFieldError('studentId', role === 'admin' ? '工号已被注册' : '学号已被注册');
      } else {
        clearFieldError('studentId');
      }
    } else {
      clearFieldError('studentId');
    }
  };

  const handleRegister = () => {
    const newErrors: Record<string, string> = {};

    // 通用必填
    if (!form.name.trim()) newErrors.name = '请输入姓名';
    if (!form.studentId.trim()) {
      newErrors.studentId = role === 'admin' ? '请输入工号/学号' : '请输入学号';
    } else if (users.some(u => u.studentId === form.studentId.trim())) {
      newErrors.studentId = role === 'admin' ? '工号已被注册' : '学号已被注册';
    }
    if (!isValidPhone(form.phone)) newErrors.phone = '请输入正确的手机号';
    else if (users.some(u => u.phone === form.phone)) newErrors.phone = '该手机号已注册，请登录';

    // 学生/社长特有
    if (role !== 'admin' && !form.major.trim()) newErrors.major = '请输入专业';

    // 密码
    if (!isValidPassword(form.password)) newErrors.password = '密码须为6～20位';
    if (form.confirmPassword !== form.password) newErrors.confirmPassword = '两次密码不一致';

    // 管理员权限校验（Demo: 工号以 ADM 开头）
    if (role === 'admin' && !form.studentId.toUpperCase().startsWith('ADM')) {
      newErrors.studentId = '工号不符合管理员权限，请联系学校确认（Demo: 以ADM开头）';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const ok = register({
      username: form.phone,  // 用手机号作为 username
      password: form.password,
      role,
      name: form.name.trim(),
      studentId: form.studentId.trim(),
      major: role !== 'admin' ? form.major.trim() : undefined,
      phone: form.phone,
      favorites: [],
    });

    if (ok) {
      showToast('注册成功，已自动登录 🎉');
      const user = useStore.getState().currentUser;
      if (!user) return;
      if (user.role === 'student') navigate('/');
      else if (user.role === 'club') navigate('/club/register');
      else navigate('/admin/dashboard');
    } else {
      setErrors({ phone: '该手机号已注册，请直接登录' });
    }
  };

  // 输入框通用 className
  const inputCls = (field: string) =>
    `w-full px-4 py-3 rounded-xl border text-sm transition focus:outline-none focus:ring-2 focus:ring-purple-100 ${
      errors[field] ? 'border-red-400 bg-red-50' : 'border-gray-200 focus:border-purple-400'
    }`;

  return (
    <div className="space-y-4">
      {/* Role selector */}
      <div>
        <p className="text-sm font-medium text-gray-700 mb-2">选择身份</p>
        <div className="grid grid-cols-3 gap-2">
          {roles.map(r => (
            <button
              key={r.value}
              onClick={() => { setRole(r.value); setErrors({}); }}
              className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl border-2 transition-all ${
                role === r.value
                  ? 'border-purple-500 bg-purple-50 text-purple-700'
                  : 'border-gray-200 text-gray-500 hover:border-purple-300'
              }`}
            >
              <span className="text-2xl">{r.emoji}</span>
              <span className="text-sm font-semibold">{r.label}</span>
              <span className="text-xs text-gray-400">{r.desc}</span>
            </button>
          ))}
        </div>
        {role === 'admin' && (
          <div className="mt-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 text-xs text-amber-700">
            ⚠️ 管理员账号须通过学校权限校验（工号以 ADM 开头）
          </div>
        )}
      </div>

      {/* 姓名 */}
      <div>
        <label className="text-sm font-medium text-gray-700 block mb-1.5">
          姓名 <span className="text-red-400">*</span>
        </label>
        <input
          value={form.name}
          onChange={e => { setForm(f => ({ ...f, name: e.target.value })); clearFieldError('name'); }}
          placeholder="请输入真实姓名"
          className={inputCls('name')}
        />
        {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
      </div>

      {/* 学号 / 工号 */}
      <div>
        <label className="text-sm font-medium text-gray-700 block mb-1.5">
          {role === 'admin' ? '工号/学号' : '学号'} <span className="text-red-400">*</span>
        </label>
        <input
          value={form.studentId}
          onChange={e => handleStudentIdChange(e.target.value)}
          placeholder={role === 'admin' ? '请输入工号（如 ADM001）' : '请输入学号'}
          className={inputCls('studentId')}
        />
        {errors.studentId && <p className="text-xs text-red-500 mt-1">{errors.studentId}</p>}
      </div>

      {/* 专业（学生/社长） */}
      {role !== 'admin' && (
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1.5">
            专业 <span className="text-red-400">*</span>
          </label>
          <input
            value={form.major}
            onChange={e => { setForm(f => ({ ...f, major: e.target.value })); clearFieldError('major'); }}
            placeholder="如：计算机科学与技术"
            className={inputCls('major')}
          />
          {errors.major && <p className="text-xs text-red-500 mt-1">{errors.major}</p>}
        </div>
      )}

      {/* 手机号 */}
      <div>
        <label className="text-sm font-medium text-gray-700 block mb-1.5">
          手机号 <span className="text-red-400">*</span>
        </label>
        <div className="relative">
          <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={form.phone}
            onChange={e => handlePhoneChange(e.target.value)}
            placeholder="请输入手机号（将作为登录账号）"
            maxLength={11}
            className={`w-full pl-10 pr-4 py-3 rounded-xl border text-sm transition focus:outline-none focus:ring-2 focus:ring-purple-100 ${
              errors.phone ? 'border-red-400 bg-red-50' : 'border-gray-200 focus:border-purple-400'
            }`}
          />
        </div>
        {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
      </div>

      {/* 密码 */}
      <div>
        <label className="text-sm font-medium text-gray-700 block mb-1.5">
          密码 <span className="text-red-400">*</span>
          <span className="text-gray-400 font-normal ml-1">（6～20位）</span>
        </label>
        <div className="relative">
          <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type={showPwd ? 'text' : 'password'}
            value={form.password}
            onChange={e => handlePasswordChange(e.target.value)}
            placeholder="请设置6～20位密码"
            className={`w-full pl-10 pr-11 py-3 rounded-xl border text-sm transition focus:outline-none focus:ring-2 focus:ring-purple-100 ${
              errors.password ? 'border-red-400 bg-red-50' : 'border-gray-200 focus:border-purple-400'
            }`}
          />
          <button
            type="button"
            onClick={() => setShowPwd(!showPwd)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
      </div>

      {/* 确认密码 */}
      <div>
        <label className="text-sm font-medium text-gray-700 block mb-1.5">
          确认密码 <span className="text-red-400">*</span>
        </label>
        <div className="relative">
          <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type={showConfirmPwd ? 'text' : 'password'}
            value={form.confirmPassword}
            onChange={e => handleConfirmPwdChange(e.target.value)}
            placeholder="请再次输入密码"
            className={`w-full pl-10 pr-11 py-3 rounded-xl border text-sm transition focus:outline-none focus:ring-2 focus:ring-purple-100 ${
              errors.confirmPassword ? 'border-red-400 bg-red-50' : 'border-gray-200 focus:border-purple-400'
            }`}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPwd(!showConfirmPwd)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {showConfirmPwd ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        {errors.confirmPassword && (
          <p className="text-xs text-red-500 mt-1">{errors.confirmPassword}</p>
        )}
        {form.confirmPassword && !errors.confirmPassword && form.confirmPassword === form.password && (
          <p className="text-xs text-green-500 mt-1">✓ 密码一致</p>
        )}
      </div>

      <button
        onClick={handleRegister}
        className="w-full py-4 gradient-primary text-white rounded-xl font-bold text-base shadow-md hover:shadow-lg transition-shadow btn-click mt-2"
      >
        完成注册
      </button>

      <p className="text-xs text-gray-400 text-center">
        已有账号？
        <button onClick={onSwitchToLogin} className="text-purple-600 font-medium ml-1 hover:underline">
          立即登录
        </button>
      </p>
    </div>
  );
}
