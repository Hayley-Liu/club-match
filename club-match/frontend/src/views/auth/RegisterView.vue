<template>
  <div class="auth-page">
    <div class="auth-bg">
      <div class="auth-shape s1"></div>
      <div class="auth-shape s2"></div>
    </div>
    <div class="auth-box">
      <div class="auth-logo" @click="$router.push('/')">🎯 社团招新平台</div>
      <h2 class="auth-title">加入我们 🎉</h2>
      <p class="auth-sub">注册账号，开启你的社团探索之旅</p>

      <form @submit.prevent="handleRegister" class="auth-form">
        <div class="form-group">
          <label class="form-label">我的身份 <span class="required">*</span></label>
          <div class="role-select">
            <div
              v-for="r in roles" :key="r.value"
              :class="['role-option', { active: form.role === r.value }]"
              @click="form.role = r.value"
            >
              <span class="role-icon">{{ r.icon }}</span>
              <span class="role-name">{{ r.name }}</span>
              <span class="role-desc">{{ r.desc }}</span>
            </div>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">用户名 <span class="required">*</span></label>
            <input v-model="form.username" class="form-input" type="text" placeholder="登录用，字母+数字" />
          </div>
          <div class="form-group">
            <label class="form-label">姓名 <span class="required">*</span></label>
            <input v-model="form.name" class="form-input" type="text" placeholder="真实姓名" />
          </div>
        </div>
        <div class="form-row" v-if="form.role === 'student'">
          <div class="form-group">
            <label class="form-label">学号</label>
            <input v-model="form.student_id" class="form-input" type="text" placeholder="学号" />
          </div>
          <div class="form-group">
            <label class="form-label">专业</label>
            <input v-model="form.major" class="form-input" type="text" placeholder="所在专业" />
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">手机号</label>
          <input v-model="form.phone" class="form-input" type="tel" placeholder="联系手机号" />
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">密码 <span class="required">*</span></label>
            <input v-model="form.password" class="form-input" type="password" placeholder="至少6位" />
          </div>
          <div class="form-group">
            <label class="form-label">确认密码 <span class="required">*</span></label>
            <input v-model="form.confirm" class="form-input" type="password" placeholder="再次输入密码" />
          </div>
        </div>
        <div v-if="error" class="auth-error">⚠️ {{ error }}</div>
        <button class="btn btn-primary btn-block btn-lg" type="submit" :disabled="loading">
          <span v-if="loading" class="loading-spin" style="width:18px;height:18px;border-width:2px"></span>
          <span v-else>立即注册</span>
        </button>
      </form>

      <div class="auth-footer">
        已有账号？ <router-link to="/login" class="auth-link">去登录</router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, inject } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()
const showToast = inject('showToast')

const form = ref({ role: 'student', username: '', name: '', student_id: '', major: '', phone: '', password: '', confirm: '' })
const loading = ref(false)
const error = ref('')

const roles = [
  { value: 'student', icon: '🎓', name: '在校学生', desc: '寻找心仪社团' },
  { value: 'leader', icon: '🏆', name: '社团负责人', desc: '发布社团招新' },
]

async function handleRegister() {
  if (!form.value.username || !form.value.password || !form.value.name) {
    error.value = '请填写必填项'
    return
  }
  if (form.value.password.length < 6) {
    error.value = '密码至少6位'
    return
  }
  if (form.value.password !== form.value.confirm) {
    error.value = '两次密码不一致'
    return
  }
  loading.value = true
  error.value = ''
  try {
    const { confirm, ...data } = form.value
    const res = await authStore.register(data)
    showToast('注册成功！', 'success')
    if (res.user.role === 'leader') router.push('/leader/apply')
    else router.push('/assessment')
  } catch (e) {
    error.value = e.message || '注册失败'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.auth-page { min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;position:relative;overflow:hidden; }
.auth-bg { position:fixed;inset:0;pointer-events:none; }
.auth-shape { position:absolute;border-radius:50%;opacity:.08;background:var(--gradient-primary); }
.s1 { width:700px;height:700px;top:-300px;right:-200px; }
.s2 { width:400px;height:400px;bottom:-200px;left:-100px;background:var(--gradient-secondary); }
.auth-box { background:rgba(255,255,255,.95);backdrop-filter:blur(20px);border-radius:24px;padding:40px;max-width:520px;width:100%;box-shadow:0 20px 60px rgba(102,126,234,.18);position:relative;z-index:1; }
.auth-logo { text-align:center;font-size:18px;font-weight:800;cursor:pointer;color:var(--color-primary);margin-bottom:20px; }
.auth-title { font-size:26px;font-weight:900;text-align:center;margin-bottom:6px; }
.auth-sub { text-align:center;color:var(--color-text-secondary);font-size:14px;margin-bottom:24px; }
.role-select { display:flex;gap:12px; }
.role-option { flex:1;padding:14px 12px;border-radius:14px;border:2px solid var(--color-border);cursor:pointer;transition:var(--transition);text-align:center;display:flex;flex-direction:column;gap:4px; }
.role-option.active { border-color:var(--color-primary);background:rgba(102,126,234,.06); }
.role-option:hover { border-color:var(--color-primary); }
.role-icon { font-size:28px; }
.role-name { font-size:14px;font-weight:700; }
.role-desc { font-size:11px;color:var(--color-text-muted); }
.form-row { display:grid;grid-template-columns:1fr 1fr;gap:12px; }
.auth-error { background:rgba(245,34,45,.08);color:var(--color-error);border-radius:10px;padding:10px 14px;font-size:13px;margin-bottom:16px; }
.auth-footer { text-align:center;margin-top:20px;font-size:14px;color:var(--color-text-secondary); }
.auth-link { color:var(--color-primary);font-weight:600; }
@media (max-width:480px) { .form-row { grid-template-columns:1fr; } .role-select { flex-direction:column; } }
</style>
