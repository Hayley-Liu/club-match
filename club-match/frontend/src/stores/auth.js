import { defineStore } from 'pinia'
import request from '@/utils/request'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: JSON.parse(localStorage.getItem('user') || 'null'),
    token: localStorage.getItem('token') || '',
  }),
  getters: {
    isLoggedIn: s => !!s.token && !!s.user,
    isStudent: s => s.user?.role === 'student',
    isLeader: s => s.user?.role === 'leader',
    isAdmin: s => s.user?.role === 'admin',
  },
  actions: {
    async login(username, password) {
      const res = await request.post('/auth/login', { username, password })
      this.token = res.data.token
      this.user = res.data.user
      localStorage.setItem('token', res.data.token)
      localStorage.setItem('user', JSON.stringify(res.data.user))
      return res.data
    },
    async register(data) {
      const res = await request.post('/auth/register', data)
      this.token = res.data.token
      this.user = res.data.user
      localStorage.setItem('token', res.data.token)
      localStorage.setItem('user', JSON.stringify(res.data.user))
      return res.data
    },
    async fetchProfile() {
      const res = await request.get('/auth/profile')
      this.user = res.data
      localStorage.setItem('user', JSON.stringify(res.data))
      return res.data
    },
    logout() {
      this.token = ''
      this.user = null
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    }
  }
})
