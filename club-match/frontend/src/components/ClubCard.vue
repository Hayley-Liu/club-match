<template>
  <div class="club-card card" @click="$emit('click')">
    <div class="club-cover">
      <img :src="club.cover_image || defaultCover" :alt="club.name" loading="lazy" />
      <div class="cover-overlay"></div>
      <div class="cover-badges">
        <span v-if="club.match_score > 0" :class="['match-badge', matchClass]">
          ⭐ {{ club.match_score }}% 匹配
        </span>
        <span v-if="!club.is_recruiting" class="status-badge status-offline">招新已结束</span>
        <span v-else-if="isFull" class="status-badge status-offline">名额已满</span>
        <span v-else class="status-badge status-recruiting">🔥 招新中</span>
      </div>
    </div>
    <div class="club-body">
      <div class="club-name-row">
        <h3 class="club-name">{{ club.name }}</h3>
        <span class="cat-badge" :class="`cat-${club.category}`">{{ catName }}</span>
      </div>
      <p class="club-desc">{{ club.description }}</p>
      <div class="club-tags" v-if="club.tags?.length">
        <span v-for="t in club.tags.slice(0,3)" :key="t" class="tag tag-purple">{{ t }}</span>
      </div>
      <div class="club-footer">
        <div class="recruit-info">
          <div class="progress-bar" style="margin-bottom:4px;">
            <div class="progress-bar-fill" :style="{ width: progressWidth }"></div>
          </div>
          <span class="recruit-count">已报名 {{ club.current_count }}/{{ club.max_members }} 人</span>
        </div>
        <span class="view-count">👁 {{ club.view_count || 0 }}</span>
      </div>
      <!-- 匹配理由 -->
      <div v-if="club.match_reasons?.length" class="match-reasons">
        <span class="reason-label">契合你的：</span>
        <span v-for="(r,i) in club.match_reasons" :key="i" class="reason-tag">{{ r }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({ club: { type: Object, required: true } })
defineEmits(['click'])

const defaultCover = 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=600'

const catMap = { art: '文艺', sport: '体育', academic: '学术', public: '公益', comprehensive: '综合' }
const catName = computed(() => catMap[props.club.category] || '其他')

const matchClass = computed(() => {
  const s = props.club.match_score
  if (s >= 80) return 'match-high'
  if (s >= 50) return 'match-mid'
  return 'match-low'
})

const isFull = computed(() => props.club.current_count >= props.club.max_members)
const progressWidth = computed(() => `${Math.min(100, Math.round(props.club.current_count / props.club.max_members * 100))}%`)
</script>

<style scoped>
.club-card { cursor: pointer; display: flex; flex-direction: column; }
.club-cover { position: relative; height: 180px; overflow: hidden; }
.club-cover img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.4s ease; }
.club-card:hover .club-cover img { transform: scale(1.05); }
.cover-overlay {
  position: absolute; inset: 0;
  background: linear-gradient(to bottom, transparent 50%, rgba(0,0,0,0.3) 100%);
}
.cover-badges { position: absolute; top: 12px; left: 12px; display: flex; gap: 6px; flex-wrap: wrap; }
.club-body { padding: 16px; flex: 1; display: flex; flex-direction: column; gap: 10px; }
.club-name-row { display: flex; align-items: center; gap: 10px; }
.club-name { font-size: 16px; font-weight: 700; flex: 1; }
.cat-badge { padding: 2px 8px; border-radius: 6px; font-size: 11px; font-weight: 600; }
.cat-art { background: rgba(240,147,251,0.15); color: #a855f7; }
.cat-sport { background: rgba(79,172,254,0.15); color: #0ea5e9; }
.cat-academic { background: rgba(67,233,123,0.15); color: #16a34a; }
.cat-public { background: rgba(250,112,154,0.15); color: #e11d48; }
.cat-comprehensive { background: rgba(102,126,234,0.12); color: #667eea; }
.club-desc {
  font-size: 13px; color: var(--color-text-secondary); line-height: 1.5;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
}
.club-tags { display: flex; flex-wrap: wrap; gap: 6px; }
.club-footer { display: flex; align-items: flex-end; justify-content: space-between; margin-top: auto; }
.recruit-info { flex: 1; margin-right: 12px; }
.recruit-count { font-size: 12px; color: var(--color-text-muted); }
.view-count { font-size: 12px; color: var(--color-text-muted); }
.match-reasons { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; padding-top: 8px; border-top: 1px solid var(--color-border); }
.reason-label { font-size: 12px; color: var(--color-text-muted); }
.reason-tag { padding: 2px 8px; background: rgba(102,126,234,0.08); color: var(--color-primary); border-radius: 12px; font-size: 11px; font-weight: 500; }
</style>
