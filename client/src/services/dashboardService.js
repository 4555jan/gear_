import axios from 'axios'
import { useAuthStore } from '../stores/authStore'

const API_URL = 'http://localhost:5000/api'

// Create axios instance with interceptors
const api = axios.create({
  baseURL: API_URL,
})

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout()
    }
    return Promise.reject(error)
  }
)

export const dashboardService = {
  // Get dashboard statistics
  getStats: async () => {
    const response = await api.get('/dashboard/overview')
    return response.data
  },

  // Get recent activity
  getRecentActivity: async (limit = 10) => {
    const response = await api.get(`/dashboard/recent-activity?limit=${limit}`)
    return response.data
  },

  // Get team performance data
  getTeamPerformance: async () => {
    const response = await api.get('/dashboard/team-performance')
    return response.data
  },

  // Get equipment status overview
  getEquipmentOverview: async () => {
    const response = await api.get('/dashboard/equipment-overview')
    return response.data
  },

  // Get maintenance metrics
  getMaintenanceMetrics: async (period = '30') => {
    const response = await api.get(`/dashboard/maintenance-metrics?period=${period}`)
    return response.data
  },

  // Get workload distribution
  getWorkloadDistribution: async () => {
    const response = await api.get('/dashboard/workload')
    return response.data
  },

  // Get alerts and notifications
  getAlerts: async () => {
    const response = await api.get('/dashboard/alerts')
    return response.data
  },

  // Get upcoming maintenance
  getUpcomingMaintenance: async (days = 7) => {
    const response = await api.get(`/dashboard/upcoming-maintenance?days=${days}`)
    return response.data
  }
}