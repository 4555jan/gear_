import React, { useState, useEffect } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { useAuthStore } from '../../stores/authStore'
import { equipmentService } from '../../services/equipmentService'

const CreateEquipmentModal = ({ isOpen, onClose, onSubmit, equipment = null }) => {
  const { user } = useAuthStore()
  const isEditing = Boolean(equipment)

  const [formData, setFormData] = useState({
    name: '',
    model: '',
    serialNumber: '',
    category: '',
    status: 'operational',
    department: '',
    location: '',
    assignedTo: '',
    maintenanceTeam: '',
    purchaseDate: '',
    purchasePrice: '',
    warrantyExpiry: '',
    vendor: '',
    description: '',
    criticality: 'medium',
    maintenanceSchedule: {
      enabled: false,
      type: 'preventive',
      interval: 1,
      frequency: 'months'
    }
  })

  // Mock data for dropdowns - replace with actual API calls
  const [teams, setTeams] = useState([])
  const [employees, setEmployees] = useState([])
  
  const departments = ['Production', 'Maintenance', 'Quality Control', 'Warehouse', 'IT', 'Administration']
  const categories = ['Machinery', 'Electrical', 'HVAC', 'IT Equipment', 'Vehicles', 'Tools', 'Safety Equipment']
  const statuses = ['operational', 'maintenance', 'down']
  const criticalityOptions = ['low', 'medium', 'high', 'critical']

  useEffect(() => {
    if (isOpen) {
      // Load teams and employees when modal opens
      loadTeamsAndEmployees()
      
      if (isEditing && equipment) {
        setFormData({
          ...equipment,
          assignedTo: equipment.assignedTo?._id || '',
          maintenanceTeam: equipment.maintenanceTeam?._id || '',
          purchaseDate: equipment.purchaseDate ? new Date(equipment.purchaseDate).toISOString().split('T')[0] : '',
          warrantyExpiry: equipment.warrantyExpiry ? new Date(equipment.warrantyExpiry).toISOString().split('T')[0] : '',
          maintenanceSchedule: equipment.maintenanceSchedule || {
            enabled: false,
            type: 'preventive',
            interval: 1,
            frequency: 'months'
          }
        })
      } else {
        // Reset form for new equipment
        setFormData({
          name: '',
          model: '',
          serialNumber: '',
          category: '',
          status: 'operational',
          department: '',
          location: '',
          assignedTo: '',
          maintenanceTeam: '',
          purchaseDate: '',
          purchasePrice: '',
          warrantyExpiry: '',
          vendor: '',
          description: '',
          criticality: 'medium',
          maintenanceSchedule: {
            enabled: false,
            type: 'preventive',
            interval: 1,
            frequency: 'months'
          }
        })
      }
    }
  }, [isOpen, isEditing, equipment])

  const loadTeamsAndEmployees = async () => {
    try {
      // Mock data - replace with actual API calls
      setTeams([
        { _id: '1', name: 'Electrical Team' },
        { _id: '2', name: 'Mechanical Team' },
        { _id: '3', name: 'IT Support Team' }
      ])
      setEmployees([
        { _id: '1', name: 'John Doe', department: 'Maintenance' },
        { _id: '2', name: 'Jane Smith', department: 'Production' },
        { _id: '3', name: 'Bob Johnson', department: 'Quality Control' }
      ])
    } catch (error) {
      console.error('Error loading teams and employees:', error)
    }
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    
    if (name.startsWith('maintenanceSchedule.')) {
      const field = name.split('.')[1]
      setFormData(prev => ({
        ...prev,
        maintenanceSchedule: {
          ...prev.maintenanceSchedule,
          [field]: type === 'checkbox' ? checked : value
        }
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }))
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit(formData)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 overflow-y-auto pt-10">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 mb-10">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {isEditing ? 'Edit Equipment' : 'Create New Equipment'}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {isEditing ? 'Update equipment information and settings' : 'Add a new piece of equipment to track and manage'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-6">
            {/* Basic Information */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Equipment Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="e.g., Production Line 1 Conveyor"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Model
                  </label>
                  <input
                    type="text"
                    name="model"
                    value={formData.model}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="e.g., XC-200 Pro"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Serial Number *
                  </label>
                  <input
                    type="text"
                    name="serialNumber"
                    value={formData.serialNumber}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="e.g., SN123456789"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category *
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    required
                  >
                    <option value="">Select Category</option>
                    {categories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    {statuses.map(status => (
                      <option key={status} value={status}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Criticality
                  </label>
                  <select
                    name="criticality"
                    value={formData.criticality}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    {criticalityOptions.map(level => (
                      <option key={level} value={level}>
                        {level.charAt(0).toUpperCase() + level.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Location and Assignment */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Location & Assignment</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Department *
                  </label>
                  <select
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    required
                  >
                    <option value="">Select Department</option>
                    {departments.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Location
                  </label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="e.g., Building A, Floor 2, Room 201"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Assigned To
                  </label>
                  <select
                    name="assignedTo"
                    value={formData.assignedTo}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">Select Employee</option>
                    {employees.map(employee => (
                      <option key={employee._id} value={employee._id}>{employee.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Maintenance Team
                  </label>
                  <select
                    name="maintenanceTeam"
                    value={formData.maintenanceTeam}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">Select Team</option>
                    {teams.map(team => (
                      <option key={team._id} value={team._id}>{team.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Purchase Information */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Purchase Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Purchase Date
                  </label>
                  <input
                    type="date"
                    name="purchaseDate"
                    value={formData.purchaseDate}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Purchase Price
                  </label>
                  <input
                    type="number"
                    name="purchasePrice"
                    value={formData.purchasePrice}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Warranty Expiry
                  </label>
                  <input
                    type="date"
                    name="warrantyExpiry"
                    value={formData.warrantyExpiry}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Vendor
                  </label>
                  <input
                    type="text"
                    name="vendor"
                    value={formData.vendor}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Vendor name"
                  />
                </div>
              </div>
            </div>

            {/* Maintenance Schedule */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Maintenance Schedule</h3>
              <div className="space-y-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="enableSchedule"
                    name="maintenanceSchedule.enabled"
                    checked={formData.maintenanceSchedule.enabled}
                    onChange={handleChange}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label htmlFor="enableSchedule" className="ml-2 block text-sm text-gray-700">
                    Enable preventive maintenance schedule
                  </label>
                </div>

                {formData.maintenanceSchedule.enabled && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Type
                      </label>
                      <select
                        name="maintenanceSchedule.type"
                        value={formData.maintenanceSchedule.type}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      >
                        <option value="preventive">Preventive</option>
                        <option value="inspection">Inspection</option>
                        <option value="calibration">Calibration</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Interval
                      </label>
                      <input
                        type="number"
                        name="maintenanceSchedule.interval"
                        value={formData.maintenanceSchedule.interval}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        min="1"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Frequency
                      </label>
                      <select
                        name="maintenanceSchedule.frequency"
                        value={formData.maintenanceSchedule.frequency}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      >
                        <option value="days">Days</option>
                        <option value="weeks">Weeks</option>
                        <option value="months">Months</option>
                        <option value="years">Years</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Additional Information</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Additional notes about this equipment..."
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200 mt-8">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              {isEditing ? 'Update Equipment' : 'Create Equipment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateEquipmentModal