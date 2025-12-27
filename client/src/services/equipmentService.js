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

export const equipmentService = {
  // Get all equipment with optional filters
  async getEquipment(filters = {}) {
    const queryParams = new URLSearchParams()
    
    if (filters.department) queryParams.append('department', filters.department)
    if (filters.status) queryParams.append('status', filters.status)
    if (filters.category) queryParams.append('category', filters.category)
    if (filters.search) queryParams.append('search', filters.search)
    if (filters.assignedTo) queryParams.append('assignedTo', filters.assignedTo)
    if (filters.maintenanceTeam) queryParams.append('maintenanceTeam', filters.maintenanceTeam)

    const response = await api.get(`/equipment?${queryParams}`)
    return response.data
  },

  // Get single equipment by ID
  async getEquipmentById(id) {
    const response = await api.get(`/equipment/${id}`)
    return response.data
  },

  // Create new equipment
  async createEquipment(equipmentData) {
    const response = await api.post('/equipment', equipmentData)
    return response.data
  },

  // Update equipment
  async updateEquipment(id, equipmentData) {
    const response = await api.put(`/equipment/${id}`, equipmentData)
    return response.data
  },

  // Delete equipment
  async deleteEquipment(id) {
    await api.delete(`/equipment/${id}`)
  },

  // Get equipment statistics
  async getEquipmentStats() {
    const response = await api.get('/equipment/stats')
    return response.data
  },

  // Update equipment status
  async updateEquipmentStatus(id, status) {
    const response = await api.patch(`/equipment/${id}/status`, { status })
    return response.data
  },

  // Get equipment maintenance history
  async getEquipmentMaintenanceHistory(id) {
    const response = await api.get(`/equipment/${id}/maintenance-history`)
    return response.data
  },

  // Create maintenance request for equipment
  async createMaintenanceRequest(equipmentId, requestData) {
    const response = await api.post(`/equipment/${equipmentId}/maintenance-request`, requestData)
    return response.data
  },

  // Get equipment maintenance requests
  async getEquipmentMaintenanceRequests(equipmentId) {
    const response = await api.get(`/equipment/${equipmentId}/maintenance-requests`)
    return response.data
  },

  // Scrap equipment
  async scrapEquipment(id, reason) {
    const response = await api.patch(`/equipment/${id}/scrap`, { reason })
    return response.data
  },

  // Generate equipment QR code
  async generateQRCode(id) {
    const response = await api.post(`/equipment/${id}/qr-code`)
    return response.blob() // Return blob for image download
  },

  // Export equipment data
  async exportEquipment(format = 'csv', filters = {}) {
    const queryParams = new URLSearchParams()
    queryParams.append('format', format)
    
    if (filters.department) queryParams.append('department', filters.department)
    if (filters.status) queryParams.append('status', filters.status)
    if (filters.category) queryParams.append('category', filters.category)

    const response = await api.get(`/equipment/export?${queryParams}`)
    return response.blob() // Return blob for file download
  },

  // Backward compatibility methods
  getAll: async () => {
    const response = await api.get('/equipment')
    return response.data
  },

  getById: async (id) => {
    const response = await api.get(`/equipment/${id}`)
    return response.data
  },

  create: async (equipmentData) => {
    const response = await api.post('/equipment', equipmentData)
    return response.data
  },

  update: async (id, equipmentData) => {
    const response = await api.put(`/equipment/${id}`, equipmentData)
    return response.data
  },

  delete: async (id) => {
    await api.delete(`/equipment/${id}`)
  },

  getByCategory: async (category) => {
    const response = await api.get(`/equipment/category/${category}`)
    return response.data
  },

  getByLocation: async (location) => {
    const response = await api.get(`/equipment/location/${location}`)
    return response.data
  },

  updateStatus: async (id, status) => {
    const response = await api.patch(`/equipment/${id}/status`, { status })
    return response.data
  },

  getMaintenanceHistory: async (id) => {
    const response = await api.get(`/equipment/${id}/maintenance-history`)
    return response.data
  },

  scheduleMaintenance: async (id, maintenanceData) => {
    const response = await api.post(`/equipment/${id}/schedule-maintenance`, maintenanceData)
    return response.data
  }
}