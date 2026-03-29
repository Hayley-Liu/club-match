<template>
  <AppLayout>
    <div class="stats-page">
      <div class="page-inner">
        <div class="page-header">
          <h2 class="page-title">📊 数据统计</h2>
          <span v-if="myClub" class="club-name-tag">{{ myClub.name }}</span>
        </div>

        <div v-if="loading" class="loading-overlay" style="min-height:400px"><div class="loading-spin"></div></div>

        <template v-else-if="stats">
          <!-- 核心指标卡 -->
          <div class="metrics-grid">
            <div class="metric-card card">
              <div class="metric-icon">👁</div>
              <div class="metric-info">
                <div class="metric-num">{{ stats.view_count }}</div>
                <div class="metric-label">社团浏览量</div>
              </div>
            </div>
            <div class="metric-card card">
              <div class="metric-icon">📋</div>
              <div class="metric-info">
                <div class="metric-num">{{ stats.total_applications }}</div>
                <div class="metric-label">收到报名总数</div>
              </div>
            </div>
            <div class="metric-card card">
              <div class="metric-icon">✅</div>
              <div class="metric-info">
                <div class="metric-num success-num">{{ stats.approved_count }}</div>
                <div class="metric-label">已通过人数</div>
              </div>
            </div>
            <div class="metric-card card">
              <div class="metric-icon">📈</div>
              <div class="metric-info">
                <div class="metric-num">{{ stats.pass_rate }}%</div>
                <div class="metric-label">审核通过率</div>
              </div>
            </div>
          </div>

          <!-- 图表区 -->
          <div class="charts-row">
            <!-- 近7天趋势 -->
            <div class="card chart-card">
              <h3 class="chart-title">📅 近7天报名趋势</h3>
              <div class="trend-chart" v-if="trendData.length">
                <div class="trend-bars">
                  <div
                    v-for="item in trendData" :key="item.date"
                    class="trend-bar-wrap"
                  >
                    <div class="trend-bar" :style="{ height: `${barHeight(item.count)}%` }">
                      <span class="bar-count">{{ item.count }}</span>
                    </div>
                    <div class="trend-date">{{ item.date.slice(5) }}</div>
                  </div>
                </div>
              </div>
              <div v-else class="empty-chart">近期暂无报名数据</div>
            </div>

            <!-- 标签分布 -->
            <div class="card chart-card">
              <h3 class="chart-title">🏷 申请人标签分布</h3>
              <div class="tag-dist" v-if="Object.keys(stats.tag_distribution||{}).length">
                <div v-for="(count, tag) in topTags" :key="tag" class="tag-dist-item">
                  <div class="tag-dist-label">{{ tag }}</div>
                  <div class="tag-dist-bar-wrap">
                    <div class="tag-dist-bar" :style="{ width: `${count / maxTagCount * 100}%` }"></div>
                  </div>
                  <div class="tag-dist-count">{{ count }}</div>
                </div>
              </div>
              <div v-else class="empty-chart">暂无标签数据</div>
            </div>
          </div>

          <!-- 招新状态 -->
          <div class="card recruit-status-card">
            <h3 class="chart-title">招新状态概览</h3>
            <div class="status-overview">
              <div class="status-segment pending" :style="{ flex: stats.pending_count }">
                <span>待审核 {{ stats.pending_count }}</span>
              </div>
              <div class="status-segment approved" :style="{ flex: stats.approved_count }">
                <span>已通过 {{ stats.approved_count }}</span>
              </div>
              <div class="status-segment rejected" :style="{ flex: stats.total_applications - stats.approved_count - stats.pending_count }">
              </div>
            </div>
            <div class="status-legend">
              <div class="legend-item"><div class="legend-dot pending-dot"></div> 待审核</div>
              <div class="legend-item"><div class="legend-dot approved-dot"></div> 已通过</div>
              <div class="legend-item"><div class="legend-dot other-dot"></div> 已驳回/其他</div>
            </div>
          </div>
        </template>

        <div v-else class="empty-state">
          <div class="empty-icon">📊</div>
          <div class="empty-title">暂无数据</div>
          <div class="empty-desc">社团审核通过并开启招新后才会有数据</div>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import AppLayout from '@/components/AppLayout.vue'
import request from '@/utils/request'

const myClub = ref(null)
const stats = ref(null)
const loading = ref(true)
const trendData = ref([])

const topTags = computed(() => {
  if (!stats.value?.tag_distribution) return {}
  const sorted = Object.entries(stats.value.tag_distribution).sort((a,b)=>b[1]-a[1]).slice(0,8)
  return Object.fromEntries(sorted)
})
const maxTagCount = computed(() => Math.max(...Object.values(topTags.value), 1))
const maxTrend = computed(() => Math.max(...trendData.value.map(d => d.count), 1))
function barHeight(count) { return Math.max(8, Math.round(count / maxTrend.value * 100)) }

onMounted(async () => {
  try {
    const r = await request.get('/clubs/my/club')
    myClub.value = r.data
    if (myClub.value) {
      const s = await request.get(`/clubs/${myClub.value.id}/stats`)
      stats.value = s.data
      trendData.value = s.data.trend || []
    }
  } catch {} finally { loading.value = false }
})
</script>

<style scoped>
.stats-page { padding: 32px 0; }
.page-inner { max-width: 1100px; margin: 0 auto; padding: 0 24px; }
.page-header { display: flex; align-items: center; gap: 16px; margin-bottom: 32px; }
.page-title { font-size: 24px; font-weight: 800; }
.club-name-tag { padding: 4px 14px; background: rgba(102,126,234,.1); color: var(--color-primary); border-radius: 20px; font-size: 13px; font-weight: 600; }
.metrics-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 16px; margin-bottom: 24px; }
.metric-card { padding: 24px; display: flex; align-items: center; gap: 16px; }
.metric-icon { font-size: 36px; }
.metric-num { font-size: 32px; font-weight: 900; background: var(--gradient-primary); -webkit-background-clip: text; -webkit-text-fill-color: transparent; line-height: 1; }
.metric-num.success-num { background: linear-gradient(135deg,#52c41a,#73d13d); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
.metric-label { font-size: 13px; color: var(--color-text-muted); margin-top: 4px; }
.charts-row { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
.chart-card { padding: 24px; }
.chart-title { font-size: 15px; font-weight: 700; margin-bottom: 20px; }
.trend-chart { height: 160px; display: flex; align-items: flex-end; }
.trend-bars { display: flex; align-items: flex-end; gap: 8px; width: 100%; height: 100%; }
.trend-bar-wrap { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 4px; height: 100%; justify-content: flex-end; }
.trend-bar { width: 100%; background: var(--gradient-primary); border-radius: 6px 6px 0 0; min-height: 8px; position: relative; display: flex; align-items: flex-start; justify-content: center; transition: height 0.5s ease; }
.bar-count { position: absolute; top: -18px; font-size: 11px; font-weight: 600; color: var(--color-primary); }
.trend-date { font-size: 11px; color: var(--color-text-muted); }
.empty-chart { display: flex; align-items: center; justify-content: center; height: 120px; color: var(--color-text-muted); font-size: 13px; }
.tag-dist { display: flex; flex-direction: column; gap: 12px; }
.tag-dist-item { display: flex; align-items: center; gap: 10px; }
.tag-dist-label { width: 60px; font-size: 12px; color: var(--color-text-secondary); flex-shrink: 0; text-align: right; }
.tag-dist-bar-wrap { flex: 1; height: 16px; background: rgba(102,126,234,.1); border-radius: 8px; overflow: hidden; }
.tag-dist-bar { height: 100%; background: var(--gradient-primary); border-radius: 8px; transition: width 0.6s ease; }
.tag-dist-count { width: 28px; font-size: 12px; font-weight: 600; color: var(--color-primary); text-align: right; }
.recruit-status-card { padding: 24px; }
.status-overview { display: flex; border-radius: 10px; overflow: hidden; height: 32px; margin-bottom: 12px; gap: 2px; }
.status-segment { display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 600; color: #fff; min-width: 0; transition: flex 0.5s; }
.status-segment.pending { background: var(--color-warning); }
.status-segment.approved { background: var(--color-success); }
.status-segment.rejected { background: rgba(153,153,153,.5); }
.status-legend { display: flex; gap: 20px; }
.legend-item { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--color-text-secondary); }
.legend-dot { width: 10px; height: 10px; border-radius: 50%; }
.pending-dot { background: var(--color-warning); }
.approved-dot { background: var(--color-success); }
.other-dot { background: rgba(153,153,153,.5); }
@media (max-width: 768px) { .metrics-grid { grid-template-columns: repeat(2,1fr); } .charts-row { grid-template-columns: 1fr; } }
</style>
