import { Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useAuthStore } from './stores/authStore'
import Layout from './components/Layout'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import ActivateAccount from './pages/ActivateAccount'
import Dashboard from './pages/Dashboard'
import Equipment from './pages/Equipment'
import EquipmentDetail from './pages/EquipmentDetail'
import Maintenance from './pages/Maintenance'
import MaintenanceCalendar from './pages/MaintenanceCalendar'
import Teams from './pages/Teams'
import Reports from './pages/Reports'
import Users from './pages/Users'
import Profile from './pages/Profile'
import LoadingSpinner from './components/ui/LoadingSpinner'

function App() {
  const { user, isLoading, checkAuth } = useAuthStore()

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/activate/:token" element={<ActivateAccount />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    )
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/equipment" element={<Equipment />} />
        <Route path="/equipment/:id" element={<EquipmentDetail />} />
        <Route path="/maintenance" element={<Maintenance />} />
        <Route path="/calendar" element={<MaintenanceCalendar />} />
        
        {/* Admin and Technician routes */}
        {(user.role === 'admin' || user.role === 'technician') && (
          <>
            <Route path="/teams" element={<Teams />} />
            <Route path="/reports" element={<Reports />} />
          </>
        )}
        
        {/* Admin only routes */}
        {user.role === 'admin' && (
          <>
            <Route path="/users" element={<Users />} />
          </>
        )}
        
        <Route path="/profile" element={<Profile />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Layout>
  )
}

export default App