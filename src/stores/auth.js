import { defineStore } from 'pinia'
import { getCurrentUser, login as apiLogin, logout as apiLogout } from '@/api/auth'

export const useAuthStore = defineStore('auth', {
    state: () => ({
        user: null,
        loading: false
    }),

    getters: {
        isAuthenticated: (state) => !!state.user,
        userRole: (state) => state.user?.roleName || '',
        userName: (state) => state.user?.realName || ''
    },

    actions: {
        async initialize() {
            this.loading = true
            try {
                this.user = await getCurrentUser()
            } finally {
                this.loading = false
            }
        },

        async login(username, password) {
            this.loading = true
            try {
                this.user = await apiLogin(username, password)
                return this.user
            } finally {
                this.loading = false
            }
        },

        async logout() {
            await apiLogout()
            this.user = null
        }
    }
})