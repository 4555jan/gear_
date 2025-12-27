import React, { useState, useEffect } from 'react'
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd'
import { 
  PlusIcon, 
  WrenchScrewdriverIcon, 
  CalendarIcon, 
  ChartBarIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
  UserIcon,
  Squares2X2Icon,
  TableCellsIcon,
  FunnelIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import CreateMaintenanceModal from '../components/maintenance/CreateMaintenanceModal'
import CalendarView from '../components/maintenance/CalendarView'
import { useAuthStore } from '../stores/authStore'
import { maintenanceService } from '../services/maintenanceService'
import toast from 'react-hot-toast'

const Maintenance = () => {
  const [requests, setRequests] = useState({
    new: [],
    'in-progress': [],
    repaired: [],
    scrap: []
  })
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState('kanban') // kanban, calendar, list
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [selectedTeam, setSelectedTeam] = useState('all')
  const [selectedType, setSelectedType] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [stats, setStats] = useState({
    new: 0,
    'in-progress': 0,
    repaired: 0,
    scrap: 0,
    overdue: 0
  })
  
  const { user } = useAuthStore()

  // Map backend status to frontend stage
  const mapStatusToStage = (status) => {
    switch (status) {
      case 'New': return 'new'
      case 'Assigned': return 'in-progress'
      case 'In Progress': return 'in-progress'
      case 'Waiting for Parts': return 'in-progress'
      case 'On Hold': return 'in-progress'
      case 'Completed': return 'repaired'
      case 'Cancelled': return 'scrap'
      case 'Rejected': return 'scrap'
      default: return 'new'
    }
  }

  // Map frontend stage to backend status
  const mapStageToStatus = (stage) => {
    switch (stage) {
      case 'new': return 'New'
      case 'in-progress': return 'In Progress'
      case 'repaired': return 'Completed'
      case 'scrap': return 'Cancelled'
      default: return 'New'
    }
  }

  const stages = [
    { id: 'new', title: 'New', color: 'bg-blue-500', bgColor: 'bg-blue-50', borderColor: 'border-blue-200' },
    { id: 'in-progress', title: 'In Progress', color: 'bg-yellow-500', bgColor: 'bg-yellow-50', borderColor: 'border-yellow-200' },
    { id: 'repaired', title: 'Repaired', color: 'bg-green-500', bgColor: 'bg-green-50', borderColor: 'border-green-200' },
    { id: 'scrap', title: 'Scrap', color: 'bg-red-500', bgColor: 'bg-red-50', borderColor: 'border-red-200' }
  ]

  const requestTypes = ['corrective', 'preventive']
  const teams = ['Mechanics', 'Electricians', 'IT Support', 'HVAC Technicians']

  useEffect(() => {
    loadMaintenanceRequests()
  }, [selectedTeam, selectedType, searchTerm])

  const loadMaintenanceRequests = async () => {
    try {
      setLoading(true)
      
      // Fetch maintenance requests from API
      const response = await maintenanceService.getAll()
      
      if (response && response.requests) {
        // Group requests by stage according to GearGuard workflow
        // Map backend status to frontend stage
        const mapStatusToStage = (status) => {
          switch (status) {
            case 'New': return 'new'
            case 'Assigned': return 'in-progress'
            case 'In Progress': return 'in-progress'
            case 'Waiting for Parts': return 'in-progress'
            case 'On Hold': return 'in-progress'
            case 'Completed': return 'repaired'
            case 'Cancelled': return 'scrap'
            case 'Rejected': return 'scrap'
            default: return 'new'
          }
        }
        
        const groupedRequests = {
          new: response.requests.filter(r => mapStatusToStage(r.status) === 'new'),
          'in-progress': response.requests.filter(r => mapStatusToStage(r.status) === 'in-progress'),
          repaired: response.requests.filter(r => mapStatusToStage(r.status) === 'repaired'),
          scrap: response.requests.filter(r => mapStatusToStage(r.status) === 'scrap')
        }
        
        setRequests(groupedRequests)
        
        // Calculate stats
        const newStats = {
          new: groupedRequests.new.length,
          'in-progress': groupedRequests['in-progress'].length,
          repaired: groupedRequests.repaired.length,
          scrap: groupedRequests.scrap.length,
          overdue: response.requests.filter(r => 
            new Date(r.dueDate || r.scheduledDate) < new Date() && 
            mapStatusToStage(r.status) !== 'repaired' && 
            mapStatusToStage(r.status) !== 'scrap'
          ).length
        }
        setStats(newStats)
      } else {
        // Initialize empty state if no data
        setRequests({
          new: [],
          'in-progress': [],
          repaired: [],
          scrap: []
        })
        setStats({
          new: 0,
          'in-progress': 0,
          repaired: 0,
          scrap: 0,
          overdue: 0
        })
      }
      
    } catch (error) {
      console.error('Error loading maintenance requests:', error)
      if (error.response?.status === 503) {
        toast.error('Database connection unavailable. Please ensure the server is running.')
      } else {
        toast.error('Failed to load maintenance requests')
      }
      
      // Initialize empty state on error
      setRequests({
        new: [],
        'in-progress': [],
        repaired: [],
        scrap: []
      })
      setStats({
        new: 0,
        'in-progress': 0,
        repaired: 0,
        scrap: 0,
        overdue: 0
      })
    } finally {
      setLoading(false)
    }
  }

  // Handle drag and drop for Kanban board (GearGuard requirement)
  const handleDragEnd = async (result) => {
    if (!result.destination) return

    const { source, destination, draggableId } = result
    
    // If dropped in the same position, do nothing
    if (source.droppableId === destination.droppableId && source.index === destination.index) {
      return
    }

    try {
      // Find the request being moved
      const sourceStage = source.droppableId
      const destStage = destination.droppableId
      
      const request = requests[sourceStage].find(r => r._id === draggableId)
      
      if (request) {
        // Update request stage via API (convert frontend stage to backend status)
        const backendStatus = mapStageToStatus(destStage)
        await maintenanceService.updateStatus(request._id, backendStatus)
        
        // Update local state immediately for better UX
        const newRequests = { ...requests }
        
        // Remove from source
        newRequests[sourceStage] = newRequests[sourceStage].filter(r => r._id !== draggableId)
        
        // Add to destination with updated stage
        const updatedRequest = { ...request, stage: destStage, status: destStage }
        newRequests[destStage] = [...newRequests[destStage], updatedRequest]
        
        setRequests(newRequests)
        
        // Show success message based on GearGuard workflow
        let message = 'Request status updated'
        if (destStage === 'in-progress') {
          message = 'Request moved to In Progress'
        } else if (destStage === 'repaired') {
          message = 'Request marked as Repaired'
        } else if (destStage === 'scrap') {
          message = 'Equipment marked for scrap - check equipment status'
        }
        
        toast.success(message)
      }
    } catch (error) {
      console.error('Error updating request status:', error)
      toast.error('Failed to update request status')
    }
  }

  // Handle creating new maintenance request
  const handleCreateRequest = async (requestData) => {
    try {
      const newRequest = await maintenanceService.create(requestData)
      toast.success('Maintenance request created successfully')
      setIsCreateModalOpen(false)
      loadMaintenanceRequests() // Reload data
    } catch (error) {
      console.error('Error creating maintenance request:', error)
      toast.error('Failed to create maintenance request')
    }
  }

  const isOverdue = (scheduledDate, status) => {
    const stage = mapStatusToStage(status)
    return new Date(scheduledDate) < new Date() && stage !== 'repaired' && stage !== 'scrap'
  }

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'critical':
      case 'emergency': return 'text-red-600 bg-red-100'
      case 'high': return 'text-orange-600 bg-orange-100'
      case 'medium': return 'text-yellow-600 bg-yellow-100'
      case 'low': return 'text-green-600 bg-green-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusColor = (status) => {
    const stage = mapStatusToStage(status)
    switch (stage) {
      case 'new':
        return 'badge-primary'
      case 'in-progress':
        return 'badge-warning'
      case 'repaired':
        return 'badge-success'
      case 'scrap':
        return 'badge-danger'
      default:
        return 'badge-secondary'
    }
  }

  const getStatusIcon = (status) => {
    const stage = mapStatusToStage(status)
    switch (stage) {
      case 'new':
        return <ExclamationCircleIcon className="w-4 h-4" />
      case 'in-progress':
        return <ClockIcon className="w-4 h-4" />
      case 'repaired':
        return <CheckCircleIcon className="w-4 h-4" />
      case 'scrap':
        return <CalendarIcon className="w-4 h-4" />
      default:
        return <CalendarIcon className="w-4 h-4" />
    }
  }

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Create filtered requests array from all stages
  const allRequests = [
    ...requests.new,
    ...requests['in-progress'],
    ...requests.repaired,
    ...requests.scrap
  ]

  const filteredRequests = allRequests.filter(request => {
    const matchesSearch = searchTerm === '' || 
      request.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.equipment?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter
    const matchesPriority = priorityFilter === 'all' || request.priority === priorityFilter
    
    return matchesSearch && matchesStatus && matchesPriority
  })

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Maintenance Requests</h1>
          <p className="text-gray-600">Manage and track maintenance work orders</p>
        </div>
        {user?.role !== 'employee' && (
          <button 
            onClick={() => setIsCreateModalOpen(true)}
            className="btn btn-primary"
          >
            <PlusIcon className="w-4 h-4" />
            Create Request
          </button>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card">
          <div className="card-body text-center">
            <div className="text-2xl font-bold text-blue-600">
              {requests.new.length}
            </div>
            <div className="text-sm text-gray-600">New</div>
          </div>
        </div>
        <div className="card">
          <div className="card-body text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {requests['in-progress'].length}
            </div>
            <div className="text-sm text-gray-600">In Progress</div>
          </div>
        </div>
        <div className="card">
          <div className="card-body text-center">
            <div className="text-2xl font-bold text-green-600">
              {requests.repaired.length}
            </div>
            <div className="text-sm text-gray-600">Repaired</div>
          </div>
        </div>
        <div className="card">
          <div className="card-body text-center">
            <div className="text-2xl font-bold text-red-600">
              {requests.scrap.length}
            </div>
            <div className="text-sm text-gray-600">Scrap</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search
              </label>
              <input
                type="text"
                className="input"
                placeholder="Search requests..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                className="input"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Priority
              </label>
              <select
                className="input"
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
              >
                <option value="all">All Priority</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* View Mode Selector */}
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('kanban')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              viewMode === 'kanban' 
                ? 'bg-purple-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Squares2X2Icon className="w-4 h-4 inline mr-2" />
            Kanban
          </button>
          <button
            onClick={() => setViewMode('calendar')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              viewMode === 'calendar' 
                ? 'bg-purple-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <CalendarIcon className="w-4 h-4 inline mr-2" />
            Calendar
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              viewMode === 'list' 
                ? 'bg-purple-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <TableCellsIcon className="w-4 h-4 inline mr-2" />
            List
          </button>
        </div>
      </div>

      {/* Content based on view mode */}
      {viewMode === 'kanban' && (
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {stages.map((stage) => (
              <Droppable key={stage.id} droppableId={stage.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`${stage.bgColor} ${stage.borderColor} border-2 border-dashed rounded-lg p-4 min-h-96 ${
                      snapshot.isDraggingOver ? 'border-purple-400 bg-purple-50' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-gray-900 flex items-center">
                        <div className={`w-3 h-3 ${stage.color} rounded-full mr-2`}></div>
                        {stage.title}
                      </h3>
                      <span className="bg-white px-2 py-1 rounded-full text-sm font-medium">
                        {requests[stage.id].length}
                      </span>
                    </div>
                    
                    <div className="space-y-3">
                      {requests[stage.id].map((request, index) => (
                        <Draggable key={request._id} draggableId={request._id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`bg-white rounded-lg shadow-sm p-4 border border-gray-200 hover:shadow-md transition-shadow ${
                                snapshot.isDragging ? 'shadow-lg rotate-2' : ''
                              } ${
                                isOverdue(request.scheduledDate || request.dueDate, request.status) ? 'border-red-300 bg-red-50' : ''
                              }`}
                            >
                              <div className="flex items-start justify-between mb-3">
                                <h4 className="font-medium text-gray-900 text-sm leading-tight">
                                  {request.title || request.subject}
                                </h4>
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(request.priority)}`}>
                                  {request.priority}
                                </span>
                              </div>
                              
                              <div className="text-sm text-gray-600 mb-3">
                                <div className="flex items-center mb-1">
                                  <WrenchScrewdriverIcon className="w-4 h-4 mr-1" />
                                  <span>{request.equipment?.name}</span>
                                </div>
                                {request.assignedTo && (
                                  <div className="flex items-center">
                                    <UserIcon className="w-4 h-4 mr-1" />
                                    <span>{request.assignedTo.name}</span>
                                  </div>
                                )}
                              </div>
                              
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-gray-500">
                                  {formatDate(request.scheduledDate || request.dueDate)}
                                </span>
                                {isOverdue(request.scheduledDate || request.dueDate, request.status) && (
                                  <span className="text-red-600 font-medium">Overdue</span>
                                )}
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  </div>
                )}
              </Droppable>
            ))}
          </div>
        </DragDropContext>
      )}

      {viewMode === 'calendar' && (
        <CalendarView 
          requests={allRequests.filter(r => r.type === 'preventive')} 
          onCreateRequest={handleCreateRequest}
        />
      )}

      {viewMode === 'list' && (
        <div className="space-y-4">
          {filteredRequests.length > 0 ? (
            filteredRequests.map((request) => (
          <div 
            key={request._id} 
            className={`card hover:shadow-lg transition-shadow ${
              isOverdue(request.dueDate || request.scheduledDate, request.status) ? 'border-red-200' : ''
            }`}
          >
            <div className="card-body">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-medium text-gray-900">{request.title}</h3>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(request.priority)}`}>
                      {request.priority}
                    </span>
                    <span className={`badge ${getStatusColor(request.status)}`}>
                      {getStatusIcon(request.status)}
                      <span className="ml-1">{request.status.replace('_', ' ')}</span>
                    </span>
                  </div>
                  
                  <p className="text-gray-600 mb-3">{request.description}</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Equipment:</span>
                      <p className="text-gray-600">{request.equipment?.name || 'General'}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Assigned to:</span>
                      <p className="text-gray-600">{request.assignedTo?.name || 'Unassigned'}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Requested by:</span>
                      <p className="text-gray-600">{request.requestedBy?.name}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Due Date:</span>
                      <p className={`${isOverdue(request.dueDate, request.status) ? 'text-red-600 font-medium' : 'text-gray-600'}`}>
                        {formatDate(request.dueDate)}
                      </p>
                    </div>
                  </div>

                  {request.workLog && request.workLog.length > 0 && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                      <h4 className="font-medium text-gray-700 mb-2">Latest Update:</h4>
                      <p className="text-sm text-gray-600">
                        {request.workLog[request.workLog.length - 1].description}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        by {request.workLog[request.workLog.length - 1].technician?.name} • {formatDate(request.workLog[request.workLog.length - 1].timestamp)}
                      </p>
                    </div>
                  )}
                </div>
                
                <div className="flex flex-col space-y-2">
                  <button className="btn btn-outline btn-sm">
                    View Details
                  </button>
                  {user?.role !== 'employee' && request.status !== 'completed' && (
                    <button className="btn btn-primary btn-sm">
                      Update Status
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))
          ) : (
            <div className="text-center py-12">
              <CalendarIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No maintenance requests found</h3>
              <p className="text-gray-600">
                {searchTerm || statusFilter !== 'all' || priorityFilter !== 'all'
                  ? 'Try adjusting your search criteria'
                  : 'Get started by creating your first maintenance request'
                }
              </p>
            </div>
          )}
        </div>
      )}

      {/* Create Maintenance Modal */}
      {isCreateModalOpen && (
        <CreateMaintenanceModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSave={handleCreateRequest}
        />
      )}
    </div>
  )
}

export default Maintenance