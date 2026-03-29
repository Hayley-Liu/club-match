<template>
  <AppLayout>
    <div class="profile-page">
      <div class="profile-inner">
        <!-- 头像+基本信息 -->
        <div class="card profile-card">
          <div class="avatar-section">
            <div class="avatar-wrap">
              <div class="avatar-circle">{{ initials }}</div>
            </div>
            <div class="profile-info">
              <h2 class="profile-name">{{ user?.name || user?.username }}</h2>
              <div class="profile-role">
                <span :class="['role-badge', `role-${user?.role}`]">{{ roleLabel }}</span>
                <span v-if="user?.student_id" class="student-id">{{ user.student_id }}</span>
              </div>
              <div class="profile-meta" v-if="user?.major">📚 {{ user.major }}</div>
            </div>
          </div>

          <!-- 统计 -->
          <div class="profile-stats">
            <div class="stat-box" @click="$router.push('/my-applications')">
              <span class="stat-num">{{ stats.applications }}</span>
              <span class="stat-label">报名社团</span>
            </div>
            <div class="stat-box" @click="$router.push('/favorites')">
              <span class="stat-num">{{ stats.favorites }}</span>
              <span class="stat-label">收藏社团</span>
            </div>
            <div class="stat-box">
              <span class="stat-num">{{ stats.approved }}</span>
              <span class="stat-label">已通过</span>
            </div>
          </div>
        </div>

        <!-- 编辑信息 -->
        <div class="card edit-card">
          <div class="edit-header">
            <h3 class="section-title-sm">个人信息</h3>
            <button class="btn btn-primary btn-sm" @click="saveProfile" :disabled="saving">
              {{ saving ? '保存中...' : '保存修改' }}
            </button>
          </div>
          <div class="edit-form">
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">姓名</label>
                <input v-model="editForm.name" class="form-input" placeholder="真实姓名" />
              </div>
              <div class="form-group">
                <label class="form-label">手机号</label>
                <input v-model="editForm.phone" class="form-input" placeholder="联系手机" type="tel" />
              </div>
            </div>
            <div class="form-row" v-if="authStore.isStudent">
              <div class="form-group">
                <label class="form-label">学号</label>
                <input v-model="editForm.student_id" class="form-input" placeholder="学号" />
              </div>
              <div class="form-group">
                <label class="form-label">专业</label>
                <input v-model="editForm.major" class="form-input" placeholder="就读专业" />
              </div>
            </div>
          </div>
        </div>

        <!-- 测评结果 -->
        <div class="card tags-card" v-if="assessmentTags.length">
          <div class="edit-header">
            <h3 class="section-title-sm">🎯 我的兴趣标签</h3>
            <button class="btn btn-ghost btn-sm" @click="$router.push('/assessment')">重新测评</button>
          </div>
          <div class="tags-cloud">
            <span v-for="tag in assessmentTags" :key="tag" class="tag tag-purple">{{ tag }}</span>
          </div>
          <p class="tags-hint">基于你的兴趣测评结果生成，影响社团推荐结果</p>
        </div>
        <div class="card no-assess-card" v-else>
          <span class="na-icon">🎯</span>
          <div>
            <h4>还没有完成兴趣测评</h4>
            <p>完成测评后获取个性化社团推荐</p>
          </div>
          <button class="btn btn-primary btn-sm" @click="$router.push('/assessment')">去测评</button>
        </div>

        <!-- 快捷入口 -->
        <div class="card quick-links-card">
          <h3 class="section-title-sm">快捷入口</h3>
          <div class="quick-links">
            <div class="quick-link" @click="$router.push('/my-applications')">
              <span class="ql-icon">📋</span>
              <span class="ql-name">我的报名</span>
              <span class="ql-arrow">→</span>
            </div>
            <div class="quick-link" @click="$router.push('/favorites')">
              <span class="ql-icon">❤️</span>
              <span class="ql-name">我的收藏</span>
              <span class="ql-arrow">→</span>
            </div>
            <div class="quick-link" @click="$router.push('/notifications')">
              <span class="ql-icon">🔔</span>
              <span class="ql-name">通知中心</span>
              <span class="ql-arrow">→</span>
            </div>
            <div class="quick-link" @click="$router.push('/clubs')">
              <span class="ql-icon">🔍</span>
              <span class="ql-name">发现社团</span>
              <span class="ql-arrow">→</span>
            </div>
          </div>
        </div>

        <button class="btn btn-ghost logout-btn" @click="handleLogout">🚪 退出登录</button>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted, inject } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import AppLayout from '@/components/AppLayout.vue'
import request from '@/utils/request'

const router = useRouter()
const authStore = useAuthStore()
const showToast = inject('showToast')
const saving = ref(false)
const assessmentTags = ref([])
const stats = ref({ applications: 0, favorites: 0, approved: 0 })

const user = computed(() => authStore.user)
const initials = computed(() => {
  const n = user.value?.name || user.value?.username || '?'
  return n.charAt(0).toUpperCase()
})
const roleLabel = computed(() => ({ student: '学生', leader: '社长', admin: '管理员' }[user.value?.role] || '用户'))

const editForm = ref({
  name: user.value?.name || '',
  phone: user.value?.phone || '',
  student_id: user.value?.student_id || '',
  major: user.value?.major || '',
})

async function saveProfile() {
  saving.value = true
  try {
    await authStore.fetchProfile()
    await request.put('/auth/profile', editForm.value)
    await authStore.fetchProfile()
    showToast('保存成功', 'success')
  } catch (e) {
    showToast(e.message, 'error')
  } finally { saving.value = false }
}

function handleLogout() {
  authStore.logout()
  router.push('/')
}

onMounted(async () => {
  if (authStore.isStudent) {
    try {
      const r = await request.get('/assessment/result')
      assessmentTags.value = r.data?.tags || []
    } catch {}
    try {
      const apps = await request.get('/applications/my')
      stats.value.applications = apps.data?.length || 0
      stats.value.approved = apps.data?.filter(a => a.status === 'approved').length || 0
    } catch {}
    try {
      const favs = await request.get('/clubs/my/favorites')
      stats.value.favorites = favs.data?.length || 0
    } catch {}
  }
})
</script>

<style scoped>
.profile-page { padding: 32px 0; }
.profile-inner { max-width: 680px; margin: 0 auto; padding: 0 24px; display: flex; flex-direction: column; gap: 20px; }
.profile-card { padding: 28px; }
.avatar-section { display: flex; gap: 20px; align-items: flex-start; margin-bottom: 24px; }
.avatar-circle { width: 72px; height: 72px; border-radius: 50%; background: var(--gradient-primary); display: flex; align-items: center; justify-content: center; font-size: 28px; font-weight: 800; color: #fff; flex-shrink: 0; }
.profile-name { font-size: 22px; font-weight: 800; margin-bottom: 8px; }
.profile-role { display: flex; align-items: center; gap: 10px; margin-bottom: 6px; }
.role-badge { padding: 3px 10px; border-radius: 20px; font-size: 12px; font-weight: 600; }
.role-student { background: rgba(102,126,234,.12); color: var(--color-primary); }
.role-leader { background: rgba(250,173,20,.15); color: #d48806; }
.role-admin { background: rgba(245,34,45,.1); color: #cf1322; }
.student-id { font-size: 13px; color: var(--color-text-muted); }
.profile-meta { font-size: 13px; color: var(--color-text-secondary); }
.profile-stats { display: grid; grid-template-columns: repeat(3,1fr); gap: 12px; }
.stat-box { background: var(--gradient-bg); border-radius: 12px; padding: 16px; text-align: center; cursor: pointer; transition: var(--transition); }
.stat-box:hover { background: rgba(102,126,234,.08); }
.stat-num { display: block; font-size: 24px; font-weight: 900; background: var(--gradient-primary); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
.stat-label { font-size: 12px; color: var(--color-text-muted); }
.edit-card { padding: 24px; }
.edit-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.section-title-sm { font-size: 16px; font-weight: 700; }
.edit-form { display: flex; flex-direction: column; gap: 0; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.tags-card { padding: 24px; }
.tags-cloud { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 10px; }
.tags-hint { font-size: 12px; color: var(--color-text-muted); }
.no-assess-card { padding: 20px 24px; display: flex; align-items: center; gap: 16px; }
.na-icon { font-size: 32px; }
.no-assess-card h4 { font-size: 15px; font-weight: 700; margin-bottom: 4px; }
.no-assess-card p { font-size: 13px; color: var(--color-text-muted); }
.no-assess-card .btn { margin-left: auto; flex-shrink: 0; }
.quick-links-card { padding: 24px; }
.quick-links { display: flex; flex-direction: column; }
.quick-link { display: flex; align-items: center; gap: 14px; padding: 14px 0; border-bottom: 1px solid var(--color-border); cursor: pointer; transition: background 0.15s; border-radius: 8px; }
.quick-link:last-child { border-bottom: none; }
.quick-link:hover { background: rgba(102,126,234,.04); padding-left: 8px; }
.ql-icon { font-size: 22px; }
.ql-name { flex: 1; font-size: 14px; font-weight: 600; }
.ql-arrow { color: var(--color-text-muted); }
.logout-btn { color: var(--color-error); margin: 8px auto 32px; }
@media (max-width: 480px) { .form-row { grid-template-columns: 1fr; } }
</style>
