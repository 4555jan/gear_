import api from './api'

class TeamService {
  // Get all teams with filters
  async getTeams(params = {}) {
    const response = await api.get('/teams', { params })
    return response.data
  }

  // Get team by ID
  async getTeam(id) {
    const response = await api.get(`/teams/${id}`)
    return response.data
  }

  // Create new team
  async createTeam(teamData) {
    const response = await api.post('/teams', teamData)
    return response.data
  }

  // Update team
  async updateTeam(id, teamData) {
    const response = await api.put(`/teams/${id}`, teamData)
    return response.data
  }

  // Delete team
  async deleteTeam(id) {
    const response = await api.delete(`/teams/${id}`)
    return response.data
  }

  // Add member to team
  async addMember(teamId, memberData) {
    const response = await api.post(`/teams/${teamId}/members`, memberData)
    return response.data
  }

  // Remove member from team
  async removeMember(teamId, userId) {
    const response = await api.delete(`/teams/${teamId}/members/${userId}`)
    return response.data
  }

  // Update member role
  async updateMemberRole(teamId, userId, role) {
    const response = await api.put(`/teams/${teamId}/members/${userId}/role`, { role })
    return response.data
  }

  // Get teams by specialization
  async getTeamsBySpecialization(specialization) {
    const response = await api.get(`/teams/specialization/${specialization}`)
    return response.data
  }

  // Get team workload
  async getTeamWorkload(teamId) {
    const response = await api.get(`/teams/${teamId}/workload`)
    return response.data
  }

  // Get team performance
  async getTeamPerformance(teamId, startDate, endDate) {
    const response = await api.get(`/teams/${teamId}/performance`, {
      params: { startDate, endDate }
    })
    return response.data
  }

  // Get available technicians
  async getAvailableTechnicians() {
    const response = await api.get('/teams/available-technicians/list')
    return response.data
  }
}

export default new TeamService()