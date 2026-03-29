<template>
  <AppLayout>
    <div class="notif-page">
      <div class="page-inner">
        <div class="page-header">
          <h2 class="page-title">🔔 通知中心</h2>
          <button v-if="hasUnread" class="btn btn-ghost btn-sm" @click="markAllRead">全部标记已读</button>
        </div>

        <div v-if="loading" class="loading-overlay"><div class="loading-spin"></div></div>

        <div v-else-if="notifications.length" class="notif-list">
          <div
            v-for="n in notifications" :key="n.id"
            :class="['notif-item', { unread: !n.is_read, top: n.is_top, urgent: n.is_urgent }]"
            @click="markRead(n)"
          >
            <div class="notif-icon-wrap">
              <span class="notif-icon">{{ notifIcon(n.type) }}</span>
              <span v-if="!n.is_read" class="unread-dot"></span>
            </div>
            <div class="notif-content">
              <div class="notif-title-row">
                <h4 class="notif-title">{{ n.title }}</h4>
                <div class="notif-badges">
                  <span v-if="n.is_top" class="tag tag-orange" style="font-size:10px">置顶</span>
                  <span v-if="n.is_urgent" class="tag tag-red" style="font-size:10px">紧急</span>
                </div>
              </div>
              <p class="notif-body">{{ n.content }}</p>
              <span class="notif-time">{{ formatTime(n.created_at) }}</span>
            </div>
            <button class="delete-btn" @click.stop="deleteNotif(n)" title="删除">×</button>
          </div>
        </div>

        <div v-else class="empty-state">
          <div class="empty-icon">🔕</div>
          <div class="empty-title">暂无通知</div>
          <div class="empty-desc">你的通知会在这里显示</div>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted, inject } from 'vue'
import AppLayout from '@/components/AppLayout.vue'
import request from '@/utils/request'

const showToast = inject('showToast')
const notifications = ref([])
const loading = ref(true)

const hasUnread = computed(() => notifications.value.some(n => !n.is_read))

function notifIcon(type) {
  const map = { system: '📢', club_review: '🏆', apply_review: '📋' }
  return map[type] || '🔔'
}

function formatTime(t) {
  if (!t) return ''
  const d = new Date(t)
  const now = new Date()
  const diff = now - d
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff/60000)}分钟前`
  if (diff < 86400000) return `${Math.floor(diff/3600000)}小时前`
  if (diff < 86400000 * 3) return `${Math.floor(diff/86400000)}天前`
  return d.toLocaleDateString('zh-CN', { month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit' })
}

async function markRead(n) {
  if (n.is_read) return
  try {
    await request.put(`/notifications/${n.id}/read`)
    n.is_read = true
  } catch {}
}

async function markAllRead() {
  try {
    await request.put('/notifications/read-all')
    notifications.value.forEach(n => n.is_read = true)
    showToast('全部已读', 'success')
  } catch {}
}

async function deleteNotif(n) {
  try {
    await request.delete(`/notifications/${n.id}`)
    notifications.value = notifications.value.filter(x => x.id !== n.id)
  } catch {}
}

onMounted(async () => {
  try {
    const res = await request.get('/notifications')
    notifications.value = res.data?.list || []
  } catch {} finally { loading.value = false }
})
</script>

<style scoped>
.notif-page { padding: 32px 0; }
.page-inner { max-width: 760px; margin: 0 auto; padding: 0 24px; }
.page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 28px; }
.page-title { font-size: 24px; font-weight: 800; }
.notif-list { display: flex; flex-direction: column; gap: 12px; }
.notif-item {
  background: #fff; border-radius: 16px; padding: 18px 20px;
  display: flex; gap: 14px; align-items: flex-start;
  transition: var(--transition); cursor: pointer; position: relative;
  box-shadow: var(--card-shadow);
}
.notif-item:hover { box-shadow: var(--card-shadow-hover); transform: translateY(-1px); }
.notif-item.unread { border-left: 3px solid var(--color-primary); }
.notif-item.top { border-top: 2px solid var(--color-warning); }
.notif-item.urgent { border-left: 3px solid var(--color-error); }
.notif-icon-wrap { position: relative; flex-shrink: 0; }
.notif-icon { font-size: 28px; }
.unread-dot { position: absolute; top: -2px; right: -2px; width: 10px; height: 10px; background: var(--color-primary); border-radius: 50%; border: 2px solid #fff; }
.notif-content { flex: 1; min-width: 0; }
.notif-title-row { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; flex-wrap: wrap; }
.notif-title { font-size: 15px; font-weight: 700; }
.notif-badges { display: flex; gap: 4px; }
.notif-body { font-size: 13px; color: var(--color-text-secondary); line-height: 1.6; margin-bottom: 8px; }
.notif-time { font-size: 12px; color: var(--color-text-muted); }
.delete-btn { background: none; color: var(--color-text-muted); font-size: 20px; opacity: 0; transition: opacity 0.2s; flex-shrink: 0; line-height: 1; cursor: pointer; }
.notif-item:hover .delete-btn { opacity: 1; }
</style>
