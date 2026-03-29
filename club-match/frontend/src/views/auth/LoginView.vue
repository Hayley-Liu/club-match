<template>
  <div class="auth-page">
    <div class="auth-bg">
      <div class="auth-shape s1"></div>
      <div class="auth-shape s2"></div>
    </div>
    <div class="auth-box">
      <div class="auth-logo" @click="$router.push('/')">🎯 社团招新平台</div>
      <h2 class="auth-title">欢迎回来 👋</h2>
      <p class="auth-sub">登录你的账号，开始探索心仪社团</p>

      <form @submit.prevent="handleLogin" class="auth-form">
        <div class="form-group">
          <label class="form-label">用户名 <span class="required">*</span></label>
          <input v-model="form.username" class="form-input" type="text" placeholder="请输入用户名" autocomplete="username" />
        </div>
        <div class="form-group">
          <label class="form-label">密码 <span class="required">*</span></label>
          <div class="input-wrapper">
            <input v-model="form.password" class="form-input" :type="showPwd ? 'text' : 'password'" placeholder="请输入密码" autocomplete="current-password" />
            <span class="pwd-toggle" @click="showPwd = !showPwd">{{ showPwd ? '🙈' : '👁' }}</span>
          </div>
        </div>
        <div v-if="error" class="auth-error">⚠️ {{ error }}</div>
        <button class="btn btn-primary btn-block btn-lg" type="submit" :disabled="loading">
          <span v-if="loading" class="loading-spin" style="width:18px;height:18px;border-width:2px"></span>
          <span v-else>登录</span>
        </button>
      </form>

      <!-- 演示账号 -->
      <div class="demo-accounts">
        <div class="demo-title">🧪 演示账号（点击快速登录）：</div>
        <div class="demo-grid">
          <button class="demo-btn" v-for="d in demoAccounts" :key="d.username" @click="fillDemo(d)">
            <span class="demo-role-icon">{{ d.icon }}</span>
            <span>{{ d.label }}</span>
            <span class="demo-account">{{ d.username }}</span>
          </button>
        </div>
      </div>

      <div class="auth-footer">
        还没有账号？
        <router-link to="/register" class="auth-link">立即注册</router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, inject } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const showToast = inject('showToast')

const form = ref({ username: '', password: '' })
const showPwd = ref(false)
const loading = ref(false)
const error = ref('')

const demoAccounts = [
  { icon: '🎓', label: '学生', username: 'xiaolin', password: 'student123' },
  { icon: '🏆', label: '社长', username: 'ajie', password: 'leader123' },
  { icon: '⚙️', label: '管理员', username: 'admin', password: 'admin123' },
]

function fillDemo(d) {
  form.value.username = d.username
  form.value.password = d.password
}

async function handleLogin() {
  if (!form.value.username || !form.value.password) {
    error.value = '请输入用户名和密码'
    return
  }
  loading.value = true
  error.value = ''
  try {
    const data = await authStore.login(form.value.username, form.value.password)
    showToast('登录成功！', 'success')
    const redirect = route.query.redirect
    if (redirect) { router.push(redirect); return }
    if (data.user.role === 'admin') router.push('/admin/dashboard')
    else if (data.user.role === 'leader') router.push('/leader/manage')
    else router.push('/')
  } catch (e) {
    error.value = e.message || '登录失败，请检查账号密码'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.auth-page {
  min-height: 100vh; display: flex; align-items: center; justify-content: center;
  padding: 24px; position: relative; overflow: hidden;
}
.auth-bg { position: fixed; inset: 0; pointer-events: none; }
.auth-shape {
  position: absolute; border-radius: 50%; opacity: 0.08;
  background: var(--gradient-primary);
}
.s1 { width: 700px; height: 700px; top: -300px; right: -200px; }
.s2 { width: 400px; height: 400px; bottom: -200px; left: -100px; background: var(--gradient-secondary); }
.auth-box {
  background: rgba(255,255,255,0.95); backdrop-filter: blur(20px);
  border-radius: 24px; padding: 48px 40px;
  max-width: 440px; width: 100%;
  box-shadow: 0 20px 60px rgba(102,126,234,0.18);
  position: relative; z-index: 1;
}
.auth-logo { text-align: center; font-size: 18px; font-weight: 800; cursor: pointer; color: var(--color-primary); margin-bottom: 28px; }
.auth-title { font-size: 28px; font-weight: 900; text-align: center; margin-bottom: 8px; }
.auth-sub { text-align: center; color: var(--color-text-secondary); font-size: 14px; margin-bottom: 32px; }
.auth-form { display: flex; flex-direction: column; gap: 0; }
.input-wrapper { position: relative; }
.input-wrapper .form-input { padding-right: 44px; }
.pwd-toggle {
  position: absolute; right: 14px; top: 50%; transform: translateY(-50%);
  cursor: pointer; font-size: 18px; user-select: none;
}
.auth-error {
  background: rgba(245,34,45,0.08); color: var(--color-error);
  border-radius: 10px; padding: 10px 14px; font-size: 13px; margin-bottom: 16px;
}
.demo-accounts {
  margin-top: 24px; padding: 16px; background: rgba(102,126,234,0.05);
  border-radius: 14px; border: 1.5px dashed rgba(102,126,234,0.2);
}
.demo-title { font-size: 12px; color: var(--color-text-muted); margin-bottom: 10px; }
.demo-grid { display: flex; gap: 8px; }
.demo-btn {
  flex: 1; display: flex; flex-direction: column; align-items: center; gap: 4px;
  padding: 10px 8px; border-radius: 12px; background: #fff;
  border: 1.5px solid var(--color-border); cursor: pointer;
  transition: var(--transition); font-size: 12px;
}
.demo-btn:hover { border-color: var(--color-primary); background: rgba(102,126,234,0.05); }
.demo-role-icon { font-size: 20px; }
.demo-account { font-size: 11px; color: var(--color-text-muted); }
.auth-footer { text-align: center; margin-top: 24px; font-size: 14px; color: var(--color-text-secondary); }
.auth-link { color: var(--color-primary); font-weight: 600; }
.auth-link:hover { text-decoration: underline; }
</style>
