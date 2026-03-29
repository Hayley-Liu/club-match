<template>
  <AppLayout>
    <div class="leader-apply-page">
      <div class="apply-inner">
        <!-- 已有社团 -->
        <template v-if="myClub">
          <div :class="['status-card card', `status-${myClub.status}`]">
            <div class="status-icon">{{ statusIcons[myClub.status] }}</div>
            <div class="status-info">
              <h3>{{ myClub.name }}</h3>
              <div class="status-line">
                <span :class="['status-badge', `status-${myClub.status}`]">{{ statusLabels[myClub.status] }}</span>
                <span class="status-time">{{ formatDate(myClub.created_at) }} 申请</span>
              </div>
              <p v-if="myClub.reject_reason" class="reject-msg">驳回原因：{{ myClub.reject_reason }}</p>
            </div>
            <div class="status-actions">
              <button v-if="myClub.status === 'active'" class="btn btn-primary" @click="$router.push('/leader/manage')">
                进入管理 →
              </button>
              <button v-if="myClub.status === 'rejected'" class="btn btn-secondary" @click="resetForm">
                修改重提
              </button>
            </div>
          </div>
          <div v-if="myClub.status === 'pending'" class="pending-hint card">
            <span class="hint-icon">⏰</span>
            <div>
              <h4>审核中，请耐心等待</h4>
              <p>管理员通常在24小时内完成审核，审核结果将通过通知告知</p>
            </div>
          </div>
        </template>

        <!-- 申请表单 -->
        <div v-else-if="showForm" class="card apply-form-card">
          <div class="form-top">
            <h2 class="form-title">🏠 社团入驻申请</h2>
            <p class="form-sub">填写社团基本信息，提交后等待管理员审核（通常24小时内）</p>
          </div>

          <form @submit.prevent="handleSubmit">
            <div class="form-section">
              <h4 class="form-section-title">基本信息</h4>
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">社团名称 <span class="required">*</span></label>
                  <input v-model="form.name" class="form-input" placeholder="全名，唯一不可重复" />
                </div>
                <div class="form-group">
                  <label class="form-label">兴趣分类 <span class="required">*</span></label>
                  <select v-model="form.category" class="form-input">
                    <option value="">请选择分类</option>
                    <option v-for="c in categories" :key="c.key" :value="c.key">{{ c.emoji }} {{ c.name }}</option>
                  </select>
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">招新标签 <span class="required">*</span> <span class="optional">（最多3个，用于匹配学生）</span></label>
                <div class="tag-select-grid">
                  <button
                    v-for="tag in allTags" :key="tag"
                    type="button"
                    :class="['tag-select-btn', { selected: form.tags.includes(tag), disabled: !form.tags.includes(tag) && form.tags.length >= 3 }]"
                    @click="toggleTag(tag)"
                    :disabled="!form.tags.includes(tag) && form.tags.length >= 3"
                  >{{ tag }}</button>
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">社团简介 <span class="required">*</span></label>
                <textarea v-model="form.description" class="form-input form-textarea" placeholder="介绍社团的活动内容、特色和魅力（200字以内）" maxlength="200" rows="4"></textarea>
                <div class="form-hint">{{ form.description.length }}/200</div>
              </div>
            </div>

            <div class="form-section">
              <h4 class="form-section-title">招新设置</h4>
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">招新人数上限</label>
                  <input v-model.number="form.max_members" class="form-input" type="number" min="1" max="500" placeholder="30" />
                </div>
                <div class="form-group">
                  <label class="form-label">招新截止时间</label>
                  <input v-model="form.recruit_end_at" class="form-input" type="datetime-local" />
                </div>
              </div>
            </div>

            <div class="form-section">
              <h4 class="form-section-title">联系方式</h4>
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">微信号</label>
                  <input v-model="form.contact_info.wechat" class="form-input" placeholder="负责人微信" />
                </div>
                <div class="form-group">
                  <label class="form-label">QQ号</label>
                  <input v-model="form.contact_info.qq" class="form-input" placeholder="社团QQ" />
                </div>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">负责人姓名 <span class="required">*</span></label>
                  <input v-model="form.leader_name" class="form-input" :placeholder="authStore.user?.name" />
                </div>
                <div class="form-group">
                  <label class="form-label">联系电话 <span class="required">*</span></label>
                  <input v-model="form.contact_info.phone" class="form-input" placeholder="手机号" />
                </div>
              </div>
            </div>

            <div v-if="error" class="auth-error">⚠️ {{ error }}</div>

            <div class="form-actions">
              <button type="submit" class="btn btn-primary btn-lg btn-block" :disabled="loading">
                <span v-if="loading" class="loading-spin" style="width:18px;height:18px;border-width:2px"></span>
                <span v-else>提交申请</span>
              </button>
            </div>
          </form>
        </div>

        <!-- 初始加载 -->
        <div v-else class="loading-overlay" style="min-height:400px"><div class="loading-spin"></div></div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, onMounted, inject } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import AppLayout from '@/components/AppLayout.vue'
import request from '@/utils/request'

const router = useRouter()
const authStore = useAuthStore()
const showToast = inject('showToast')
const myClub = ref(null)
const showForm = ref(false)
const loading = ref(false)
const error = ref('')

const categories = [
  { key: 'art', emoji: '🎨', name: '文艺创作' },
  { key: 'sport', emoji: '⚽', name: '体育运动' },
  { key: 'academic', emoji: '🔬', name: '学术科技' },
  { key: 'public', emoji: '💚', name: '公益实践' },
  { key: 'comprehensive', emoji: '⭐', name: '综合类' },
]
const allTags = ['摄影', '音乐', '舞蹈', '绘画', '球类', '健身', '编程', '辩论', '志愿服务', '环保', '周中晚上', '周末全天', '周末半天', '节假日', '5小时以上', '2-5小时', '1-2小时', '轻度参与', '中度参与', '高度参与']

const statusLabels = { pending: '审核中', active: '审核通过', rejected: '审核未通过', offline: '已下架', suspended: '已暂停' }
const statusIcons = { pending: '⏳', active: '✅', rejected: '❌', offline: '🚫', suspended: '⏸' }

const form = ref({
  name: '', category: '', tags: [], description: '', max_members: 30,
  recruit_end_at: '', leader_name: '', contact_info: { wechat: '', qq: '', phone: '' }
})

function toggleTag(tag) {
  const idx = form.value.tags.indexOf(tag)
  if (idx === -1) { if (form.value.tags.length < 3) form.value.tags.push(tag) }
  else form.value.tags.splice(idx, 1)
}

function formatDate(d) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('zh-CN')
}

function resetForm() {
  myClub.value = null
  showForm.value = true
  if (myClub.value) {
    form.value.name = myClub.value.name
    form.value.category = myClub.value.category
  }
}

async function handleSubmit() {
  if (!form.value.name || !form.value.category || !form.value.tags.length || !form.value.description || !form.value.contact_info.phone) {
    error.value = '请填写所有必填项（名称、分类、标签、简介、电话）'
    return
  }
  loading.value = true
  error.value = ''
  try {
    await request.post('/clubs/apply', form.value)
    showToast('申请已提交，等待审核！', 'success')
    const res = await request.get('/clubs/my/club')
    myClub.value = res.data
    showForm.value = false
  } catch (e) {
    error.value = e.message
  } finally { loading.value = false }
}

onMounted(async () => {
  try {
    const res = await request.get('/clubs/my/club')
    myClub.value = res.data
    showForm.value = !res.data
  } catch { showForm.value = true }
  finally { if (!myClub.value && !showForm.value) showForm.value = true }
})
</script>

<style scoped>
.leader-apply-page { padding: 32px 0; }
.apply-inner { max-width: 720px; margin: 0 auto; padding: 0 24px; display: flex; flex-direction: column; gap: 20px; }
.status-card { padding: 28px; display: flex; align-items: flex-start; gap: 20px; }
.status-icon { font-size: 40px; flex-shrink: 0; }
.status-info { flex: 1; }
.status-info h3 { font-size: 20px; font-weight: 800; margin-bottom: 10px; }
.status-line { display: flex; align-items: center; gap: 12px; margin-bottom: 8px; }
.status-time { font-size: 12px; color: var(--color-text-muted); }
.reject-msg { font-size: 13px; color: var(--color-error); background: rgba(245,34,45,.06); padding: 8px 12px; border-radius: 8px; margin-top: 8px; }
.pending-hint { padding: 20px 24px; display: flex; gap: 16px; align-items: center; background: rgba(250,173,20,.06); border: 1.5px solid rgba(250,173,20,.2); }
.hint-icon { font-size: 28px; }
.pending-hint h4 { font-size: 14px; font-weight: 700; margin-bottom: 4px; }
.pending-hint p { font-size: 12px; color: var(--color-text-muted); }
.apply-form-card { padding: 36px; }
.form-top { margin-bottom: 28px; }
.form-title { font-size: 22px; font-weight: 800; margin-bottom: 6px; }
.form-sub { font-size: 13px; color: var(--color-text-muted); }
.form-section { margin-bottom: 28px; padding-bottom: 24px; border-bottom: 1px solid var(--color-border); }
.form-section:last-of-type { border-bottom: none; }
.form-section-title { font-size: 14px; font-weight: 700; color: var(--color-primary); margin-bottom: 16px; padding: 4px 10px; background: rgba(102,126,234,.08); border-radius: 6px; display: inline-block; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.tag-select-grid { display: flex; flex-wrap: wrap; gap: 8px; }
.tag-select-btn {
  padding: 6px 14px; border-radius: 50px; font-size: 12px; font-weight: 500;
  border: 1.5px solid var(--color-border); background: #fff; cursor: pointer; transition: var(--transition);
  color: var(--color-text-secondary);
}
.tag-select-btn:hover:not(.disabled) { border-color: var(--color-primary); color: var(--color-primary); }
.tag-select-btn.selected { background: var(--gradient-primary); border-color: transparent; color: #fff; }
.tag-select-btn.disabled { opacity: .4; cursor: not-allowed; }
.form-actions { margin-top: 8px; }
.auth-error { background: rgba(245,34,45,.08); color: var(--color-error); border-radius: 10px; padding: 10px 14px; font-size: 13px; margin-bottom: 16px; }
@media (max-width: 640px) { .form-row { grid-template-columns: 1fr; } .apply-form-card { padding: 24px 16px; } }
</style>
