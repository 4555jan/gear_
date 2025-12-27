import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Dialog, Transition } from '@headlessui/react'
import { Fragment } from 'react'
import { XMarkIcon, PlusIcon } from '@heroicons/react/24/outline'
import teamService from '../../services/teamService'
import toast from 'react-hot-toast'
import LoadingSpinner from '../ui/LoadingSpinner'

const specializations = [
  'Electrical',
  'Mechanical', 
  'HVAC',
  'Plumbing',
  'IT/Electronics',
  'Building Maintenance',
  'Industrial Equipment',
  'Safety Systems',
  'Automotive',
  'General Maintenance'
]

const workingDays = [
  { value: 'monday', label: 'Monday' },
  { value: 'tuesday', label: 'Tuesday' },
  { value: 'wednesday', label: 'Wednesday' },
  { value: 'thursday', label: 'Thursday' },
  { value: 'friday', label: 'Friday' },
  { value: 'saturday', label: 'Saturday' },
  { value: 'sunday', label: 'Sunday' }
]

const CreateTeamModal = ({ isOpen, onClose, onSuccess }) => {
  const [isLoading, setIsLoading] = useState(false)
  const [selectedSpecializations, setSelectedSpecializations] = useState([])
  const [selectedWorkingDays, setSelectedWorkingDays] = useState(['monday', 'tuesday', 'wednesday', 'thursday', 'friday'])

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm({
    defaultValues: {
      maxCapacity: 10,
      workingHours: {
        start: '08:00',
        end: '17:00'
      }
    }
  })

  const handleClose = () => {
    reset()
    setSelectedSpecializations([])
    setSelectedWorkingDays(['monday', 'tuesday', 'wednesday', 'thursday', 'friday'])
    onClose()
  }

  const onSubmit = async (data) => {
    if (selectedSpecializations.length === 0) {
      toast.error('Please select at least one specialization')
      return
    }

    setIsLoading(true)
    try {
      const teamData = {
        ...data,
        specialization: selectedSpecializations,
        workingDays: selectedWorkingDays
      }

      await teamService.createTeam(teamData)
      toast.success('Team created successfully')
      handleClose()
      onSuccess && onSuccess()
    } catch (error) {
      console.error('Error creating team:', error)
      toast.error(error.response?.data?.message || 'Failed to create team')
    } finally {
      setIsLoading(false)
    }
  }

  const toggleSpecialization = (spec) => {
    setSelectedSpecializations(prev => 
      prev.includes(spec) 
        ? prev.filter(s => s !== spec)
        : [...prev, spec]
    )
  }

  const toggleWorkingDay = (day) => {
    setSelectedWorkingDays(prev => 
      prev.includes(day) 
        ? prev.filter(d => d !== day)
        : [...prev, day]
    )
  }

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-lg bg-white p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex items-center justify-between mb-6">
                  <Dialog.Title as="h3" className="text-lg font-medium text-gray-900">
                    Create New Team
                  </Dialog.Title>
                  <button
                    type="button"
                    className="text-gray-400 hover:text-gray-600"
                    onClick={handleClose}
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  {/* Team Name */}
                  <div>
                    <label className="form-label">Team Name *</label>
                    <input
                      {...register('name', { 
                        required: 'Team name is required',
                        minLength: { value: 2, message: 'Name must be at least 2 characters' }
                      })}
                      type="text"
                      className="form-input"
                      placeholder="Enter team name"
                    />
                    {errors.name && <p className="form-error">{errors.name.message}</p>}
                  </div>

                  {/* Description */}
                  <div>
                    <label className="form-label">Description</label>
                    <textarea
                      {...register('description')}
                      rows={3}
                      className="form-input"
                      placeholder="Enter team description"
                    />
                  </div>

                  {/* Specializations */}
                  <div>
                    <label className="form-label">Specializations *</label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {specializations.map((spec) => (
                        <label key={spec} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={selectedSpecializations.includes(spec)}
                            onChange={() => toggleSpecialization(spec)}
                            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                          />
                          <span className="ml-2 text-sm text-gray-700">{spec}</span>
                        </label>
                      ))}
                    </div>
                    {selectedSpecializations.length === 0 && (
                      <p className="text-red-600 text-sm mt-1">Please select at least one specialization</p>
                    )}
                  </div>

                  {/* Max Capacity */}
                  <div>
                    <label className="form-label">Max Capacity</label>
                    <input
                      {...register('maxCapacity', { 
                        valueAsNumber: true,
                        min: { value: 1, message: 'Capacity must be at least 1' },
                        max: { value: 50, message: 'Capacity cannot exceed 50' }
                      })}
                      type="number"
                      min="1"
                      max="50"
                      className="form-input"
                    />
                    {errors.maxCapacity && <p className="form-error">{errors.maxCapacity.message}</p>}
                  </div>

                  {/* Working Hours */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="form-label">Start Time</label>
                      <input
                        {...register('workingHours.start')}
                        type="time"
                        className="form-input"
                      />
                    </div>
                    <div>
                      <label className="form-label">End Time</label>
                      <input
                        {...register('workingHours.end')}
                        type="time"
                        className="form-input"
                      />
                    </div>
                  </div>

                  {/* Working Days */}
                  <div>
                    <label className="form-label">Working Days</label>
                    <div className="grid grid-cols-4 gap-2 mt-2">
                      {workingDays.map((day) => (
                        <label key={day.value} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={selectedWorkingDays.includes(day.value)}
                            onChange={() => toggleWorkingDay(day.value)}
                            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                          />
                          <span className="ml-2 text-sm text-gray-700">{day.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Location */}
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="form-label">Building</label>
                      <input
                        {...register('location.building')}
                        type="text"
                        className="form-input"
                        placeholder="Building"
                      />
                    </div>
                    <div>
                      <label className="form-label">Floor</label>
                      <input
                        {...register('location.floor')}
                        type="text"
                        className="form-input"
                        placeholder="Floor"
                      />
                    </div>
                    <div>
                      <label className="form-label">Department</label>
                      <input
                        {...register('location.department')}
                        type="text"
                        className="form-input"
                        placeholder="Department"
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end space-x-3 pt-6">
                    <button
                      type="button"
                      onClick={handleClose}
                      className="btn-secondary"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="btn-primary flex items-center"
                    >
                      {isLoading && <LoadingSpinner size="sm" className="mr-2" />}
                      Create Team
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}

export default CreateTeamModal