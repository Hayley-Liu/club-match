<template>
  <AppLayout>
    <div class="club-list-page">
      <div class="list-inner">
        <!-- 搜索过滤区 -->
        <div class="filter-section card">
          <div class="filter-row">
            <div class="search-box">
              <span class="search-icon">🔍</span>
              <input
                v-model="keyword" class="search-input"
                placeholder="搜索社团名称..." @input="debounceSearch"
              />
              <button v-if="keyword" class="search-clear" @click="keyword='';fetchClubs()">×</button>
            </div>
            <div class="filter-cats">
              <button
                v-for="cat in allCategories" :key="cat.key"
                :class="['cat-btn', { active: activeCat === cat.key }]"
                @click="selectCat(cat.key)"
              >
                {{ cat.emoji }} {{ cat.name }}
              </button>
            </div>
            <div class="sort-btns">
              <button v-for="s in sorts" :key="s.key" :class="['sort-btn', { active: activeSort === s.key }]" @click="selectSort(s.key)">{{ s.name }}</button>
            </div>
          </div>
        </div>

        <!-- 结果信息 -->
        <div class="result-info">
          <span class="result-count">共 {{ total }} 个社团</span>
          <span v-if="activeCat !== 'all'" class="filter-tag">
            {{ allCategories.find(c=>c.key===activeCat)?.name }}
            <span @click="selectCat('all')" class="filter-clear">×</span>
          </span>
        </div>

        <div v-if="loading" class="loading-overlay" style="min-height:300px"><div class="loading-spin"></div></div>

        <div v-else-if="clubs.length" class="clubs-grid">
          <ClubCard v-for="club in clubs" :key="club.id" :club="club" @click="$router.push(`/clubs/${club.id}`)" />
        </div>

        <div v-else class="empty-state">
          <div class="empty-icon">🔎</div>
          <div class="empty-title">没有找到匹配的社团</div>
          <div class="empty-desc">换个关键词试试，或者浏览全部社团</div>
          <button class="btn btn-secondary" @click="selectCat('all');keyword=''">清除筛选</button>
        </div>

        <!-- 分页 -->
        <div v-if="totalPages > 1" class="pagination">
          <button class="page-btn" @click="gotoPage(currentPage-1)" :disabled="currentPage===1">←</button>
          <button
            v-for="p in pageNums" :key="p"
            :class="['page-btn', { active: p === currentPage, dots: p === '...' }]"
            @click="p !== '...' && gotoPage(p)"
          >{{ p }}</button>
          <button class="page-btn" @click="gotoPage(currentPage+1)" :disabled="currentPage===totalPages">→</button>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppLayout from '@/components/AppLayout.vue'
import ClubCard from '@/components/ClubCard.vue'
import request from '@/utils/request'

const route = useRoute()
const router = useRouter()
const clubs = ref([])
const loading = ref(true)
const keyword = ref('')
const activeCat = ref(route.query.category || 'all')
const activeSort = ref('default')
const total = ref(0)
const currentPage = ref(1)
const pageSize = 12

const allCategories = [
  { key: 'all', name: '全部', emoji: '🌟' },
  { key: 'art', name: '文艺', emoji: '🎨' },
  { key: 'sport', name: '体育', emoji: '⚽' },
  { key: 'academic', name: '学术', emoji: '🔬' },
  { key: 'public', name: '公益', emoji: '💚' },
  { key: 'comprehensive', name: '综合', emoji: '⭐' },
]
const sorts = [
  { key: 'default', name: '综合' },
  { key: 'hot', name: '🔥 热门' },
  { key: 'new', name: '✨ 最新' },
]

const totalPages = computed(() => Math.ceil(total.value / pageSize))
const pageNums = computed(() => {
  const pages = []
  for (let i = 1; i <= totalPages.value; i++) {
    if (i === 1 || i === totalPages.value || Math.abs(i - currentPage.value) <= 2) pages.push(i)
    else if (pages[pages.length - 1] !== '...') pages.push('...')
  }
  return pages
})

let searchTimer = null
function debounceSearch() {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => { currentPage.value = 1; fetchClubs() }, 400)
}

function selectCat(key) { activeCat.value = key; currentPage.value = 1; fetchClubs() }
function selectSort(key) { activeSort.value = key; currentPage.value = 1; fetchClubs() }
function gotoPage(p) { if (p < 1 || p > totalPages.value) return; currentPage.value = p; fetchClubs(); window.scrollTo({ top: 0, behavior: 'smooth' }) }

async function fetchClubs() {
  loading.value = true
  try {
    const params = { page: currentPage.value, pageSize, sort: activeSort.value }
    if (keyword.value) params.keyword = keyword.value
    if (activeCat.value !== 'all') params.category = activeCat.value
    const res = await request.get('/clubs', { params })
    clubs.value = res.data.list || []
    total.value = res.data.total || 0
  } catch {} finally { loading.value = false }
}

onMounted(fetchClubs)
</script>

<style scoped>
.club-list-page { padding: 32px 0; }
.list-inner { max-width: 1280px; margin: 0 auto; padding: 0 24px; }
.filter-section { padding: 20px 24px; margin-bottom: 24px; }
.filter-row { display: flex; flex-wrap: wrap; gap: 16px; align-items: center; }
.search-box {
  display: flex; align-items: center; gap: 8px;
  background: var(--gradient-bg); border-radius: 50px;
  padding: 10px 16px; border: 1.5px solid var(--color-border);
  min-width: 240px; flex: 1; max-width: 320px;
}
.search-icon { font-size: 16px; }
.search-input { border: none; background: transparent; flex: 1; font-size: 14px; color: var(--color-text); }
.search-input::placeholder { color: var(--color-text-muted); }
.search-clear { background: none; color: var(--color-text-muted); font-size: 18px; cursor: pointer; }
.filter-cats { display: flex; flex-wrap: wrap; gap: 8px; }
.cat-btn {
  padding: 6px 14px; border-radius: 50px; font-size: 13px; font-weight: 500;
  background: transparent; border: 1.5px solid var(--color-border); color: var(--color-text-secondary);
  cursor: pointer; transition: var(--transition);
}
.cat-btn:hover { border-color: var(--color-primary); color: var(--color-primary); }
.cat-btn.active { background: var(--gradient-primary); border-color: transparent; color: #fff; }
.sort-btns { display: flex; gap: 6px; margin-left: auto; }
.sort-btn {
  padding: 6px 14px; border-radius: 50px; font-size: 12px; font-weight: 500;
  background: transparent; border: 1.5px solid var(--color-border); color: var(--color-text-secondary);
  cursor: pointer; transition: var(--transition);
}
.sort-btn.active { background: rgba(102,126,234,.1); border-color: var(--color-primary); color: var(--color-primary); }
.result-info { display: flex; align-items: center; gap: 10px; margin-bottom: 20px; }
.result-count { font-size: 14px; color: var(--color-text-secondary); }
.filter-tag { display: flex; align-items: center; gap: 4px; padding: 3px 10px; background: rgba(102,126,234,.1); color: var(--color-primary); border-radius: 20px; font-size: 12px; }
.filter-clear { cursor: pointer; font-size: 16px; line-height: 1; }
.clubs-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 20px; }
.pagination { display: flex; justify-content: center; gap: 8px; margin-top: 40px; }
.page-btn { width: 36px; height: 36px; border-radius: 50%; border: 1.5px solid var(--color-border); background: #fff; font-size: 14px; cursor: pointer; transition: var(--transition); display: flex; align-items: center; justify-content: center; }
.page-btn:hover:not(:disabled):not(.dots) { border-color: var(--color-primary); color: var(--color-primary); }
.page-btn.active { background: var(--gradient-primary); border-color: transparent; color: #fff; }
.page-btn.dots { border: none; cursor: default; }
.page-btn:disabled { opacity: .4; cursor: not-allowed; }
@media (max-width: 1024px) { .clubs-grid { grid-template-columns: repeat(2,1fr); } }
@media (max-width: 640px) { .clubs-grid { grid-template-columns: 1fr; } .search-box { max-width: 100%; } }
</style>
