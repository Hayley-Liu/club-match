<template>
  <AppLayout>
    <div class="admin-notif-page">
      <div class="page-inner">
        <div class="page-header">
          <h2 class="page-title">📢 通知管理</h2>
          <button class="btn btn-primary" @click="openCreate">+ 发布新通知</button>
        </div>

        <div v-if="loading" class="loading-overlay"><div class="loading-spin"></div></div>

        <div v-else-if="notifications.length" class="notif-list">
          <div v-for="n in notifications" :key="n.id" class="notif-row card">
            <div class="notif-main">
              <div class="notif-title-row">
                <span class="notif-type-icon">{{ typeIcon(n.type) }}</span>
                <h4 class="notif-title">{{ n.title }}</h4>
                <div class="notif-flags">
                  <span v-if="n.is_top" class="tag tag-orange" style="font-size:10px">置顶</span>
                  <span v-if="n.is_urgent" class="tag tag-red" style="font-size:10px">紧急</span>
                  <span :class="['tag', targetTagClass(n.target_role)]" style="font-size:10px">{{ targetLabel(n.target_role) }}</span>
                </div>
              </div>
              <p class="notif-content-text">{{ n.content }}</p>
              <div class="notif-meta">
                <span>📅 {{ formatTime(n.created_at) }}</span>
                <span>👁 已读 {{ n.read_count || 0 }} 人</span>
              </div>
            </div>
            <div class="notif-actions">
              <button class="btn btn-ghost btn-sm" @click="deleteNotif(n)" style="color:var(--color-error)">删除</button>
            </div>
          </div>
        </div>

        <div v-else class="empty-state">
          <div class="empty-icon">📭</div>
          <div class="empty-title">暂无通知</div>
          <div class="empty-desc">发布一条通知，让师生及时了解招新动态</div>
        </div>
      </div>
    </div>

    <!-- 创建通知弹窗 -->
    <div v-if="modal.show" class="modal-overlay" @click.self="modal.show=false">
      <div class="modal create-modal">
        <div class="modal-header">
          <h3 class="modal-title">📢 发布新通知</h3>
          <button class="modal-close" @click="modal.show=false">×</button>
        </div>
        <div class="form-group">
          <label class="form-label">通知标题 <span class="required">*</span></label>
          <input v-model="modal.form.title" class="form-input" placeholder="简洁明了的标题" />
        </div>
        <div class="form-group">
          <label class="form-label">通知内容 <span class="required">*</span></label>
          <textarea v-model="modal.form.content" class="form-input form-textarea" placeholder="详细通知内容" rows="4"></textarea>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">通知类型</label>
            <select v-model="modal.form.type" class="form-input">
              <option value="system">📢 系统公告</option>
              <option value="club_review">🏆 社团审核</option>
              <option value="apply_review">📋 报名审核</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">推送对象</label>
            <select v-model="modal.form.target_role" class="form-input">
              <option value="all">全体用户</option>
              <option value="student">仅学生</option>
              <option value="leader">仅社长</option>
            </select>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="check-label" style="margin-top:8px">
              <input type="checkbox" v-model="modal.form.is_top" />
              <span style="margin-left:6px">置顶显示</span>
            </label>
          </div>
          <div class="form-group">
            <label class="check-label" style="margin-top:8px">
              <input type="checkbox" v-model="modal.form.is_urgent" />
              <span style="margin-left:6px">标记为紧急</span>
            </label>
          </div>
        </div>
        <div v-if="modal.error" class="auth-error">⚠️ {{ modal.error }}</div>
        <div class="modal-footer">
          <button class="btn btn-ghost" @click="modal.show=false">取消</button>
          <button class="btn btn-primary" @click="submitNotif" :disabled="modal.loading">
            <span v-if="modal.loading" class="loading-spin" style="width:16px;height:16px;border-width:2px"></span>
            <span v-else>立即发布</span>
          </button>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, onMounted, inject } from 'vue'
import AppLayout from '@/components/AppLayout.vue'
import request from '@/utils/request'

const showToast = inject('showToast')
const loading = ref(true)
const notifications = ref([])

const modal = ref({
  show: false, loading: false, error: '',
  form: { title: '', content: '', type: 'system', target_role: 'all', is_top: false, is_urgent: false }
})

const typeIcon = t => ({ system: '📢', club_review: '🏆', apply_review: '📋' }[t] || '🔔')
const targetLabel = r => ({ all: '全体用户', student: '学生', leader: '社长' }[r] || r)
const targetTagClass = r => ({ all: 'tag-blue', student: 'tag-purple', leader: 'tag-orange' }[r] || 'tag-blue')

function formatTime(t) {
  if (!t) return ''
  return new Date(t).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
}

function openCreate() {
  modal.value = {
    show: true, loading: false, error: '',
    form: { title: '', content: '', type: 'system', target_role: 'all', is_top: false, is_urgent: false }
  }
}

async function submitNotif() {
  if (!modal.value.form.title || !modal.value.form.content) {
    modal.value.error = '请填写标题和内容'
    return
  }
  modal.value.loading = true
  modal.value.error = ''
  try {
    const res = await request.post('/admin/notifications', modal.value.form)
    notifications.value.unshift(res.data)
    modal.value.show = false
    showToast('通知已发布', 'success')
  } catch (e) {
    modal.value.error = e.message
  } finally { modal.value.loading = false }
}

async function deleteNotif(n) {
  try {
    await request.delete(`/admin/notifications/${n.id}`)
    notifications.value = notifications.value.filter(x => x.id !== n.id)
    showToast('已删除', 'success')
  } catch (e) { showToast(e.message, 'error') }
}

onMounted(async () => {
  try {
    const res = await request.get('/admin/notifications')
    notifications.value = res.data?.list || []
  } catch {} finally { loading.value = false }
})
</script>

<style scoped>
.admin-notif-page { padding: 32px 0; }
.page-inner { max-width: 900px; margin: 0 auto; padding: 0 24px; }
.page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 28px; }
.page-title { font-size: 24px; font-weight: 800; }
.notif-list { display: flex; flex-direction: column; gap: 12px; }
.notif-row { padding: 20px 24px; display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; }
.notif-main { flex: 1; min-width: 0; }
.notif-title-row { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; flex-wrap: wrap; }
.notif-type-icon { font-size: 22px; flex-shrink: 0; }
.notif-title { font-size: 16px; font-weight: 700; }
.notif-flags { display: flex; gap: 6px; flex-wrap: wrap; }
.notif-content-text { font-size: 13px; color: var(--color-text-secondary); line-height: 1.6; margin-bottom: 10px; }
.notif-meta { display: flex; gap: 16px; font-size: 12px; color: var(--color-text-muted); }
.notif-actions { flex-shrink: 0; }
.create-modal { max-width: 520px; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.auth-error { background: rgba(245,34,45,.08); color: var(--color-error); border-radius: 10px; padding: 10px 14px; font-size: 13px; margin-bottom: 8px; }
</style>
