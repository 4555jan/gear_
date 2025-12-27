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

export const maintenanceService = {
  // Get all maintenance requests
  getAll: async () => {
    const response = await api.get('/maintenance')
    return response.data
  },

  // Get maintenance request by ID
  getById: async (id) => {
    const response = await api.get(`/maintenance/${id}`)
    return response.data
  },

  // Create new maintenance request
  create: async (requestData) => {
    const response = await api.post('/maintenance', requestData)
    return response.data
  },

  // Update maintenance request
  update: async (id, requestData) => {
    const response = await api.put(`/maintenance/${id}`, requestData)
    return response.data
  },

  // Delete maintenance request
  delete: async (id) => {
    await api.delete(`/maintenance/${id}`)
  },

  // Update request status
  updateStatus: async (id, status) => {
    const response = await api.patch(`/maintenance/${id}/status`, { status })
    return response.data
  },

  // Assign technician to request
  assignTechnician: async (id, technicianId) => {
    const response = await api.patch(`/maintenance/${id}/assign`, { technicianId })
    return response.data
  },

  // Add work log entry
  addWorkLog: async (id, workLogData) => {
    const response = await api.post(`/maintenance/${id}/work-log`, workLogData)
    return response.data
  },

  // Get requests by status
  getByStatus: async (status) => {
    const response = await api.get(`/maintenance/status/${status}`)
    return response.data
  },

  // Get requests by priority
  getByPriority: async (priority) => {
    const response = await api.get(`/maintenance/priority/${priority}`)
    return response.data
  },

  // Get requests assigned to current user
  getMyRequests: async () => {
    const response = await api.get('/maintenance/my-requests')
    return response.data
  },

  // Get requests created by current user
  getMyCreatedRequests: async () => {
    const response = await api.get('/maintenance/my-created')
    return response.data
  },

  // Get overdue requests
  getOverdue: async () => {
    const response = await api.get('/maintenance/overdue')
    return response.data
  },

  // Get maintenance statistics
  getStats: async () => {
    const response = await api.get('/maintenance/stats')
    return response.data
  },

  // Complete maintenance request
  complete: async (id, completionData) => {
    const response = await api.patch(`/maintenance/${id}/complete`, completionData)
    return response.data
  }
}