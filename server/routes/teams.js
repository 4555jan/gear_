const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');
const Team = require('../models/Team');
const User = require('../models/User');
const MaintenanceRequest = require('../models/MaintenanceRequest');
const { auth, canManageTeams, logUserAction } = require('../middleware/auth');
const { handleValidationErrors, asyncHandler } = require('../middleware/validation');

// Validation rules
const teamValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Team name must be between 2 and 50 characters'),
  body('specialization')
    .isArray({ min: 1 })
    .withMessage('At least one specialization is required'),
  body('maxCapacity')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Max capacity must be between 1 and 50')
];

const addMemberValidation = [
  body('userId')
    .isMongoId()
    .withMessage('Invalid user ID'),
  body('role')
    .optional()
    .isIn(['lead', 'senior', 'junior', 'trainee'])
    .withMessage('Invalid member role')
];

// @route   GET /api/teams
// @desc    Get all teams with pagination and filters
// @access  Private (Admin, Technician for read-only)
router.get('/', auth, [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('specialization')
    .optional()
    .isString()
    .trim()
    .withMessage('Invalid specialization'),
  query('status')
    .optional()
    .isIn(['active', 'inactive', 'disbanded'])
    .withMessage('Invalid status')
], handleValidationErrors, asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  
  // Build filter
  const filter = {};
  if (req.query.specialization) {
    filter.specialization = { $in: [req.query.specialization] };
  }
  if (req.query.status) {
    filter.status = req.query.status;
  }

  // Get teams with pagination
  const teams = await Team.find(filter)
    .populate('teamLead', 'name email')
    .populate('members.user', 'name email role skills')
    .populate('equipment', 'name serialNumber status')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Team.countDocuments(filter);

  // Calculate additional stats for each team
  const teamsWithStats = await Promise.all(teams.map(async (team) => {
    const teamObj = team.toObject();
    
    // Get maintenance stats for this team
    const maintenanceStats = await MaintenanceRequest.aggregate([
      { $match: { assignedTeam: team._id } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          completed: { $sum: { $cond: [{ $eq: ['$status', 'Completed'] }, 1, 0] } },
          inProgress: { $sum: { $cond: [{ $eq: ['$status', 'In Progress'] }, 1, 0] } },
          avgResolutionTime: { 
            $avg: { 
              $cond: [
                { $eq: ['$status', 'Completed'] },
                { 
                  $divide: [
                    { $subtract: ['$completedAt', '$createdAt'] },
                    1000 * 60 * 60 // Convert to hours
                  ]
                },
                null
              ]
            }
          }
        }
      }
    ]);

    const stats = maintenanceStats[0] || { total: 0, completed: 0, inProgress: 0, avgResolutionTime: 0 };
    const efficiency = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

    return {
      ...teamObj,
      activeMembersCount: team.activeMembersCount,
      stats: {
        totalMembers: team.members.length,
        activeMembers: team.activeMembersCount,
        equipmentCount: team.equipment.length,
        completedRequests: stats.completed,
        totalRequests: stats.total,
        inProgressRequests: stats.inProgress,
        avgResponseTime: stats.avgResolutionTime ? `${stats.avgResolutionTime.toFixed(1)} hours` : 'N/A',
        efficiency: `${efficiency}%`
      }
    };
  }));

  res.json({
    teams: teamsWithStats,
    pagination: {
      current: page,
      pages: Math.ceil(total / limit),
      total,
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1
    }
  });
}));

// @route   GET /api/teams/:id
// @desc    Get team by ID with detailed information
// @access  Private
router.get('/:id', auth, [
  param('id').isMongoId().withMessage('Invalid team ID')
], handleValidationErrors, asyncHandler(async (req, res) => {
  const team = await Team.findById(req.params.id)
    .populate('teamLead', 'name email phoneNumber')
    .populate('members.user', 'name email role skills workload lastLogin')
    .populate('equipment', 'name serialNumber status location criticality')
    .populate('currentWorkload');

  if (!team) {
    return res.status(404).json({
      message: 'Team not found',
      code: 'TEAM_NOT_FOUND'
    });
  }

  // Get team performance stats
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - 1); // Last month
  const endDate = new Date();

  const performanceStats = await Team.getTeamPerformance(team._id, startDate, endDate);

  res.json({
    team: {
      ...team.toObject(),
      activeMembersCount: team.activeMembersCount
    },
    performance: performanceStats[0] || {
      completedTasks: 0,
      totalTasks: 0
    }
  });
}));

// @route   POST /api/teams
// @desc    Create new team
// @access  Private (Admin only)
router.post('/', auth, canManageTeams, teamValidation, handleValidationErrors, logUserAction('CREATE_TEAM'), asyncHandler(async (req, res) => {
  const { name, description, specialization, maxCapacity, workingHours, workingDays, location } = req.body;

  // Check if team name already exists
  const existingTeam = await Team.findOne({ name });
  if (existingTeam) {
    return res.status(400).json({
      message: 'Team with this name already exists',
      code: 'TEAM_NAME_EXISTS'
    });
  }

  const team = new Team({
    name,
    description,
    specialization,
    maxCapacity,
    workingHours,
    workingDays,
    location,
    status: 'active'
  });

  await team.save();

  res.status(201).json({
    message: 'Team created successfully',
    team
  });
}));

// @route   PUT /api/teams/:id
// @desc    Update team information
// @access  Private (Admin only)
router.put('/:id', auth, canManageTeams, [
  param('id').isMongoId().withMessage('Invalid team ID'),
  ...teamValidation.map(rule => rule.optional())
], handleValidationErrors, logUserAction('UPDATE_TEAM'), asyncHandler(async (req, res) => {
  const team = await Team.findById(req.params.id);
  
  if (!team) {
    return res.status(404).json({
      message: 'Team not found',
      code: 'TEAM_NOT_FOUND'
    });
  }

  // Check if new name conflicts with existing teams
  if (req.body.name && req.body.name !== team.name) {
    const existingTeam = await Team.findOne({ 
      name: req.body.name, 
      _id: { $ne: team._id } 
    });
    if (existingTeam) {
      return res.status(400).json({
        message: 'Team with this name already exists',
        code: 'TEAM_NAME_EXISTS'
      });
    }
  }

  const allowedUpdates = ['name', 'description', 'specialization', 'maxCapacity', 'workingHours', 'workingDays', 'location', 'status'];
  const updates = {};

  Object.keys(req.body).forEach(key => {
    if (allowedUpdates.includes(key)) {
      updates[key] = req.body[key];
    }
  });

  const updatedTeam = await Team.findByIdAndUpdate(
    req.params.id,
    updates,
    { new: true, runValidators: true }
  ).populate('teamLead', 'name email').populate('members.user', 'name email role');

  res.json({
    message: 'Team updated successfully',
    team: updatedTeam
  });
}));

// @route   DELETE /api/teams/:id
// @desc    Delete team (soft delete - set status to disbanded)
// @access  Private (Admin only)
router.delete('/:id', auth, canManageTeams, [
  param('id').isMongoId().withMessage('Invalid team ID')
], handleValidationErrors, logUserAction('DELETE_TEAM'), asyncHandler(async (req, res) => {
  const team = await Team.findById(req.params.id);
  
  if (!team) {
    return res.status(404).json({
      message: 'Team not found',
      code: 'TEAM_NOT_FOUND'
    });
  }

  // Check if team has active members
  if (team.activeMembersCount > 0) {
    return res.status(400).json({
      message: 'Cannot delete team with active members. Remove all members first.',
      code: 'TEAM_HAS_ACTIVE_MEMBERS'
    });
  }

  // Soft delete - set status to disbanded
  team.status = 'disbanded';
  await team.save();

  res.json({
    message: 'Team disbanded successfully'
  });
}));

// @route   POST /api/teams/:id/members
// @desc    Add member to team
// @access  Private (Admin only)
router.post('/:id/members', auth, canManageTeams, [
  param('id').isMongoId().withMessage('Invalid team ID'),
  ...addMemberValidation
], handleValidationErrors, logUserAction('ADD_TEAM_MEMBER'), asyncHandler(async (req, res) => {
  const { userId, role = 'junior' } = req.body;
  
  const team = await Team.findById(req.params.id);
  if (!team) {
    return res.status(404).json({
      message: 'Team not found',
      code: 'TEAM_NOT_FOUND'
    });
  }

  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({
      message: 'User not found',
      code: 'USER_NOT_FOUND'
    });
  }

  // Check if user is already in a team
  if (user.team) {
    return res.status(400).json({
      message: 'User is already assigned to another team',
      code: 'USER_ALREADY_IN_TEAM'
    });
  }

  // Add member to team
  try {
    await team.addMember(userId, role);
    
    // Update user's team assignment
    user.team = team._id;
    await user.save();

    const updatedTeam = await Team.findById(team._id)
      .populate('members.user', 'name email role skills');

    res.status(201).json({
      message: 'Member added to team successfully',
      team: updatedTeam
    });
  } catch (error) {
    return res.status(400).json({
      message: error.message,
      code: 'ADD_MEMBER_ERROR'
    });
  }
}));

// @route   DELETE /api/teams/:id/members/:userId
// @desc    Remove member from team
// @access  Private (Admin only)
router.delete('/:id/members/:userId', auth, canManageTeams, [
  param('id').isMongoId().withMessage('Invalid team ID'),
  param('userId').isMongoId().withMessage('Invalid user ID')
], handleValidationErrors, logUserAction('REMOVE_TEAM_MEMBER'), asyncHandler(async (req, res) => {
  const { id: teamId, userId } = req.params;
  
  const team = await Team.findById(teamId);
  if (!team) {
    return res.status(404).json({
      message: 'Team not found',
      code: 'TEAM_NOT_FOUND'
    });
  }

  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({
      message: 'User not found',
      code: 'USER_NOT_FOUND'
    });
  }

  // Remove member from team
  try {
    await team.removeMember(userId);
    
    // Remove team assignment from user
    user.team = null;
    await user.save();

    const updatedTeam = await Team.findById(team._id)
      .populate('members.user', 'name email role skills');

    res.json({
      message: 'Member removed from team successfully',
      team: updatedTeam
    });
  } catch (error) {
    return res.status(400).json({
      message: error.message,
      code: 'REMOVE_MEMBER_ERROR'
    });
  }
}));

// @route   PUT /api/teams/:id/members/:userId/role
// @desc    Update member role in team
// @access  Private (Admin only)
router.put('/:id/members/:userId/role', auth, canManageTeams, [
  param('id').isMongoId().withMessage('Invalid team ID'),
  param('userId').isMongoId().withMessage('Invalid user ID'),
  body('role').isIn(['lead', 'senior', 'junior', 'trainee']).withMessage('Invalid role')
], handleValidationErrors, logUserAction('UPDATE_MEMBER_ROLE'), asyncHandler(async (req, res) => {
  const { id: teamId, userId } = req.params;
  const { role } = req.body;
  
  const team = await Team.findById(teamId);
  if (!team) {
    return res.status(404).json({
      message: 'Team not found',
      code: 'TEAM_NOT_FOUND'
    });
  }

  try {
    await team.updateMemberRole(userId, role);

    const updatedTeam = await Team.findById(team._id)
      .populate('teamLead', 'name email')
      .populate('members.user', 'name email role skills');

    res.json({
      message: 'Member role updated successfully',
      team: updatedTeam
    });
  } catch (error) {
    return res.status(400).json({
      message: error.message,
      code: 'UPDATE_ROLE_ERROR'
    });
  }
}));

// @route   GET /api/teams/specialization/:specialization
// @desc    Get teams by specialization
// @access  Private
router.get('/specialization/:specialization', auth, asyncHandler(async (req, res) => {
  const { specialization } = req.params;
  
  const teams = await Team.findBySpecialization(specialization);
  
  res.json({
    specialization,
    teams: teams.map(team => ({
      ...team.toObject(),
      activeMembersCount: team.activeMembersCount
    }))
  });
}));

// @route   GET /api/teams/:id/workload
// @desc    Get team workload and availability
// @access  Private
router.get('/:id/workload', auth, [
  param('id').isMongoId().withMessage('Invalid team ID')
], handleValidationErrors, asyncHandler(async (req, res) => {
  const team = await Team.findById(req.params.id)
    .populate('members.user', 'name workload')
    .populate('currentWorkload');

  if (!team) {
    return res.status(404).json({
      message: 'Team not found',
      code: 'TEAM_NOT_FOUND'
    });
  }

  const workloadData = {
    teamId: team._id,
    teamName: team.name,
    totalMembers: team.activeMembersCount,
    currentWorkload: team.currentWorkload || 0,
    capacity: team.maxCapacity,
    utilization: team.activeMembersCount > 0 ? ((team.currentWorkload || 0) / team.activeMembersCount) * 100 : 0,
    members: team.members
      .filter(member => member.isActive)
      .map(member => ({
        userId: member.user._id,
        name: member.user.name,
        role: member.role,
        workload: member.user.workload,
        availability: member.user.workload < 10 ? 'Available' : 'Busy'
      }))
  };

  res.json(workloadData);
}));

// @route   GET /api/teams/:id/performance
// @desc    Get team performance metrics
// @access  Private (Admin, Team Lead)
router.get('/:id/performance', auth, [
  param('id').isMongoId().withMessage('Invalid team ID'),
  query('startDate').optional().isISO8601().withMessage('Invalid start date'),
  query('endDate').optional().isISO8601().withMessage('Invalid end date')
], handleValidationErrors, asyncHandler(async (req, res) => {
  const team = await Team.findById(req.params.id);
  
  if (!team) {
    return res.status(404).json({
      message: 'Team not found',
      code: 'TEAM_NOT_FOUND'
    });
  }

  // Check access - Admin or Team Lead
  if (req.user.role !== 'admin' && 
      (!team.teamLead || team.teamLead.toString() !== req.user._id.toString())) {
    return res.status(403).json({
      message: 'Access denied. Only admins and team leads can view performance metrics.',
      code: 'ACCESS_DENIED'
    });
  }

  const startDate = req.query.startDate ? new Date(req.query.startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const endDate = req.query.endDate ? new Date(req.query.endDate) : new Date();

  const performanceStats = await Team.getTeamPerformance(team._id, startDate, endDate);

  res.json({
    teamId: team._id,
    teamName: team.name,
    period: { startDate, endDate },
    performance: performanceStats[0] || {
      completedTasks: 0,
      totalTasks: 0,
      completionRate: 0
    }
  });
}));

// @route   GET /api/teams/available-technicians
// @desc    Get available technicians for team assignment
// @access  Private (Admin only)
router.get('/available-technicians/list', auth, canManageTeams, asyncHandler(async (req, res) => {
  const availableTechnicians = await User.find({
    role: 'technician',
    status: 'active',
    team: null
  }).select('name email skills workload phoneNumber department');

  res.json({
    technicians: availableTechnicians,
    count: availableTechnicians.length
  });
}));

module.exports = router;