<template>
  <AppLayout>
    <div class="assessment-page">
      <div class="assessment-bg">
        <div class="bg-shape s1"></div>
        <div class="bg-shape s2"></div>
      </div>

      <!-- 完成页 -->
      <div v-if="completed" class="completed-screen">
        <div class="completed-icon">🎉</div>
        <h2 class="completed-title">测评完成！</h2>
        <p class="completed-desc">已生成你的专属兴趣标签</p>
        <div class="tags-cloud">
          <span v-for="tag in resultTags" :key="tag" class="tag tag-purple tag-lg">{{ tag }}</span>
        </div>
        <div class="completed-actions">
          <button class="btn btn-primary btn-lg" @click="$router.push('/recommend')">查看匹配社团 →</button>
          <button class="btn btn-secondary" @click="$router.push('/clubs')">浏览全部社团</button>
        </div>
      </div>

      <!-- 答题页 -->
      <div v-else class="assessment-main">
        <div class="assessment-header">
          <button class="btn btn-ghost btn-sm back-btn" @click="$router.push('/')">← 返回</button>
          <div class="progress-wrap">
            <div class="progress-label">第 {{ currentStep }}/8 题</div>
            <div class="progress-bar" style="width:240px">
              <div class="progress-bar-fill" :style="{ width: `${(currentStep / 8) * 100}%` }"></div>
            </div>
          </div>
          <div class="step-dots">
            <span v-for="i in 8" :key="i" :class="['dot', { active: i === currentStep, done: i < currentStep }]"></span>
          </div>
        </div>

        <transition :name="slideDir === 'left' ? 'slide-left' : 'slide-right'" mode="out-in">
          <div class="question-card card" :key="currentStep">
            <div class="q-dim-badge">{{ currentQ.dim }}</div>
            <h3 class="q-text">{{ currentQ.question }}</h3>
            <p class="q-hint">可多选，选择符合你的选项</p>

            <div class="options-grid" :class="{ 'cols-2': currentOptions.length > 4 }">
              <button
                v-for="opt in currentOptions" :key="opt"
                :class="['option-btn', { selected: isSelected(opt) }]"
                @click="toggleOption(opt)"
              >
                <span class="opt-icon">{{ getOptIcon(opt) }}</span>
                <span class="opt-text">{{ opt }}</span>
                <span v-if="isSelected(opt)" class="opt-check">✓</span>
              </button>
            </div>
          </div>
        </transition>

        <div class="question-nav">
          <button class="btn btn-secondary" @click="prevStep" :disabled="currentStep === 1">← 上一题</button>
          <span class="nav-hint">{{ selectedCount }} 项已选</span>
          <button
            class="btn btn-primary"
            @click="nextStep"
            :disabled="selectedCount === 0"
          >
            {{ currentStep < 8 ? '下一题 →' : '提交测评 🎉' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 草稿恢复弹窗 -->
    <div v-if="showDraftModal" class="modal-overlay" @click.self="showDraftModal=false">
      <div class="modal">
        <div class="modal-header">
          <h3 class="modal-title">📝 发现未完成的测评</h3>
        </div>
        <p style="color:var(--color-text-secondary);font-size:14px;margin-bottom:20px;">
          检测到上次未完成的测评（已完成 {{ draft.draft_step }}/8 题），是否继续？
        </p>
        <div class="modal-footer">
          <button class="btn btn-ghost" @click="restartAssessment">重新开始</button>
          <button class="btn btn-primary" @click="continueDraft">继续答题</button>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted, inject, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import AppLayout from '@/components/AppLayout.vue'
import request from '@/utils/request'

const router = useRouter()
const authStore = useAuthStore()
const showToast = inject('showToast')

const QUESTIONS = [
  { id: 1, dim: '兴趣方向', question: '你对哪些活动感兴趣？（可多选）', options: ['文艺创作', '体育运动', '学术科技', '公益实践'] },
  { id: 2, dim: '细分兴趣', question: '你喜欢哪些具体形式？（可多选）', options: [] },
  { id: 3, dim: '核心特长', question: '你在这些活动上是什么水平？（可多选）', options: ['完全新手', '有点基础', '比较熟练', '专业水平'] },
  { id: 4, dim: '时间投入', question: '你每周愿意为社团投入多少时间？（可多选）', options: ['5小时以上', '2-5小时', '1-2小时', '随缘参与'] },
  { id: 5, dim: '空闲时段', question: '你一般什么时候有空？（可多选）', options: ['周中晚上', '周末全天', '周末半天', '节假日'] },
  { id: 6, dim: '社交偏好', question: '你喜欢什么样的团队氛围？（可多选）', options: ['大团队热闹', '小圈子亲密', '独立行动多', '无所谓'] },
  { id: 7, dim: '目标导向', question: '你加入社团主要想获得什么？（可多选）', options: ['提升技能', '结交朋友', '丰富经历', '综测加分'] },
  { id: 8, dim: '参与方式', question: '你更想担任什么角色？（可多选）', options: ['组织者/leader', '执行者/参与者', '创意提供者', '看情况'] },
]

const Q2_MAP = {
  '文艺创作': ['绘画', '音乐', '舞蹈', '摄影', '写作', '戏剧'],
  '体育运动': ['球类', '健身', '游泳', '跑步', '武术', '瑜伽'],
  '学术科技': ['编程', '辩论', '数学', '机器人', '创业', '外语'],
  '公益实践': ['志愿服务', '环保', '支教', '社区服务', '动物保护', '扶贫'],
}
const OPT_ICONS = {
  '文艺创作':'🎨','体育运动':'⚽','学术科技':'🔬','公益实践':'💚',
  '绘画':'🖌','音乐':'🎵','舞蹈':'💃','摄影':'📸','写作':'✍️','戏剧':'🎭',
  '球类':'⚽','健身':'💪','游泳':'🏊','跑步':'🏃','武术':'🥋','瑜伽':'🧘',
  '编程':'💻','辩论':'🎤','数学':'📐','机器人':'🤖','创业':'🚀','外语':'🌍',
  '志愿服务':'🤝','环保':'🌿','支教':'📚','社区服务':'🏘','动物保护':'🐾','扶贫':'❤',
  '完全新手':'🌱','有点基础':'🌿','比较熟练':'🌳','专业水平':'🏆',
  '5小时以上':'🔥','2-5小时':'⏰','1-2小时':'🕐','随缘参与':'🎲',
  '周中晚上':'🌙','周末全天':'☀️','周末半天':'🌤','节假日':'🎉',
  '大团队热闹':'🎊','小圈子亲密':'🤗','独立行动多':'🦅','无所谓':'😊',
  '提升技能':'📈','结交朋友':'👥','丰富经历':'⭐','综测加分':'📊',
  '组织者/leader':'👑','执行者/参与者':'🙋','创意提供者':'💡','看情况':'🤔',
}

const currentStep = ref(1)
const answers = ref({})
const completed = ref(false)
const resultTags = ref([])
const slideDir = ref('left')
const showDraftModal = ref(false)
const draft = ref({})
const submitting = ref(false)

const currentQ = computed(() => QUESTIONS[currentStep.value - 1])
const currentOptions = computed(() => {
  if (currentStep.value === 2) {
    const q1Answers = answers.value['1'] || []
    const allOpts = new Set()
    q1Answers.forEach(a => { (Q2_MAP[a] || []).forEach(o => allOpts.add(o)) })
    return allOpts.size > 0 ? [...allOpts] : Object.values(Q2_MAP).flat().slice(0, 10)
  }
  return currentQ.value.options
})

const selectedCount = computed(() => (answers.value[currentStep.value] || []).length)

function isSelected(opt) {
  return (answers.value[currentStep.value] || []).includes(opt)
}
function toggleOption(opt) {
  if (!answers.value[currentStep.value]) answers.value[currentStep.value] = []
  const idx = answers.value[currentStep.value].indexOf(opt)
  if (idx === -1) answers.value[currentStep.value].push(opt)
  else answers.value[currentStep.value].splice(idx, 1)
}
function getOptIcon(opt) { return OPT_ICONS[opt] || '🔸' }

async function saveDraft() {
  if (!authStore.isLoggedIn) return
  try {
    await request.post('/assessment/draft', { answers: answers.value, step: currentStep.value })
  } catch {}
}

function prevStep() {
  if (currentStep.value === 1) return
  slideDir.value = 'right'
  currentStep.value--
}

async function nextStep() {
  if (currentStep.value < 8) {
    slideDir.value = 'left'
    currentStep.value++
    await saveDraft()
  } else {
    await submitAssessment()
  }
}

async function submitAssessment() {
  if (submitting.value) return
  submitting.value = true
  try {
    const res = await request.post('/assessment/submit', { answers: answers.value })
    resultTags.value = res.data.tags || []
    completed.value = true
    showToast('测评完成！', 'success')
  } catch (e) {
    showToast(e.message, 'error')
    if (e.message.includes('今天已经')) {
      router.push('/recommend')
    }
  } finally {
    submitting.value = false
  }
}

function continueDraft() {
  showDraftModal.value = false
  currentStep.value = draft.value.draft_step
  answers.value = draft.value.answers || {}
}
function restartAssessment() {
  showDraftModal.value = false
  currentStep.value = 1
  answers.value = {}
}

onMounted(async () => {
  if (!authStore.isLoggedIn) {
    router.push('/login?redirect=/assessment')
    return
  }
  // 检查是否有草稿
  try {
    const res = await request.get('/assessment/draft')
    if (res.data && res.data.draft_step > 0) {
      draft.value = res.data
      showDraftModal.value = true
    }
  } catch {}
})
</script>

<style scoped>
.assessment-page { min-height:calc(100vh - var(--header-height)); padding:40px 24px; position:relative; display:flex; flex-direction:column; align-items:center; }
.assessment-bg { position:fixed;inset:0;pointer-events:none;overflow:hidden; }
.bg-shape { position:absolute;border-radius:50%;opacity:.06;background:var(--gradient-primary); }
.s1 { width:600px;height:600px;top:-200px;right:-150px; }
.s2 { width:400px;height:400px;bottom:-150px;left:-100px;background:var(--gradient-secondary); }
.assessment-main { max-width:640px;width:100%;position:relative;z-index:1; }
.assessment-header { display:flex;align-items:center;gap:20px;margin-bottom:32px;flex-wrap:wrap; }
.back-btn { flex-shrink:0; }
.progress-wrap { display:flex;flex-direction:column;gap:6px; }
.progress-label { font-size:13px;font-weight:600;color:var(--color-text-secondary); }
.step-dots { display:flex;gap:6px;margin-left:auto; }
.dot { width:10px;height:10px;border-radius:50%;background:var(--color-border);transition:var(--transition); }
.dot.active { background:var(--gradient-primary);width:24px;border-radius:5px; }
.dot.done { background:var(--color-primary); }
.question-card { padding:36px;position:relative;z-index:1; }
.q-dim-badge { display:inline-block;padding:4px 12px;border-radius:20px;background:rgba(102,126,234,.1);color:var(--color-primary);font-size:12px;font-weight:600;margin-bottom:16px; }
.q-text { font-size:22px;font-weight:800;color:var(--color-text);margin-bottom:8px;line-height:1.4; }
.q-hint { font-size:13px;color:var(--color-text-muted);margin-bottom:28px; }
.options-grid { display:grid;grid-template-columns:1fr 1fr;gap:12px; }
.options-grid.cols-2 { grid-template-columns:repeat(3,1fr); }
.option-btn {
  display:flex;align-items:center;gap:10px;padding:14px 16px;
  border-radius:14px;border:2px solid var(--color-border);background:#fff;
  font-size:14px;font-weight:500;color:var(--color-text);
  cursor:pointer;transition:var(--transition);text-align:left;position:relative;
}
.option-btn:hover { border-color:var(--color-primary);background:rgba(102,126,234,.04); }
.option-btn.selected { border-color:var(--color-primary);background:rgba(102,126,234,.08);color:var(--color-primary); }
.opt-icon { font-size:20px;flex-shrink:0; }
.opt-text { flex:1;font-size:13px; }
.opt-check { position:absolute;top:8px;right:10px;width:18px;height:18px;background:var(--gradient-primary);border-radius:50%;color:#fff;font-size:11px;display:flex;align-items:center;justify-content:center;font-weight:700; }
.question-nav { display:flex;align-items:center;justify-content:space-between;margin-top:24px; }
.nav-hint { font-size:13px;color:var(--color-text-muted); }
/* Completed */
.completed-screen { display:flex;flex-direction:column;align-items:center;text-align:center;padding:60px 24px;position:relative;z-index:1;max-width:560px;width:100%; }
.completed-icon { font-size:72px;margin-bottom:16px;animation:bounce 0.6s ease; }
@keyframes bounce { 0%,100%{transform:scale(1)} 50%{transform:scale(1.2)} }
.completed-title { font-size:32px;font-weight:900;margin-bottom:8px; }
.completed-desc { color:var(--color-text-secondary);margin-bottom:28px; }
.tags-cloud { display:flex;flex-wrap:wrap;gap:10px;justify-content:center;margin-bottom:36px;max-width:480px; }
.tag-lg { font-size:14px;padding:6px 16px; }
.completed-actions { display:flex;gap:16px;flex-wrap:wrap;justify-content:center; }
/* Slide animations */
.slide-left-enter-from { opacity:0;transform:translateX(40px); }
.slide-left-enter-active { transition:all .3s ease; }
.slide-left-leave-to { opacity:0;transform:translateX(-40px); }
.slide-left-leave-active { transition:all .2s ease; }
.slide-right-enter-from { opacity:0;transform:translateX(-40px); }
.slide-right-enter-active { transition:all .3s ease; }
.slide-right-leave-to { opacity:0;transform:translateX(40px); }
.slide-right-leave-active { transition:all .2s ease; }
@media (max-width:640px) { .options-grid,.options-grid.cols-2 { grid-template-columns:1fr 1fr; } .question-card { padding:24px 20px; } }
</style>
