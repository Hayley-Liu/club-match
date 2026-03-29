import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, Club, Application, Notification, AssessmentTags } from '../types';
import { MOCK_USERS, MOCK_CLUBS, MOCK_APPLICATIONS, MOCK_NOTIFICATIONS } from '../data/mockData';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface StoreState {
  // Auth
  currentUser: User | null;
  users: User[];
  login: (username: string, password: string) => boolean;
  loginByPhone: (phone: string, password?: string) => 'ok' | 'not_found' | 'wrong_password';
  logout: () => void;
  register: (data: Partial<User>) => boolean;
  updateUser: (updates: Partial<User>) => void;

  // Clubs
  clubs: Club[];
  getApprovedClubs: () => Club[];
  getClubById: (id: string) => Club | undefined;
  getClubByPresidentId: (presidentId: string) => Club | undefined;
  updateClub: (id: string, updates: Partial<Club>) => void;
  addClub: (club: Club) => void;
  submitClubApplication: (data: Partial<Club>) => string;

  // Applications
  applications: Application[];
  getApplicationsByClubId: (clubId: string) => Application[];
  getApplicationsByStudentId: (studentId: string) => Application[];
  submitApplication: (data: Omit<Application, 'id' | 'createdAt'>) => boolean;
  updateApplicationStatus: (id: string, status: Application['status'], rejectReason?: string) => void;
  cancelApplication: (id: string) => void;

  // Assessment
  saveAssessmentDraft: (answers: Record<number, string[]>) => void;
  completeAssessment: (tags: AssessmentTags) => void;
  clearAssessmentDraft: () => void;

  // Favorites
  toggleFavorite: (clubId: string) => void;
  isFavorited: (clubId: string) => boolean;

  // Notifications
  notifications: Notification[];
  addNotification: (notif: Omit<Notification, 'id' | 'createdAt' | 'readBy' | 'isWithdrawn'>) => void;
  markNotificationRead: (id: string) => void;
  markAllRead: () => void;
  withdrawNotification: (id: string) => void;
  deleteNotification: (id: string) => void;
  getUnreadCount: () => number;
  getUserNotifications: () => Notification[];
  addSystemNotification: (targetUserId: string, title: string, content: string, targetRole?: Notification['targetRole']) => void;

  // Toast
  toasts: Toast[];
  showToast: (message: string, type?: Toast['type']) => void;
  removeToast: (id: string) => void;

  // Match score calculation
  calcMatchScore: (club: Club) => number;
  getRecommendedClubs: () => Array<Club & { matchScore: number }>;

  // internal helper
  isNotificationForUser: (n: Notification) => boolean;
}

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      // Initial state
      currentUser: null,
      users: MOCK_USERS,
      clubs: MOCK_CLUBS,
      applications: MOCK_APPLICATIONS,
      notifications: MOCK_NOTIFICATIONS,
      toasts: [],

      // ─── Auth ───────────────────────────────────────────────────────────────

      login: (username, password) => {
        const user = get().users.find(u => u.username === username && u.password === password);
        if (user) { set({ currentUser: user }); return true; }
        return false;
      },

      loginByPhone: (phone, password) => {
        const users = get().users;
        const user = users.find(u => u.phone === phone);
        if (!user) return 'not_found';
        if (password !== undefined && user.password !== password) return 'wrong_password';
        set({ currentUser: user });
        return 'ok';
      },

      logout: () => { set({ currentUser: null }); },

      register: (data) => {
        const users = get().users;
        // 用手机号作为 username，同时检查 username 和 phone 唯一性
        const phoneExists = data.phone && users.find(u => u.phone === data.phone);
        const usernameExists = data.username && users.find(u => u.username === data.username);
        if (phoneExists || usernameExists) return false;
        const newUser: User = {
          id: `u_${Date.now()}`,
          username: data.username || data.phone || `u_${Date.now()}`,
          password: data.password!,
          role: data.role || 'student',
          name: data.name!,
          phone: data.phone,
          studentId: data.studentId,
          major: data.major,
          favorites: [],
          ...data,
        };
        set(state => ({ users: [...state.users, newUser], currentUser: newUser }));
        return true;
      },

      updateUser: (updates) => {
        const user = get().currentUser;
        if (!user) return;
        const updatedUser = { ...user, ...updates };
        set(state => ({
          currentUser: updatedUser,
          users: state.users.map(u => u.id === user.id ? updatedUser : u),
        }));
      },

      // ─── Clubs ──────────────────────────────────────────────────────────────

      getApprovedClubs: () => get().clubs.filter(c => c.status === 'approved'),

      getClubById: (id) => get().clubs.find(c => c.id === id),

      getClubByPresidentId: (presidentId) => get().clubs.find(c => c.presidentId === presidentId),

      updateClub: (id, updates) => {
        set(state => ({ clubs: state.clubs.map(c => c.id === id ? { ...c, ...updates } : c) }));
      },

      addClub: (club) => set(state => ({ clubs: [...state.clubs, club] })),

      submitClubApplication: (data) => {
        const id = `c_${Date.now()}`;
        const newClub: Club = {
          id,
          name: data.name || '',
          category: data.category || '',
          categoryColor: 'tag-art',
          tags: data.tags || [],
          interestTags: data.tags || [],
          timeTags: [],
          skillTags: [],
          description: data.description || '',
          detailDescription: data.description || '',
          presidentId: data.presidentId || '',
          presidentName: data.presidentName || '',
          phone: data.phone || '',
          maxMembers: data.maxMembers || 30,
          currentMembers: 0,
          deadline: data.deadline || '',
          status: 'pending',
          coverEmoji: '🌟',
          coverColor: 'from-purple-500 to-pink-500',
          applicationCount: 0,
          activities: [],
          requirements: data.requirements || '',
          createdAt: new Date().toISOString().split('T')[0],
          ...data,
        };
        set(state => ({ clubs: [...state.clubs, newClub] }));
        return id;
      },

      // ─── Applications ────────────────────────────────────────────────────────

      getApplicationsByClubId: (clubId) => get().applications.filter(a => a.clubId === clubId),

      getApplicationsByStudentId: (studentId) => get().applications.filter(a => a.studentId === studentId),

      submitApplication: (data) => {
        const existing = get().applications.find(a => a.clubId === data.clubId && a.studentId === data.studentId);
        if (existing) return false;
        const newApp: Application = {
          ...data,
          id: `a_${Date.now()}`,
          createdAt: new Date().toISOString().split('T')[0],
          status: 'pending',
        };
        set(state => ({
          applications: [...state.applications, newApp],
          clubs: state.clubs.map(c =>
            c.id === data.clubId ? { ...c, applicationCount: c.applicationCount + 1 } : c
          ),
        }));
        const club = get().getClubById(data.clubId);
        if (club) {
          get().addSystemNotification(
            club.presidentId,
            '📋 您有新的报名申请待审核',
            `${data.studentName} 申请加入 ${data.clubName}，请及时审核。`,
            'club'
          );
        }
        return true;
      },

      updateApplicationStatus: (id, status, rejectReason) => {
        const app = get().applications.find(a => a.id === id);
        if (!app) return;
        set(state => ({
          applications: state.applications.map(a => a.id === id ? { ...a, status, rejectReason } : a),
        }));
        if (status === 'approved') {
          get().addSystemNotification(
            app.studentId,
            `🎉 ${app.clubName} 报名已通过！`,
            `恭喜！您申请加入 ${app.clubName} 已通过审核，请查看社长联系方式加入社团。`,
            'student'
          );
        } else if (status === 'rejected') {
          get().addSystemNotification(
            app.studentId,
            `😔 ${app.clubName} 报名未通过`,
            `您申请加入 ${app.clubName} 未通过审核。驳回原因：${rejectReason || '暂未说明'}`,
            'student'
          );
        }
      },

      cancelApplication: (id) => {
        const app = get().applications.find(a => a.id === id);
        if (!app) return;
        set(state => ({
          applications: state.applications.filter(a => a.id !== id),
          clubs: state.clubs.map(c =>
            c.id === app.clubId ? { ...c, applicationCount: Math.max(0, c.applicationCount - 1) } : c
          ),
        }));
      },

      // ─── Assessment ──────────────────────────────────────────────────────────

      saveAssessmentDraft: (answers) => {
        const user = get().currentUser;
        if (!user) return;
        get().updateUser({ assessmentDraft: { answers } });
      },

      completeAssessment: (tags) => {
        const today = new Date().toISOString().split('T')[0];
        get().updateUser({
          assessmentTags: tags,
          lastAssessmentDate: today,
          assessmentDraft: undefined,
        });
      },

      clearAssessmentDraft: () => {
        get().updateUser({ assessmentDraft: undefined });
      },

      // ─── Favorites ──────────────────────────────────────────────────────────

      toggleFavorite: (clubId) => {
        const user = get().currentUser;
        if (!user) return;
        const favorites = user.favorites.includes(clubId)
          ? user.favorites.filter(id => id !== clubId)
          : [...user.favorites, clubId];
        get().updateUser({ favorites });
      },

      isFavorited: (clubId) => {
        const user = get().currentUser;
        return user ? user.favorites.includes(clubId) : false;
      },

      // ─── Notifications ───────────────────────────────────────────────────────

      addNotification: (notif) => {
        const newNotif: Notification = {
          ...notif,
          id: `n_${Date.now()}`,
          createdAt: new Date().toISOString().split('T')[0],
          readBy: [],
          isWithdrawn: false,
        };
        set(state => ({ notifications: [newNotif, ...state.notifications] }));
      },

      markNotificationRead: (id) => {
        const user = get().currentUser;
        if (!user) return;
        set(state => ({
          notifications: state.notifications.map(n =>
            n.id === id && !n.readBy.includes(user.id)
              ? { ...n, readBy: [...n.readBy, user.id] }
              : n
          ),
        }));
      },

      markAllRead: () => {
        const user = get().currentUser;
        if (!user) return;
        set(state => ({
          notifications: state.notifications.map(n =>
            !n.readBy.includes(user.id) ? { ...n, readBy: [...n.readBy, user.id] } : n
          ),
        }));
      },

      withdrawNotification: (id) => {
        set(state => ({
          notifications: state.notifications.map(n => n.id === id ? { ...n, isWithdrawn: true } : n),
        }));
      },

      deleteNotification: (id) => {
        set(state => ({ notifications: state.notifications.filter(n => n.id !== id) }));
      },

      getUnreadCount: () => {
        const user = get().currentUser;
        if (!user) return 0;
        return get().notifications.filter(n => {
          if (n.isWithdrawn || n.readBy.includes(user.id)) return false;
          if (n.targetUserId) return n.targetUserId === user.id;
          if (n.targetRole === 'all') return true;
          return n.targetRole === user.role;
        }).length;
      },

      getUserNotifications: () => {
        const user = get().currentUser;
        if (!user) return [];
        return get().notifications.filter(n => {
          if (n.isWithdrawn) return false;
          if (n.targetUserId) return n.targetUserId === user.id;
          if (n.targetRole === 'all') return true;
          return n.targetRole === user.role;
        }).sort((a, b) => {
          if (a.isPinned && !b.isPinned) return -1;
          if (!a.isPinned && b.isPinned) return 1;
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
      },

      addSystemNotification: (targetUserId, title, content, targetRole = 'all') => {
        get().addNotification({
          title,
          content,
          type: 'system',
          targetRole,
          targetUserId,
          isPinned: false,
          createdBy: 'system',
        });
      },

      isNotificationForUser: (n: Notification) => {
        const user = get().currentUser;
        if (!user || n.isWithdrawn) return false;
        if (n.targetUserId) return n.targetUserId === user.id;
        if (n.targetRole === 'all') return true;
        return n.targetRole === user.role;
      },

      // ─── Toast ──────────────────────────────────────────────────────────────

      showToast: (message, type = 'success') => {
        const id = `t_${Date.now()}`;
        set(state => ({ toasts: [...state.toasts, { id, message, type }] }));
        setTimeout(() => get().removeToast(id), 3500);
      },

      removeToast: (id) => {
        set(state => ({ toasts: state.toasts.filter(t => t.id !== id) }));
      },

      // ─── Match score ─────────────────────────────────────────────────────────

      calcMatchScore: (club) => {
        const user = get().currentUser;
        if (!user?.assessmentTags) return 0;
        const userTags = user.assessmentTags.all;
        const interestMatches = club.interestTags.filter(t => userTags.includes(t)).length;
        const interestScore = club.interestTags.length > 0
          ? (interestMatches / club.interestTags.length) * 100 : 50;
        const timeMatches = club.timeTags.filter(t => userTags.includes(t)).length;
        const timeScore = club.timeTags.length > 0
          ? (timeMatches / club.timeTags.length) * 100 : 50;
        const skillMatches = club.skillTags.filter(t => userTags.includes(t)).length;
        const skillScore = club.skillTags.length > 0
          ? (skillMatches / club.skillTags.length) * 100 : 50;
        return Math.min(99, Math.max(30, Math.round(interestScore * 0.5 + timeScore * 0.3 + skillScore * 0.2)));
      },

      getRecommendedClubs: () => {
        const user = get().currentUser;
        const clubs = get().clubs.filter(c => c.status === 'approved');
        if (!user?.assessmentTags) {
          return clubs
            .sort((a, b) => b.applicationCount - a.applicationCount)
            .map(c => ({ ...c, matchScore: 0 }));
        }
        return clubs
          .map(club => ({ ...club, matchScore: get().calcMatchScore(club) }))
          .sort((a, b) => b.matchScore - a.matchScore);
      },
    }),
    {
      name: 'club-match-storage',
      partialize: (state) => ({
        currentUser: state.currentUser,
        users: state.users,
        clubs: state.clubs,
        applications: state.applications,
        notifications: state.notifications,
      }),
    }
  )
);
