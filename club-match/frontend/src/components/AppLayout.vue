<template>
  <div class="layout-wrapper" :class="{ 'has-sidebar': hasSidebar }">
    <!-- 顶部导航栏 -->
    <header class="app-header">
      <div class="header-inner">
        <div class="header-logo" @click="goHome">
          <span class="logo-icon">🎯</span>
          <span class="logo-text">社团招新平台</span>
        </div>

        <!-- 导航链接（桌面端） -->
        <nav class="header-nav" v-if="!authStore.isAdmin">
          <router-link to="/" class="nav-link">首页</router-link>
          <router-link to="/clubs" class="nav-link">发现社团</router-link>
          <router-link v-if="authStore.isLoggedIn && !authStore.isLeader" to="/recommend" class="nav-link">我的推荐</router-link>
          <router-link v-if="authStore.isLoggedIn && !authStore.isLeader" to="/my-applications" class="nav-link">我的报名</router-link>
        </nav>

        <div class="header-actions">
          <!-- 通知铃铛 -->
          <div v-if="authStore.isLoggedIn" class="notif-bell" @click="$router.push('/notifications')">
            <span>🔔</span>
            <span v-if="unreadCount > 0" class="notif-dot">{{ unreadCount > 99 ? '99+' : unreadCount }}</span>
          </div>

          <!-- 用户菜单 -->
          <div v-if="authStore.isLoggedIn" class="user-menu" @click="toggleUserMenu" ref="userMenuRef">
            <div class="user-avatar">
              <img v-if="authStore.user?.avatar_url" :src="authStore.user.avatar_url" alt="头像" />
              <span v-else>{{ (authStore.user?.name || authStore.user?.username || '?').charAt(0).toUpperCase() }}</span>
            </div>
            <span class="user-name">{{ authStore.user?.name || authStore.user?.username }}</span>
            <span class="menu-arrow">▾</span>

            <div v-if="showUserMenu" class="user-dropdown">
              <div class="dropdown-item" @click="goProfile"><span>👤</span> 个人中心</div>
              <div v-if="authStore.isStudent" class="dropdown-item" @click="$router.push('/favorites')"><span>❤️</span> 我的收藏</div>
              <div v-if="authStore.isLeader" class="dropdown-item" @click="$router.push('/leader/manage')"><span>🏠</span> 社团管理</div>
              <div v-if="authStore.isAdmin" class="dropdown-item" @click="$router.push('/admin/dashboard')"><span>⚙️</span> 管理后台</div>
              <div class="dropdown-divider"></div>
              <div class="dropdown-item danger" @click="handleLogout"><span>🚪</span> 退出登录</div>
            </div>
          </div>

          <!-- 未登录 -->
          <template v-else>
            <button class="btn btn-ghost btn-sm" @click="$router.push('/login')">登录</button>
            <button class="btn btn-primary btn-sm" @click="$router.push('/register')">注册</button>
          </template>

          <!-- 移动端菜单按钮 -->
          <button class="mobile-menu-btn" @click="toggleMobileMenu">
            <span></span><span></span><span></span>
          </button>
        </div>
      </div>

      <!-- 移动端菜单 -->
      <div v-if="showMobileMenu" class="mobile-nav">
        <router-link to="/" class="mobile-nav-link" @click="showMobileMenu=false">首页</router-link>
        <router-link to="/clubs" class="mobile-nav-link" @click="showMobileMenu=false">发现社团</router-link>
        <router-link v-if="authStore.isLoggedIn" to="/recommend" class="mobile-nav-link" @click="showMobileMenu=false">我的推荐</router-link>
        <router-link v-if="authStore.isLoggedIn" to="/my-applications" class="mobile-nav-link" @click="showMobileMenu=false">我的报名</router-link>
        <router-link v-if="authStore.isLoggedIn" to="/notifications" class="mobile-nav-link" @click="showMobileMenu=false">通知中心</router-link>
        <div v-if="!authStore.isLoggedIn" style="padding:12px 16px;display:flex;gap:8px;">
          <button class="btn btn-secondary btn-sm" style="flex:1" @click="$router.push('/login');showMobileMenu=false">登录</button>
          <button class="btn btn-primary btn-sm" style="flex:1" @click="$router.push('/register');showMobileMenu=false">注册</button>
        </div>
        <div v-else class="mobile-nav-link danger" @click="handleLogout">🚪 退出登录</div>
      </div>
    </header>

    <!-- 主内容区 -->
    <main class="app-main">
      <slot />
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import request from '@/utils/request'

const props = defineProps({ hasSidebar: Boolean })
const authStore = useAuthStore()
const router = useRouter()
const showUserMenu = ref(false)
const showMobileMenu = ref(false)
const userMenuRef = ref(null)
const unreadCount = ref(0)

function goHome() {
  if (authStore.isAdmin) router.push('/admin/dashboard')
  else if (authStore.isLeader) router.push('/leader/manage')
  else router.push('/')
}

function goProfile() {
  showUserMenu.value = false
  if (authStore.isAdmin) router.push('/admin/dashboard')
  else if (authStore.isLeader) router.push('/leader/manage')
  else router.push('/profile')
}

function toggleUserMenu() { showUserMenu.value = !showUserMenu.value }
function toggleMobileMenu() { showMobileMenu.value = !showMobileMenu.value }

function handleLogout() {
  authStore.logout()
  showUserMenu.value = false
  showMobileMenu.value = false
  router.push('/')
}

function handleClickOutside(e) {
  if (userMenuRef.value && !userMenuRef.value.contains(e.target)) {
    showUserMenu.value = false
  }
}

async function fetchUnreadCount() {
  if (!authStore.isLoggedIn) return
  try {
    const res = await request.get('/notifications')
    unreadCount.value = res.data?.unread_count || 0
  } catch {}
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  fetchUnreadCount()
})
onUnmounted(() => document.removeEventListener('click', handleClickOutside))
</script>

<style scoped>
.layout-wrapper { min-height: 100vh; display: flex; flex-direction: column; }
.app-header {
  position: sticky; top: 0; z-index: 100;
  background: rgba(255,255,255,0.92); backdrop-filter: blur(16px);
  border-bottom: 1px solid rgba(102,126,234,0.12);
  box-shadow: 0 2px 16px rgba(102,126,234,0.08);
}
.header-inner {
  max-width: 1280px; margin: 0 auto; padding: 0 24px;
  height: var(--header-height); display: flex; align-items: center; gap: 32px;
}
.header-logo {
  display: flex; align-items: center; gap: 10px; cursor: pointer;
  font-weight: 800; font-size: 18px; color: var(--color-text);
  flex-shrink: 0;
}
.logo-icon { font-size: 24px; }
.logo-text { background: var(--gradient-primary); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
.header-nav { display: flex; align-items: center; gap: 4px; flex: 1; }
.nav-link {
  padding: 8px 14px; border-radius: 10px;
  font-size: 14px; font-weight: 500; color: var(--color-text-secondary);
  transition: var(--transition);
}
.nav-link:hover, .nav-link.router-link-active { background: rgba(102,126,234,0.1); color: var(--color-primary); }
.header-actions { display: flex; align-items: center; gap: 12px; margin-left: auto; }
.notif-bell {
  position: relative; width: 38px; height: 38px;
  display: flex; align-items: center; justify-content: center;
  border-radius: 50%; cursor: pointer; transition: var(--transition);
  background: transparent;
}
.notif-bell:hover { background: rgba(102,126,234,0.1); }
.notif-bell span:first-child { font-size: 20px; }
.notif-dot {
  position: absolute; top: 4px; right: 4px;
  background: var(--color-error); color: #fff;
  font-size: 10px; font-weight: 700; padding: 1px 4px; border-radius: 10px;
  min-width: 16px; text-align: center; line-height: 14px;
}
.user-menu {
  position: relative; display: flex; align-items: center; gap: 8px;
  padding: 6px 12px; border-radius: 50px; cursor: pointer;
  transition: var(--transition); background: transparent;
}
.user-menu:hover { background: rgba(102,126,234,0.1); }
.user-avatar {
  width: 32px; height: 32px; border-radius: 50%; overflow: hidden;
  background: var(--gradient-primary); display: flex; align-items: center; justify-content: center;
  color: #fff; font-size: 14px; font-weight: 700; flex-shrink: 0;
}
.user-avatar img { width: 100%; height: 100%; object-fit: cover; }
.user-name { font-size: 14px; font-weight: 600; max-width: 80px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.menu-arrow { font-size: 12px; color: var(--color-text-muted); }
.user-dropdown {
  position: absolute; top: calc(100% + 8px); right: 0;
  background: #fff; border-radius: 16px;
  box-shadow: 0 8px 40px rgba(0,0,0,0.15);
  min-width: 170px; overflow: hidden;
  animation: scaleIn 0.18s cubic-bezier(0.34,1.56,0.64,1);
  transform-origin: top right;
}
.dropdown-item {
  padding: 12px 18px; font-size: 14px; cursor: pointer;
  display: flex; align-items: center; gap: 10px;
  transition: background 0.15s; color: var(--color-text);
}
.dropdown-item:hover { background: rgba(102,126,234,0.06); }
.dropdown-item.danger { color: var(--color-error); }
.dropdown-item.danger:hover { background: rgba(245,34,45,0.06); }
.dropdown-divider { height: 1px; background: var(--color-border); margin: 4px 0; }
.app-main { flex: 1; }
.mobile-menu-btn {
  display: none; flex-direction: column; gap: 5px;
  background: transparent; padding: 6px;
}
.mobile-menu-btn span { display: block; width: 22px; height: 2px; background: var(--color-text); border-radius: 2px; }
.mobile-nav {
  background: #fff; border-top: 1px solid var(--color-border);
  padding: 8px 0;
}
.mobile-nav-link {
  display: block; padding: 12px 24px; font-size: 15px; font-weight: 500;
  color: var(--color-text); transition: background 0.15s;
}
.mobile-nav-link:hover { background: rgba(102,126,234,0.06); }
.mobile-nav-link.router-link-active { color: var(--color-primary); background: rgba(102,126,234,0.06); }
.mobile-nav-link.danger { color: var(--color-error); cursor: pointer; }
@media (max-width: 768px) {
  .header-nav, .user-name, .menu-arrow { display: none; }
  .mobile-menu-btn { display: flex; }
}
</style>
