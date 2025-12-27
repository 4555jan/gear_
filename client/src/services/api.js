import axios from 'axios'
import toast from 'react-hot-toast'

// Create axios instance
const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    const { response } = error

    // Handle network errors
    if (!response) {
      toast.error('Network error. Please check your connection.')
      return Promise.reject(error)
    }

    // Handle authentication errors
    if (response.status === 401) {
      localStorage.removeItem('token')
      delete api.defaults.headers.common['Authorization']
      
      if (window.location.pathname !== '/login') {
        toast.error('Session expired. Please login again.')
        window.location.href = '/login'
      }
      return Promise.reject(error)
    }

    // Handle authorization errors
    if (response.status === 403) {
      toast.error('Access denied. Insufficient permissions.')
      return Promise.reject(error)
    }

    // Handle validation errors
    if (response.status === 400 && response.data.errors) {
      const errors = response.data.errors
      if (Array.isArray(errors)) {
        errors.forEach(err => toast.error(err.message))
      }
      return Promise.reject(error)
    }

    // Handle server errors
    if (response.status >= 500) {
      toast.error('Server error. Please try again later.')
      return Promise.reject(error)
    }

    return Promise.reject(error)
  }
)

export default api