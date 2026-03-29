<template>
  <AppLayout>
    <div class="recommend-page">
      <div class="section-inner">
        <!-- 用户标签云 -->
        <div class="tags-section card" v-if="assessmentResult">
          <div class="tags-header">
            <div>
              <h2 class="tags-title">🎉 测评完成！这是你的专属标签</h2>
              <p class="tags-sub">基于你的测评结果，为你推荐最匹配的社团</p>
            </div>
            <button class="btn btn-ghost btn-sm" @click="$router.push('/assessment')">重新测评</button>
          </div>
          <div class="tags-cloud">
            <span v-for="tag in assessmentResult.tags" :key="tag" class="tag tag-purple tag-md">{{ tag }}</span>
          </div>
        </div>

        <!-- 未测评提示 -->
        <div v-else-if="!loading" class="no-assessment card">
          <div class="no-assess-content">
            <span class="no-assess-icon">🎯</span>
            <h3>还没有完成测评</h3>
            <p>完成兴趣测评，获取个性化社团推荐</p>
            <button class="btn btn-primary" @click="$router.push('/assessment')">去测评</button>
          </div>
        </div>

        <!-- 推荐列表 -->
        <div class="recommend-header">
          <div>
            <h3 class="recommend-title">
              {{ isHotMode ? '🔥 热门社团推荐' : '⭐ 为你推荐' }}
            </h3>
            <p v-if="isHotMode" class="recommend-sub" style="color:var(--color-warning)">暂无完美匹配的社团，为你推荐热门社团~</p>
            <p v-else class="recommend-sub">共找到 {{ total }} 个匹配社团</p>
          </div>
          <button class="btn btn-secondary btn-sm" @click="$router.push('/clubs')">查看全部社团</button>
        </div>

        <div v-if="loading" class="loading-overlay"><div class="loading-spin"></div></div>

        <div v-else-if="clubs.length" class="clubs-grid">
          <ClubCard
            v-for="club in clubs" :key="club.id"
            :club="club"
            @click="$router.push(`/clubs/${club.id}`)"
          />
        </div>

        <div v-else class="empty-state">
          <div class="empty-icon">😅</div>
          <div class="empty-title">暂无正在招新的社团</div>
          <div class="empty-desc">请稍后再来查看</div>
          <button class="btn btn-secondary" @click="$router.push('/clubs')">浏览全部社团</button>
        </div>

        <!-- 加载更多 -->
        <div v-if="hasMore && !loading" class="load-more">
          <button class="btn btn-secondary" @click="loadMore" :disabled="loadingMore">
            <span v-if="loadingMore" class="loading-spin" style="width:16px;height:16px;border-width:2px"></span>
            <span v-else>加载更多</span>
          </button>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import AppLayout from '@/components/AppLayout.vue'
import ClubCard from '@/components/ClubCard.vue'
import request from '@/utils/request'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const clubs = ref([])
const loading = ref(true)
const loadingMore = ref(false)
const assessmentResult = ref(null)
const isHotMode = ref(false)
const total = ref(0)
const page = ref(1)
const hasMore = ref(false)

async function fetchRecommend(isMore = false) {
  if (!isMore) loading.value = true
  else loadingMore.value = true
  try {
    let res
    if (authStore.isLoggedIn) {
      res = await request.get('/clubs/recommend', { params: { page: page.value, pageSize: 9 } })
      isHotMode.value = res.data.list.some(c => c.is_hot)
    } else {
      res = await request.get('/clubs', { params: { page: page.value, pageSize: 9, sort: 'hot' } })
      isHotMode.value = true
    }
    if (isMore) clubs.value.push(...(res.data.list || []))
    else clubs.value = res.data.list || []
    total.value = res.data.total || 0
    hasMore.value = clubs.value.length < total.value
  } catch {} finally {
    loading.value = false
    loadingMore.value = false
  }
}

async function loadMore() {
  page.value++
  await fetchRecommend(true)
}

onMounted(async () => {
  if (authStore.isLoggedIn) {
    try {
      const r = await request.get('/assessment/result')
      assessmentResult.value = r.data
    } catch {}
  }
  await fetchRecommend()
})
</script>

<style scoped>
.recommend-page { padding: 40px 0; }
.section-inner { max-width: 1280px; margin: 0 auto; padding: 0 24px; }
.tags-section { padding: 28px 32px; margin-bottom: 32px; }
.tags-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; margin-bottom: 20px; }
.tags-title { font-size: 20px; font-weight: 800; margin-bottom: 6px; }
.tags-sub { font-size: 13px; color: var(--color-text-secondary); }
.tags-cloud { display: flex; flex-wrap: wrap; gap: 10px; }
.tag-md { font-size: 13px; padding: 5px 14px; }
.no-assessment { padding: 48px; margin-bottom: 32px; }
.no-assess-content { display: flex; flex-direction: column; align-items: center; gap: 12px; text-align: center; }
.no-assess-icon { font-size: 52px; }
.recommend-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; flex-wrap: wrap; gap: 12px; }
.recommend-title { font-size: 22px; font-weight: 800; }
.recommend-sub { font-size: 13px; color: var(--color-text-secondary); margin-top: 4px; }
.clubs-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 20px; }
.load-more { display: flex; justify-content: center; margin-top: 32px; }
@media (max-width: 1024px) { .clubs-grid { grid-template-columns: repeat(2,1fr); } }
@media (max-width: 640px) { .clubs-grid { grid-template-columns: 1fr; } }
</style>
