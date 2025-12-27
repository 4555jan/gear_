import React, { useState } from 'react'
import { ChevronLeftIcon, ChevronRightIcon, PlusIcon } from '@heroicons/react/24/outline'

const CalendarView = ({ requests = [], onCreateRequest }) => {
  const [currentDate, setCurrentDate] = useState(new Date())

  // Get the first day of the current month
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
  const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
  
  // Get the starting date (previous month's days to fill the week)
  const startDate = new Date(firstDayOfMonth)
  startDate.setDate(startDate.getDate() - firstDayOfMonth.getDay())
  
  // Get the ending date (next month's days to fill the week)
  const endDate = new Date(lastDayOfMonth)
  endDate.setDate(endDate.getDate() + (6 - lastDayOfMonth.getDay()))

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  const navigateMonth = (direction) => {
    const newDate = new Date(currentDate)
    newDate.setMonth(currentDate.getMonth() + direction)
    setCurrentDate(newDate)
  }

  const getRequestsForDate = (date) => {
    const dateStr = date.toISOString().split('T')[0]
    return requests.filter(request => {
      const requestDate = new Date(request.scheduledDate).toISOString().split('T')[0]
      return requestDate === dateStr
    })
  }

  const generateCalendarDays = () => {
    const days = []
    const currentDay = new Date(startDate)

    while (currentDay <= endDate) {
      days.push(new Date(currentDay))
      currentDay.setDate(currentDay.getDate() + 1)
    }

    return days
  }

  const isToday = (date) => {
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  const isCurrentMonth = (date) => {
    return date.getMonth() === currentDate.getMonth()
  }

  const formatTime = (dateStr) => {
    return new Date(dateStr).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 border-red-300 text-red-800'
      case 'high': return 'bg-orange-100 border-orange-300 text-orange-800'
      case 'medium': return 'bg-yellow-100 border-yellow-300 text-yellow-800'
      case 'low': return 'bg-green-100 border-green-300 text-green-800'
      default: return 'bg-gray-100 border-gray-300 text-gray-800'
    }
  }

  const calendarDays = generateCalendarDays()

  return (
    <div className="bg-white shadow-sm border border-gray-200 rounded-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          <p className="text-sm text-gray-600">
            Scheduled maintenance requests for preventive and corrective work
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigateMonth(-1)}
            className="p-2 hover:bg-gray-100 rounded-md transition-colors"
          >
            <ChevronLeftIcon className="w-5 h-5 text-gray-600" />
          </button>
          
          <button
            onClick={() => setCurrentDate(new Date())}
            className="px-3 py-1 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
          >
            Today
          </button>
          
          <button
            onClick={() => navigateMonth(1)}
            className="p-2 hover:bg-gray-100 rounded-md transition-colors"
          >
            <ChevronRightIcon className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        {/* Day Headers */}
        <div className="grid grid-cols-7 bg-gray-50">
          {dayNames.map(day => (
            <div key={day} className="p-3 text-center text-sm font-medium text-gray-700 border-r border-gray-200 last:border-r-0">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7">
          {calendarDays.map((date, index) => {
            const dayRequests = getRequestsForDate(date)
            const isDateToday = isToday(date)
            const isDateCurrentMonth = isCurrentMonth(date)

            return (
              <div 
                key={index}
                className={`min-h-[120px] p-2 border-r border-b border-gray-200 last:border-r-0 ${
                  isDateCurrentMonth ? 'bg-white' : 'bg-gray-50'
                } hover:bg-gray-50 transition-colors cursor-pointer`}
                onClick={() => onCreateRequest && onCreateRequest(date)}
              >
                {/* Date Number */}
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-sm font-medium ${
                    isDateToday 
                      ? 'w-6 h-6 bg-primary-600 text-white rounded-full flex items-center justify-center' 
                      : isDateCurrentMonth 
                        ? 'text-gray-900' 
                        : 'text-gray-400'
                  }`}>
                    {date.getDate()}
                  </span>
                  
                  {/* Add button for current month dates */}
                  {isDateCurrentMonth && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation()
                        onCreateRequest && onCreateRequest(date)
                      }}
                      className="opacity-0 hover:opacity-100 p-1 hover:bg-primary-100 rounded transition-all"
                    >
                      <PlusIcon className="w-3 h-3 text-primary-600" />
                    </button>
                  )}
                </div>

                {/* Requests for this day */}
                <div className="space-y-1">
                  {dayRequests.slice(0, 3).map(request => (
                    <div
                      key={request.id}
                      className={`text-xs p-1 rounded border ${getPriorityColor(request.priority)} truncate`}
                      title={`${request.subject} - ${request.equipment.name} (${formatTime(request.scheduledDate)})`}
                    >
                      <div className="font-medium truncate">{request.subject}</div>
                      <div className="text-xs opacity-75 truncate">
                        {formatTime(request.scheduledDate)}
                      </div>
                    </div>
                  ))}
                  
                  {/* Show more indicator */}
                  {dayRequests.length > 3 && (
                    <div className="text-xs text-gray-500 font-medium">
                      +{dayRequests.length - 3} more
                    </div>
                  )}
                  
                  {/* Empty state for current month */}
                  {dayRequests.length === 0 && isDateCurrentMonth && (
                    <div className="text-xs text-gray-400 italic">
                      No requests
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center space-x-4 text-sm">
          <div className="flex items-center space-x-2">
            <span className="text-gray-600">Priority:</span>
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-green-100 border border-green-300 rounded"></div>
                <span className="text-xs text-gray-600">Low</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-yellow-100 border border-yellow-300 rounded"></div>
                <span className="text-xs text-gray-600">Medium</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-orange-100 border border-orange-300 rounded"></div>
                <span className="text-xs text-gray-600">High</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-red-100 border border-red-300 rounded"></div>
                <span className="text-xs text-gray-600">Critical</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="text-sm text-gray-600">
          <span className="font-medium">{requests.length}</span> total scheduled requests
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>Calendar View:</strong> Click any date to create a new maintenance request for that day. 
          Preventive maintenance requests will appear on their scheduled dates for easy planning.
        </p>
      </div>
    </div>
  )
}

export default CalendarView