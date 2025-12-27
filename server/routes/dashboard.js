const express = require('express');
const router = express.Router();
const MaintenanceRequest = require('../models/MaintenanceRequest');
const Equipment = require('../models/Equipment');
const User = require('../models/User');
const Team = require('../models/Team');
const { auth, isAdmin } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/validation');

// @route   GET /api/dashboard/overview
// @desc    Get dashboard overview statistics
// @access  Private (All roles)
router.get('/overview', auth, asyncHandler(async (req, res) => {
  const userRole = req.user.role;
  const userId = req.user._id;
  const userTeam = req.user.team;

  // Base statistics
  let stats = {};

  if (userRole === 'admin') {
    // Admin sees everything
    const [equipmentStats, maintenanceStats, userStats, teamStats] = await Promise.all([
      Equipment.aggregate([
        { $match: { isActive: true } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            active: { $sum: { $cond: [{ $eq: ['$status', 'Active'] }, 1, 0] } },
            maintenance: { $sum: { $cond: [{ $eq: ['$status', 'Maintenance'] }, 1, 0] } },
            outOfService: { $sum: { $cond: [{ $eq: ['$status', 'Out of Service'] }, 1, 0] } },
            critical: { $sum: { $cond: [{ $eq: ['$criticality', 'Critical'] }, 1, 0] } }
          }
        }
      ]),
      MaintenanceRequest.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            open: { $sum: { $cond: [{ $not: { $in: ['$status', ['Completed', 'Cancelled', 'Rejected']] } }, 1, 0] } },
            completed: { $sum: { $cond: [{ $eq: ['$status', 'Completed'] }, 1, 0] } },
            completedToday: { 
              $sum: { 
                $cond: [
                  { 
                    $and: [
                      { $eq: ['$status', 'Completed'] },
                      { $gte: ['$completedAt', new Date(new Date().setHours(0, 0, 0, 0))] }
                    ]
                  }, 
                  1, 
                  0
                ] 
              } 
            },
            overdue: { 
              $sum: { 
                $cond: [
                  { 
                    $and: [
                      { $not: { $in: ['$status', ['Completed', 'Cancelled', 'Rejected']] } },
                      { $lt: ['$dueDate', new Date()] }
                    ]
                  }, 
                  1, 
                  0
                ] 
              } 
            },
            emergency: { $sum: { $cond: [{ $eq: ['$priority', 'Emergency'] }, 1, 0] } }
          }
        }
      ]),
      User.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            active: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
            technicians: { $sum: { $cond: [{ $eq: ['$role', 'technician'] }, 1, 0] } }
          }
        }
      ]),
      Team.countDocuments({ status: 'active' })
    ]);

    stats = {
      equipment: equipmentStats[0] || {},
      maintenance: maintenanceStats[0] || {},
      users: userStats[0] || {},
      activeTeams: teamStats
    };

  } else if (userRole === 'technician') {
    // Technician sees their assignments and team equipment
    const [assignedRequests, teamEquipment, teamRequests] = await Promise.all([
      MaintenanceRequest.find({
        assignedTechnician: userId,
        status: { $not: { $in: ['Completed', 'Cancelled', 'Rejected'] } }
      }).countDocuments(),
      Equipment.find({
        assignedTeam: userTeam,
        isActive: true
      }).countDocuments(),
      MaintenanceRequest.find({
        assignedTeam: userTeam,
        status: { $not: { $in: ['Completed', 'Cancelled', 'Rejected'] } }
      }).countDocuments()
    ]);

    stats = {
      assignedRequests,
      teamEquipment,
      teamRequests,
      workload: req.user.workload || 0
    };

  } else {
    // Employee sees their requests
    const [myRequests, completedRequests] = await Promise.all([
      MaintenanceRequest.find({
        createdBy: userId,
        status: { $not: { $in: ['Completed', 'Cancelled', 'Rejected'] } }
      }).countDocuments(),
      MaintenanceRequest.find({
        createdBy: userId,
        status: 'Completed'
      }).countDocuments()
    ]);

    stats = {
      myRequests,
      completedRequests
    };
  }

  res.json({
    userRole,
    stats,
    timestamp: new Date()
  });
}));

// @route   GET /api/dashboard/recent-activity
// @desc    Get recent activity feed
// @access  Private (All roles)
router.get('/recent-activity', auth, asyncHandler(async (req, res) => {
  let matchStage = {};
  
  if (req.user.role === 'employee') {
    matchStage.createdBy = req.user._id;
  } else if (req.user.role === 'technician') {
    matchStage.$or = [
      { assignedTechnician: req.user._id },
      { assignedTeam: req.user.team }
    ];
  }

  const recentRequests = await MaintenanceRequest.find(matchStage)
    .populate('equipment', 'name serialNumber')
    .populate('createdBy', 'name')
    .populate('assignedTechnician', 'name')
    .sort({ updatedAt: -1 })
    .limit(10);

  const activities = recentRequests.map(request => ({
    id: request._id,
    type: 'maintenance',
    title: request.title,
    equipment: request.equipment.name,
    status: request.status,
    priority: request.priority,
    createdBy: request.createdBy.name,
    assignedTo: request.assignedTechnician?.name,
    timestamp: request.updatedAt,
    age: Math.floor((new Date() - request.updatedAt) / (1000 * 60 * 60 * 24)) // days ago
  }));

  res.json(activities);
}));

// @route   GET /api/dashboard/charts/maintenance-by-status
// @desc    Get maintenance requests grouped by status for charts
// @access  Private (Admin, Technician)
router.get('/charts/maintenance-by-status', auth, asyncHandler(async (req, res) => {
  let matchStage = {};
  
  if (req.user.role === 'technician') {
    matchStage.$or = [
      { assignedTechnician: req.user._id },
      { assignedTeam: req.user.team }
    ];
  } else if (req.user.role === 'employee') {
    matchStage.createdBy = req.user._id;
  }

  const statusData = await MaintenanceRequest.aggregate([
    { $match: matchStage },
    { $group: { _id: '$status', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);

  res.json(statusData);
}));

// @route   GET /api/dashboard/charts/equipment-by-category
// @desc    Get equipment grouped by category for charts
// @access  Private (Admin, Technician)
router.get('/charts/equipment-by-category', auth, asyncHandler(async (req, res) => {
  let matchStage = { isActive: true };
  
  if (req.user.role === 'technician' && req.user.team) {
    matchStage.assignedTeam = req.user.team;
  }

  const categoryData = await Equipment.aggregate([
    { $match: matchStage },
    { $group: { _id: '$category', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);

  res.json(categoryData);
}));

// @route   GET /api/dashboard/charts/maintenance-trends
// @desc    Get maintenance request trends over time
// @access  Private (Admin only)
router.get('/charts/maintenance-trends', auth, isAdmin, asyncHandler(async (req, res) => {
  const months = parseInt(req.query.months) || 6;
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months);

  const trendData = await MaintenanceRequest.aggregate([
    { $match: { createdAt: { $gte: startDate } } },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' }
        },
        total: { $sum: 1 },
        completed: { $sum: { $cond: [{ $eq: ['$status', 'Completed'] }, 1, 0] } },
        pending: { $sum: { $cond: [{ $ne: ['$status', 'Completed'] }, 1, 0] } }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } }
  ]);

  // Format data for frontend charts
  const formattedData = trendData.map(item => ({
    period: `${item._id.year}-${String(item._id.month).padStart(2, '0')}`,
    total: item.total,
    completed: item.completed,
    pending: item.pending
  }));

  res.json(formattedData);
}));

// @route   GET /api/dashboard/workload/technicians
// @desc    Get technician workload data
// @access  Private (Admin, Team leads)
router.get('/workload/technicians', auth, asyncHandler(async (req, res) => {
  let matchStage = { role: 'technician', status: 'active' };
  
  // If user is team lead, only show their team
  if (req.user.role === 'technician' && req.user.team) {
    const team = await Team.findById(req.user.team);
    if (team && team.teamLead && team.teamLead.toString() === req.user._id.toString()) {
      matchStage.team = req.user.team;
    } else {
      return res.status(403).json({
        message: 'Access denied. Only team leads and admins can view workload data.',
        code: 'WORKLOAD_ACCESS_DENIED'
      });
    }
  } else if (req.user.role !== 'admin') {
    return res.status(403).json({
      message: 'Access denied. Only admins and team leads can view workload data.',
      code: 'WORKLOAD_ACCESS_DENIED'
    });
  }

  const technicians = await User.find(matchStage)
    .populate('team', 'name')
    .select('name email workload team')
    .sort({ workload: -1 });

  // Get active assignments for each technician
  const workloadData = await Promise.all(technicians.map(async (tech) => {
    const activeAssignments = await MaintenanceRequest.find({
      assignedTechnician: tech._id,
      status: { $not: { $in: ['Completed', 'Cancelled', 'Rejected'] } }
    }).populate('equipment', 'name serialNumber');

    return {
      id: tech._id,
      name: tech.name,
      email: tech.email,
      team: tech.team?.name,
      workload: tech.workload,
      activeAssignments: activeAssignments.length,
      assignments: activeAssignments.map(req => ({
        id: req._id,
        title: req.title,
        equipment: req.equipment.name,
        priority: req.priority,
        dueDate: req.dueDate
      }))
    };
  }));

  res.json({
    technicians: workloadData,
    summary: {
      totalTechnicians: workloadData.length,
      averageWorkload: workloadData.reduce((sum, tech) => sum + tech.workload, 0) / workloadData.length,
      overloaded: workloadData.filter(tech => tech.workload > 10).length
    }
  });
}));

// @route   GET /api/dashboard/alerts
// @desc    Get system alerts and notifications
// @access  Private (All roles)
router.get('/alerts', auth, asyncHandler(async (req, res) => {
  const alerts = [];
  
  if (req.user.role === 'admin' || req.user.role === 'technician') {
    // Equipment needing maintenance
    const equipmentDue = await Equipment.findMaintenanceDue(7);
    if (equipmentDue.length > 0) {
      alerts.push({
        type: 'warning',
        category: 'maintenance',
        title: 'Equipment Maintenance Due',
        message: `${equipmentDue.length} equipment items need maintenance within 7 days`,
        count: equipmentDue.length,
        action: '/equipment?maintenance=due'
      });
    }

    // Overdue maintenance requests
    const overdueRequests = await MaintenanceRequest.findOverdue();
    let relevantOverdue = overdueRequests;
    
    if (req.user.role === 'technician') {
      relevantOverdue = overdueRequests.filter(req => 
        (req.assignedTechnician && req.assignedTechnician._id.toString() === req.user._id.toString()) ||
        (req.assignedTeam && req.assignedTeam._id.toString() === req.user.team?.toString())
      );
    }

    if (relevantOverdue.length > 0) {
      alerts.push({
        type: 'error',
        category: 'overdue',
        title: 'Overdue Maintenance Requests',
        message: `${relevantOverdue.length} maintenance requests are overdue`,
        count: relevantOverdue.length,
        action: '/maintenance?overdue=true'
      });
    }

    // Critical equipment
    const criticalEquipment = await Equipment.find({
      criticality: 'Critical',
      status: { $in: ['Maintenance', 'Out of Service'] },
      isActive: true
    });

    if (criticalEquipment.length > 0) {
      alerts.push({
        type: 'error',
        category: 'critical',
        title: 'Critical Equipment Issues',
        message: `${criticalEquipment.length} critical equipment items need attention`,
        count: criticalEquipment.length,
        action: '/equipment?criticality=Critical&status=maintenance,out-of-service'
      });
    }
  }

  if (req.user.role === 'admin') {
    // Unassigned requests
    const unassignedRequests = await MaintenanceRequest.find({
      status: 'New',
      assignedTechnician: null
    });

    if (unassignedRequests.length > 0) {
      alerts.push({
        type: 'info',
        category: 'assignment',
        title: 'Unassigned Requests',
        message: `${unassignedRequests.length} maintenance requests need technician assignment`,
        count: unassignedRequests.length,
        action: '/maintenance?status=new&assigned=false'
      });
    }

    // High workload technicians
    const overloadedTechnicians = await User.find({
      role: 'technician',
      workload: { $gt: 10 },
      status: 'active'
    });

    if (overloadedTechnicians.length > 0) {
      alerts.push({
        type: 'warning',
        category: 'workload',
        title: 'Overloaded Technicians',
        message: `${overloadedTechnicians.length} technicians have high workloads`,
        count: overloadedTechnicians.length,
        action: '/dashboard/workload'
      });
    }
  }

  res.json({
    alerts,
    count: alerts.length,
    lastUpdated: new Date()
  });
}));

module.exports = router;