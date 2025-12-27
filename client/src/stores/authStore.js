import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import api from '../services/api'
import toast from 'react-hot-toast'

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,
      isInitialized: false,

      setUser: (user) => set({ user }),
      setToken: (token) => {
        set({ token })
        if (token) {
          localStorage.setItem('token', token)
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`
        } else {
          localStorage.removeItem('token')
          delete api.defaults.headers.common['Authorization']
        }
      },

      login: async (email, password) => {
        set({ isLoading: true })
        try {
          const response = await api.post('/auth/login', { email, password })
          const { token, user } = response.data
          
          get().setToken(token)
          set({ user, isLoading: false })
          
          toast.success(`Welcome back, ${user.name}!`)
          return { success: true }
        } catch (error) {
          set({ isLoading: false })
          const message = error.response?.data?.message || 'Login failed'
          toast.error(message)
          return { success: false, error: message }
        }
      },

      register: async (userData) => {
        set({ isLoading: true })
        try {
          const response = await api.post('/auth/register', userData)
          const { token, user } = response.data
          
          get().setToken(token)
          set({ user, isLoading: false })
          
          toast.success(`Welcome to CMMS, ${user.name}!`)
          return { success: true }
        } catch (error) {
          set({ isLoading: false })
          const message = error.response?.data?.message || 'Registration failed'
          toast.error(message)
          return { success: false, error: message }
        }
      },

      logout: async () => {
        try {
          await api.post('/auth/logout')
        } catch (error) {
          console.warn('Logout request failed:', error)
        }
        
        get().setToken(null)
        set({ user: null })
        toast.success('Logged out successfully')
      },

      register: async (userData) => {
        set({ isLoading: true })
        try {
          const response = await api.post('/auth/register', userData)
          const { token, user } = response.data
          
          get().setToken(token)
          set({ user, isLoading: false })
          
          toast.success(`Account created successfully!`)
          return { success: true }
        } catch (error) {
          set({ isLoading: false })
          const message = error.response?.data?.message || 'Registration failed'
          toast.error(message)
          return { success: false, error: message }
        }
      },

      checkAuth: async () => {
        const token = localStorage.getItem('token')
        if (!token) {
          set({ isInitialized: true })
          return
        }

        set({ isLoading: true, token })
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`

        try {
          const response = await api.get('/auth/me')
          set({ 
            user: response.data.user, 
            isLoading: false, 
            isInitialized: true 
          })
        } catch (error) {
          console.warn('Auth check failed:', error)
          get().setToken(null)
          set({ 
            user: null, 
            isLoading: false, 
            isInitialized: true 
          })
        }
      },

      updateProfile: async (profileData) => {
        try {
          const response = await api.put('/auth/profile', profileData)
          set({ user: response.data.user })
          toast.success('Profile updated successfully')
          return { success: true }
        } catch (error) {
          const message = error.response?.data?.message || 'Profile update failed'
          toast.error(message)
          return { success: false, error: message }
        }
      },

      changePassword: async (passwordData) => {
        try {
          await api.put('/auth/change-password', passwordData)
          toast.success('Password changed successfully')
          return { success: true }
        } catch (error) {
          const message = error.response?.data?.message || 'Password change failed'
          toast.error(message)
          return { success: false, error: message }
        }
      },

      // Check if user has permission for specific actions
      hasPermission: (permission) => {
        const { user } = get()
        if (!user) return false

        const permissions = {
          'view_equipment': ['admin', 'technician'],
          'manage_equipment': ['admin'],
          'view_maintenance': ['admin', 'technician', 'employee'],
          'create_maintenance': ['admin', 'technician', 'employee'],
          'assign_maintenance': ['admin'],
          'manage_teams': ['admin'],
          'manage_users': ['admin'],
          'view_dashboard': ['admin', 'technician', 'employee'],
          'view_reports': ['admin', 'technician']
        }

        return permissions[permission]?.includes(user.role) || false
      }
    }),
    {
      name: 'cmms-auth',
      partialize: (state) => ({ 
        token: state.token,
        user: state.user 
      })
    }
  )
)

export { useAuthStore }