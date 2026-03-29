<template>
  <AppLayout>
    <div class="apply-page">
      <div class="apply-inner" v-if="club">
        <!-- 社团信息卡 -->
        <div class="club-preview card">
          <img :src="club.cover_image || defaultCover" class="preview-img" alt="" />
          <div class="preview-info">
            <h3 class="preview-name">{{ club.name }}</h3>
            <div class="preview-meta">
              <span v-if="club.match_score > 0" :class="['match-badge', matchClass]">⭐ {{ club.match_score }}% 匹配</span>
              <span class="status-badge status-recruiting" v-if="club.is_recruiting">招新中</span>
            </div>
            <div class="preview-tags">
              <span v-for="t in club.tags" :key="t" class="tag tag-purple">{{ t }}</span>
            </div>
          </div>
        </div>

        <!-- 报名表单 -->
        <div class="card apply-form-card">
          <h2 class="form-title">📝 填写报名信息</h2>
          <p class="form-sub">以下信息将发送给社团负责人，请如实填写</p>

          <form @submit.prevent="handleSubmit">
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">姓名 <span class="required">*</span></label>
                <input v-model="form.name" class="form-input" type="text" placeholder="你的真实姓名" />
              </div>
              <div class="form-group">
                <label class="form-label">学号</label>
                <input v-model="form.student_id" class="form-input" type="text" placeholder="学号" />
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">手机号 <span class="required">*</span></label>
                <input v-model="form.phone" class="form-input" type="tel" placeholder="联系手机号" />
              </div>
              <div class="form-group">
                <label class="form-label">专业</label>
                <input v-model="form.major" class="form-input" type="text" placeholder="就读专业" />
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">自我介绍 <span class="optional">（选填）</span></label>
              <textarea v-model="form.introduction" class="form-input form-textarea" placeholder="介绍一下你自己，为什么想加入这个社团？（200字以内）" maxlength="200"></textarea>
              <div class="form-hint">{{ form.introduction.length }}/200</div>
            </div>
            <div class="form-group">
              <label class="form-label">特长标签 <span class="optional">（选填，多选）</span></label>
              <div class="skill-tags-grid">
                <button
                  v-for="tag in skillOptions" :key="tag"
                  type="button"
                  :class="['skill-tag', { selected: form.skill_tags.includes(tag) }]"
                  @click="toggleSkillTag(tag)"
                >{{ tag }}</button>
              </div>
            </div>
            <div v-if="error" class="auth-error">⚠️ {{ error }}</div>
            <div class="form-actions">
              <button type="button" class="btn btn-secondary" @click="$router.go(-1)">取消</button>
              <button type="submit" class="btn btn-primary btn-lg" :disabled="loading">
                <span v-if="loading" class="loading-spin" style="width:18px;height:18px;border-width:2px"></span>
                <span v-else>🎉 提交报名</span>
              </button>
            </div>
          </form>
        </div>
      </div>
      <div v-else class="loading-overlay" style="min-height:50vh"><div class="loading-spin"></div></div>
    </div>

    <!-- 成功弹窗 -->
    <div v-if="showSuccess" class="modal-overlay">
      <div class="modal success-modal">
        <div class="success-icon">🎉</div>
        <h3>报名成功！</h3>
        <p>你已成功报名 <strong>{{ club?.name }}</strong>，请耐心等待审核结果。</p>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="$router.push('/clubs')">继续浏览社团</button>
          <button class="btn btn-primary" @click="$router.push('/my-applications')">查看我的报名</button>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted, inject } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import AppLayout from '@/components/AppLayout.vue'
import request from '@/utils/request'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const showToast = inject('showToast')
const defaultCover = 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800'

const club = ref(null)
const loading = ref(false)
const error = ref('')
const showSuccess = ref(false)

const form = ref({
  name: authStore.user?.name || '',
  student_id: authStore.user?.student_id || '',
  phone: authStore.user?.phone || '',
  major: authStore.user?.major || '',
  introduction: '',
  skill_tags: [],
})

const skillOptions = ['摄影', '音乐', '舞蹈', '绘画', '编程', '写作', '运动', '设计', '演讲', '组织管理', '活动策划', '剪辑']

const matchClass = computed(() => {
  const s = club.value?.match_score
  if (s >= 80) return 'match-high'
  if (s >= 50) return 'match-mid'
  return 'match-low'
})

function toggleSkillTag(tag) {
  const idx = form.value.skill_tags.indexOf(tag)
  if (idx === -1) form.value.skill_tags.push(tag)
  else form.value.skill_tags.splice(idx, 1)
}

async function handleSubmit() {
  if (!form.value.name || !form.value.phone) {
    error.value = '姓名和手机号为必填项'
    return
  }
  loading.value = true
  error.value = ''
  try {
    await request.post('/applications', {
      club_id: parseInt(route.params.clubId),
      ...form.value,
    })
    showSuccess.value = true
  } catch (e) {
    error.value = e.message || '报名失败，请重试'
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  try {
    const res = await request.get(`/clubs/${route.params.clubId}`)
    club.value = res.data
  } catch { router.push('/clubs') }
})
</script>

<style scoped>
.apply-page { padding: 32px 0; }
.apply-inner { max-width: 680px; margin: 0 auto; padding: 0 24px; display: flex; flex-direction: column; gap: 20px; }
.club-preview { display: flex; gap: 16px; padding: 20px; }
.preview-img { width: 100px; height: 70px; object-fit: cover; border-radius: 12px; flex-shrink: 0; }
.preview-info { flex: 1; display: flex; flex-direction: column; gap: 8px; }
.preview-name { font-size: 18px; font-weight: 700; }
.preview-meta { display: flex; gap: 8px; align-items: center; }
.preview-tags { display: flex; flex-wrap: wrap; gap: 6px; }
.apply-form-card { padding: 36px; }
.form-title { font-size: 22px; font-weight: 800; margin-bottom: 6px; }
.form-sub { font-size: 13px; color: var(--color-text-muted); margin-bottom: 28px; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.optional { font-weight: 400; color: var(--color-text-muted); font-size: 12px; }
.skill-tags-grid { display: flex; flex-wrap: wrap; gap: 10px; }
.skill-tag {
  padding: 6px 14px; border-radius: 50px; font-size: 13px;
  border: 1.5px solid var(--color-border); background: #fff;
  cursor: pointer; transition: var(--transition); color: var(--color-text-secondary);
}
.skill-tag:hover { border-color: var(--color-primary); }
.skill-tag.selected { background: var(--gradient-primary); border-color: transparent; color: #fff; }
.form-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 8px; }
.auth-error { background: rgba(245,34,45,.08); color: var(--color-error); border-radius: 10px; padding: 10px 14px; font-size: 13px; margin-bottom: 16px; }
.success-modal { text-align: center; }
.success-icon { font-size: 64px; margin-bottom: 16px; }
@media (max-width: 640px) { .form-row { grid-template-columns: 1fr; } .apply-form-card { padding: 24px 20px; } }
</style>
