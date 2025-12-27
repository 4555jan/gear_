import React, { useState, useEffect } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { useAuthStore } from '../../stores/authStore'
import { equipmentService } from '../../services/equipmentService'

const CreateMaintenanceModal = ({ isOpen, onClose, onSubmit }) => {
  const { user } = useAuthStore()

  const [formData, setFormData] = useState({
    title: '',
    equipment: '',
    type: 'Corrective',
    priority: 'Medium',
    scheduledDate: '',
    assignedTo: '',
    team: '',
    description: '',
    estimatedDuration: ''
  })

  const [equipment, setEquipment] = useState([])
  const [teams, setTeams] = useState([])
  const [technicians, setTechnicians] = useState([])
  const [loading, setLoading] = useState(false)

  const requestTypes = ['Corrective', 'Preventive', 'Predictive', 'Emergency']
  const priorities = ['Low', 'Medium', 'High', 'Critical', 'Emergency']

  useEffect(() => {
    if (isOpen) {
      loadData()
      // Reset form
      setFormData({
        title: '',
        equipment: '',
        type: 'Corrective',
        priority: 'Medium',
        scheduledDate: '',
        assignedTo: '',
        team: '',
        description: '',
        estimatedDuration: ''
      })
    }
  }, [isOpen])

  const loadData = async () => {
    try {
      // Load equipment, teams, and technicians
      const equipmentData = await equipmentService.getEquipment()
      setEquipment(equipmentData.equipment || equipmentData || [])
      
      // Mock data for teams and technicians - replace with actual API calls
      setTeams([
        { _id: '1', name: 'Mechanics' },
        { _id: '2', name: 'Electricians' },
        { _id: '3', name: 'IT Support' },
        { _id: '4', name: 'HVAC Technicians' }
      ])
      
      setTechnicians([
        { _id: '1', name: 'John Smith', team: 'Mechanics' },
        { _id: '2', name: 'Jane Doe', team: 'IT Support' },
        { _id: '3', name: 'Bob Wilson', team: 'HVAC Technicians' },
        { _id: '4', name: 'Mike Brown', team: 'Electricians' }
      ])
    } catch (error) {
      console.error('Error loading form data:', error)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleEquipmentChange = (e) => {
    const selectedEquipmentId = e.target.value
    const selectedEquipment = equipment.find(eq => eq._id === selectedEquipmentId)
    
    if (selectedEquipment) {
      // Auto-fill team based on equipment
      const equipmentTeam = selectedEquipment.maintenanceTeam
      setFormData(prev => ({
        ...prev,
        equipment: selectedEquipmentId,
        team: equipmentTeam?._id || ''
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        equipment: selectedEquipmentId,
        team: ''
      }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      // Add created by information
      const requestData = {
        ...formData,
        createdBy: user._id
      }
      
      await onSubmit(requestData)
    } catch (error) {
      console.error('Error creating request:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredTechnicians = formData.team 
    ? technicians.filter(tech => tech.team === teams.find(t => t._id === formData.team)?.name)
    : technicians

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 overflow-y-auto pt-10">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 mb-10">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Create Maintenance Request</h2>
            <p className="text-sm text-gray-600 mt-1">Submit a new maintenance request for equipment repair or maintenance</p>
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
          <div className="space-y-4">
            {/* Request Type and Priority */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Request Type *
                </label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  required
                >
                  {requestTypes.map(type => (
                    <option key={type} value={type}>
                      {type === 'corrective' ? 'Corrective (Breakdown)' : 'Preventive (Routine)'}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Priority *
                </label>
                <select
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  required
                >
                  {priorities.map(priority => (
                    <option key={priority} value={priority}>
                      {priority.charAt(0).toUpperCase() + priority.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="e.g., Oil leak in hydraulic system"
                required
              />
            </div>

            {/* Equipment Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Equipment *
              </label>
              <select
                name="equipment"
                value={formData.equipment}
                onChange={handleEquipmentChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                required
              >
                <option value="">Select Equipment</option>
                {equipment.map(item => (
                  <option key={item._id} value={item._id}>
                    {item.name} - {item.department} ({item.serialNumber})
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Selecting equipment will auto-fill the maintenance team
              </p>
            </div>

            {/* Team and Technician */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Maintenance Team
                </label>
                <select
                  name="team"
                  value={formData.team}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">Select Team</option>
                  {teams.map(team => (
                    <option key={team._id} value={team._id}>{team.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Assign to Technician
                </label>
                <select
                  name="assignedTo"
                  value={formData.assignedTo}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">Unassigned</option>
                  {filteredTechnicians.map(tech => (
                    <option key={tech._id} value={tech._id}>{tech.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Scheduled Date and Duration */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Scheduled Date *
                </label>
                <input
                  type="datetime-local"
                  name="scheduledDate"
                  value={formData.scheduledDate}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estimated Duration (hours)
                </label>
                <input
                  type="number"
                  name="estimatedDuration"
                  value={formData.estimatedDuration}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="2.5"
                  step="0.5"
                  min="0"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Describe the issue or maintenance requirements in detail..."
                required
              />
            </div>

            {/* Workflow Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">Request Workflow</h4>
              <div className="text-sm text-blue-800 space-y-1">
                <p>1. Request starts in <strong>New</strong> stage</p>
                <p>2. Technician picks up and moves to <strong>In Progress</strong></p>
                <p>3. Work completed and moved to <strong>Repaired</strong></p>
                <p>4. If equipment is beyond repair, move to <strong>Scrap</strong></p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateMaintenanceModal