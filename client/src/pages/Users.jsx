import React, { useState, useEffect } from 'react'
import { PlusIcon, MagnifyingGlassIcon, UserIcon, TrashIcon, PencilIcon, BuildingOfficeIcon, EnvelopeIcon } from '@heroicons/react/24/outline'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import CreateUserModal from '../components/CreateUserModal'
import { useAuthStore } from '../stores/authStore'
import { userService } from '../services/userService'
import { workshopService } from '../services/workshopService'
import toast from 'react-hot-toast'

const Users = () => {
  const [users, setUsers] = useState([])
  const [workshops, setWorkshops] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedRole, setSelectedRole] = useState('all')
  const [selectedWorkshop, setSelectedWorkshop] = useState('all')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const { user } = useAuthStore()

  const roles = [
    { value: 'admin', label: 'Administrator', color: 'bg-red-100 text-red-800' },
    { value: 'technician', label: 'Technician', color: 'bg-blue-100 text-blue-800' },
    { value: 'employee', label: 'Employee', color: 'bg-green-100 text-green-800' }
  ]

  const statuses = [
    { value: 'active', label: 'Active', color: 'bg-green-100 text-green-800' },
    { value: 'inactive', label: 'Inactive', color: 'bg-gray-100 text-gray-800' },
    { value: 'suspended', label: 'Suspended', color: 'bg-red-100 text-red-800' }
  ]

  useEffect(() => {
    loadUsers()
    if (user.role === 'admin') {
      loadWorkshops()
    }
  }, [searchTerm, selectedRole, selectedWorkshop])

  const loadUsers = async () => {
    try {
      setLoading(true)
      const filters = {
        search: searchTerm,
        role: selectedRole !== 'all' ? selectedRole : '',
        workshop: selectedWorkshop !== 'all' ? selectedWorkshop : ''
      }
      const data = await userService.getUsers(filters)
      setUsers(data.users || data)
    } catch (error) {
      console.error('Error loading users:', error)
      toast.error('Failed to load users')
      setUsers([])
    } finally {
      setLoading(false)
    }
  }

  const loadWorkshops = async () => {
    try {
      const data = await workshopService.getWorkshops()
      setWorkshops(data.workshops || data)
    } catch (error) {
      console.error('Error loading workshops:', error)
      // Don't show error toast for workshops - it might not be set up yet
      setWorkshops([])
    }
  }

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await userService.deleteUser(userId)
        toast.success('User deleted successfully')
        loadUsers()
      } catch (error) {
        toast.error('Failed to delete user')
      }
    }
  }

  const handleStatusChange = async (userId, newStatus) => {
    try {
      await userService.updateUser(userId, { status: newStatus })
      toast.success('User status updated successfully')
      loadUsers()
    } catch (error) {
      toast.error('Failed to update user status')
    }
  }

  const handleResendWelcome = async (userId) => {
    try {
      await userService.resendWelcomeEmail(userId)
      toast.success('Welcome email sent successfully')
    } catch (error) {
      toast.error('Failed to send welcome email')
    }
  }

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getRoleColor = (role) => {
    const roleData = roles.find(r => r.value === role)
    return roleData ? roleData.color : 'bg-gray-100 text-gray-800'
  }

  const getStatusColor = (status) => {
    const statusData = statuses.find(s => s.value === status)
    return statusData ? statusData.color : 'bg-gray-100 text-gray-800'
  }

  const getUserStats = () => {
    const stats = {
      total: users.length,
      active: users.filter(u => u.status === 'active').length,
      admins: users.filter(u => u.role === 'admin').length,
      technicians: users.filter(u => u.role === 'technician').length,
      employees: users.filter(u => u.role === 'employee').length
    }
    return stats
  }

  const stats = getUserStats()

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600 mt-1">Manage system users and their permissions</p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="btn btn-primary flex items-center gap-2"
        >
          <PlusIcon className="w-5 h-5" />
          Add User
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-800">Total Users</p>
              <p className="text-2xl font-bold text-blue-900">{stats.total}</p>
            </div>
            <UserIcon className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-800">Active</p>
              <p className="text-2xl font-bold text-green-900">{stats.active}</p>
            </div>
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            </div>
          </div>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-red-800">Admins</p>
              <p className="text-2xl font-bold text-red-900">{stats.admins}</p>
            </div>
            <div className="w-8 h-8 bg-red-100 rounded-lg"></div>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-800">Technicians</p>
              <p className="text-2xl font-bold text-blue-900">{stats.technicians}</p>
            </div>
            <div className="w-8 h-8 bg-blue-100 rounded-lg"></div>
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-800">Employees</p>
              <p className="text-2xl font-bold text-green-900">{stats.employees}</p>
            </div>
            <div className="w-8 h-8 bg-green-100 rounded-lg"></div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Search users by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <select
          value={selectedRole}
          onChange={(e) => setSelectedRole(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">All Roles</option>
          {roles.map(role => (
            <option key={role.value} value={role.value}>{role.label}</option>
          ))}
        </select>

        {/* Workshop filter - only show for admins */}
        {user.role === 'admin' && (
          <select
            value={selectedWorkshop}
            onChange={(e) => setSelectedWorkshop(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Workshops</option>
            {workshops.map(workshop => (
              <option key={workshop._id} value={workshop._id}>
                {workshop.name} ({workshop.code})
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Users ({filteredUsers.length})</h3>
        </div>

        {filteredUsers.length === 0 ? (
          <div className="text-center py-12">
            <UserIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No invited users found</p>
            <p className="text-gray-400 text-sm mt-2">Invite users via email to see them here</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Workshop
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Department
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Invited By
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Login
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((u) => (
                  <tr key={u._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-700">
                            {u.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{u.name}</div>
                          <div className="text-sm text-gray-500">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(u.role)}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <BuildingOfficeIcon className="w-4 h-4 text-gray-400 mr-2" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {u.workshop?.name || 'No Workshop'}
                          </div>
                          {u.workshop?.code && (
                            <div className="text-xs text-gray-500">{u.workshop.code}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={u.status}
                        onChange={(e) => handleStatusChange(u._id, e.target.value)}
                        className={`text-xs font-semibold rounded-full border-0 ${getStatusColor(u.status)}`}
                        disabled={u._id === user._id} // Can't change own status
                      >
                        {statuses.map(status => (
                          <option key={status.value} value={status.value}>{status.label}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {u.department || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {u.invitedBy?.name || 'System'}
                      </div>
                      {u.invitedBy?.email && (
                        <div className="text-xs text-gray-500">{u.invitedBy.email}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {u.lastLogin ? new Date(u.lastLogin).toLocaleDateString() : 'Never'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setSelectedUser(u)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Edit User"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleResendWelcome(u._id)}
                          className="text-green-600 hover:text-green-900"
                          title="Resend Welcome Email"
                        >
                          <EnvelopeIcon className="w-4 h-4" />
                        </button>
                        {u._id !== user._id && ( // Can't delete yourself
                          <button
                            onClick={() => handleDeleteUser(u._id)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete User"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create User Modal */}
      <CreateUserModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={loadUsers}
      />
    </div>
  )
}

export default Users