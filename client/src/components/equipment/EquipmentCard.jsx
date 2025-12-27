import React from 'react'
import { useNavigate } from 'react-router-dom'
import { WrenchScrewdriverIcon, ExclamationTriangleIcon, CalendarIcon, BuildingOfficeIcon, UserIcon, ClockIcon } from '@heroicons/react/24/outline'
import { useAuthStore } from '../../stores/authStore'

const EquipmentCard = ({ equipment, onUpdate }) => {
  const { user } = useAuthStore()
  const navigate = useNavigate()

  const getStatusColor = (status) => {
    switch (status) {
      case 'operational': return 'bg-green-100 text-green-800 border-green-200'
      case 'maintenance': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'down': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical': return 'text-red-600'
      case 'high': return 'text-orange-600'
      case 'medium': return 'text-yellow-600'
      case 'low': return 'text-green-600'
      default: return 'text-gray-600'
    }
  }

  const formatDate = (date) => {
    if (!date) return 'Not set'
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  // Mock maintenance request count - replace with actual API call
  const maintenanceRequestCount = Math.floor(Math.random() * 5)
  const openRequestCount = Math.floor(Math.random() * 3)

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">{equipment.name}</h3>
            <p className="text-sm text-gray-600">{equipment.model}</p>
            <p className="text-xs text-gray-500 font-mono">SN: {equipment.serialNumber}</p>
          </div>
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(equipment.status)}`}>
            {equipment.status}
          </span>
        </div>

        {/* Quick Info */}
        <div className="space-y-2">
          <div className="flex items-center text-sm text-gray-600">
            <BuildingOfficeIcon className="w-4 h-4 mr-2 text-gray-400" />
            <span className="font-medium w-20">Department:</span>
            <span>{equipment.department || 'Not Assigned'}</span>
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <UserIcon className="w-4 h-4 mr-2 text-gray-400" />
            <span className="font-medium w-20">Assigned to:</span>
            <span>{equipment.assignedTo?.name || 'Unassigned'}</span>
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <WrenchScrewdriverIcon className="w-4 h-4 mr-2 text-gray-400" />
            <span className="font-medium w-20">Team:</span>
            <span>{equipment.maintenanceTeam?.name || 'Not Assigned'}</span>
          </div>
        </div>
      </div>

      {/* Details */}
      <div className="p-4 space-y-3">
        {/* Equipment Details */}\n        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="font-medium text-gray-700">Category:</span>
            <p className="text-gray-600">{equipment.category}</p>
          </div>
          <div>
            <span className="font-medium text-gray-700">Location:</span>
            <p className="text-gray-600">{equipment.location}</p>
          </div>
          <div>
            <span className="font-medium text-gray-700">Purchase Date:</span>
            <p className="text-gray-600">{formatDate(equipment.purchaseDate)}</p>
          </div>
          <div>
            <span className="font-medium text-gray-700">Warranty:</span>
            <p className="text-gray-600">{formatDate(equipment.warrantyExpiry)}</p>
          </div>
        </div>

        {/* Priority */}
        {equipment.criticality && (
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Priority:</span>
            <span className={`text-sm font-medium ${getPriorityColor(equipment.criticality)}`}>
              {equipment.criticality}
            </span>
          </div>
        )}

        {/* Next Maintenance Schedule */}
        {equipment.maintenanceSchedule && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center text-sm text-blue-800">
              <CalendarIcon className="w-4 h-4 mr-2" />
              <span className="font-medium">Next Maintenance:</span>
            </div>
            <p className="text-sm text-blue-700 mt-1">
              {equipment.maintenanceSchedule.type} - 
              Every {equipment.maintenanceSchedule.interval} {equipment.maintenanceSchedule.frequency}
            </p>
            {equipment.maintenanceSchedule.nextDue && (
              <p className="text-xs text-blue-600 mt-1">
                Due: {formatDate(equipment.maintenanceSchedule.nextDue)}
              </p>
            )}
          </div>
        )}

        {/* Critical Status Alert */}
        {equipment.status === 'down' && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start">
            <ExclamationTriangleIcon className="w-4 h-4 text-red-600 mr-2 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-red-800">Equipment Down</p>
              <p className="text-xs text-red-700">Requires immediate attention</p>
            </div>
          </div>
        )}
      </div>

      {/* Smart Buttons - Odoo Style */}
      <div className="px-4 pb-4">\n        <div className="grid grid-cols-2 gap-2">
          {/* Maintenance Requests Button with Count */}
          <button className="relative bg-primary-50 hover:bg-primary-100 border border-primary-200 rounded-lg p-3 transition-colors group">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <WrenchScrewdriverIcon className="w-4 h-4 text-primary-600 mr-2" />
                <span className="text-sm font-medium text-primary-800">Maintenance</span>
              </div>
              {maintenanceRequestCount > 0 && (
                <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-primary-600 rounded-full">
                  {maintenanceRequestCount}
                </span>
              )}
            </div>
            <p className="text-xs text-primary-700 mt-1 text-left">
              {maintenanceRequestCount} total, {openRequestCount} open
            </p>
          </button>

          {/* History Button */}
          <button className="bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg p-3 transition-colors">
            <div className="flex items-center">
              <ClockIcon className="w-4 h-4 text-gray-600 mr-2" />
              <span className="text-sm font-medium text-gray-800">History</span>
            </div>
            <p className="text-xs text-gray-600 mt-1 text-left">View all activities</p>
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 mt-3">
          <button 
            onClick={() => navigate(`/equipment/${equipment._id}`)}
            className="flex-1 bg-white border border-gray-300 text-gray-700 px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            View Details
          </button>
          {user?.role !== 'employee' && (
            <button className="flex-1 bg-primary-600 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-primary-700 transition-colors">
              Edit Equipment
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default EquipmentCard