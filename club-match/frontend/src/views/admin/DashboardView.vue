<template>
  <AppLayout>
    <div class="admin-dashboard">
      <div class="dash-inner">
        <div class="dash-header">
          <h2 class="dash-title">📊 数据看板</h2>
          <span class="dash-time">{{ currentTime }}</span>
        </div>

        <div v-if="loading" class="loading-overlay" style="min-height:400px"><div class="loading-spin"></div></div>

        <template v-else>
          <!-- 核心指标 -->
          <div class="metrics-grid">
            <div class="metric-card card" v-for="m in metrics" :key="m.label">
              <div class="metric-top">
                <span class="metric-icon">{{ m.icon }}</span>
                <span :class="['metric-badge', m.badgeClass]">{{ m.badge }}</span>
              </div>
              <div class="metric-num">{{ data[m.key] ?? 0 }}</div>
              <div class="metric-label">{{ m.label }}</div>
            </div>
          </div>

          <!-- 告警横幅 -->
          <div v-if="data.pending_clubs > 0 || data.pending_applications > 0" class="alert-row">
            <div v-if="data.pending_clubs > 0" class="alert-card card" @click="$router.push('/admin/clubs?status=pending')">
              <span class="alert-icon">⚠️</span>
              <span>有 <strong>{{ data.pending_clubs }}</strong> 个社团待审核</span>
              <span class="alert-action">立即处理 →</span>
            </div>
            <div v-if="data.pending_applications > 0" class="alert-card card">
              <span class="alert-icon">📋</span>
              <span>全平台有 <strong>{{ data.pending_applications }}</strong> 份报名待审核</span>
            </div>
          </div>

          <!-- 图表区 -->
          <div class="charts-row">
            <!-- 近7天报名趋势 -->
            <div class="card chart-card trend-card">
              <h3 class="chart-title">📅 近7天报名趋势</h3>
              <div class="trend-chart" v-if="weeklyTrend.length">
                <div class="trend-bars">
                  <div v-for="item in weeklyTrend" :key="item.date" class="trend-bar-wrap">
                    <div class="trend-bar" :style="{ height: `${barH(item.count)}%` }">
                      <span class="bar-count">{{ item.count }}</span>
                    </div>
                    <div class="trend-date">{{ item.date.slice(5) }}</div>
                  </div>
                </div>
              </div>
              <div v-else class="empty-chart">暂无近期报名数据</div>
            </div>

            <!-- 社团分类分布 -->
            <div class="card chart-card pie-card">
              <h3 class="chart-title">🗂 社团分类分布</h3>
              <div class="cat-dist">
                <div v-for="cat in categoryDist" :key="cat.category" class="cat-dist-item">
                  <div class="cat-dist-label">
                    <span>{{ catEmoji(cat.category) }} {{ catName(cat.category) }}</span>
                    <span class="cat-count">{{ cat.count }}</span>
                  </div>
                  <div class="cat-dist-bar-wrap">
                    <div class="cat-dist-bar" :style="{ width: `${cat.count / maxCatCount * 100}%`, background: catColor(cat.category) }"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 热门社团 TOP10 -->
          <div class="card top-clubs-card">
            <h3 class="chart-title">🏆 热门社团 TOP10</h3>
            <div class="top-clubs-list">
              <div v-for="(club, index) in topClubs" :key="club.id" class="top-club-item" @click="$router.push(`/clubs/${club.id}`)">
                <div :class="['rank-badge', index < 3 ? `rank-${index+1}` : 'rank-other']">{{ index + 1 }}</div>
                <div class="top-club-info">
                  <span class="top-club-name">{{ club.name }}</span>
                  <span class="top-club-cat">{{ catEmoji(club.category) }} {{ catName(club.category) }}</span>
                </div>
                <div class="top-club-stats">
                  <span class="top-app-count">{{ club.app_count }} 报名</span>
                  <div class="progress-bar" style="width:120px">
                    <div class="progress-bar-fill" :style="{ width: `${club.app_count / maxAppCount * 100}%` }"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </template>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import AppLayout from '@/components/AppLayout.vue'
import request from '@/utils/request'

const router = useRouter()
const loading = ref(true)
const data = ref({})
const currentTime = ref(new Date().toLocaleString('zh-CN'))

setInterval(() => { currentTime.value = new Date().toLocaleString('zh-CN') }, 1000)

const metrics = [
  { key: 'today_assessments', label: '今日测评完成', icon: '🎯', badge: '今日', badgeClass: 'badge-blue' },
  { key: 'today_applications', label: '今日报名数', icon: '📝', badge: '今日', badgeClass: 'badge-green' },
  { key: 'active_clubs', label: '正在招新社团', icon: '🔥', badge: '招新中', badgeClass: 'badge-orange' },
  { key: 'total_clubs', label: '入驻社团总数', icon: '🏠', badge: '总计', badgeClass: 'badge-purple' },
  { key: 'pending_clubs', label: '待审核社团', icon: '⏳', badge: '待处理', badgeClass: 'badge-warn' },
  { key: 'pending_applications', label: '全平台待审报名', icon: '📋', badge: '待处理', badgeClass: 'badge-warn' },
  { key: 'total_students', label: '注册学生数', icon: '🎓', badge: '总计', badgeClass: 'badge-blue' },
  { key: 'total_leaders', label: '社长账号数', icon: '🏆', badge: '总计', badgeClass: 'badge-purple' },
]

const weeklyTrend = computed(() => data.value.weekly_trend || [])
const topClubs = computed(() => data.value.top_clubs || [])
const categoryDist = computed(() => data.value.category_distribution || [])
const maxCatCount = computed(() => Math.max(...categoryDist.value.map(c => c.count), 1))
const maxAppCount = computed(() => Math.max(...topClubs.value.map(c => c.app_count), 1))
const maxTrend = computed(() => Math.max(...weeklyTrend.value.map(d => d.count), 1))
function barH(count) { return Math.max(8, Math.round(count / maxTrend.value * 100)) }

const catMap = { art: ['文艺', '🎨', '#a855f7'], sport: ['体育', '⚽', '#0ea5e9'], academic: ['学术', '🔬', '#16a34a'], public: ['公益', '💚', '#e11d48'], comprehensive: ['综合', '⭐', '#667eea'] }
const catName = k => catMap[k]?.[0] || k
const catEmoji = k => catMap[k]?.[1] || '🏷'
const catColor = k => catMap[k]?.[2] || '#667eea'

onMounted(async () => {
  try {
    const res = await request.get('/admin/dashboard')
    data.value = res.data
  } catch {} finally { loading.value = false }
})
</script>

<style scoped>
.admin-dashboard { padding: 32px 0; }
.dash-inner { max-width: 1280px; margin: 0 auto; padding: 0 24px; }
.dash-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 28px; }
.dash-title { font-size: 24px; font-weight: 800; }
.dash-time { font-size: 13px; color: var(--color-text-muted); }
.metrics-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 16px; margin-bottom: 20px; }
.metric-card { padding: 20px 22px; }
.metric-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.metric-icon { font-size: 28px; }
.metric-badge { padding: 3px 8px; border-radius: 20px; font-size: 11px; font-weight: 600; }
.badge-blue { background: rgba(24,144,255,.1); color: #096dd9; }
.badge-green { background: rgba(82,196,26,.12); color: #389e0d; }
.badge-orange { background: rgba(250,173,20,.15); color: #d48806; }
.badge-purple { background: rgba(102,126,234,.1); color: var(--color-primary); }
.badge-warn { background: rgba(245,34,45,.08); color: #cf1322; }
.metric-num { font-size: 36px; font-weight: 900; background: var(--gradient-primary); -webkit-background-clip: text; -webkit-text-fill-color: transparent; line-height: 1; margin-bottom: 6px; }
.metric-label { font-size: 12px; color: var(--color-text-muted); }
.alert-row { display: flex; gap: 12px; margin-bottom: 20px; flex-wrap: wrap; }
.alert-card { padding: 14px 20px; display: flex; align-items: center; gap: 10px; cursor: pointer; background: rgba(250,173,20,.06); border: 1.5px solid rgba(250,173,20,.2); flex: 1; min-width: 200px; }
.alert-icon { font-size: 20px; }
.alert-action { margin-left: auto; color: var(--color-primary); font-size: 13px; font-weight: 600; }
.charts-row { display: grid; grid-template-columns: 3fr 2fr; gap: 20px; margin-bottom: 20px; }
.chart-card { padding: 24px; }
.chart-title { font-size: 15px; font-weight: 700; margin-bottom: 20px; }
.trend-chart { height: 160px; }
.trend-bars { display: flex; align-items: flex-end; gap: 8px; height: 100%; }
.trend-bar-wrap { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 4px; height: 100%; justify-content: flex-end; }
.trend-bar { width: 100%; background: var(--gradient-primary); border-radius: 6px 6px 0 0; min-height: 8px; position: relative; display: flex; align-items: flex-start; justify-content: center; }
.bar-count { position: absolute; top: -18px; font-size: 11px; font-weight: 600; color: var(--color-primary); }
.trend-date { font-size: 11px; color: var(--color-text-muted); }
.empty-chart { display: flex; align-items: center; justify-content: center; height: 120px; color: var(--color-text-muted); font-size: 13px; }
.cat-dist { display: flex; flex-direction: column; gap: 14px; }
.cat-dist-item { display: flex; flex-direction: column; gap: 6px; }
.cat-dist-label { display: flex; justify-content: space-between; font-size: 13px; }
.cat-count { font-weight: 700; }
.cat-dist-bar-wrap { height: 10px; background: rgba(0,0,0,.06); border-radius: 5px; overflow: hidden; }
.cat-dist-bar { height: 100%; border-radius: 5px; transition: width .5s; }
.top-clubs-card { padding: 24px; }
.top-clubs-list { display: flex; flex-direction: column; gap: 2px; }
.top-club-item { display: flex; align-items: center; gap: 14px; padding: 12px 0; border-bottom: 1px solid var(--color-border); cursor: pointer; transition: background .15s; border-radius: 8px; }
.top-club-item:hover { background: rgba(102,126,234,.03); padding-left: 8px; }
.top-club-item:last-child { border-bottom: none; }
.rank-badge { width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 800; flex-shrink: 0; }
.rank-1 { background: linear-gradient(135deg,#ffd700,#ffb300); color: #7d4e00; }
.rank-2 { background: linear-gradient(135deg,#c0c0c0,#a8a8a8); color: #3d3d3d; }
.rank-3 { background: linear-gradient(135deg,#cd7f32,#a0522d); color: #fff; }
.rank-other { background: rgba(102,126,234,.08); color: var(--color-text-muted); }
.top-club-info { flex: 1; display: flex; flex-direction: column; gap: 2px; }
.top-club-name { font-size: 14px; font-weight: 600; }
.top-club-cat { font-size: 12px; color: var(--color-text-muted); }
.top-club-stats { display: flex; flex-direction: column; align-items: flex-end; gap: 6px; }
.top-app-count { font-size: 12px; font-weight: 600; color: var(--color-primary); }
@media (max-width: 1024px) { .metrics-grid { grid-template-columns: repeat(2,1fr); } .charts-row { grid-template-columns: 1fr; } }
@media (max-width: 640px) { .metrics-grid { grid-template-columns: repeat(2,1fr); } }
</style>
