<template>
  <AppLayout>
    <div class="my-apps-page">
      <div class="page-inner">
        <div class="page-header">
          <h2 class="page-title">📋 我的报名</h2>
          <button class="btn btn-secondary btn-sm" @click="$router.push('/clubs')">继续浏览社团</button>
        </div>

        <!-- 状态分段切换 -->
        <div class="status-tabs">
          <button
            v-for="tab in tabs" :key="tab.key"
            :class="['tab-btn', { active: activeTab === tab.key }]"
            @click="activeTab = tab.key"
          >
            {{ tab.label }}
            <span v-if="counts[tab.key]" class="tab-count">{{ counts[tab.key] }}</span>
          </button>
        </div>

        <div v-if="loading" class="loading-overlay"><div class="loading-spin"></div></div>

        <div v-else-if="filteredList.length" class="apps-list">
          <div v-for="app in filteredList" :key="app.id" class="app-card card">
            <div class="app-club-info" @click="$router.push(`/clubs/${app.club_id}`)">
              <img :src="app.cover_image || defaultCover" class="club-thumb" alt="" />
              <div class="club-text">
                <div class="club-name-row">
                  <h3 class="app-club-name">{{ app.club_name }}</h3>
                  <span v-if="app.club_status==='offline'" class="tag tag-red">已下架</span>
                </div>
                <div class="app-meta">
                  <span :class="['status-badge', `status-${app.status}`]">{{ statusLabels[app.status] }}</span>
                  <span class="apply-time">{{ formatDate(app.created_at) }} 报名</span>
                </div>
              </div>
            </div>

            <div class="app-body">
              <!-- 匹配度 -->
              <div v-if="app.match_score > 0" class="match-row">
                <span :class="['match-badge', app.match_score>=80?'match-high':app.match_score>=50?'match-mid':'match-low']">
                  ⭐ {{ app.match_score }}% 匹配
                </span>
                <div class="match-tags" v-if="app.match_reasons?.length">
                  <span v-for="r in app.match_reasons" :key="r" class="tag tag-purple" style="font-size:11px">{{ r }}</span>
                </div>
              </div>

              <!-- 已通过：显示联系方式 -->
              <div v-if="app.status==='approved' && app.contact_info" class="contact-card">
                <div class="contact-title">📞 社团联系方式</div>
                <div class="contact-items">
                  <span v-if="app.contact_info.wechat">💬 {{ app.contact_info.wechat }}</span>
                  <span v-if="app.contact_info.qq">🐧 {{ app.contact_info.qq }}</span>
                  <span v-if="app.contact_info.phone">📱 {{ app.contact_info.phone }}</span>
                </div>
              </div>

              <!-- 已驳回：显示原因 -->
              <div v-if="app.status==='rejected' && app.reject_reason" class="reject-reason">
                <span class="reject-icon">ℹ️</span>
                <span>驳回原因：{{ app.reject_reason }}</span>
              </div>
            </div>

            <div class="app-footer">
              <button v-if="app.status==='pending'" class="btn btn-ghost btn-sm cancel-btn" @click="cancelApp(app)">
                取消报名
              </button>
              <button class="btn btn-secondary btn-sm" @click="$router.push(`/clubs/${app.club_id}`)">
                查看社团
              </button>
            </div>
          </div>
        </div>

        <div v-else class="empty-state">
          <div class="empty-icon">{{ emptyStates[activeTab].icon }}</div>
          <div class="empty-title">{{ emptyStates[activeTab].title }}</div>
          <div class="empty-desc">{{ emptyStates[activeTab].desc }}</div>
          <button class="btn btn-primary" @click="$router.push('/clubs')">去逛逛</button>
        </div>
      </div>
    </div>

    <!-- 取消确认弹窗 -->
    <div v-if="cancelTarget" class="modal-overlay" @click.self="cancelTarget=null">
      <div class="modal">
        <div class="modal-header">
          <h3 class="modal-title">确认取消报名？</h3>
          <button class="modal-close" @click="cancelTarget=null">×</button>
        </div>
        <p style="color:var(--color-text-secondary);font-size:14px">
          确定要取消报名 <strong>{{ cancelTarget?.club_name }}</strong> 吗？取消后可重新报名。
        </p>
        <div class="modal-footer">
          <button class="btn btn-ghost" @click="cancelTarget=null">再想想</button>
          <button class="btn btn-danger" @click="confirmCancel" :disabled="cancelling">确认取消</button>
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
const defaultCover = 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=400'
const loading = ref(true)
const applications = ref([])
const activeTab = ref('all')
const cancelTarget = ref(null)
const cancelling = ref(false)

const tabs = [
  { key: 'all', label: '全部' },
  { key: 'pending', label: '待审核' },
  { key: 'approved', label: '已通过' },
  { key: 'rejected', label: '已驳回' },
]

const statusLabels = { pending: '⏳ 待审核', approved: '✅ 已通过', rejected: '❌ 已驳回', cancelled: '已取消' }

const emptyStates = {
  all: { icon: '📋', title: '还没有报名哦', desc: '快去发现心仪的社团吧~' },
  pending: { icon: '⏳', title: '暂无待审核报名', desc: '去报名感兴趣的社团' },
  approved: { icon: '✅', title: '暂无通过的报名', desc: '再等等或者试试其他社团~' },
  rejected: { icon: '💪', title: '暂无被拒的报名', desc: '继续探索更多社团吧~' },
}

const counts = computed(() => {
  const res = {}
  tabs.forEach(t => {
    if (t.key !== 'all') res[t.key] = applications.value.filter(a => a.status === t.key).length
  })
  return res
})

const filteredList = computed(() => {
  if (activeTab.value === 'all') return applications.value
  return applications.value.filter(a => a.status === activeTab.value)
})

function formatDate(d) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
}

function cancelApp(app) { cancelTarget.value = app }

async function confirmCancel() {
  cancelling.value = true
  try {
    await request.delete(`/applications/${cancelTarget.value.id}`)
    applications.value = applications.value.filter(a => a.id !== cancelTarget.value.id)
    cancelTarget.value = null
    showToast('已取消报名', 'success')
  } catch (e) {
    showToast(e.message, 'error')
  } finally {
    cancelling.value = false
  }
}

onMounted(async () => {
  try {
    const res = await request.get('/applications/my')
    applications.value = res.data || []
  } catch {} finally { loading.value = false }
})
</script>

<style scoped>
.my-apps-page { padding: 32px 0; }
.page-inner { max-width: 860px; margin: 0 auto; padding: 0 24px; }
.page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 28px; }
.page-title { font-size: 24px; font-weight: 800; }
.status-tabs { display: flex; gap: 4px; background: rgba(255,255,255,0.7); padding: 6px; border-radius: 50px; margin-bottom: 24px; width: fit-content; box-shadow: var(--card-shadow); }
.tab-btn {
  padding: 8px 20px; border-radius: 50px; font-size: 14px; font-weight: 600;
  background: transparent; color: var(--color-text-secondary); cursor: pointer; transition: var(--transition);
  display: flex; align-items: center; gap: 6px; border: none;
}
.tab-btn:hover { color: var(--color-primary); }
.tab-btn.active { background: var(--gradient-primary); color: #fff; box-shadow: 0 2px 10px rgba(102,126,234,0.3); }
.tab-count { background: rgba(255,255,255,0.3); padding: 1px 6px; border-radius: 10px; font-size: 11px; }
.tab-btn.active .tab-count { background: rgba(255,255,255,0.3); }
.apps-list { display: flex; flex-direction: column; gap: 16px; }
.app-card { padding: 0; overflow: hidden; }
.app-club-info { display: flex; gap: 14px; padding: 18px 20px 14px; cursor: pointer; transition: background 0.15s; }
.app-club-info:hover { background: rgba(102,126,234,0.03); }
.club-thumb { width: 80px; height: 56px; object-fit: cover; border-radius: 10px; flex-shrink: 0; }
.club-text { flex: 1; display: flex; flex-direction: column; gap: 8px; justify-content: center; }
.club-name-row { display: flex; align-items: center; gap: 8px; }
.app-club-name { font-size: 16px; font-weight: 700; }
.app-meta { display: flex; align-items: center; gap: 10px; }
.apply-time { font-size: 12px; color: var(--color-text-muted); }
.app-body { padding: 0 20px 14px; display: flex; flex-direction: column; gap: 10px; }
.match-row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.match-tags { display: flex; flex-wrap: wrap; gap: 6px; }
.contact-card { background: rgba(82,196,26,0.06); border-radius: 10px; padding: 12px 16px; border: 1px solid rgba(82,196,26,0.15); }
.contact-title { font-size: 13px; font-weight: 600; color: #389e0d; margin-bottom: 8px; }
.contact-items { display: flex; flex-wrap: wrap; gap: 12px; font-size: 13px; color: var(--color-text-secondary); }
.reject-reason { background: rgba(245,34,45,0.05); border-radius: 10px; padding: 10px 14px; font-size: 13px; color: var(--color-text-secondary); display: flex; gap: 6px; }
.app-footer { padding: 12px 20px; border-top: 1px solid var(--color-border); display: flex; justify-content: flex-end; gap: 10px; }
.cancel-btn { color: var(--color-error); }
</style>
