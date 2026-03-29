<template>
  <AppLayout>
    <div class="favorites-page">
      <div class="page-inner">
        <div class="page-header">
          <h2 class="page-title">❤️ 我的收藏</h2>
          <span class="result-count" v-if="clubs.length">{{ clubs.length }} 个社团</span>
        </div>

        <div v-if="loading" class="loading-overlay"><div class="loading-spin"></div></div>

        <div v-else-if="clubs.length" class="clubs-grid">
          <div v-for="club in clubs" :key="club.id" class="fav-item">
            <ClubCard :club="club" @click="$router.push(`/clubs/${club.id}`)" />
            <button class="unfav-btn" @click.stop="removeFavorite(club)" title="取消收藏">
              ❤️ 取消收藏
            </button>
          </div>
        </div>

        <div v-else class="empty-state">
          <div class="empty-icon">💔</div>
          <div class="empty-title">还没有收藏的社团</div>
          <div class="empty-desc">快去发现心仪的社团，点击收藏按钮保存吧~</div>
          <button class="btn btn-primary" @click="$router.push('/clubs')">去浏览社团</button>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, onMounted, inject } from 'vue'
import AppLayout from '@/components/AppLayout.vue'
import ClubCard from '@/components/ClubCard.vue'
import request from '@/utils/request'

const showToast = inject('showToast')
const clubs = ref([])
const loading = ref(true)

async function removeFavorite(club) {
  try {
    await request.post(`/clubs/${club.id}/favorite`)
    clubs.value = clubs.value.filter(c => c.id !== club.id)
    showToast('已取消收藏', 'info')
  } catch (e) { showToast(e.message, 'error') }
}

onMounted(async () => {
  try {
    const res = await request.get('/clubs/my/favorites')
    clubs.value = res.data || []
  } catch {} finally { loading.value = false }
})
</script>

<style scoped>
.favorites-page { padding: 32px 0; }
.page-inner { max-width: 1280px; margin: 0 auto; padding: 0 24px; }
.page-header { display: flex; align-items: center; gap: 16px; margin-bottom: 28px; }
.page-title { font-size: 24px; font-weight: 800; }
.result-count { color: var(--color-text-muted); font-size: 14px; }
.clubs-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 20px; }
.fav-item { display: flex; flex-direction: column; }
.unfav-btn {
  padding: 8px; background: rgba(245,34,45,0.06); border: 1px solid rgba(245,34,45,0.15);
  color: #cf1322; border-radius: 0 0 16px 16px; font-size: 13px; cursor: pointer;
  transition: var(--transition);
}
.unfav-btn:hover { background: rgba(245,34,45,0.12); }
@media (max-width:1024px) { .clubs-grid { grid-template-columns: repeat(2,1fr); } }
@media (max-width:640px) { .clubs-grid { grid-template-columns: 1fr; } }
</style>
