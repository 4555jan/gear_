import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Dialog, Transition } from '@headlessui/react'
import { Fragment } from 'react'
import { XMarkIcon, UserPlusIcon } from '@heroicons/react/24/outline'
import teamService from '../../services/teamService'
import toast from 'react-hot-toast'
import LoadingSpinner from '../ui/LoadingSpinner'

const memberRoles = [
  { value: 'lead', label: 'Team Lead' },
  { value: 'senior', label: 'Senior Technician' },
  { value: 'junior', label: 'Junior Technician' },
  { value: 'trainee', label: 'Trainee' }
]

const AddTeamMemberModal = ({ isOpen, onClose, teamId, onSuccess }) => {
  const [isLoading, setIsLoading] = useState(false)
  const [availableTechnicians, setAvailableTechnicians] = useState([])
  const [loadingTechnicians, setLoadingTechnicians] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm({
    defaultValues: {
      role: 'junior'
    }
  })

  useEffect(() => {
    if (isOpen) {
      loadAvailableTechnicians()
    }
  }, [isOpen])

  const loadAvailableTechnicians = async () => {
    setLoadingTechnicians(true)
    try {
      const response = await teamService.getAvailableTechnicians()
      setAvailableTechnicians(response.technicians)
    } catch (error) {
      console.error('Error loading technicians:', error)
      toast.error('Failed to load available technicians')
    } finally {
      setLoadingTechnicians(false)
    }
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  const onSubmit = async (data) => {
    if (!data.userId) {
      toast.error('Please select a technician')
      return
    }

    setIsLoading(true)
    try {
      await teamService.addMember(teamId, {
        userId: data.userId,
        role: data.role
      })
      
      toast.success('Team member added successfully')
      handleClose()
      onSuccess && onSuccess()
    } catch (error) {
      console.error('Error adding team member:', error)
      toast.error(error.response?.data?.message || 'Failed to add team member')
    } finally {
      setIsLoading(false)
    }
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
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-lg bg-white p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex items-center justify-between mb-6">
                  <Dialog.Title as="h3" className="text-lg font-medium text-gray-900">
                    Add Team Member
                  </Dialog.Title>
                  <button
                    type="button"
                    className="text-gray-400 hover:text-gray-600"
                    onClick={handleClose}
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                {loadingTechnicians ? (
                  <div className="flex justify-center py-8">
                    <LoadingSpinner size="lg" />
                  </div>
                ) : (
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    {/* Technician Selection */}
                    <div>
                      <label className="form-label">Select Technician *</label>
                      <select
                        {...register('userId', { required: 'Please select a technician' })}
                        className="form-input"
                      >
                        <option value="">Choose a technician...</option>
                        {availableTechnicians.map((technician) => (
                          <option key={technician._id} value={technician._id}>
                            {technician.name} - {technician.email}
                            {technician.skills?.length > 0 && 
                              ` (${technician.skills.join(', ')})`
                            }
                          </option>
                        ))}
                      </select>
                      {errors.userId && <p className="form-error">{errors.userId.message}</p>}
                      
                      {availableTechnicians.length === 0 && (
                        <p className="text-sm text-yellow-600 mt-2">
                          No available technicians. All technicians are already assigned to teams.
                        </p>
                      )}
                    </div>

                    {/* Role Selection */}
                    <div>
                      <label className="form-label">Role *</label>
                      <select
                        {...register('role', { required: 'Please select a role' })}
                        className="form-input"
                      >
                        {memberRoles.map((role) => (
                          <option key={role.value} value={role.value}>
                            {role.label}
                          </option>
                        ))}
                      </select>
                      {errors.role && <p className="form-error">{errors.role.message}</p>}
                    </div>

                    {/* Role Description */}
                    <div className="bg-gray-50 p-4 rounded-md">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Role Responsibilities:</h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li><strong>Team Lead:</strong> Manages team operations, assigns tasks, reports to management</li>
                        <li><strong>Senior Technician:</strong> Handles complex repairs, mentors junior members</li>
                        <li><strong>Junior Technician:</strong> Performs routine maintenance, assists seniors</li>
                        <li><strong>Trainee:</strong> Learning role, works under supervision</li>
                      </ul>
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
                        disabled={isLoading || availableTechnicians.length === 0}
                        className="btn-primary flex items-center"
                      >
                        {isLoading && <LoadingSpinner size="sm" className="mr-2" />}
                        <UserPlusIcon className="h-4 w-4 mr-2" />
                        Add Member
                      </button>
                    </div>
                  </form>
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}

export default AddTeamMemberModal