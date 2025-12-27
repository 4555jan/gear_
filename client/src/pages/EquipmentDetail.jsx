import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  WrenchScrewdriverIcon, 
  ExclamationTriangleIcon, 
  CalendarIcon, 
  BuildingOfficeIcon, 
  UserIcon, 
  ClockIcon,
  PencilIcon,
  TrashIcon,
  QrCodeIcon,
  DocumentArrowDownIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import CreateEquipmentModal from '../components/equipment/CreateEquipmentModal'
import { equipmentService } from '../services/equipmentService'
import { useAuthStore } from '../stores/authStore'
import toast from 'react-hot-toast'

const EquipmentDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()

  const [equipment, setEquipment] = useState(null)
  const [maintenanceHistory, setMaintenanceHistory] = useState([])
  const [maintenanceRequests, setMaintenanceRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('details')

  useEffect(() => {
    loadEquipmentDetails()
  }, [id])

  const loadEquipmentDetails = async () => {
    try {
      setLoading(true)
      const [equipmentData, historyData, requestsData] = await Promise.all([
        equipmentService.getEquipmentById(id),
        equipmentService.getEquipmentMaintenanceHistory(id).catch(() => []),
        equipmentService.getEquipmentMaintenanceRequests(id).catch(() => [])
      ])
      
      setEquipment(equipmentData)
      setMaintenanceHistory(historyData)
      setMaintenanceRequests(requestsData)
    } catch (error) {
      console.error('Error loading equipment details:', error)
      toast.error('Failed to load equipment details')
      navigate('/equipment')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateEquipment = async (equipmentData) => {
    try {
      await equipmentService.updateEquipment(id, equipmentData)
      toast.success('Equipment updated successfully!')
      loadEquipmentDetails()
      setIsEditModalOpen(false)
    } catch (error) {
      toast.error(error.message || 'Failed to update equipment')
    }
  }

  const handleDeleteEquipment = async () => {
    if (window.confirm('Are you sure you want to delete this equipment? This action cannot be undone.')) {
      try {
        await equipmentService.deleteEquipment(id)
        toast.success('Equipment deleted successfully!')
        navigate('/equipment')
      } catch (error) {
        toast.error(error.message || 'Failed to delete equipment')
      }
    }
  }

  const handleStatusChange = async (newStatus) => {
    try {
      await equipmentService.updateEquipmentStatus(id, newStatus)
      toast.success('Equipment status updated successfully!')
      loadEquipmentDetails()
    } catch (error) {
      toast.error(error.message || 'Failed to update status')
    }
  }

  const handleScrapEquipment = async () => {
    const reason = prompt('Please provide a reason for scrapping this equipment:')
    if (reason) {
      try {
        await equipmentService.scrapEquipment(id, reason)
        toast.success('Equipment marked as scrapped!')
        loadEquipmentDetails()
      } catch (error) {
        toast.error(error.message || 'Failed to scrap equipment')
      }
    }
  }

  const generateQRCode = async () => {
    try {
      const blob = await equipmentService.generateQRCode(id)
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `equipment-${equipment.serialNumber}-qr.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      toast.success('QR code downloaded!')
    } catch (error) {
      toast.error('Failed to generate QR code')
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'operational': return 'bg-green-100 text-green-800 border-green-200'
      case 'maintenance': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'down': return 'bg-red-100 text-red-800 border-red-200'
      case 'scrapped': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const formatDate = (date) => {
    if (!date) return 'Not set'
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  if (loading) {
    return <LoadingSpinner />
  }

  if (!equipment) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Equipment not found</p>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white shadow-sm border border-gray-200 rounded-lg p-6">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center space-x-4 mb-4">
              <h1 className="text-2xl font-bold text-gray-900">{equipment.name}</h1>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(equipment.status)}`}>
                {equipment.status}
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
              <div className="flex items-center">
                <BuildingOfficeIcon className="w-4 h-4 mr-2" />
                <span>{equipment.department}</span>
              </div>
              <div className="flex items-center">
                <span className="font-mono">SN: {equipment.serialNumber}</span>
              </div>
              <div className="flex items-center">
                <span>Model: {equipment.model}</span>
              </div>
            </div>
          </div>
          
          {/* Action Buttons */}
          {user?.role !== 'employee' && (
            <div className="flex space-x-3">
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <PencilIcon className="w-4 h-4 mr-2" />
                Edit
              </button>
              <button
                onClick={generateQRCode}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <QrCodeIcon className="w-4 h-4 mr-2" />
                QR Code
              </button>
              {user.role === 'admin' && (
                <button
                  onClick={handleDeleteEquipment}
                  className="inline-flex items-center px-3 py-2 border border-red-300 shadow-sm text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50"
                >
                  <TrashIcon className="w-4 h-4 mr-2" />
                  Delete
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Smart Buttons - Odoo Style */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <button className="bg-primary-50 hover:bg-primary-100 border border-primary-200 rounded-lg p-4 transition-colors group relative">
          <div className="flex items-center justify-between mb-2">
            <WrenchScrewdriverIcon className="w-6 h-6 text-primary-600" />
            <span className="inline-flex items-center justify-center w-6 h-6 text-xs font-bold text-white bg-primary-600 rounded-full">
              {maintenanceRequests.length}
            </span>
          </div>
          <h3 className="text-sm font-semibold text-primary-800">Maintenance Requests</h3>
          <p className="text-xs text-primary-600">{maintenanceRequests.filter(r => r.status === 'open').length} open</p>
        </button>

        <button className="bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg p-4 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <ClockIcon className="w-6 h-6 text-blue-600" />
            <span className="inline-flex items-center justify-center w-6 h-6 text-xs font-bold text-white bg-blue-600 rounded-full">
              {maintenanceHistory.length}
            </span>
          </div>
          <h3 className="text-sm font-semibold text-blue-800">History</h3>
          <p className="text-xs text-blue-600">All activities</p>
        </button>

        <button className="bg-green-50 hover:bg-green-100 border border-green-200 rounded-lg p-4 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <CalendarIcon className="w-6 h-6 text-green-600" />
          </div>
          <h3 className="text-sm font-semibold text-green-800">Schedule</h3>
          <p className="text-xs text-green-600">Maintenance planning</p>
        </button>

        <button className="bg-orange-50 hover:bg-orange-100 border border-orange-200 rounded-lg p-4 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <ChartBarIcon className="w-6 h-6 text-orange-600" />
          </div>
          <h3 className="text-sm font-semibold text-orange-800">Analytics</h3>
          <p className="text-xs text-orange-600">Performance metrics</p>
        </button>
      </div>

      {/* Tabs */}
      <div className="bg-white shadow-sm border border-gray-200 rounded-lg">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            {[
              { key: 'details', name: 'Equipment Details' },
              { key: 'maintenance', name: 'Maintenance' },
              { key: 'history', name: 'History' },
              { key: 'documents', name: 'Documents' }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.key
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'details' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Basic Information */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-500">Name:</span>
                      <span className="text-sm text-gray-900">{equipment.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-500">Model:</span>
                      <span className="text-sm text-gray-900">{equipment.model || 'Not specified'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-500">Serial Number:</span>
                      <span className="text-sm text-gray-900 font-mono">{equipment.serialNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-500">Category:</span>
                      <span className="text-sm text-gray-900">{equipment.category}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-500">Criticality:</span>
                      <span className={`text-sm font-medium ${
                        equipment.criticality === 'critical' ? 'text-red-600' :
                        equipment.criticality === 'high' ? 'text-orange-600' :
                        equipment.criticality === 'medium' ? 'text-yellow-600' : 'text-green-600'
                      }`}>
                        {equipment.criticality || 'Medium'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Location & Assignment */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Location & Assignment</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-500">Department:</span>
                      <span className="text-sm text-gray-900">{equipment.department}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-500">Location:</span>
                      <span className="text-sm text-gray-900">{equipment.location || 'Not specified'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-500">Assigned To:</span>
                      <span className="text-sm text-gray-900">{equipment.assignedTo?.name || 'Unassigned'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-500">Maintenance Team:</span>
                      <span className="text-sm text-gray-900">{equipment.maintenanceTeam?.name || 'Not assigned'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Purchase Information */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Purchase Information</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-500">Purchase Date:</span>
                      <span className="text-sm text-gray-900">{formatDate(equipment.purchaseDate)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-500">Purchase Price:</span>
                      <span className="text-sm text-gray-900">
                        {equipment.purchasePrice ? `$${equipment.purchasePrice.toLocaleString()}` : 'Not specified'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-500">Vendor:</span>
                      <span className="text-sm text-gray-900">{equipment.vendor || 'Not specified'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-500">Warranty Expiry:</span>
                      <span className="text-sm text-gray-900">{formatDate(equipment.warrantyExpiry)}</span>
                    </div>
                  </div>
                </div>

                {/* Status Actions */}
                {user?.role !== 'employee' && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Status Actions</h3>
                    <div className="space-y-3">
                      <div className="flex space-x-2">
                        {['operational', 'maintenance', 'down'].map(status => (
                          <button
                            key={status}
                            onClick={() => handleStatusChange(status)}
                            disabled={equipment.status === status}
                            className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                              equipment.status === status 
                                ? getStatusColor(status)
                                : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                            }`}
                          >
                            {status === 'operational' ? 'Mark Operational' :
                             status === 'maintenance' ? 'Mark for Maintenance' :
                             'Mark as Down'}
                          </button>
                        ))}
                      </div>
                      {equipment.status !== 'scrapped' && (
                        <button
                          onClick={handleScrapEquipment}
                          className="w-full px-3 py-2 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm font-medium hover:bg-red-100 transition-colors"
                        >
                          Mark as Scrapped
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'maintenance' && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Maintenance Information</h3>
              {equipment.maintenanceSchedule?.enabled ? (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <h4 className="font-medium text-blue-900 mb-2">Scheduled Maintenance</h4>
                  <p className="text-sm text-blue-800">
                    {equipment.maintenanceSchedule.type} maintenance every {equipment.maintenanceSchedule.interval} {equipment.maintenanceSchedule.frequency}
                  </p>
                  {equipment.maintenanceSchedule.nextDue && (
                    <p className="text-sm text-blue-700 mt-1">
                      Next due: {formatDate(equipment.maintenanceSchedule.nextDue)}
                    </p>
                  )}
                </div>
              ) : (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
                  <p className="text-sm text-gray-600">No scheduled maintenance configured</p>
                </div>
              )}

              {/* Maintenance Requests */}
              <h4 className="font-medium text-gray-900 mb-3">Recent Maintenance Requests</h4>
              {maintenanceRequests.length > 0 ? (
                <div className="space-y-3">
                  {maintenanceRequests.slice(0, 5).map(request => (
                    <div key={request._id} className="bg-white border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h5 className="font-medium text-gray-900">{request.title}</h5>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          request.status === 'open' ? 'bg-green-100 text-green-800' :
                          request.status === 'in-progress' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {request.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{request.description}</p>
                      <p className="text-xs text-gray-500 mt-2">Created: {formatDate(request.createdAt)}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No maintenance requests found</p>
              )}
            </div>
          )}

          {activeTab === 'history' && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Maintenance History</h3>
              {maintenanceHistory.length > 0 ? (
                <div className="space-y-4">
                  {maintenanceHistory.map(record => (
                    <div key={record._id} className="bg-white border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h5 className="font-medium text-gray-900">{record.type}</h5>
                        <span className="text-xs text-gray-500">{formatDate(record.date)}</span>
                      </div>
                      <p className="text-sm text-gray-600">{record.description}</p>
                      {record.technician && (
                        <p className="text-xs text-gray-500 mt-2">Performed by: {record.technician.name}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No maintenance history available</p>
              )}
            </div>
          )}

          {activeTab === 'documents' && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Documents & Manuals</h3>
              <div className="text-center py-12 text-gray-500">
                <DocumentArrowDownIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>Document management feature coming soon</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      <CreateEquipmentModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSubmit={handleUpdateEquipment}
        equipment={equipment}
      />
    </div>
  )
}

export default EquipmentDetail