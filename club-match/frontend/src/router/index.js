import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes = [
  // 公共路由
  { path: '/', name: 'Home', component: () => import('@/views/student/HomeView.vue') },
  { path: '/login', name: 'Login', component: () => import('@/views/auth/LoginView.vue') },
  { path: '/register', name: 'Register', component: () => import('@/views/auth/RegisterView.vue') },
  { path: '/clubs', name: 'ClubList', component: () => import('@/views/student/ClubListView.vue') },
  { path: '/clubs/:id', name: 'ClubDetail', component: () => import('@/views/student/ClubDetailView.vue') },

  // 学生路由（需登录）
  { path: '/assessment', name: 'Assessment', component: () => import('@/views/student/AssessmentView.vue'), meta: { requiresAuth: true, role: 'student' } },
  { path: '/recommend', name: 'Recommend', component: () => import('@/views/student/RecommendView.vue') },
  { path: '/apply/:clubId', name: 'ApplyForm', component: () => import('@/views/student/ApplyFormView.vue'), meta: { requiresAuth: true } },
  { path: '/my-applications', name: 'MyApplications', component: () => import('@/views/student/MyApplicationsView.vue'), meta: { requiresAuth: true } },
  { path: '/notifications', name: 'Notifications', component: () => import('@/views/student/NotificationsView.vue'), meta: { requiresAuth: true } },
  { path: '/profile', name: 'Profile', component: () => import('@/views/student/ProfileView.vue'), meta: { requiresAuth: true } },
  { path: '/favorites', name: 'Favorites', component: () => import('@/views/student/FavoritesView.vue'), meta: { requiresAuth: true } },

  // 社团端路由
  { path: '/leader/apply', name: 'LeaderApply', component: () => import('@/views/leader/LeaderApplyView.vue'), meta: { requiresAuth: true, role: 'leader' } },
  { path: '/leader/manage', name: 'LeaderManage', component: () => import('@/views/leader/LeaderManageView.vue'), meta: { requiresAuth: true, role: 'leader' } },
  { path: '/leader/applications', name: 'LeaderApplications', component: () => import('@/views/leader/LeaderApplicationsView.vue'), meta: { requiresAuth: true, role: 'leader' } },
  { path: '/leader/stats', name: 'LeaderStats', component: () => import('@/views/leader/LeaderStatsView.vue'), meta: { requiresAuth: true, role: 'leader' } },

  // 管理端路由
  { path: '/admin/dashboard', name: 'AdminDashboard', component: () => import('@/views/admin/DashboardView.vue'), meta: { requiresAuth: true, role: 'admin' } },
  { path: '/admin/clubs', name: 'AdminClubs', component: () => import('@/views/admin/ClubsManageView.vue'), meta: { requiresAuth: true, role: 'admin' } },
  { path: '/admin/notifications', name: 'AdminNotifications', component: () => import('@/views/admin/NotificationsManageView.vue'), meta: { requiresAuth: true, role: 'admin' } },

  { path: '/:pathMatch(.*)*', redirect: '/' },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() { return { top: 0 } }
})

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  if (to.meta.requiresAuth && !authStore.isLoggedIn) {
    next({ name: 'Login', query: { redirect: to.fullPath } })
  } else {
    next()
  }
})

export default router
