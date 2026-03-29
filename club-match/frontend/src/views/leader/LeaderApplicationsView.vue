<template>
  <AppLayout>
    <div class="leader-apps-page">
      <div class="page-inner">
        <div class="page-header">
          <div>
            <h2 class="page-title">📋 报名审核</h2>
            <p class="page-sub" v-if="myClub">{{ myClub.name }} · 共 {{ total }} 份报名</p>
          </div>
          <div class="header-actions">
            <div class="sort-btns">
              <button v-for="s in sorts" :key="s.key" :class="['sort-btn', { active: activeSort === s.key }]" @click="selectSort(s.key)">{{ s.name }}</button>
            </div>
            <div v-if="selected.length" class="batch-actions">
              <span class="selected-count">已选 {{ selected.length }} 人</span>
              <button class="btn btn-success btn-sm" @click="batchReview('approve')">批量通过</button>
              <button class="btn btn-ghost btn-sm" style="color:var(--color-error)" @click="batchReview('reject')">批量驳回</button>
            </div>
          </div>
        </div>

        <!-- 状态切换 -->
        <div class="status-tabs">
          <button v-for="tab in tabs" :key="tab.key" :class="['tab-btn', { active: activeTab === tab.key }]" @click="selectTab(tab.key)">
            {{ tab.label }}
            <span v-if="counts[tab.key]" class="tab-count">{{ counts[tab.key] }}</span>
          </button>
        </div>

        <div v-if="loading" class="loading-overlay"><div class="loading-spin"></div></div>

        <div v-else-if="filteredApps.length" class="apps-table">
          <!-- 全选行 -->
          <div v-if="activeTab === 'pending'" class="table-header">
            <label class="check-label">
              <input type="checkbox" :checked="allSelected" @change="toggleSelectAll" />
              全选
            </label>
            <span class="col-name">申请人</span>
            <span class="col-match">匹配度</span>
            <span class="col-tags">标签</span>
            <span class="col-time">时间</span>
            <span class="col-actions">操作</span>
          </div>

          <div v-for="app in filteredApps" :key="app.id" class="app-row card">
            <label v-if="activeTab === 'pending'" class="check-cell" @click.stop>
              <input type="checkbox" :checked="selected.includes(app.id)" @change="toggleSelect(app.id)" />
            </label>
            <div class="app-student-info">
              <div class="student-avatar">{{ (app.name || '?').charAt(0) }}</div>
              <div class="student-text">
                <div class="student-name-row">
                  <span class="student-name">{{ app.name }}</span>
                  <span v-if="app.student_id" class="student-id">{{ app.student_id }}</span>
                </div>
                <div class="student-meta">
                  <span v-if="app.major">📚 {{ app.major }}</span>
                  <span v-if="app.phone">📱 {{ app.phone }}</span>
                </div>
                <div v-if="app.introduction" class="student-intro">
                  "{{ app.introduction }}"
                </div>
              </div>
            </div>

            <div class="app-match-col">
              <span :class="['match-badge', app.match_score>=80?'match-high':app.match_score>=50?'match-mid':'match-low']">
                ⭐ {{ app.match_score }}%
              </span>
            </div>

            <div class="app-tags-col">
              <span v-for="t in app.skill_tags.slice(0,3)" :key="t" class="tag tag-blue" style="font-size:11px">{{ t }}</span>
            </div>

            <div class="app-time-col">
              <span class="app-time">{{ formatTime(app.created_at) }}</span>
              <span :class="['status-badge', `status-${app.status}`]" style="font-size:11px;display:block;margin-top:4px">{{ statusLabels[app.status] }}</span>
            </div>

            <div class="app-actions-col">
              <template v-if="app.status === 'pending'">
                <button class="btn btn-success btn-sm" @click="reviewOne(app, 'approve')">✓ 通过</button>
                <button class="btn btn-ghost btn-sm" style="color:var(--color-error);font-size:12px" @click="openReject(app)">✗ 驳回</button>
              </template>
              <span v-else-if="app.status === 'rejected'" class="reject-reason-mini">{{ app.reject_reason }}</span>
            </div>
          </div>
        </div>

        <div v-else class="empty-state">
          <div class="empty-icon">📭</div>
          <div class="empty-title">暂无{{ tabs.find(t=>t.key===activeTab)?.label }}报名</div>
          <div class="empty-desc">{{ activeTab === 'pending' ? '暂时没有新的报名申请' : '处理完成后显示在这里' }}</div>
        </div>
      </div>
    </div>

    <!-- 驳回理由弹窗 -->
    <div v-if="rejectModal.show" class="modal-overlay" @click.self="rejectModal.show=false">
      <div class="modal">
        <div class="modal-header">
          <h3 class="modal-title">驳回报名</h3>
          <button class="modal-close" @click="rejectModal.show=false">×</button>
        </div>
        <p style="margin-bottom:12px;font-size:14px;color:var(--color-text-secondary)">
          驳回 <strong>{{ rejectModal.name }}</strong> 的报名，请填写原因：
        </p>
        <div class="quick-reasons">
          <button v-for="r in quickReasons" :key="r" class="quick-reason-btn" type="button" @click="rejectModal.reason=r">{{ r }}</button>
        </div>
        <div class="form-group" style="margin-top:12px">
          <textarea v-model="rejectModal.reason" class="form-input form-textarea" placeholder="驳回原因..." rows="3"></textarea>
        </div>
        <div class="modal-footer">
          <button class="btn btn-ghost" @click="rejectModal.show=false">取消</button>
          <button class="btn btn-danger" @click="confirmReject" :disabled="!rejectModal.reason">确认驳回</button>
        </div>
      </div>
    </div>

    <!-- 批量驳回理由弹窗 -->
    <div v-if="batchRejectModal.show" class="modal-overlay" @click.self="batchRejectModal.show=false">
      <div class="modal">
        <div class="modal-header">
          <h3 class="modal-title">批量驳回 ({{ selected.length }} 人)</h3>
          <button class="modal-close" @click="batchRejectModal.show=false">×</button>
        </div>
        <div class="form-group">
          <textarea v-model="batchRejectModal.reason" class="form-input form-textarea" placeholder="批量驳回原因..." rows="3"></textarea>
        </div>
        <div class="modal-footer">
          <button class="btn btn-ghost" @click="batchRejectModal.show=false">取消</button>
          <button class="btn btn-danger" @click="confirmBatchReject" :disabled="!batchRejectModal.reason">确认批量驳回</button>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted, inject } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import AppLayout from '@/components/AppLayout.vue'
import request from '@/utils/request'

const route = useRoute()
const authStore = useAuthStore()
const showToast = inject('showToast')

const myClub = ref(null)
const applications = ref([])
const loading = ref(true)
const activeTab = ref(route.query.status || 'pending')
const activeSort = ref('match')
const selected = ref([])
const total = computed(() => applications.value.length)

const tabs = [
  { key: 'pending', label: '待审核' },
  { key: 'approved', label: '已通过' },
  { key: 'rejected', label: '已驳回' },
  { key: 'all', label: '全部' },
]
const sorts = [
  { key: 'match', name: '按匹配度' },
  { key: 'time', name: '按时间' },
]
const statusLabels = { pending: '待审核', approved: '已通过', rejected: '已驳回', cancelled: '已取消' }
const quickReasons = ['暂时名额已满，感谢报名', '招新已结束', '与社团需求不匹配', '请下学期再来']

const rejectModal = ref({ show: false, appId: null, name: '', reason: '' })
const batchRejectModal = ref({ show: false, reason: '' })

const counts = computed(() => {
  return {
    pending: applications.value.filter(a => a.status === 'pending').length,
    approved: applications.value.filter(a => a.status === 'approved').length,
    rejected: applications.value.filter(a => a.status === 'rejected').length,
  }
})

const filteredApps = computed(() => {
  let list = applications.value
  if (activeTab.value !== 'all') list = list.filter(a => a.status === activeTab.value)
  if (activeSort.value === 'match') list = [...list].sort((a, b) => b.match_score - a.match_score)
  else list = [...list].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  return list
})

const allSelected = computed(() =>
  filteredApps.value.filter(a => a.status === 'pending').length > 0 &&
  filteredApps.value.filter(a => a.status === 'pending').every(a => selected.value.includes(a.id))
)

function toggleSelectAll(e) {
  if (e.target.checked) selected.value = filteredApps.value.filter(a => a.status === 'pending').map(a => a.id)
  else selected.value = []
}

function toggleSelect(id) {
  const idx = selected.value.indexOf(id)
  if (idx === -1) selected.value.push(id)
  else selected.value.splice(idx, 1)
}

function selectTab(key) { activeTab.value = key; selected.value = [] }
function selectSort(key) { activeSort.value = key }

function formatTime(t) {
  if (!t) return ''
  return new Date(t).toLocaleDateString('zh-CN', { month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit' })
}

function openReject(app) {
  rejectModal.value = { show: true, appId: app.id, name: app.name, reason: '' }
}

async function reviewOne(app, action, reason = '') {
  try {
    await request.put(`/applications/${app.id}/review`, { action, reject_reason: reason })
    app.status = action === 'approve' ? 'approved' : 'rejected'
    if (action === 'reject') app.reject_reason = reason
    showToast(action === 'approve' ? '已通过' : '已驳回', 'success')
  } catch (e) { showToast(e.message, 'error') }
}

async function confirmReject() {
  if (!rejectModal.value.reason.trim()) return
  const app = applications.value.find(a => a.id === rejectModal.value.appId)
  if (app) await reviewOne(app, 'reject', rejectModal.value.reason)
  rejectModal.value.show = false
}

async function batchReview(action) {
  if (!selected.value.length) return
  if (action === 'reject') { batchRejectModal.value = { show: true, reason: '' }; return }
  try {
    await request.post('/applications/batch-review', { ids: selected.value, action })
    selected.value.forEach(id => {
      const app = applications.value.find(a => a.id === id)
      if (app) app.status = 'approved'
    })
    showToast(`已批量通过 ${selected.value.length} 人`, 'success')
    selected.value = []
  } catch (e) { showToast(e.message, 'error') }
}

async function confirmBatchReject() {
  if (!batchRejectModal.value.reason.trim()) return
  try {
    await request.post('/applications/batch-review', { ids: selected.value, action: 'reject', reject_reason: batchRejectModal.value.reason })
    selected.value.forEach(id => {
      const app = applications.value.find(a => a.id === id)
      if (app) { app.status = 'rejected'; app.reject_reason = batchRejectModal.value.reason }
    })
    showToast(`已批量驳回 ${selected.value.length} 人`, 'success')
    selected.value = []
    batchRejectModal.value.show = false
  } catch (e) { showToast(e.message, 'error') }
}

onMounted(async () => {
  try {
    const r = await request.get('/clubs/my/club')
    myClub.value = r.data
    if (myClub.value) {
      const apps = await request.get(`/applications/club/${myClub.value.id}`)
      applications.value = apps.data || []
    }
  } catch {} finally { loading.value = false }
})
</script>

<style scoped>
.leader-apps-page { padding: 32px 0; }
.page-inner { max-width: 1100px; margin: 0 auto; padding: 0 24px; }
.page-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 28px; flex-wrap: wrap; gap: 12px; }
.page-title { font-size: 24px; font-weight: 800; }
.page-sub { font-size: 13px; color: var(--color-text-muted); margin-top: 4px; }
.header-actions { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.sort-btns { display: flex; gap: 6px; }
.sort-btn { padding: 6px 14px; border-radius: 50px; font-size: 12px; font-weight: 500; background: transparent; border: 1.5px solid var(--color-border); cursor: pointer; transition: var(--transition); }
.sort-btn.active { background: rgba(102,126,234,.1); border-color: var(--color-primary); color: var(--color-primary); }
.batch-actions { display: flex; align-items: center; gap: 8px; padding: 6px 14px; background: rgba(102,126,234,.08); border-radius: 50px; }
.selected-count { font-size: 13px; font-weight: 600; color: var(--color-primary); }
.status-tabs { display: flex; gap: 4px; background: rgba(255,255,255,.7); padding: 6px; border-radius: 50px; margin-bottom: 24px; width: fit-content; box-shadow: var(--card-shadow); }
.tab-btn { padding: 8px 20px; border-radius: 50px; font-size: 14px; font-weight: 600; background: transparent; color: var(--color-text-secondary); cursor: pointer; transition: var(--transition); display: flex; align-items: center; gap: 6px; border: none; }
.tab-btn.active { background: var(--gradient-primary); color: #fff; }
.tab-count { background: rgba(0,0,0,.1); padding: 1px 6px; border-radius: 10px; font-size: 11px; }
.apps-table { display: flex; flex-direction: column; gap: 12px; }
.table-header { display: flex; align-items: center; gap: 16px; padding: 10px 16px; font-size: 12px; font-weight: 600; color: var(--color-text-muted); }
.app-row { padding: 16px; display: flex; align-items: center; gap: 16px; transition: var(--transition); }
.check-cell { flex-shrink: 0; }
.check-label { display: flex; align-items: center; gap: 6px; font-size: 13px; cursor: pointer; }
.student-avatar { width: 42px; height: 42px; border-radius: 50%; background: var(--gradient-primary); display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 700; font-size: 16px; flex-shrink: 0; }
.app-student-info { display: flex; gap: 12px; align-items: flex-start; flex: 1; min-width: 0; }
.student-text { flex: 1; min-width: 0; }
.student-name-row { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
.student-name { font-size: 14px; font-weight: 700; }
.student-id { font-size: 12px; color: var(--color-text-muted); }
.student-meta { display: flex; flex-wrap: wrap; gap: 10px; font-size: 12px; color: var(--color-text-muted); margin-bottom: 4px; }
.student-intro { font-size: 12px; color: var(--color-text-secondary); background: rgba(102,126,234,.05); padding: 6px 10px; border-radius: 8px; font-style: italic; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.app-match-col { flex-shrink: 0; min-width: 80px; text-align: center; }
.app-tags-col { display: flex; flex-wrap: wrap; gap: 4px; min-width: 80px; max-width: 140px; }
.app-time-col { flex-shrink: 0; min-width: 80px; text-align: center; }
.app-time { font-size: 12px; color: var(--color-text-muted); }
.app-actions-col { flex-shrink: 0; display: flex; flex-direction: column; gap: 4px; min-width: 90px; }
.reject-reason-mini { font-size: 11px; color: var(--color-text-muted); max-width: 120px; word-break: break-all; }
.quick-reasons { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 4px; }
.quick-reason-btn { padding: 4px 12px; border-radius: 20px; border: 1.5px solid var(--color-border); background: #fff; font-size: 12px; cursor: pointer; transition: var(--transition); }
.quick-reason-btn:hover { border-color: var(--color-primary); color: var(--color-primary); }
@media (max-width: 768px) { .app-match-col, .app-tags-col { display: none; } }
</style>
