<template>
  <AppLayout>
    <div class="admin-clubs-page">
      <div class="page-inner">
        <div class="page-header">
          <h2 class="page-title">🏠 社团管理</h2>
          <div class="header-actions">
            <span v-if="selected.length" class="selected-info">已选 {{ selected.length }} 个</span>
            <div v-if="activeTab === 'pending' && selected.length" class="batch-btns">
              <button class="btn btn-success btn-sm" @click="batchReview('approve')">批量通过</button>
              <button class="btn btn-ghost btn-sm" style="color:var(--color-error)" @click="openBatchReject">批量驳回</button>
            </div>
            <button v-if="activeTab === 'offline' && selected.length" class="btn btn-secondary btn-sm" @click="batchOnline">批量恢复上架</button>
          </div>
        </div>

        <!-- 状态切换 -->
        <div class="status-tabs">
          <button v-for="tab in tabs" :key="tab.key" :class="['tab-btn', { active: activeTab === tab.key }]" @click="selectTab(tab.key)">
            {{ tab.label }}
            <span v-if="counts[tab.key]" class="tab-count">{{ counts[tab.key] }}</span>
          </button>
        </div>

        <!-- 搜索 -->
        <div class="search-row">
          <div class="search-box">
            <span>🔍</span>
            <input v-model="keyword" class="search-input" placeholder="搜索社团名称或负责人..." @input="debounceSearch" />
          </div>
        </div>

        <div v-if="loading" class="loading-overlay"><div class="loading-spin"></div></div>

        <div v-else-if="clubs.length" class="clubs-table">
          <div class="table-header-row">
            <label class="check-cell">
              <input type="checkbox" :checked="allSelected" @change="toggleAll" />
            </label>
            <span class="col-club">社团信息</span>
            <span class="col-leader">负责人</span>
            <span class="col-status">状态</span>
            <span class="col-time">申请时间</span>
            <span class="col-ops">操作</span>
          </div>

          <div v-for="club in clubs" :key="club.id" class="club-row card">
            <label class="check-cell" @click.stop>
              <input type="checkbox" :checked="selected.includes(club.id)" @change="toggleSelect(club.id)" />
            </label>
            <div class="club-info-cell">
              <div :class="['cat-dot', `cat-${club.category}`]"></div>
              <div class="club-text-info">
                <span class="club-row-name">{{ club.name }}</span>
                <div class="club-tags-row">
                  <span v-for="t in club.tags.slice(0,2)" :key="t" class="tag tag-purple" style="font-size:10px">{{ t }}</span>
                </div>
              </div>
            </div>
            <div class="leader-cell">
              <span class="leader-name">{{ club.leader_name }}</span>
              <span class="leader-phone">{{ club.leader_phone }}</span>
            </div>
            <div class="status-cell">
              <span :class="['status-badge', `status-${club.status}`]">{{ statusLabels[club.status] }}</span>
              <span v-if="club.is_recruiting" class="status-badge status-recruiting" style="font-size:10px;margin-top:3px">招新中</span>
            </div>
            <div class="time-cell">{{ formatDate(club.created_at) }}</div>
            <div class="ops-cell">
              <template v-if="club.status === 'pending'">
                <button class="btn btn-success btn-sm" @click="reviewOne(club, 'approve')">通过</button>
                <button class="btn btn-ghost btn-sm" style="color:var(--color-error);font-size:12px" @click="openReject(club)">驳回</button>
              </template>
              <template v-else-if="club.status === 'active'">
                <button class="btn btn-ghost btn-sm" style="color:var(--color-error);font-size:12px" @click="openOffline(club)">下架</button>
                <button class="btn btn-ghost btn-sm" style="font-size:12px" @click="$router.push(`/clubs/${club.id}`)">查看</button>
              </template>
              <template v-else-if="club.status === 'offline'">
                <button class="btn btn-success btn-sm" @click="onlineClub(club)">恢复上架</button>
              </template>
              <template v-else-if="club.status === 'rejected'">
                <span class="reject-reason-mini" :title="club.reject_reason">{{ club.reject_reason?.slice(0,15) }}</span>
              </template>
            </div>
          </div>
        </div>

        <div v-else class="empty-state">
          <div class="empty-icon">🏠</div>
          <div class="empty-title">暂无{{ tabs.find(t=>t.key===activeTab)?.label }}社团</div>
        </div>
      </div>
    </div>

    <!-- 审核/下架 弹窗 -->
    <div v-if="modal.show" class="modal-overlay" @click.self="modal.show=false">
      <div class="modal">
        <div class="modal-header">
          <h3 class="modal-title">{{ modal.title }}</h3>
          <button class="modal-close" @click="modal.show=false">×</button>
        </div>
        <p style="margin-bottom:12px;font-size:14px;color:var(--color-text-secondary)">{{ modal.desc }}</p>
        <div class="form-group" v-if="modal.needReason">
          <textarea v-model="modal.reason" class="form-input form-textarea" :placeholder="modal.placeholder || '请填写原因'" rows="3"></textarea>
        </div>
        <div class="modal-footer">
          <button class="btn btn-ghost" @click="modal.show=false">取消</button>
          <button :class="['btn', modal.btnClass || 'btn-danger']" @click="confirmModal" :disabled="modal.needReason && !modal.reason">确认</button>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted, watch, inject } from 'vue'
import { useRoute } from 'vue-router'
import AppLayout from '@/components/AppLayout.vue'
import request from '@/utils/request'

const route = useRoute()
const showToast = inject('showToast')
const clubs = ref([])
const loading = ref(true)
const activeTab = ref(route.query.status || 'pending')
const keyword = ref('')
const selected = ref([])
const total = ref({})

const tabs = [
  { key: 'pending', label: '待审核' },
  { key: 'active', label: '已通过' },
  { key: 'offline', label: '已下架' },
  { key: 'rejected', label: '已驳回' },
  { key: '', label: '全部' },
]
const statusLabels = { pending: '待审核', active: '正常', rejected: '已驳回', offline: '已下架', suspended: '已暂停' }
const modal = ref({ show: false, type: '', title: '', desc: '', needReason: false, reason: '', placeholder: '', clubId: null, btnClass: '' })
const counts = computed(() => total.value)
const allSelected = computed(() => clubs.value.length > 0 && clubs.value.every(c => selected.value.includes(c.id)))
const maxAppCount = computed(() => 1)

function toggleAll(e) {
  if (e.target.checked) selected.value = clubs.value.map(c => c.id)
  else selected.value = []
}
function toggleSelect(id) {
  const idx = selected.value.indexOf(id)
  if (idx === -1) selected.value.push(id)
  else selected.value.splice(idx, 1)
}
function selectTab(key) { activeTab.value = key; selected.value = []; fetchClubs() }
function formatDate(d) { return d ? new Date(d).toLocaleDateString('zh-CN') : '' }

let st = null
function debounceSearch() { clearTimeout(st); st = setTimeout(fetchClubs, 400) }

async function fetchClubs() {
  loading.value = true
  try {
    const res = await request.get('/admin/clubs', { params: { status: activeTab.value || undefined, keyword: keyword.value || undefined, pageSize: 50 } })
    clubs.value = res.data.list || []
  } catch {} finally { loading.value = false }
}

async function fetchCounts() {
  try {
    const counts = {}
    for (const tab of tabs) {
      const r = await request.get('/admin/clubs', { params: { status: tab.key || undefined, pageSize: 1 } })
      counts[tab.key] = r.data.total
    }
    total.value = counts
  } catch {}
}

function openReject(club) {
  modal.value = { show: true, type: 'reject', title: `驳回社团：${club.name}`, desc: '请填写驳回原因，将通知到社长', needReason: true, reason: '', placeholder: '如：信息不完整，请补充社团简介', clubId: club.id, btnClass: 'btn-danger' }
}
function openOffline(club) {
  modal.value = { show: true, type: 'offline', title: `下架社团：${club.name}`, desc: '下架后该社团将停止招新，社长将收到通知', needReason: true, reason: '', placeholder: '下架原因（如：违规操作）', clubId: club.id, btnClass: 'btn-danger' }
}
function openBatchReject() {
  modal.value = { show: true, type: 'batch-reject', title: `批量驳回 ${selected.value.length} 个社团`, desc: '请填写驳回原因', needReason: true, reason: '', placeholder: '批量驳回原因', clubId: null, btnClass: 'btn-danger' }
}

async function reviewOne(club, action) {
  try {
    await request.put(`/admin/clubs/${club.id}/review`, { action })
    club.status = action === 'approve' ? 'active' : 'rejected'
    showToast(action === 'approve' ? '已通过' : '已驳回', 'success')
    fetchCounts()
  } catch (e) { showToast(e.message, 'error') }
}

async function onlineClub(club) {
  try {
    await request.put(`/admin/clubs/${club.id}/online`)
    club.status = 'active'
    showToast('已恢复上架', 'success')
  } catch (e) { showToast(e.message, 'error') }
}

async function batchOnline() {
  for (const id of selected.value) {
    try { await request.put(`/admin/clubs/${id}/online`) } catch {}
  }
  selected.value = []
  fetchClubs()
  showToast('已批量恢复上架', 'success')
}

async function batchReview(action) {
  try {
    await request.post('/admin/clubs/batch-review', { ids: selected.value, action })
    showToast(`已批量${action === 'approve' ? '通过' : '驳回'}`, 'success')
    selected.value = []
    fetchClubs()
    fetchCounts()
  } catch (e) { showToast(e.message, 'error') }
}

async function confirmModal() {
  const { type, clubId, reason } = modal.value
  try {
    if (type === 'reject') {
      await request.put(`/admin/clubs/${clubId}/review`, { action: 'reject', reject_reason: reason })
      const club = clubs.value.find(c => c.id === clubId)
      if (club) { club.status = 'rejected'; club.reject_reason = reason }
      showToast('已驳回', 'success')
    } else if (type === 'offline') {
      await request.put(`/admin/clubs/${clubId}/offline`, { reason })
      const club = clubs.value.find(c => c.id === clubId)
      if (club) club.status = 'offline'
      showToast('已下架', 'success')
    } else if (type === 'batch-reject') {
      await request.post('/admin/clubs/batch-review', { ids: selected.value, action: 'reject', reject_reason: reason })
      showToast('已批量驳回', 'success')
      selected.value = []
      fetchClubs()
    }
    modal.value.show = false
    fetchCounts()
  } catch (e) { showToast(e.message, 'error') }
}

onMounted(() => { fetchClubs(); fetchCounts() })
</script>

<style scoped>
.admin-clubs-page { padding: 32px 0; }
.page-inner { max-width: 1280px; margin: 0 auto; padding: 0 24px; }
.page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 28px; flex-wrap: wrap; gap: 12px; }
.page-title { font-size: 24px; font-weight: 800; }
.header-actions { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.selected-info { font-size: 13px; color: var(--color-primary); font-weight: 600; }
.batch-btns { display: flex; gap: 6px; }
.status-tabs { display: flex; gap: 4px; background: rgba(255,255,255,.7); padding: 6px; border-radius: 50px; margin-bottom: 20px; width: fit-content; box-shadow: var(--card-shadow); flex-wrap: wrap; }
.tab-btn { padding: 8px 18px; border-radius: 50px; font-size: 13px; font-weight: 600; background: transparent; color: var(--color-text-secondary); cursor: pointer; transition: var(--transition); display: flex; align-items: center; gap: 6px; border: none; }
.tab-btn.active { background: var(--gradient-primary); color: #fff; }
.tab-count { background: rgba(0,0,0,.1); padding: 1px 6px; border-radius: 10px; font-size: 11px; }
.search-row { margin-bottom: 20px; }
.search-box { display: flex; align-items: center; gap: 8px; background: #fff; border-radius: 50px; padding: 10px 16px; border: 1.5px solid var(--color-border); max-width: 320px; box-shadow: var(--card-shadow); }
.search-input { border: none; background: transparent; flex: 1; font-size: 14px; color: var(--color-text); }
.clubs-table { display: flex; flex-direction: column; gap: 8px; }
.table-header-row { display: flex; align-items: center; gap: 12px; padding: 10px 16px; font-size: 12px; font-weight: 600; color: var(--color-text-muted); background: rgba(255,255,255,.6); border-radius: 12px; }
.club-row { padding: 14px 16px; display: flex; align-items: center; gap: 12px; }
.check-cell { flex-shrink: 0; width: 24px; }
.club-info-cell { display: flex; align-items: center; gap: 10px; flex: 2; min-width: 0; }
.cat-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
.cat-art { background: #a855f7; }
.cat-sport { background: #0ea5e9; }
.cat-academic { background: #16a34a; }
.cat-public { background: #e11d48; }
.cat-comprehensive { background: #667eea; }
.club-text-info { flex: 1; min-width: 0; }
.club-row-name { font-size: 14px; font-weight: 700; display: block; margin-bottom: 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.club-tags-row { display: flex; flex-wrap: wrap; gap: 4px; }
.leader-cell { flex: 1; display: flex; flex-direction: column; font-size: 13px; }
.leader-name { font-weight: 600; }
.leader-phone { color: var(--color-text-muted); font-size: 12px; }
.status-cell { flex-shrink: 0; min-width: 80px; display: flex; flex-direction: column; gap: 3px; }
.time-cell { flex-shrink: 0; font-size: 12px; color: var(--color-text-muted); min-width: 80px; }
.ops-cell { flex-shrink: 0; display: flex; gap: 6px; min-width: 100px; flex-wrap: wrap; }
.reject-reason-mini { font-size: 11px; color: var(--color-text-muted); max-width: 100px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.col-club { flex: 2; }
.col-leader { flex: 1; }
.col-status { flex-shrink: 0; min-width: 80px; }
.col-time { flex-shrink: 0; min-width: 80px; }
.col-ops { flex-shrink: 0; min-width: 100px; }
@media (max-width: 768px) { .leader-cell, .time-cell { display: none; } }
</style>
