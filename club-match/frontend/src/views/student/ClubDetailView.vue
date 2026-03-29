<template>
  <AppLayout>
    <div class="club-detail-page" v-if="club">
      <!-- 封面区 -->
      <div class="detail-hero" :style="{ backgroundImage: `url(${club.cover_image || defaultCover})` }">
        <div class="hero-overlay"></div>
        <div class="hero-inner">
          <button class="btn btn-ghost back-btn" @click="$router.go(-1)">← 返回</button>
          <div class="hero-info">
            <span :class="['cat-badge', `cat-${club.category}`]">{{ catName }}</span>
            <h1 class="hero-club-name">{{ club.name }}</h1>
            <div class="hero-meta">
              <span>负责人：{{ club.leader_name }}</span>
              <span class="dot-sep">·</span>
              <span>已报名 {{ club.current_count }}/{{ club.max_members }} 人</span>
            </div>
          </div>
          <div class="hero-actions">
            <span v-if="club.match_score > 0" :class="['match-badge', matchClass]">⭐ {{ club.match_score }}% 匹配</span>
            <button class="favorite-btn" @click="toggleFavorite" :title="club.is_favorite ? '取消收藏' : '收藏'">
              {{ club.is_favorite ? '❤️' : '🤍' }}
            </button>
          </div>
        </div>
      </div>

      <div class="detail-body">
        <!-- 左侧主内容 -->
        <div class="detail-main">
          <!-- 社团简介 -->
          <div class="card detail-card">
            <h3 class="card-title">社团简介</h3>
            <p class="club-desc-text">{{ club.description }}</p>
          </div>

          <!-- 活动照片 -->
          <div class="card detail-card" v-if="club.photos?.length">
            <h3 class="card-title">活动照片</h3>
            <div class="photos-grid">
              <img v-for="(p, i) in club.photos" :key="i" :src="p" :alt="`活动照片${i+1}`" class="photo-item" @click="lightbox(p)" />
            </div>
          </div>

          <!-- 标签 -->
          <div class="card detail-card" v-if="club.tags?.length">
            <h3 class="card-title">招新标签</h3>
            <div class="tags-wrap">
              <span v-for="t in club.tags" :key="t" class="tag tag-purple">{{ t }}</span>
            </div>
          </div>

          <!-- 匹配理由 -->
          <div class="card detail-card match-card" v-if="club.match_score > 0">
            <h3 class="card-title">🎯 为什么推荐给你</h3>
            <div class="match-reasons-list">
              <div v-if="club.match_reasons?.length" class="reason-row">
                <span class="reason-icon">✨</span>
                <span>契合你的：{{ club.match_reasons.join(' + ') }}</span>
              </div>
              <div class="match-score-bar">
                <span class="match-score-num">{{ club.match_score }}%</span>
                <div class="progress-bar" style="flex:1">
                  <div class="progress-bar-fill" :style="{width: `${club.match_score}%`}"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 右侧信息卡 -->
        <div class="detail-sidebar">
          <!-- 报名状态 -->
          <div class="card sidebar-card recruit-card">
            <div class="recruit-status">
              <span v-if="!club.is_recruiting" class="status-badge status-offline">招新已结束</span>
              <span v-else-if="isFull" class="status-badge status-offline">名额已满</span>
              <span v-else class="status-badge status-recruiting">🔥 正在招新</span>
            </div>
            <div class="recruit-progress">
              <div class="progress-bar">
                <div class="progress-bar-fill" :style="{width: progressWidth}"></div>
              </div>
              <div class="progress-text">{{ club.current_count }}/{{ club.max_members }} 人</div>
            </div>
            <div v-if="club.recruit_end_at" class="deadline">
              截止时间：{{ formatDate(club.recruit_end_at) }}
            </div>

            <template v-if="canApply">
              <button v-if="!appliedStatus" class="btn btn-primary btn-block btn-lg apply-btn" @click="goApply">
                🎉 立即报名
              </button>
              <div v-else class="applied-status">
                <span :class="['status-badge', `status-${appliedStatus}`]">
                  {{ appliedLabels[appliedStatus] }}
                </span>
                <button class="btn btn-ghost btn-sm" @click="$router.push('/my-applications')">查看详情</button>
              </div>
            </template>
            <button v-else-if="!authStore.isLoggedIn" class="btn btn-primary btn-block" @click="$router.push(`/login?redirect=/clubs/${club.id}`)">
              登录后报名
            </button>
            <div v-else-if="isFull" class="full-tips">名额已满，建议关注其他相似社团</div>
          </div>

          <!-- 联系方式（已通过才显示）-->
          <div v-if="appliedStatus === 'approved'" class="card sidebar-card">
            <h4 class="sidebar-card-title">📞 联系方式</h4>
            <div class="contact-list">
              <div v-if="club.contact_info?.wechat" class="contact-item"><span>💬</span> 微信：{{ club.contact_info.wechat }}</div>
              <div v-if="club.contact_info?.qq" class="contact-item"><span>🐧</span> QQ：{{ club.contact_info.qq }}</div>
              <div v-if="club.contact_info?.phone" class="contact-item"><span>📱</span> 电话：{{ club.contact_info.phone }}</div>
            </div>
          </div>

          <!-- 社团基本信息 -->
          <div class="card sidebar-card">
            <h4 class="sidebar-card-title">📋 基本信息</h4>
            <div class="info-list">
              <div class="info-item"><span class="info-label">负责人</span><span>{{ club.leader_name }}</span></div>
              <div class="info-item"><span class="info-label">类型</span><span>{{ catName }}</span></div>
              <div class="info-item"><span class="info-label">浏览量</span><span>👁 {{ club.view_count }}</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="loading" class="loading-overlay" style="min-height:50vh"><div class="loading-spin"></div></div>

    <div v-else class="empty-state" style="min-height:50vh">
      <div class="empty-icon">😕</div>
      <div class="empty-title">社团不存在或已下架</div>
      <button class="btn btn-primary" @click="$router.push('/clubs')">返回社团列表</button>
    </div>

    <!-- 图片灯箱 -->
    <div v-if="lightboxImg" class="lightbox" @click="lightboxImg=null">
      <img :src="lightboxImg" class="lightbox-img" />
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import AppLayout from '@/components/AppLayout.vue'
import request from '@/utils/request'
import { inject } from 'vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const showToast = inject('showToast')

const club = ref(null)
const loading = ref(true)
const appliedStatus = ref(null)
const lightboxImg = ref(null)
const defaultCover = 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1200'

const catMap = { art:'文艺', sport:'体育', academic:'学术', public:'公益', comprehensive:'综合' }
const catName = computed(() => catMap[club.value?.category] || '其他')
const matchClass = computed(() => {
  const s = club.value?.match_score
  if (s >= 80) return 'match-high'
  if (s >= 50) return 'match-mid'
  return 'match-low'
})
const isFull = computed(() => club.value?.current_count >= club.value?.max_members)
const progressWidth = computed(() => {
  if (!club.value) return '0%'
  return `${Math.min(100, Math.round(club.value.current_count / club.value.max_members * 100))}%`
})
const canApply = computed(() => authStore.isLoggedIn && authStore.isStudent && club.value?.is_recruiting && !isFull.value && club.value?.status === 'active')

const appliedLabels = { pending: '⏳ 待审核', approved: '✅ 已通过', rejected: '❌ 已驳回', cancelled: '已取消' }

function formatDate(d) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('zh-CN', { year:'numeric', month:'2-digit', day:'2-digit' })
}

async function toggleFavorite() {
  if (!authStore.isLoggedIn) { router.push('/login'); return }
  try {
    const res = await request.post(`/clubs/${club.value.id}/favorite`)
    club.value.is_favorite = res.data.is_favorite
    showToast(res.message || '操作成功', 'success')
  } catch (e) { showToast(e.message, 'error') }
}

function goApply() { router.push(`/apply/${club.value.id}`) }
function lightbox(src) { lightboxImg.value = src }

onMounted(async () => {
  try {
    const res = await request.get(`/clubs/${route.params.id}`)
    club.value = res.data
  } catch {} finally { loading.value = false }

  if (authStore.isLoggedIn && authStore.isStudent) {
    try {
      const res = await request.get('/applications/my')
      const found = res.data?.find(a => a.club_id === parseInt(route.params.id))
      if (found) appliedStatus.value = found.status
    } catch {}
  }
})
</script>

<style scoped>
.club-detail-page { max-width: 1280px; margin: 0 auto; }
.detail-hero {
  height: 360px; background-size: cover; background-position: center;
  position: relative; display: flex; align-items: flex-end;
}
.hero-overlay { position: absolute; inset: 0; background: linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.65) 100%); }
.hero-inner { position: relative; z-index: 1; width: 100%; padding: 24px; display: flex; align-items: flex-end; justify-content: space-between; }
.back-btn { position: absolute; top: -300px; left: 0; color: #fff; }
.hero-info { flex: 1; }
.cat-badge { font-size: 12px; font-weight: 600; padding: 4px 10px; border-radius: 6px; margin-bottom: 10px; display: inline-block; }
.cat-art { background: rgba(240,147,251,.25); color: #f093fb; }
.cat-sport { background: rgba(79,172,254,.25); color: #4facfe; }
.cat-academic { background: rgba(67,233,123,.25); color: #43e97b; }
.cat-public { background: rgba(250,112,154,.25); color: #fa709a; }
.cat-comprehensive { background: rgba(255,255,255,.2); color: #fff; }
.hero-club-name { font-size: 32px; font-weight: 900; color: #fff; margin-bottom: 10px; text-shadow: 0 2px 8px rgba(0,0,0,0.3); }
.hero-meta { color: rgba(255,255,255,0.85); font-size: 14px; display: flex; gap: 8px; }
.dot-sep { opacity: 0.5; }
.hero-actions { display: flex; align-items: center; gap: 12px; flex-shrink: 0; }
.favorite-btn { font-size: 28px; background: none; border: none; cursor: pointer; transition: transform 0.2s; }
.favorite-btn:hover { transform: scale(1.2); }
.detail-body { display: grid; grid-template-columns: 1fr 340px; gap: 24px; padding: 32px 24px; }
.detail-card { padding: 28px; margin-bottom: 20px; }
.card-title { font-size: 16px; font-weight: 700; margin-bottom: 16px; }
.club-desc-text { font-size: 15px; color: var(--color-text-secondary); line-height: 1.8; }
.photos-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 10px; }
.photo-item { width: 100%; height: 120px; object-fit: cover; border-radius: 10px; cursor: pointer; transition: var(--transition); }
.photo-item:hover { transform: scale(1.03); }
.tags-wrap { display: flex; flex-wrap: wrap; gap: 8px; }
.match-card { background: linear-gradient(135deg, rgba(102,126,234,0.06), rgba(118,75,162,0.04)); }
.reason-row { display: flex; align-items: center; gap: 8px; margin-bottom: 14px; font-size: 14px; }
.match-score-bar { display: flex; align-items: center; gap: 12px; }
.match-score-num { font-weight: 800; font-size: 20px; background: var(--gradient-primary); -webkit-background-clip: text; -webkit-text-fill-color: transparent; min-width: 48px; }
.sidebar-card { padding: 22px; margin-bottom: 16px; }
.sidebar-card-title { font-size: 14px; font-weight: 700; margin-bottom: 14px; }
.recruit-status { margin-bottom: 12px; }
.recruit-progress { margin-bottom: 8px; }
.progress-text { font-size: 12px; color: var(--color-text-muted); text-align: right; margin-top: 4px; }
.deadline { font-size: 12px; color: var(--color-text-muted); margin-bottom: 16px; }
.apply-btn { margin-top: 12px; }
.applied-status { display: flex; align-items: center; justify-content: space-between; padding: 12px 0; }
.full-tips { font-size: 13px; color: var(--color-text-muted); text-align: center; margin-top: 12px; }
.contact-list { display: flex; flex-direction: column; gap: 10px; }
.contact-item { font-size: 14px; color: var(--color-text-secondary); display: flex; align-items: center; gap: 8px; }
.info-list { display: flex; flex-direction: column; gap: 12px; }
.info-item { display: flex; justify-content: space-between; font-size: 14px; }
.info-label { color: var(--color-text-muted); }
.lightbox { position: fixed; inset: 0; background: rgba(0,0,0,0.9); z-index: 2000; display: flex; align-items: center; justify-content: center; cursor: pointer; }
.lightbox-img { max-width: 90vw; max-height: 90vh; border-radius: 12px; object-fit: contain; }
@media (max-width: 1024px) { .detail-body { grid-template-columns: 1fr; } }
@media (max-width: 640px) { .detail-hero { height: 240px; } .hero-club-name { font-size: 22px; } .photos-grid { grid-template-columns: repeat(2,1fr); } }
</style>
