<template>
  <AppLayout>
    <!-- Hero Section -->
    <section class="hero-section">
      <div class="hero-bg">
        <div class="hero-shape shape-1"></div>
        <div class="hero-shape shape-2"></div>
        <div class="hero-shape shape-3"></div>
      </div>
      <div class="hero-content">
        <div class="hero-badge">🎓 高校社团招新智能平台</div>
        <h1 class="hero-title">
          <span class="title-gradient">5分钟</span>找到你的<br />社团归宿
        </h1>
        <p class="hero-desc">通过智能兴趣测评，精准匹配最适合你的社团。不用盲目逛摊位，一键发现属于你的圈子。</p>

        <div class="hero-actions">
          <button class="btn btn-primary btn-lg" @click="handleStartAssessment">
            <span>✨</span>
            {{ hasAssessment ? '查看我的推荐' : '开始测评' }}
          </button>
          <button class="btn btn-secondary btn-lg" @click="$router.push('/clubs')">
            <span>🔍</span> 浏览社团
          </button>
        </div>

        <!-- 继续测评提示 -->
        <div v-if="draftInfo" class="draft-hint" @click="$router.push('/assessment')">
          <span>📝</span>
          <span>继续完成测评（已完成 {{ draftInfo.draft_step }}/8 题）</span>
          <span class="draft-arrow">→</span>
        </div>

        <div class="hero-stats">
          <div class="stat-item"><span class="stat-num">10+</span><span class="stat-label">精选社团</span></div>
          <div class="stat-divider"></div>
          <div class="stat-item"><span class="stat-num">92%</span><span class="stat-label">匹配精准度</span></div>
          <div class="stat-divider"></div>
          <div class="stat-item"><span class="stat-num">3min</span><span class="stat-label">完成测评</span></div>
        </div>
      </div>

      <div class="hero-visual">
        <div class="visual-card" v-for="card in floatCards" :key="card.name" :style="card.style">
          <span class="card-emoji">{{ card.emoji }}</span>
          <span class="card-name">{{ card.name }}</span>
          <span class="card-match">{{ card.match }}% 匹配</span>
        </div>
      </div>
    </section>

    <!-- 官方通知横幅 -->
    <div v-if="topNotif" class="notice-banner" @click="$router.push('/notifications')">
      <span class="notice-icon">📢</span>
      <span class="notice-text">{{ topNotif.title }}</span>
      <span class="notice-more">查看详情 →</span>
    </div>

    <!-- 分类社团 -->
    <section class="categories-section">
      <div class="section-inner">
        <h2 class="section-title">按兴趣探索社团</h2>
        <div class="categories-grid">
          <div
            v-for="cat in categories" :key="cat.key"
            class="category-card"
            :style="{ background: cat.gradient }"
            @click="$router.push(`/clubs?category=${cat.key}`)"
          >
            <span class="cat-emoji">{{ cat.emoji }}</span>
            <span class="cat-name">{{ cat.name }}</span>
            <span class="cat-count">{{ cat.count }} 个社团</span>
          </div>
        </div>
      </div>
    </section>

    <!-- 热门社团 -->
    <section class="hot-clubs-section">
      <div class="section-inner">
        <div class="section-header">
          <h2 class="section-title">热门社团</h2>
          <button class="btn btn-ghost btn-sm" @click="$router.push('/clubs')">查看全部 →</button>
        </div>
        <div class="clubs-grid" v-if="hotClubs.length">
          <ClubCard
            v-for="club in hotClubs" :key="club.id"
            :club="club"
            @click="$router.push(`/clubs/${club.id}`)"
          />
        </div>
        <div v-else class="loading-overlay"><div class="loading-spin"></div></div>
      </div>
    </section>

    <!-- 平台价值介绍 -->
    <section class="features-section">
      <div class="section-inner">
        <h2 class="section-title">为什么选择我们？</h2>
        <div class="features-grid">
          <div class="feature-item" v-for="f in features" :key="f.title">
            <span class="feature-icon">{{ f.icon }}</span>
            <h3 class="feature-title">{{ f.title }}</h3>
            <p class="feature-desc">{{ f.desc }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- 页脚 -->
    <footer class="app-footer">
      <div class="footer-inner">
        <div class="footer-logo">🎯 社团招新平台</div>
        <div class="footer-links">
          <span @click="$router.push('/clubs')">发现社团</span>
          <span @click="$router.push('/assessment')">兴趣测评</span>
          <span @click="$router.push('/login')">登录注册</span>
        </div>
        <div class="footer-copy">© 2024 社团招新智能匹配平台 · 让每个新生都找到归宿</div>
      </div>
    </footer>
  </AppLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import AppLayout from '@/components/AppLayout.vue'
import ClubCard from '@/components/ClubCard.vue'
import request from '@/utils/request'

const router = useRouter()
const authStore = useAuthStore()
const hotClubs = ref([])
const draftInfo = ref(null)
const hasAssessment = ref(false)
const topNotif = ref(null)

const floatCards = [
  { emoji: '📸', name: '摄影社', match: 92, style: { top: '10%', right: '8%', animationDelay: '0s' } },
  { emoji: '💻', name: '编程俱乐部', match: 87, style: { top: '42%', right: '2%', animationDelay: '0.8s' } },
  { emoji: '🎸', name: '吉他社', match: 78, style: { top: '72%', right: '12%', animationDelay: '1.4s' } },
]

const categories = ref([
  { key: 'art', name: '文艺创作', emoji: '🎨', gradient: 'linear-gradient(135deg,#f093fb22,#f5576c11)', count: 0 },
  { key: 'sport', name: '体育运动', emoji: '⚽', gradient: 'linear-gradient(135deg,#4facfe22,#00f2fe11)', count: 0 },
  { key: 'academic', name: '学术科技', emoji: '🔬', gradient: 'linear-gradient(135deg,#43e97b22,#38f9d711)', count: 0 },
  { key: 'public', name: '公益实践', emoji: '💚', gradient: 'linear-gradient(135deg,#fa709a22,#fee14011)', count: 0 },
  { key: 'comprehensive', name: '综合类', emoji: '⭐', gradient: 'linear-gradient(135deg,#667eea22,#764ba211)', count: 0 },
])

const features = [
  { icon: '🎯', title: '智能精准匹配', desc: '8道科学测评题，多维度分析你的兴趣特长，给出最精准的个性化推荐。' },
  { icon: '⚡', title: '3分钟极速完成', desc: '告别繁琐问卷，轻量化设计，3分钟内完成测评，立即获得推荐结果。' },
  { icon: '📊', title: '匹配度透明', desc: '每个推荐都显示匹配理由，让你清楚知道"为什么推荐这个社团"。' },
  { icon: '🚀', title: '一键报名', desc: '看中心仪社团，直接在线报名，无需加群填表，随时查看审核进度。' },
]

function handleStartAssessment() {
  if (!authStore.isLoggedIn) {
    router.push('/login?redirect=/assessment')
    return
  }
  if (hasAssessment.value) {
    router.push('/recommend')
  } else {
    router.push('/assessment')
  }
}

onMounted(async () => {
  try {
    const res = await request.get('/clubs', { params: { pageSize: 6, sort: 'hot' } })
    hotClubs.value = res.data.list || []

    // 统计各分类数量
    const catMap = {}
    hotClubs.value.forEach(c => { catMap[c.category] = (catMap[c.category] || 0) + 1 })
    categories.value.forEach(c => { c.count = catMap[c.key] || '多' })
  } catch {}

  if (authStore.isLoggedIn) {
    try {
      const r = await request.get('/assessment/result')
      hasAssessment.value = !!r.data
    } catch {}
    try {
      const r = await request.get('/assessment/draft')
      if (r.data && r.data.draft_step > 0) draftInfo.value = r.data
    } catch {}
  }

  try {
    const r = await request.get('/notifications')
    const list = r.data?.list || []
    topNotif.value = list.find(n => n.is_top) || null
  } catch {}
})
</script>

<style scoped>
/* Hero */
.hero-section {
  position: relative; overflow: hidden; min-height: calc(100vh - var(--header-height));
  display: flex; align-items: center; padding: 80px 24px;
  max-width: 1280px; margin: 0 auto;
}
.hero-bg { position: absolute; inset: 0; pointer-events: none; overflow: hidden; }
.hero-shape {
  position: absolute; border-radius: 50%;
  background: var(--gradient-primary); opacity: 0.06;
}
.shape-1 { width: 600px; height: 600px; top: -200px; right: -100px; }
.shape-2 { width: 400px; height: 400px; bottom: -150px; left: -100px; background: var(--gradient-secondary); }
.shape-3 { width: 200px; height: 200px; top: 30%; left: 40%; }
.hero-content { flex: 1; max-width: 580px; position: relative; z-index: 1; }
.hero-badge {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 6px 16px; border-radius: 50px;
  background: rgba(102,126,234,0.1); color: var(--color-primary);
  font-size: 13px; font-weight: 600; margin-bottom: 24px;
}
.hero-title {
  font-size: clamp(36px, 5vw, 60px); font-weight: 900; line-height: 1.15;
  color: var(--color-text); margin-bottom: 20px;
}
.title-gradient {
  background: var(--gradient-primary); -webkit-background-clip: text;
  -webkit-text-fill-color: transparent; background-clip: text;
}
.hero-desc { font-size: 17px; color: var(--color-text-secondary); line-height: 1.7; margin-bottom: 36px; max-width: 480px; }
.hero-actions { display: flex; gap: 16px; flex-wrap: wrap; margin-bottom: 28px; }
.draft-hint {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 10px 18px; border-radius: 12px;
  background: rgba(102,126,234,0.08); border: 1.5px dashed rgba(102,126,234,0.3);
  font-size: 14px; color: var(--color-primary); cursor: pointer;
  transition: var(--transition); margin-bottom: 28px;
}
.draft-hint:hover { background: rgba(102,126,234,0.14); }
.draft-arrow { font-weight: 700; }
.hero-stats { display: flex; align-items: center; gap: 20px; }
.stat-item { display: flex; flex-direction: column; }
.stat-num { font-size: 26px; font-weight: 900; background: var(--gradient-primary); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
.stat-label { font-size: 12px; color: var(--color-text-muted); }
.stat-divider { width: 1px; height: 40px; background: var(--color-border); }
.hero-visual {
  flex-shrink: 0; width: 340px; position: relative; height: 380px;
}
.visual-card {
  position: absolute; background: rgba(255,255,255,0.85); backdrop-filter: blur(12px);
  border-radius: 16px; padding: 16px 20px;
  box-shadow: 0 8px 32px rgba(102,126,234,0.18);
  border: 1px solid rgba(255,255,255,0.7);
  display: flex; flex-direction: column; gap: 4px;
  animation: float 4s ease-in-out infinite;
  cursor: pointer; transition: transform 0.2s;
  min-width: 150px;
}
.visual-card:hover { transform: scale(1.04) !important; }
.card-emoji { font-size: 28px; }
.card-name { font-weight: 700; font-size: 15px; color: var(--color-text); }
.card-match { font-size: 13px; color: var(--color-primary); font-weight: 600; }
@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-12px); }
}

/* Notice Banner */
.notice-banner {
  background: linear-gradient(135deg,rgba(102,126,234,0.08),rgba(118,75,162,0.06));
  border-top: 1px solid rgba(102,126,234,0.15);
  border-bottom: 1px solid rgba(102,126,234,0.15);
  padding: 12px 24px; display: flex; align-items: center; gap: 10px;
  cursor: pointer; transition: background 0.2s;
}
.notice-banner:hover { background: rgba(102,126,234,0.12); }
.notice-icon { font-size: 18px; }
.notice-text { flex: 1; font-size: 14px; font-weight: 500; color: var(--color-text); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.notice-more { font-size: 13px; color: var(--color-primary); font-weight: 600; flex-shrink: 0; }

/* Sections */
.section-inner { max-width: 1280px; margin: 0 auto; padding: 0 24px; }
.section-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 28px; }
.section-title { font-size: 26px; font-weight: 800; color: var(--color-text); margin-bottom: 28px; }

/* Categories */
.categories-section { padding: 60px 0; }
.categories-grid { display: grid; grid-template-columns: repeat(5,1fr); gap: 16px; }
.category-card {
  border-radius: 16px; padding: 24px 16px;
  display: flex; flex-direction: column; align-items: center; gap: 8px;
  cursor: pointer; transition: var(--transition); border: 1.5px solid rgba(255,255,255,0.6);
}
.category-card:hover { transform: translateY(-4px); box-shadow: var(--card-shadow-hover); }
.cat-emoji { font-size: 36px; }
.cat-name { font-size: 15px; font-weight: 700; color: var(--color-text); }
.cat-count { font-size: 12px; color: var(--color-text-muted); }

/* Clubs Grid */
.hot-clubs-section { padding: 0 0 60px; }
.clubs-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 20px; }

/* Features */
.features-section { background: rgba(255,255,255,0.5); padding: 60px 0; }
.features-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 24px; }
.feature-item {
  background: #fff; border-radius: 20px; padding: 28px 24px;
  text-align: center; transition: var(--transition);
  box-shadow: var(--card-shadow);
}
.feature-item:hover { transform: translateY(-4px); box-shadow: var(--card-shadow-hover); }
.feature-icon { font-size: 40px; display: block; margin-bottom: 16px; }
.feature-title { font-size: 16px; font-weight: 700; margin-bottom: 10px; }
.feature-desc { font-size: 13px; color: var(--color-text-secondary); line-height: 1.6; }

/* Footer */
.app-footer { background: rgba(0,0,0,0.04); padding: 40px 0 24px; margin-top: 40px; }
.footer-inner { max-width: 1280px; margin: 0 auto; padding: 0 24px; text-align: center; }
.footer-logo { font-size: 20px; font-weight: 800; margin-bottom: 16px; }
.footer-links { display: flex; justify-content: center; gap: 24px; margin-bottom: 16px; }
.footer-links span { font-size: 14px; color: var(--color-text-secondary); cursor: pointer; }
.footer-links span:hover { color: var(--color-primary); }
.footer-copy { font-size: 12px; color: var(--color-text-muted); }

@media (max-width: 1024px) {
  .hero-visual { display: none; }
  .categories-grid { grid-template-columns: repeat(3,1fr); }
  .clubs-grid { grid-template-columns: repeat(2,1fr); }
  .features-grid { grid-template-columns: repeat(2,1fr); }
}
@media (max-width: 640px) {
  .hero-section { padding: 40px 16px; }
  .categories-grid { grid-template-columns: repeat(2,1fr); }
  .clubs-grid { grid-template-columns: 1fr; }
  .features-grid { grid-template-columns: 1fr; }
  .hero-actions { flex-direction: column; }
}
</style>
