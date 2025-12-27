const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');
const MaintenanceRequest = require('../models/MaintenanceRequest');
const MaintenanceController = require('../controllers/maintenanceController');
const { auth, canCreateMaintenance, canAssignTechnicians, canAccessMaintenanceRequest, logUserAction } = require('../middleware/auth');
const { handleValidationErrors, asyncHandler } = require('../middleware/validation');

// Validation rules
const maintenanceRequestValidation = [
  body('title')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Title must be between 5 and 200 characters'),
  body('description')
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('Description must be between 10 and 2000 characters'),
  body('type')
    .isIn(['Corrective', 'Preventive', 'Predictive', 'Emergency'])
    .withMessage('Invalid maintenance type'),
  body('equipment')
    .isMongoId()
    .withMessage('Valid equipment ID is required'),
  body('priority')
    .optional()
    .isIn(['Low', 'Medium', 'High', 'Critical', 'Emergency'])
    .withMessage('Invalid priority')
];

// @route   GET /api/maintenance
// @desc    Get maintenance requests with filters and pagination
// @access  Private (All roles with appropriate filtering)
router.get('/', auth, [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('status').optional().isIn(['New', 'Assigned', 'In Progress', 'Waiting for Parts', 'On Hold', 'Completed', 'Cancelled', 'Rejected']),
  query('priority').optional().isIn(['Low', 'Medium', 'High', 'Critical', 'Emergency']),
  query('type').optional().isIn(['Corrective', 'Preventive', 'Predictive', 'Emergency']),
  query('assignedTechnician').optional().isMongoId().withMessage('Invalid technician ID'),
  query('equipment').optional().isMongoId().withMessage('Invalid equipment ID')
], handleValidationErrors, MaintenanceController.getAllRequests);

// @route   POST /api/maintenance
// @desc    Create new maintenance request
// @access  Private (Admin, Technicians, and Employees)
router.post('/', auth, canCreateMaintenance, [
  ...maintenanceRequestValidation,
  body('scheduledDate').optional().isISO8601().withMessage('Invalid scheduled date'),
  body('estimatedDuration').optional().isNumeric().withMessage('Estimated duration must be a number'),
  body('dueDate').optional().isISO8601().withMessage('Invalid due date')
], handleValidationErrors, logUserAction('CREATE_MAINTENANCE_REQUEST'), MaintenanceController.createRequest);

// @route   GET /api/maintenance/:id
// @desc    Get specific maintenance request
// @access  Private (Based on role and assignment)
router.get('/:id', auth, [
  param('id').isMongoId().withMessage('Invalid maintenance request ID')
], handleValidationErrors, MaintenanceController.getRequestById);

// @route   PUT /api/maintenance/:id/assign
// @desc    Assign technician or team to maintenance request
// @access  Private (Admin and Team Leads)
router.put('/:id/assign', auth, canAssignTechnicians, [
  param('id').isMongoId().withMessage('Invalid maintenance request ID'),
  body('technicianId').optional().isMongoId().withMessage('Invalid technician ID'),
  body('teamId').optional().isMongoId().withMessage('Invalid team ID')
], handleValidationErrors, logUserAction('ASSIGN_MAINTENANCE_REQUEST'), MaintenanceController.assignRequest);

// @route   PUT /api/maintenance/:id/stage
// @desc    Update maintenance request status/stage
// @access  Private (Assigned technician or admin)
router.put('/:id/stage', auth, [
  param('id').isMongoId().withMessage('Invalid maintenance request ID'),
  body('status').isIn(['New', 'Assigned', 'In Progress', 'Waiting for Parts', 'On Hold', 'Completed', 'Cancelled', 'Rejected']).withMessage('Invalid status'),
  body('workNote').optional().trim().isLength({ min: 1, max: 1000 }).withMessage('Work note must be between 1 and 1000 characters'),
  body('hoursWorked').optional().isNumeric().withMessage('Hours worked must be a number'),
  body('partsUsed').optional().isArray().withMessage('Parts used must be an array')
], handleValidationErrors, logUserAction('UPDATE_MAINTENANCE_STATUS'), MaintenanceController.updateStage);

// @route   POST /api/maintenance/:id/notes
// @desc    Add work note to maintenance request
// @access  Private (Assigned technician or admin)
router.post('/:id/notes', auth, [
  param('id').isMongoId().withMessage('Invalid maintenance request ID'),
  body('note').trim().isLength({ min: 1, max: 1000 }).withMessage('Note must be between 1 and 1000 characters'),
  body('hoursWorked').optional().isNumeric().withMessage('Hours worked must be a number')
], handleValidationErrors, logUserAction('ADD_WORK_NOTE'), MaintenanceController.addWorkNote);

// @route   POST /api/maintenance/:id/auto-assign
// @desc    Auto-assign maintenance request to available technician
// @access  Private (Admin and Team Leads)
router.post('/:id/auto-assign', auth, canAssignTechnicians, [
  param('id').isMongoId().withMessage('Invalid maintenance request ID')
], handleValidationErrors, logUserAction('AUTO_ASSIGN_MAINTENANCE'), MaintenanceController.autoAssignRequest);

// @route   GET /api/maintenance/stats/dashboard
// @desc    Get maintenance dashboard statistics
// @access  Private (All roles)
router.get('/stats/dashboard', auth, [
  query('workshop').optional().isMongoId().withMessage('Invalid workshop ID')
], handleValidationErrors, MaintenanceController.getDashboardStats);

// @route   GET /api/maintenance/:id
// @desc    Get maintenance request by ID
// @access  Private (Admin, assigned technician, or creator)
router.get('/:id', auth, canAccessMaintenanceRequest, asyncHandler(async (req, res) => {
  const request = req.maintenanceRequest;
  
  const populatedRequest = await MaintenanceRequest.findById(request._id)
    .populate('equipment', 'name serialNumber location status manufacturer model')
    .populate('createdBy', 'name email phoneNumber')
    .populate('assignedTechnician', 'name email phoneNumber skills')
    .populate('assignedTeam', 'name specialization members')
    .populate('workNotes.technician', 'name email')
    .populate('partsUsed.requestedBy', 'name email')
    .populate('feedback.submittedBy', 'name email');

  res.json({
    request: {
      ...populatedRequest.toObject(),
      totalCost: populatedRequest.totalCost,
      totalHoursWorked: populatedRequest.totalHoursWorked,
      duration: populatedRequest.duration,
      ageInDays: populatedRequest.ageInDays,
      isOverdue: populatedRequest.isOverdue
    }
  });
}));

// @route   POST /api/maintenance
// @desc    Create new maintenance request
// @access  Private (All roles)
router.post('/', auth, canCreateMaintenance, maintenanceRequestValidation, handleValidationErrors, logUserAction('CREATE_MAINTENANCE_REQUEST'), asyncHandler(async (req, res) => {
  const {
    title,
    description,
    type,
    equipment: equipmentId,
    priority,
    scheduledDate,
    estimatedDuration,
    category,
    tags
  } = req.body;

  // Validate equipment exists
  const equipment = await Equipment.findById(equipmentId).populate('assignedTeam');
  if (!equipment) {
    return res.status(404).json({
      message: 'Equipment not found',
      code: 'EQUIPMENT_NOT_FOUND'
    });
  }

  // Create maintenance request
  const maintenanceRequest = new MaintenanceRequest({
    title,
    description,
    type,
    equipment: equipmentId,
    location: equipment.location,
    createdBy: req.user._id,
    assignedTeam: equipment.assignedTeam._id,
    priority: priority || 'Medium',
    scheduledDate,
    estimatedDuration,
    category,
    tags,
    status: 'New'
  });

  // Set due date based on priority if not scheduled
  if (!scheduledDate) {
    const priorityHours = {
      'Emergency': 2,
      'Critical': 8,
      'High': 24,
      'Medium': 72,
      'Low': 168
    };
    
    const dueHours = priorityHours[maintenanceRequest.priority];
    maintenanceRequest.dueDate = new Date(Date.now() + (dueHours * 60 * 60 * 1000));
  } else {
    maintenanceRequest.dueDate = new Date(scheduledDate);
  }

  await maintenanceRequest.save();

  const populatedRequest = await MaintenanceRequest.findById(maintenanceRequest._id)
    .populate('equipment', 'name serialNumber')
    .populate('createdBy', 'name email')
    .populate('assignedTeam', 'name specialization');

  res.status(201).json({
    message: 'Maintenance request created successfully',
    request: populatedRequest
  });
}));

// @route   PUT /api/maintenance/:id/assign
// @desc    Assign technician to maintenance request
// @access  Private (Admin, Team leads)
router.put('/:id/assign', auth, canAssignTechnicians, [
  param('id').isMongoId().withMessage('Invalid request ID'),
  body('technicianId').isMongoId().withMessage('Valid technician ID is required')
], handleValidationErrors, logUserAction('ASSIGN_TECHNICIAN'), asyncHandler(async (req, res) => {
  const { technicianId } = req.body;
  
  const request = await MaintenanceRequest.findById(req.params.id);
  if (!request) {
    return res.status(404).json({
      message: 'Maintenance request not found',
      code: 'REQUEST_NOT_FOUND'
    });
  }

  const technician = await User.findById(technicianId);
  if (!technician || technician.role !== 'technician') {
    return res.status(400).json({
      message: 'Invalid technician',
      code: 'INVALID_TECHNICIAN'
    });
  }

  // Update request
  request.assignedTechnician = technicianId;
  request.status = 'Assigned';
  await request.save();

  // Update technician workload
  technician.workload = (technician.workload || 0) + 1;
  await technician.save();

  const updatedRequest = await MaintenanceRequest.findById(request._id)
    .populate('assignedTechnician', 'name email')
    .populate('equipment', 'name serialNumber');

  res.json({
    message: 'Technician assigned successfully',
    request: updatedRequest
  });
}));

// @route   PUT /api/maintenance/:id/status
// @desc    Update maintenance request status
// @access  Private (Admin, assigned technician)
router.put('/:id/status', auth, [
  param('id').isMongoId().withMessage('Invalid request ID'),
  body('status').isIn(['New', 'Assigned', 'In Progress', 'Waiting for Parts', 'On Hold', 'Completed', 'Cancelled', 'Rejected']).withMessage('Invalid status'),
  body('note').optional().trim().isLength({ max: 1000 }).withMessage('Note cannot exceed 1000 characters')
], handleValidationErrors, canAccessMaintenanceRequest, logUserAction('UPDATE_STATUS'), asyncHandler(async (req, res) => {
  const { status, note } = req.body;
  const request = req.maintenanceRequest;

  // Check permissions for status changes
  if (req.user.role !== 'admin' && 
      (!request.assignedTechnician || request.assignedTechnician.toString() !== req.user._id.toString())) {
    return res.status(403).json({
      message: 'Access denied. Only assigned technician or admin can update status.',
      code: 'STATUS_UPDATE_DENIED'
    });
  }

  const oldStatus = request.status;
  request.status = status;

  // Add work note if provided
  if (note && req.user.role === 'technician') {
    await request.addWorkNote(req.user._id, note);
  }

  // Update technician workload
  if (status === 'Completed' && oldStatus !== 'Completed' && request.assignedTechnician) {
    const technician = await User.findById(request.assignedTechnician);
    if (technician) {
      technician.workload = Math.max(0, (technician.workload || 0) - 1);
      await technician.save();
    }
  }

  await request.save();

  const updatedRequest = await MaintenanceRequest.findById(request._id)
    .populate('assignedTechnician', 'name email')
    .populate('equipment', 'name serialNumber');

  res.json({
    message: 'Status updated successfully',
    request: updatedRequest
  });
}));

// @route   POST /api/maintenance/:id/work-notes
// @desc    Add work note to maintenance request
// @access  Private (Assigned technician, Admin)
router.post('/:id/work-notes', auth, [
  param('id').isMongoId().withMessage('Invalid request ID'),
  body('note').trim().isLength({ min: 1, max: 1000 }).withMessage('Note must be between 1 and 1000 characters'),
  body('hoursWorked').optional().isFloat({ min: 0, max: 24 }).withMessage('Hours worked must be between 0 and 24')
], handleValidationErrors, canAccessMaintenanceRequest, logUserAction('ADD_WORK_NOTE'), asyncHandler(async (req, res) => {
  const { note, hoursWorked } = req.body;
  const request = req.maintenanceRequest;

  // Only technicians and admins can add work notes
  if (req.user.role !== 'admin' && req.user.role !== 'technician') {
    return res.status(403).json({
      message: 'Access denied. Only technicians and admins can add work notes.',
      code: 'WORK_NOTE_DENIED'
    });
  }

  await request.addWorkNote(req.user._id, note, hoursWorked || 0);

  const updatedRequest = await MaintenanceRequest.findById(request._id)
    .populate('workNotes.technician', 'name email');

  res.json({
    message: 'Work note added successfully',
    workNotes: updatedRequest.workNotes
  });
}));

// @route   GET /api/maintenance/dashboard/stats
// @desc    Get maintenance dashboard statistics
// @access  Private (All roles with appropriate filtering)
router.get('/dashboard/stats', auth, asyncHandler(async (req, res) => {
  let matchStage = {};
  
  // Apply role-based filtering
  if (req.user.role === 'employee') {
    matchStage.createdBy = req.user._id;
  } else if (req.user.role === 'technician') {
    matchStage.$or = [
      { assignedTechnician: req.user._id },
      { assignedTeam: req.user.team }
    ];
  }

  const stats = await MaintenanceRequest.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        new: { $sum: { $cond: [{ $eq: ['$status', 'New'] }, 1, 0] } },
        assigned: { $sum: { $cond: [{ $eq: ['$status', 'Assigned'] }, 1, 0] } },
        inProgress: { $sum: { $cond: [{ $eq: ['$status', 'In Progress'] }, 1, 0] } },
        completed: { $sum: { $cond: [{ $eq: ['$status', 'Completed'] }, 1, 0] } },
        overdue: { 
          $sum: { 
            $cond: [
              { 
                $and: [
                  { $ne: ['$status', 'Completed'] },
                  { $lt: ['$dueDate', new Date()] }
                ]
              }, 
              1, 
              0
            ] 
          } 
        },
        emergency: { $sum: { $cond: [{ $eq: ['$priority', 'Emergency'] }, 1, 0] } },
        critical: { $sum: { $cond: [{ $eq: ['$priority', 'Critical'] }, 1, 0] } },
        high: { $sum: { $cond: [{ $eq: ['$priority', 'High'] }, 1, 0] } },
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

  // Calculate trends (compare current month with previous month)
  const now = new Date();
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

  const currentMonthMatch = { ...matchStage, createdAt: { $gte: currentMonthStart } };
  const previousMonthMatch = { 
    ...matchStage, 
    createdAt: { $gte: previousMonthStart, $lte: previousMonthEnd } 
  };

  const [currentMonthStats, previousMonthStats] = await Promise.all([
    MaintenanceRequest.aggregate([
      { $match: currentMonthMatch },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          completed: { $sum: { $cond: [{ $eq: ['$status', 'Completed'] }, 1, 0] } },
          avgResolutionTime: { 
            $avg: { 
              $cond: [
                { $eq: ['$status', 'Completed'] },
                { 
                  $divide: [
                    { $subtract: ['$completedAt', '$createdAt'] },
                    1000 * 60 * 60
                  ]
                },
                null
              ]
            }
          }
        }
      }
    ]),
    MaintenanceRequest.aggregate([
      { $match: previousMonthMatch },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          completed: { $sum: { $cond: [{ $eq: ['$status', 'Completed'] }, 1, 0] } },
          avgResolutionTime: { 
            $avg: { 
              $cond: [
                { $eq: ['$status', 'Completed'] },
                { 
                  $divide: [
                    { $subtract: ['$completedAt', '$createdAt'] },
                    1000 * 60 * 60
                  ]
                },
                null
              ]
            }
          }
        }
      }
    ])
  ]);

  const current = currentMonthStats[0] || { total: 0, completed: 0, avgResolutionTime: 0 };
  const previous = previousMonthStats[0] || { total: 0, completed: 0, avgResolutionTime: 0 };

  const calculateTrend = (current, previous) => {
    if (previous === 0) return current > 0 ? '+100%' : '0%';
    const change = ((current - previous) / previous) * 100;
    const sign = change >= 0 ? '+' : '';
    return `${sign}${change.toFixed(0)}%`;
  };

  const trends = {
    requests: calculateTrend(current.total, previous.total),
    responseTime: calculateTrend(previous.avgResolutionTime || 0, current.avgResolutionTime || 0), // Lower is better, so invert
    efficiency: calculateTrend(current.completed, previous.completed)
  };

  // Get recent requests
  const recentRequests = await MaintenanceRequest.find(matchStage)
    .populate('equipment', 'name serialNumber')
    .populate('assignedTechnician', 'name')
    .sort({ createdAt: -1 })
    .limit(5);

  // Get overdue requests
  const overdueRequests = await MaintenanceRequest.findOverdue();
  let filteredOverdue = overdueRequests;
  
  if (req.user.role === 'employee') {
    filteredOverdue = overdueRequests.filter(req => req.createdBy.toString() === req.user._id.toString());
  } else if (req.user.role === 'technician') {
    filteredOverdue = overdueRequests.filter(req => 
      (req.assignedTechnician && req.assignedTechnician._id.toString() === req.user._id.toString()) ||
      (req.assignedTeam && req.assignedTeam._id.toString() === req.user.team?.toString())
    );
  }

  res.json({
    overview: {
      ...(stats[0] || {}),
      avgResponseTime: stats[0]?.avgResolutionTime ? `${stats[0].avgResolutionTime.toFixed(1)} hours` : 'N/A',
      trends
    },
    recentRequests,
    overdueRequests: filteredOverdue.slice(0, 10),
    user: {
      role: req.user.role,
      team: req.user.team
    }
  });
}));

// @route   GET /api/maintenance/calendar
// @desc    Get maintenance requests for calendar view
// @access  Private (All roles with appropriate filtering)
router.get('/calendar/events', auth, [
  query('start').isISO8601().withMessage('Valid start date is required'),
  query('end').isISO8601().withMessage('Valid end date is required')
], handleValidationErrors, asyncHandler(async (req, res) => {
  const startDate = new Date(req.query.start);
  const endDate = new Date(req.query.end);
  
  let matchStage = {
    $or: [
      { scheduledDate: { $gte: startDate, $lte: endDate } },
      { dueDate: { $gte: startDate, $lte: endDate } }
    ]
  };

  // Apply role-based filtering
  if (req.user.role === 'employee') {
    matchStage.createdBy = req.user._id;
  } else if (req.user.role === 'technician') {
    matchStage.$and = [
      matchStage,
      {
        $or: [
          { assignedTechnician: req.user._id },
          { assignedTeam: req.user.team }
        ]
      }
    ];
  }

  const events = await MaintenanceRequest.find(matchStage)
    .populate('equipment', 'name serialNumber')
    .populate('assignedTechnician', 'name')
    .select('title type status priority scheduledDate dueDate equipment assignedTechnician');

  // Format for calendar
  const calendarEvents = events.map(event => ({
    id: event._id,
    title: `${event.equipment.name} - ${event.title}`,
    start: event.scheduledDate || event.dueDate,
    allDay: !event.scheduledDate,
    color: {
      'Emergency': '#dc2626',
      'Critical': '#ea580c',
      'High': '#f59e0b',
      'Medium': '#3b82f6',
      'Low': '#10b981'
    }[event.priority],
    extendedProps: {
      type: event.type,
      status: event.status,
      priority: event.priority,
      equipment: event.equipment,
      technician: event.assignedTechnician
    }
  }));

  res.json(calendarEvents);
}));

module.exports = router;