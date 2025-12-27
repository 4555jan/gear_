import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { EyeIcon, EyeSlashIcon, CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import { userService } from '../services/userService'
import { useAuthStore } from '../stores/authStore'
import toast from 'react-hot-toast'

const ActivateAccount = () => {
  const { token } = useParams()
  const navigate = useNavigate()
  const { login } = useAuthStore()
  
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [tokenValid, setTokenValid] = useState(null)
  const [errors, setErrors] = useState({})

  const passwordRequirements = [
    { id: 'length', text: 'At least 8 characters', test: (pwd) => pwd.length >= 8 },
    { id: 'uppercase', text: 'One uppercase letter', test: (pwd) => /[A-Z]/.test(pwd) },
    { id: 'lowercase', text: 'One lowercase letter', test: (pwd) => /[a-z]/.test(pwd) },
    { id: 'number', text: 'One number', test: (pwd) => /\d/.test(pwd) },
    { id: 'special', text: 'One special character (@$!%*?&)', test: (pwd) => /[@$!%*?&]/.test(pwd) }
  ]

  const validateForm = () => {
    const newErrors = {}
    
    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else {
      const failedRequirements = passwordRequirements.filter(req => !req.test(formData.password))
      if (failedRequirements.length > 0) {
        newErrors.password = 'Password does not meet requirements'
      }
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password'
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setLoading(true)
    try {
      const response = await userService.activateAccount(token, formData.password, formData.confirmPassword)
      
      // Log the user in immediately after activation
      login(response.user, response.token)
      
      toast.success('Account activated successfully! Welcome to the system.')
      navigate('/dashboard')
    } catch (error) {
      console.error('Activation error:', error)
      if (error.response?.data?.message) {
        toast.error(error.response.data.message)
      } else {
        toast.error('Failed to activate account. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    
    // Clear errors when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  // Check if token is valid on component mount
  useEffect(() => {
    if (!token) {
      setTokenValid(false)
      return
    }
    setTokenValid(true) // We'll validate on form submission
  }, [token])

  if (tokenValid === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <ExclamationTriangleIcon className="mx-auto h-16 w-16 text-red-500" />
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Invalid Activation Link</h2>
            <p className="mt-2 text-sm text-gray-600">
              This activation link is invalid or has expired.
            </p>
            <p className="mt-4 text-sm text-gray-600">
              Please contact your administrator for a new invitation.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="text-center">
            <CheckCircleIcon className="mx-auto h-16 w-16 text-green-500" />
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              Activate Your Account
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Set up your password to complete account activation
            </p>
          </div>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleChange}
                  className={`appearance-none relative block w-full px-3 py-2 border ${
                    errors.password ? 'border-red-300' : 'border-gray-300'
                  } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm pr-10`}
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                  ) : (
                    <EyeIcon className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password}</p>
              )}
            </div>

            {/* Password Requirements */}
            {formData.password && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Password Requirements:</h4>
                <div className="space-y-1">
                  {passwordRequirements.map((req) => {
                    const isValid = req.test(formData.password)
                    return (
                      <div key={req.id} className={`flex items-center text-xs ${
                        isValid ? 'text-green-600' : 'text-gray-500'
                      }`}>
                        <CheckCircleIcon className={`h-4 w-4 mr-2 ${
                          isValid ? 'text-green-500' : 'text-gray-300'
                        }`} />
                        {req.text}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Confirm Password Field */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirm Password
              </label>
              <div className="mt-1 relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`appearance-none relative block w-full px-3 py-2 border ${
                    errors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                  } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm pr-10`}
                  placeholder="Confirm your password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                  ) : (
                    <EyeIcon className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
              )}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Activating Account...' : 'Activate Account'}
            </button>
          </div>

          <div className="text-center">
            <p className="text-xs text-gray-500">
              Need help? Contact your system administrator.
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ActivateAccount