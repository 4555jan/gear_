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

export const reportsService = {
  // Get maintenance dashboard statistics
  getMaintenanceStats: async () => {
    const response = await api.get('/maintenance/dashboard/stats')
    return response.data
  },

  // Get team performance statistics
  getTeamStats: async () => {
    const response = await api.get('/teams')
    return response.data
  },

  // Get equipment statistics
  getEquipmentStats: async () => {
    const response = await api.get('/equipment')
    return response.data
  },

  // Get user statistics
  getUserStats: async () => {
    const response = await api.get('/users/stats')
    return response.data
  }
}

export default reportsService