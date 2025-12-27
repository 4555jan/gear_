import { useState, useEffect } from 'react'
import { useAuthStore } from '../stores/authStore'
import teamService from '../services/teamService'
import { PlusIcon, UserGroupIcon, UsersIcon, Cog6ToothIcon } from '@heroicons/react/24/outline'
import CreateTeamModal from '../components/teams/CreateTeamModal'
import AddTeamMemberModal from '../components/teams/AddTeamMemberModal'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import toast from 'react-hot-toast'

const Teams = () => {
  const { user } = useAuthStore()
  const [teams, setTeams] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showAddMemberModal, setShowAddMemberModal] = useState(false)
  const [selectedTeamId, setSelectedTeamId] = useState(null)

  useEffect(() => {
    loadTeams()
  }, [])

  const loadTeams = async () => {
    try {
      const response = await teamService.getTeams()
      setTeams(response.teams)
    } catch (error) {
      console.error('Error loading teams:', error)
      toast.error('Failed to load teams')
    } finally {
      setLoading(false)
    }
  }

  const handleAddMember = (teamId) => {
    setSelectedTeamId(teamId)
    setShowAddMemberModal(true)
  }

  const handleRemoveMember = async (teamId, userId) => {
    if (window.confirm('Are you sure you want to remove this member from the team?')) {
      try {
        await teamService.removeMember(teamId, userId)
        toast.success('Member removed successfully')
        loadTeams()
      } catch (error) {
        console.error('Error removing member:', error)
        toast.error(error.response?.data?.message || 'Failed to remove member')
      }
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Team Management</h1>
          <p className="text-gray-600">Manage maintenance teams and technician assignments</p>
        </div>
        
        {user.role === 'admin' && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary flex items-center"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Create Team
          </button>
        )}
      </div>

      {/* Teams Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teams.map((team) => (
          <div key={team._id} className="card">
            <div className="card-header">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <UserGroupIcon className="h-6 w-6 text-primary-600 mr-2" />
                  <h3 className="text-lg font-medium text-gray-900">{team.name}</h3>
                </div>
                <span className={`badge ${team.status === 'active' ? 'badge-success' : 'badge-gray'}`}>
                  {team.status}
                </span>
              </div>
              {team.description && (
                <p className="text-sm text-gray-600 mt-2">{team.description}</p>
              )}
            </div>

            <div className="card-body">
              {/* Specializations */}
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Specializations</h4>
                <div className="flex flex-wrap gap-1">
                  {team.specialization.map((spec) => (
                    <span key={spec} className="badge badge-primary">
                      {spec}
                    </span>
                  ))}
                </div>
              </div>

              {/* Team Stats */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{team.stats.activeMembers}</div>
                  <div className="text-sm text-gray-600">Active Members</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{team.stats.equipmentCount}</div>
                  <div className="text-sm text-gray-600">Equipment</div>
                </div>
              </div>

              {/* Team Members */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium text-gray-700">Members</h4>
                  {user.role === 'admin' && (
                    <button
                      onClick={() => handleAddMember(team._id)}
                      className="btn-secondary btn-xs"
                    >
                      <UsersIcon className="h-3 w-3 mr-1" />
                      Add
                    </button>
                  )}
                </div>
                
                {team.members.length > 0 ? (
                  <div className="space-y-2">
                    {team.members.slice(0, 3).map((member) => (
                      <div key={member._id} className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{member.user.name}</p>
                          <p className="text-xs text-gray-500 capitalize">{member.role}</p>
                        </div>
                        {user.role === 'admin' && (
                          <button
                            onClick={() => handleRemoveMember(team._id, member.user._id)}
                            className="text-red-600 hover:text-red-800 text-xs"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    ))}
                    {team.members.length > 3 && (
                      <p className="text-xs text-gray-500">
                        +{team.members.length - 3} more members
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No members assigned</p>
                )}
              </div>

              {/* Team Lead */}
              {team.teamLead && (
                <div className="border-t pt-3">
                  <div className="flex items-center">
                    <Cog6ToothIcon className="h-4 w-4 text-gray-400 mr-2" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{team.teamLead.name}</p>
                      <p className="text-xs text-gray-500">Team Lead</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {teams.length === 0 && (
        <div className="text-center py-12">
          <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No teams found</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by creating a new team.</p>
          {user.role === 'admin' && (
            <div className="mt-6">
              <button
                onClick={() => setShowCreateModal(true)}
                className="btn-primary"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Create Your First Team
              </button>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <CreateTeamModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={loadTeams}
      />

      <AddTeamMemberModal
        isOpen={showAddMemberModal}
        onClose={() => setShowAddMemberModal(false)}
        teamId={selectedTeamId}
        onSuccess={loadTeams}
      />
    </div>
  )
}

export default Teams