<template>
  <AppLayout>
    <div class="leader-manage-page">
      <div class="manage-inner">
        <!-- 未有社团 -->
        <div v-if="!myClub && !loading" class="no-club-card card">
          <div class="no-club-content">
            <span class="no-club-icon">🏠</span>
            <h3>还没有社团</h3>
            <p>提交入驻申请，开始数字化招新</p>
            <button class="btn btn-primary" @click="$router.push('/leader/apply')">申请入驻</button>
          </div>
        </div>

        <template v-else-if="myClub">
          <!-- 社团头部 -->
          <div class="club-header-card card">
            <div class="club-header-content">
              <img :src="myClub.cover_image || defaultCover" class="club-cover-thumb" alt="" />
              <div class="club-header-info">
                <div class="club-title-row">
                  <h2 class="club-title">{{ myClub.name }}</h2>
                  <span :class="['status-badge', `status-${myClub.status}`]">{{ statusLabels[myClub.status] }}</span>
                </div>
                <p class="club-desc-preview">{{ myClub.description }}</p>
                <div class="club-tags">
                  <span v-for="t in myClub.tags" :key="t" class="tag tag-purple">{{ t }}</span>
                </div>
              </div>
              <div class="club-header-actions">
                <button
                  v-if="myClub.status === 'active'"
                  :class="['btn', myClub.is_recruiting ? 'btn-warning' : 'btn-success']"
                  @click="toggleRecruit"
                >
                  {{ myClub.is_recruiting ? '⏸ 暂停招新' : '🚀 开启招新' }}
                </button>
                <button class="btn btn-secondary btn-sm" @click="$router.push('/leader/apply')">编辑信息</button>
              </div>
            </div>
            <!-- 招新进度 -->
            <div class="recruit-progress-row">
              <div class="recruit-stats">
                <span>已报名 <strong>{{ myClub.current_count }}</strong> / {{ myClub.max_members }} 人</span>
                <span v-if="myClub.recruit_end_at" class="deadline">截止：{{ formatDate(myClub.recruit_end_at) }}</span>
              </div>
              <div class="progress-bar" style="flex:1;max-width:300px">
                <div class="progress-bar-fill" :style="{width: `${Math.min(100, myClub.current_count/myClub.max_members*100)}%`}"></div>
              </div>
            </div>
          </div>

          <!-- 快捷导航 -->
          <div class="quick-nav-row">
            <div class="quick-nav-item card" @click="$router.push('/leader/applications')">
              <div class="qn-num">{{ pendingCount }}</div>
              <div class="qn-label">待审核报名</div>
              <div class="qn-arrow">→</div>
            </div>
            <div class="quick-nav-item card" @click="$router.push('/leader/applications?status=approved')">
              <div class="qn-num approved">{{ approvedCount }}</div>
              <div class="qn-label">已通过</div>
              <div class="qn-arrow">→</div>
            </div>
            <div class="quick-nav-item card" @click="$router.push('/leader/stats')">
              <div class="qn-num">{{ myClub.view_count || 0 }}</div>
              <div class="qn-label">社团浏览量</div>
              <div class="qn-arrow">→</div>
            </div>
          </div>

          <!-- 最新报名 -->
          <div class="card recent-apps-card">
            <div class="section-header-row">
              <h3 class="section-title-sm">最新报名</h3>
              <button class="btn btn-secondary btn-sm" @click="$router.push('/leader/applications')">查看全部</button>
            </div>
            <div v-if="recentApps.length" class="apps-mini-list">
              <div v-for="app in recentApps" :key="app.id" class="app-mini-item">
                <div class="app-mini-avatar">{{ (app.name || '?').charAt(0) }}</div>
                <div class="app-mini-info">
                  <span class="app-mini-name">{{ app.name }}</span>
                  <span class="app-mini-major">{{ app.major || '未填写专业' }}</span>
                </div>
                <span :class="['match-badge', app.match_score>=80?'match-high':app.match_score>=50?'match-mid':'match-low']" style="font-size:12px">
                  {{ app.match_score }}%
                </span>
                <span :class="['status-badge', `status-${app.status}`]" style="font-size:11px">{{ statusLabels2[app.status] }}</span>
                <div class="app-mini-actions" v-if="app.status==='pending'">
                  <button class="btn btn-success btn-sm" @click="reviewApp(app,'approve')">通过</button>
                  <button class="btn btn-ghost btn-sm" style="color:var(--color-error)" @click="openReject(app)">驳回</button>
                </div>
              </div>
            </div>
            <div v-else class="empty-mini">暂无报名记录</div>
          </div>
        </template>

        <div v-else class="loading-overlay" style="min-height:300px"><div class="loading-spin"></div></div>
      </div>
    </div>

    <!-- 驳回理由弹窗 -->
    <div v-if="rejectTarget" class="modal-overlay" @click.self="rejectTarget=null">
      <div class="modal">
        <div class="modal-header">
          <h3 class="modal-title">驳回报名</h3>
          <button class="modal-close" @click="rejectTarget=null">×</button>
        </div>
        <p style="margin-bottom:12px;font-size:14px;color:var(--color-text-secondary)">请填写驳回原因，将通知给申请人。</p>
        <div class="form-group">
          <textarea v-model="rejectReason" class="form-input form-textarea" placeholder="如：暂时名额已满，欢迎下学期再来..." rows="3"></textarea>
        </div>
        <div class="modal-footer">
          <button class="btn btn-ghost" @click="rejectTarget=null">取消</button>
          <button class="btn btn-danger" @click="confirmReject">确认驳回</button>
        </div>
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
const defaultCover = 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800'

const myClub = ref(null)
const loading = ref(true)
const recentApps = ref([])
const pendingCount = ref(0)
const approvedCount = ref(0)
const rejectTarget = ref(null)
const rejectReason = ref('')

const statusLabels = { pending: '审核中', active: '正常运营', rejected: '已驳回', offline: '已下架', suspended: '已暂停' }
const statusLabels2 = { pending: '待审核', approved: '已通过', rejected: '已驳回', cancelled: '已取消' }

function formatDate(d) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('zh-CN')
}

async function toggleRecruit() {
  try {
    const newState = !myClub.value.is_recruiting
    await request.put(`/clubs/${myClub.value.id}/recruit`, {
      is_recruiting: newState,
      recruit_end_at: myClub.value.recruit_end_at
    })
    myClub.value.is_recruiting = newState ? 1 : 0
    showToast(newState ? '已开启招新' : '已暂停招新', 'success')
  } catch (e) { showToast(e.message, 'error') }
}

function openReject(app) {
  rejectTarget.value = app
  rejectReason.value = ''
}

async function reviewApp(app, action, reason = '') {
  try {
    await request.put(`/applications/${app.id}/review`, { action, reject_reason: reason })
    app.status = action === 'approve' ? 'approved' : 'rejected'
    if (action === 'approve') { approvedCount.value++; pendingCount.value-- }
    else pendingCount.value--
    showToast(action === 'approve' ? '已通过' : '已驳回', 'success')
  } catch (e) { showToast(e.message, 'error') }
}

async function confirmReject() {
  if (!rejectReason.value.trim()) { showToast('请填写驳回原因', 'warning'); return }
  await reviewApp(rejectTarget.value, 'reject', rejectReason.value)
  rejectTarget.value = null
}

onMounted(async () => {
  try {
    const r = await request.get('/clubs/my/club')
    myClub.value = r.data
    if (myClub.value) {
      const apps = await request.get(`/applications/club/${myClub.value.id}`, { params: { sort: 'time' } })
      recentApps.value = (apps.data || []).slice(0, 5)
      pendingCount.value = (apps.data || []).filter(a => a.status === 'pending').length
      approvedCount.value = (apps.data || []).filter(a => a.status === 'approved').length
    }
  } catch {} finally { loading.value = false }
})
</script>

<style scoped>
.leader-manage-page { padding: 32px 0; }
.manage-inner { max-width: 960px; margin: 0 auto; padding: 0 24px; display: flex; flex-direction: column; gap: 20px; }
.no-club-card { padding: 60px; text-align: center; }
.no-club-content { display: flex; flex-direction: column; align-items: center; gap: 12px; }
.no-club-icon { font-size: 52px; }
.club-header-card { padding: 28px; }
.club-header-content { display: flex; gap: 20px; align-items: flex-start; margin-bottom: 20px; }
.club-cover-thumb { width: 100px; height: 70px; object-fit: cover; border-radius: 12px; flex-shrink: 0; }
.club-header-info { flex: 1; }
.club-title-row { display: flex; align-items: center; gap: 12px; margin-bottom: 8px; }
.club-title { font-size: 20px; font-weight: 800; }
.club-desc-preview { font-size: 13px; color: var(--color-text-secondary); margin-bottom: 10px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.club-tags { display: flex; flex-wrap: wrap; gap: 6px; }
.club-header-actions { display: flex; flex-direction: column; gap: 8px; flex-shrink: 0; }
.btn-warning { background: linear-gradient(135deg,#faad14,#ffc53d); color: #7d4e00; }
.recruit-progress-row { display: flex; align-items: center; gap: 16px; }
.recruit-stats { display: flex; gap: 16px; align-items: center; font-size: 13px; color: var(--color-text-secondary); min-width: 180px; }
.deadline { color: var(--color-text-muted); font-size: 12px; }
.quick-nav-row { display: grid; grid-template-columns: repeat(3,1fr); gap: 16px; }
.quick-nav-item { padding: 20px 24px; cursor: pointer; transition: var(--transition); display: flex; align-items: center; gap: 12px; }
.quick-nav-item:hover { box-shadow: var(--card-shadow-hover); transform: translateY(-2px); }
.qn-num { font-size: 28px; font-weight: 900; background: var(--gradient-primary); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
.qn-num.approved { background: linear-gradient(135deg,#52c41a,#73d13d); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
.qn-label { flex: 1; font-size: 13px; color: var(--color-text-secondary); }
.qn-arrow { color: var(--color-text-muted); }
.recent-apps-card { padding: 24px; }
.section-header-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.section-title-sm { font-size: 16px; font-weight: 700; }
.apps-mini-list { display: flex; flex-direction: column; }
.app-mini-item { display: flex; align-items: center; gap: 12px; padding: 12px 0; border-bottom: 1px solid var(--color-border); }
.app-mini-item:last-child { border-bottom: none; }
.app-mini-avatar { width: 36px; height: 36px; border-radius: 50%; background: var(--gradient-primary); display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 700; font-size: 14px; flex-shrink: 0; }
.app-mini-info { flex: 1; min-width: 0; }
.app-mini-name { display: block; font-size: 14px; font-weight: 600; }
.app-mini-major { font-size: 12px; color: var(--color-text-muted); }
.app-mini-actions { display: flex; gap: 6px; }
.empty-mini { text-align: center; padding: 24px; color: var(--color-text-muted); font-size: 13px; }
@media (max-width:768px) { .quick-nav-row { grid-template-columns: 1fr 1fr; } .club-header-content { flex-direction: column; } }
</style>
