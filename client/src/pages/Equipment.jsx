import React, { useState, useEffect } from 'react'
import { PlusIcon, WrenchScrewdriverIcon, ExclamationTriangleIcon, CalendarIcon, MagnifyingGlassIcon, FunnelIcon, BuildingOfficeIcon, UserIcon, Cog6ToothIcon } from '@heroicons/react/24/outline'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import CreateEquipmentModal from '../components/equipment/CreateEquipmentModal'
import EquipmentCard from '../components/equipment/EquipmentCard'
import { equipmentService } from '../services/equipmentService'
import { useAuthStore } from '../stores/authStore'
import toast from 'react-hot-toast'

const Equipment = () => {
  const [equipment, setEquipment] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDepartment, setSelectedDepartment] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [viewMode, setViewMode] = useState('grid') // grid or list
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  
  const { user } = useAuthStore()

  const departments = [
    'Production', 'IT', 'Maintenance', 'Administration', 
    'Quality Control', 'Logistics', 'Finance'
  ]

  const categories = [
    'CNC Machine', 'Laptop', 'Printer', 'Vehicle', 
    'HVAC System', 'Generator', 'Conveyor Belt', 'Other'
  ]

  useEffect(() => {
    loadEquipment()
  }, [searchTerm, selectedDepartment, selectedStatus, selectedCategory])

  const loadEquipment = async () => {
    try {
      setLoading(true)
      const filters = {
        search: searchTerm,
        department: selectedDepartment !== 'all' ? selectedDepartment : '',
        status: selectedStatus !== 'all' ? selectedStatus : '',
        category: selectedCategory !== 'all' ? selectedCategory : ''
      }
      const data = await equipmentService.getEquipment(filters)
      setEquipment(data.equipment || data)
    } catch (error) {
      console.error('Error loading equipment:', error)
      toast.error('Failed to load equipment')
      setEquipment([]) // Set empty array on error
    } finally {
      setLoading(false)
    }
  }

  const filteredEquipment = equipment // Equipment is already filtered by the API based on the parameters

  const getStatusStats = () => {
    const stats = {
      operational: equipment.filter(e => e.status === 'operational').length,
      maintenance: equipment.filter(e => e.status === 'maintenance').length,
      down: equipment.filter(e => e.status === 'down').length,
      total: equipment.length
    }
    return stats
  }

  const handleCreateEquipment = async (equipmentData) => {
    try {
      await equipmentService.createEquipment(equipmentData)
      toast.success('Equipment created successfully!')
      loadEquipment()
      setIsCreateModalOpen(false)
    } catch (error) {
      toast.error(error.message || 'Failed to create equipment')
    }
  }

  if (loading) {
    return <LoadingSpinner />
  }

  const stats = getStatusStats()

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="bg-white shadow-sm border border-gray-200 rounded-lg p-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">GearGuard Equipment</h1>
            <p className="text-gray-600 mt-1">The Ultimate Maintenance Tracker - Equipment Management</p>
          </div>
          {user?.role !== 'employee' && (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="btn btn-primary flex items-center gap-2"
            >
              <PlusIcon className="w-5 h-5" />
              Add Equipment
            </button>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-800">Operational</p>
                <p className="text-2xl font-bold text-green-900">{stats.operational}</p>
              </div>
              <div className="p-2 bg-green-100 rounded-lg">
                <Cog6ToothIcon className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-800">Under Maintenance</p>
                <p className="text-2xl font-bold text-yellow-900">{stats.maintenance}</p>
              </div>
              <div className="p-2 bg-yellow-100 rounded-lg">
                <WrenchScrewdriverIcon className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-800">Down</p>
                <p className="text-2xl font-bold text-red-900">{stats.down}</p>
              </div>
              <div className="p-2 bg-red-100 rounded-lg">
                <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-800">Total Assets</p>
                <p className="text-2xl font-bold text-blue-900">{stats.total}</p>
              </div>
              <div className="p-2 bg-blue-100 rounded-lg">
                <BuildingOfficeIcon className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white shadow-sm border border-gray-200 rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          {/* Search */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search Equipment
            </label>
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                className="input pl-10 w-full"
                placeholder="Search by name, serial, model..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Department Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Department
            </label>
            <select
              className="input w-full"
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
            >
              <option value="all">All Departments</option>
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              className="input w-full"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="operational">Operational</option>
              <option value="maintenance">Under Maintenance</option>
              <option value="down">Down</option>
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              className="input w-full"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="all">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* View Mode */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              View
            </label>
            <div className="flex rounded-md shadow-sm">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-2 text-sm font-medium rounded-l-md border ${
                  viewMode === 'grid'
                    ? 'bg-primary-600 text-white border-primary-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                Grid
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-2 text-sm font-medium rounded-r-md border-t border-r border-b ${
                  viewMode === 'list'
                    ? 'bg-primary-600 text-white border-primary-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                List
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Equipment Grid/List */}
      <div className="bg-white shadow-sm border border-gray-200 rounded-lg">
        {filteredEquipment.length === 0 ? (
          <div className="text-center py-12">
            <WrenchScrewdriverIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No equipment found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || selectedDepartment !== 'all' || selectedStatus !== 'all' || selectedCategory !== 'all'
                ? 'Try adjusting your search criteria'
                : 'Get started by adding your first piece of equipment'
              }
            </p>
            {user?.role !== 'employee' && (
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="btn btn-primary"
              >
                <PlusIcon className="w-4 h-4" />
                Add Equipment
              </button>
            )}
          </div>
        ) : (
          <div className={viewMode === 'grid' ? 'p-6' : 'p-0'}>
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredEquipment.map((item) => (
                  <EquipmentCard 
                    key={item._id} 
                    equipment={item} 
                    onUpdate={loadEquipment}
                  />
                ))}
              </div>
            ) : (
              <div className="overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Equipment
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Department
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Assigned To
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Maintenance Team
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredEquipment.map((item) => (
                      <tr key={item._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{item.name}</div>
                            <div className="text-sm text-gray-500">{item.serialNumber}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <BuildingOfficeIcon className="w-4 h-4 text-gray-400 mr-2" />
                            <span className="text-sm text-gray-900">{item.department}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <UserIcon className="w-4 h-4 text-gray-400 mr-2" />
                            <span className="text-sm text-gray-900">{item.assignedTo?.name || 'Unassigned'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            item.status === 'operational' ? 'bg-green-100 text-green-800' :
                            item.status === 'maintenance' ? 'bg-yellow-100 text-yellow-800' :
                            item.status === 'down' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {item.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.maintenanceTeam?.name || 'Not Assigned'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button className="text-primary-600 hover:text-primary-900 mr-4">
                            View Details
                          </button>
                          <button className="text-green-600 hover:text-green-900">
                            Maintenance
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create Equipment Modal */}
      <CreateEquipmentModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateEquipment}
        departments={departments}
        categories={categories}
      />
    </div>
  )
}

export default Equipment