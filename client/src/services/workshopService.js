import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

// Configure axios instance
const api = axios.create({
  baseURL: `${API_URL}/api`,
})

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export const workshopService = {
  // Get all workshops with filters
  async getWorkshops(filters = {}) {
    try {
      const params = new URLSearchParams()
      
      if (filters.search) params.append('search', filters.search)
      if (filters.status) params.append('status', filters.status)
      if (filters.page) params.append('page', filters.page)
      if (filters.limit) params.append('limit', filters.limit)

      const response = await api.get(`/workshops?${params.toString()}`)
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  },

  // Get workshop by ID
  async getWorkshopById(workshopId) {
    try {
      const response = await api.get(`/workshops/${workshopId}`)
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  },

  // Get current user's workshop
  async getMyWorkshop() {
    try {
      const response = await api.get('/workshops/my/workshop')
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  },

  // Create new workshop
  async createWorkshop(workshopData) {
    try {
      const response = await api.post('/workshops', workshopData)
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  },

  // Update workshop
  async updateWorkshop(workshopId, workshopData) {
    try {
      const response = await api.put(`/workshops/${workshopId}`, workshopData)
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  },

  // Delete workshop
  async deleteWorkshop(workshopId) {
    try {
      const response = await api.delete(`/workshops/${workshopId}`)
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  },

  // Get users in a workshop
  async getWorkshopUsers(workshopId, filters = {}) {
    try {
      const params = new URLSearchParams()
      
      if (filters.role) params.append('role', filters.role)
      if (filters.status) params.append('status', filters.status)

      const response = await api.get(`/workshops/${workshopId}/users?${params.toString()}`)
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  },

  // Get workshop statistics
  async getWorkshopStats(workshopId) {
    try {
      const response = await api.get(`/workshops/${workshopId}/stats`)
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  }
}