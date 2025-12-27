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

export const userService = {
  // Get all users with filters
  async getUsers(filters = {}) {
    try {
      const params = new URLSearchParams()
      
      if (filters.search) params.append('search', filters.search)
      if (filters.role) params.append('role', filters.role)
      if (filters.status) params.append('status', filters.status)
      if (filters.workshop) params.append('workshop', filters.workshop)
      if (filters.department) params.append('department', filters.department)

      const response = await api.get(`/users?${params.toString()}`)
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  },

  // Get user by ID
  async getUserById(userId) {
    try {
      const response = await api.get(`/users/${userId}`)
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  },

  // Create new user
  async createUser(userData) {
    try {
      const response = await api.post('/users', userData)
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  },

  // Update user
  async updateUser(userId, userData) {
    try {
      const response = await api.put(`/users/${userId}`, userData)
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  },

  // Delete user
  async deleteUser(userId) {
    try {
      const response = await api.delete(`/users/${userId}`)
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  },

  // Get user statistics
  async getUserStats() {
    try {
      const response = await api.get('/users/stats')
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  },

  // Update user password
  async updateUserPassword(userId, passwordData) {
    try {
      const response = await api.put(`/users/${userId}/password`, passwordData)
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  },

  // Update user role
  async updateUserRole(userId, role) {
    try {
      const response = await api.put(`/users/${userId}/role`, { role })
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  },

  // Deactivate user
  async deactivateUser(userId) {
    try {
      const response = await api.put(`/users/${userId}/deactivate`)
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  },

  // Activate user
  async activateUser(userId) {
    try {
      const response = await api.put(`/users/${userId}/activate`)
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  },

  // Get users by role
  async getUsersByRole(role) {
    try {
      const response = await api.get(`/users/role/${role}`)
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  },

  // Bulk update users
  async bulkUpdateUsers(userIds, updateData) {
    try {
      const response = await api.put('/users/bulk-update', {
        userIds,
        updateData
      })
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  },

  // Resend welcome email
  async resendWelcomeEmail(userId) {
    try {
      const response = await api.post(`/users/${userId}/resend-welcome`)
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  },

  // Forgot password
  async forgotPassword(email) {
    try {
      const response = await api.post('/users/forgot-password', { email })
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  },

  // Reset password
  async resetPassword(token, password) {
    try {
      const response = await api.post('/users/reset-password', { token, password })
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  },

  // Activate account
  async activateAccount(token, password, confirmPassword) {
    try {
      const response = await api.post(`/users/activate/${token}`, {
        password,
        confirmPassword
      })
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  }
}