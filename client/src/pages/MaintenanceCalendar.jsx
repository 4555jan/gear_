import React, { useState, useEffect, useCallback } from 'react'
import { Calendar, dateFnsLocalizer } from 'react-big-calendar'
import { format, parse, startOfWeek, getDay, addDays, isSameDay } from 'date-fns'
import { enUS } from 'date-fns/locale'
import { 
  CalendarIcon, 
  UserGroupIcon, 
  WrenchScrewdriverIcon,
  FunnelIcon,
  PlusIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import '../styles/calendar.css'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import { useAuthStore } from '../stores/authStore'
import toast from 'react-hot-toast'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

// Configure calendar localizer
const locales = {
  'en-US': enUS,
}

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
})

const MaintenanceCalendar = () => {
  const { user } = useAuthStore()
  const [events, setEvents] = useState([])
  const [maintenanceRequests, setMaintenanceRequests] = useState([])
  const [teams, setTeams] = useState([])
  const [selectedTeam, setSelectedTeam] = useState('all')
  const [selectedType, setSelectedType] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [loading, setLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [showEventModal, setShowEventModal] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState(null)

  // Fetch maintenance requests
  const fetchMaintenanceRequests = useCallback(async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const response = await axios.get(`${API_URL}/api/maintenance`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      const requests = response.data.requests || response.data
      setMaintenanceRequests(requests)
      
      // Convert to calendar events
      const calendarEvents = requests
        .filter(req => req.scheduledDate)
        .map(req => ({
          id: req._id,
          title: req.subject || 'Maintenance Request',
          start: new Date(req.scheduledDate),
          end: new Date(new Date(req.scheduledDate).getTime() + (req.duration || 60) * 60000),
          resource: req,
          type: req.maintenanceType,
          priority: req.priority,
          status: req.stage,
          technician: req.assignedTo?.name || 'Unassigned',
          equipment: req.equipment?.name || 'N/A',
          team: req.maintenanceTeam?.name || 'N/A'
        }))
      
      setEvents(calendarEvents)
    } catch (error) {
      console.error('Error fetching maintenance requests:', error)
      toast.error('Failed to load maintenance calendar')
    } finally {
      setLoading(false)
    }
  }, [])

  // Fetch teams
  const fetchTeams = useCallback(async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get(`${API_URL}/api/teams`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setTeams(response.data.teams || response.data)
    } catch (error) {
      console.error('Error fetching teams:', error)
    }
  }, [])

  useEffect(() => {
    fetchMaintenanceRequests()
    fetchTeams()
  }, [fetchMaintenanceRequests, fetchTeams])

  // Filter events based on selected filters
  const filteredEvents = events.filter(event => {
    if (selectedTeam !== 'all' && event.team !== selectedTeam) return false
    if (selectedType !== 'all' && event.type !== selectedType) return false
    if (selectedStatus !== 'all' && event.status !== selectedStatus) return false
    return true
  })

  // Event style getter - color code by priority and type
  const eventStyleGetter = (event) => {
    let backgroundColor = '#3174ad' // Default blue
    let borderColor = '#265985'
    
    // Color by priority
    if (event.priority === 'Critical') {
      backgroundColor = '#dc2626' // Red
      borderColor = '#991b1b'
    } else if (event.priority === 'High') {
      backgroundColor = '#f59e0b' // Orange
      borderColor = '#d97706'
    } else if (event.priority === 'Medium') {
      backgroundColor = '#3b82f6' // Blue
      borderColor = '#2563eb'
    } else if (event.priority === 'Low') {
      backgroundColor = '#10b981' // Green
      borderColor = '#059669'
    }

    // Add opacity for completed/cancelled tasks
    if (event.status === 'Completed' || event.status === 'Cancelled') {
      backgroundColor = '#9ca3af' // Gray
      borderColor = '#6b7280'
    }

    return {
      style: {
        backgroundColor,
        borderColor,
        borderWidth: '2px',
        borderStyle: 'solid',
        borderRadius: '4px',
        opacity: 0.9,
        color: 'white',
        display: 'block',
        fontSize: '0.85rem',
        padding: '2px 5px'
      }
    }
  }

  // Handle event selection
  const handleSelectEvent = (event) => {
    setSelectedEvent(event)
    setShowEventModal(true)
  }

  // Handle slot selection for creating new requests
  const handleSelectSlot = (slotInfo) => {
    setSelectedSlot(slotInfo)
    setShowCreateModal(true)
  }

  // Custom event component
  const EventComponent = ({ event }) => (
    <div className="flex items-center space-x-1 overflow-hidden">
      <WrenchScrewdriverIcon className="h-3 w-3 flex-shrink-0" />
      <span className="truncate text-xs font-medium">{event.title}</span>
      {event.technician && (
        <span className="text-xs opacity-75">- {event.technician}</span>
      )}
    </div>
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-indigo-100 rounded-lg">
            <CalendarIcon className="h-6 w-6 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Maintenance Calendar</h1>
            <p className="text-sm text-gray-500">Schedule and track maintenance tasks</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <FunnelIcon className="h-5 w-5 mr-2" />
            Filters
            {(selectedTeam !== 'all' || selectedType !== 'all' || selectedStatus !== 'all') && (
              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                Active
              </span>
            )}
          </button>
          
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Schedule Task
          </button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Team Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <UserGroupIcon className="h-4 w-4 inline mr-1" />
                Team
              </label>
              <select
                value={selectedTeam}
                onChange={(e) => setSelectedTeam(e.target.value)}
                className="w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="all">All Teams</option>
                {teams.map(team => (
                  <option key={team._id} value={team.name}>{team.name}</option>
                ))}
              </select>
            </div>

            {/* Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <WrenchScrewdriverIcon className="h-4 w-4 inline mr-1" />
                Maintenance Type
              </label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="all">All Types</option>
                <option value="Preventive">Preventive</option>
                <option value="Corrective">Corrective</option>
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="all">All Statuses</option>
                <option value="New">New</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          {(selectedTeam !== 'all' || selectedType !== 'all' || selectedStatus !== 'all') && (
            <div className="mt-4">
              <button
                onClick={() => {
                  setSelectedTeam('all')
                  setSelectedType('all')
                  setSelectedStatus('all')
                }}
                className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>
      )}

      {/* Legend */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <span className="font-medium text-gray-700">Priority:</span>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-red-600 rounded"></div>
            <span>Critical</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-orange-500 rounded"></div>
            <span>High</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-blue-500 rounded"></div>
            <span>Medium</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-green-500 rounded"></div>
            <span>Low</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-gray-400 rounded"></div>
            <span>Completed/Cancelled</span>
          </div>
        </div>
      </div>

      {/* Calendar */}
      <div className="bg-white rounded-lg shadow p-6" style={{ height: '700px' }}>
        <Calendar
          localizer={localizer}
          events={filteredEvents}
          startAccessor="start"
          endAccessor="end"
          onSelectEvent={handleSelectEvent}
          onSelectSlot={handleSelectSlot}
          selectable
          eventPropGetter={eventStyleGetter}
          components={{
            event: EventComponent
          }}
          views={['month', 'week', 'day', 'agenda']}
          defaultView="month"
          popup
          tooltipAccessor={(event) => `${event.title} - ${event.technician} - ${event.priority} Priority`}
        />
      </div>

      {/* Event Details Modal */}
      {showEventModal && selectedEvent && (
        <EventDetailsModal
          event={selectedEvent}
          onClose={() => {
            setShowEventModal(false)
            setSelectedEvent(null)
          }}
          onRefresh={fetchMaintenanceRequests}
        />
      )}

      {/* Create Request Modal */}
      {showCreateModal && (
        <CreateMaintenanceModal
          selectedDate={selectedSlot?.start}
          onClose={() => {
            setShowCreateModal(false)
            setSelectedSlot(null)
          }}
          onRefresh={fetchMaintenanceRequests}
        />
      )}
    </div>
  )
}

// Event Details Modal Component
const EventDetailsModal = ({ event, onClose, onRefresh }) => {
  const request = event.resource

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'Critical': return 'bg-red-100 text-red-800'
      case 'High': return 'bg-orange-100 text-orange-800'
      case 'Medium': return 'bg-blue-100 text-blue-800'
      case 'Low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'New': return 'bg-blue-100 text-blue-800'
      case 'In Progress': return 'bg-yellow-100 text-yellow-800'
      case 'Completed': return 'bg-green-100 text-green-800'
      case 'Cancelled': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900">{request.subject}</h2>
              <p className="text-sm text-gray-500 mt-1">Request ID: {request._id?.slice(-6)}</p>
            </div>
            <button
              onClick={onClose}
              className="ml-4 text-gray-400 hover:text-gray-500"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <div className="space-y-6">
            {/* Status and Priority */}
            <div className="flex space-x-3">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(request.priority)}`}>
                {request.priority} Priority
              </span>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(request.stage)}`}>
                {request.stage}
              </span>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                {request.maintenanceType}
              </span>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500">Equipment</label>
                <p className="mt-1 text-sm text-gray-900">{request.equipment?.name || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Team</label>
                <p className="mt-1 text-sm text-gray-900">{request.maintenanceTeam?.name || 'Unassigned'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Assigned To</label>
                <p className="mt-1 text-sm text-gray-900">{request.assignedTo?.name || 'Unassigned'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Scheduled Date</label>
                <p className="mt-1 text-sm text-gray-900">
                  {request.scheduledDate ? format(new Date(request.scheduledDate), 'PPp') : 'Not scheduled'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Duration</label>
                <p className="mt-1 text-sm text-gray-900">{request.duration || 0} hours</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Created By</label>
                <p className="mt-1 text-sm text-gray-900">{request.createdBy?.name || 'N/A'}</p>
              </div>
            </div>

            {/* Description */}
            {request.description && (
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-2">Description</label>
                <p className="text-sm text-gray-900 bg-gray-50 rounded-lg p-4">{request.description}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Close
              </button>
              <button
                onClick={() => {
                  window.location.href = `/maintenance/${request._id}`
                }}
                className="px-4 py-2 bg-indigo-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-indigo-700"
              >
                View Full Details
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Create Maintenance Modal Component
const CreateMaintenanceModal = ({ selectedDate, onClose, onRefresh }) => {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    subject: '',
    maintenanceType: 'Preventive',
    priority: 'Medium',
    scheduledDate: selectedDate ? format(selectedDate, "yyyy-MM-dd'T'HH:mm") : '',
    duration: 1,
    description: ''
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const token = localStorage.getItem('token')
      await axios.post(`${API_URL}/api/maintenance`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      toast.success('Maintenance task scheduled successfully')
      onRefresh()
      onClose()
    } catch (error) {
      console.error('Error creating maintenance request:', error)
      toast.error(error.response?.data?.message || 'Failed to schedule maintenance task')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Schedule Maintenance Task</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Subject *</label>
              <input
                type="text"
                required
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Type *</label>
                <select
                  value={formData.maintenanceType}
                  onChange={(e) => setFormData({ ...formData, maintenanceType: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="Preventive">Preventive</option>
                  <option value="Corrective">Corrective</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Priority *</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Scheduled Date & Time *</label>
                <input
                  type="datetime-local"
                  required
                  value={formData.scheduledDate}
                  onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Duration (hours) *</label>
                <input
                  type="number"
                  min="0.5"
                  step="0.5"
                  required
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: parseFloat(e.target.value) })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                rows="3"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-indigo-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {loading ? 'Scheduling...' : 'Schedule Task'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default MaintenanceCalendar
