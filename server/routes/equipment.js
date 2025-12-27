const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');
const Equipment = require('../models/Equipment');
const Team = require('../models/Team');
const User = require('../models/User');
const { auth, canManageEquipment, canViewEquipment, logUserAction } = require('../middleware/auth');
const { handleValidationErrors, asyncHandler } = require('../middleware/validation');

// Validation rules
const equipmentValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Equipment name must be between 2 and 100 characters'),
  body('serialNumber')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Serial number is required'),
  body('category')
    .isIn(['HVAC', 'Electrical', 'Mechanical', 'Plumbing', 'IT/Electronics', 'Safety Systems', 'Building Systems', 'Industrial Equipment', 'Automotive', 'Office Equipment', 'Medical Equipment', 'Other'])
    .withMessage('Invalid category'),
  body('assignedTeam')
    .isMongoId()
    .withMessage('Valid assigned team is required'),
  body('purchaseDate')
    .isISO8601()
    .withMessage('Valid purchase date is required'),
  body('location.building')
    .trim()
    .notEmpty()
    .withMessage('Building is required')
];

// @route   GET /api/equipment
// @desc    Get all equipment with pagination and filters
// @access  Private (Admin, Technician)
router.get('/', auth, canViewEquipment, [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('category').optional().trim(),
  query('status').optional().isIn(['Active', 'Maintenance', 'Out of Service', 'Scrapped']),
  query('team').optional().isMongoId().withMessage('Invalid team ID'),
  query('search').optional().trim().isLength({ min: 1 }).withMessage('Search term must not be empty')
], handleValidationErrors, asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  
  // Build filter
  const filter = { isActive: true };
  
  if (req.query.category) filter.category = req.query.category;
  if (req.query.status) filter.status = req.query.status;
  if (req.query.team) filter.assignedTeam = req.query.team;
  
  // Search functionality
  if (req.query.search) {
    filter.$or = [
      { name: { $regex: req.query.search, $options: 'i' } },
      { serialNumber: { $regex: req.query.search, $options: 'i' } },
      { manufacturer: { $regex: req.query.search, $options: 'i' } },
      { model: { $regex: req.query.search, $options: 'i' } }
    ];
  }

  // For non-admin users, filter by their team's equipment
  if (req.user.role === 'technician' && req.user.team) {
    filter.assignedTeam = req.user.team;
  }

  const equipment = await Equipment.find(filter)
    .populate('assignedTeam', 'name specialization')
    .populate('primaryTechnician', 'name email')
    .populate('metadata.createdBy', 'name')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Equipment.countDocuments(filter);

  // Add computed fields
  const equipmentWithStats = equipment.map(eq => {
    const eqObj = eq.toObject();
    return {
      ...eqObj,
      age: eq.age,
      warrantyStatus: eq.warrantyStatus,
      maintenanceStatus: eq.maintenanceStatus
    };
  });

  res.json({
    equipment: equipmentWithStats,
    pagination: {
      current: page,
      pages: Math.ceil(total / limit),
      total,
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1
    }
  });
}));

// @route   GET /api/equipment/:id
// @desc    Get equipment by ID with maintenance history
// @access  Private (Admin, Technician)
router.get('/:id', auth, canViewEquipment, [
  param('id').isMongoId().withMessage('Invalid equipment ID')
], handleValidationErrors, asyncHandler(async (req, res) => {
  const equipment = await Equipment.findById(req.params.id)
    .populate('assignedTeam', 'name specialization members')
    .populate('primaryTechnician', 'name email phoneNumber')
    .populate('metadata.createdBy', 'name email')
    .populate('metadata.lastModifiedBy', 'name email')
    .populate({
      path: 'maintenanceHistory',
      select: 'title type status priority scheduledDate completedAt assignedTechnician',
      populate: {
        path: 'assignedTechnician',
        select: 'name email'
      },
      options: { sort: { createdAt: -1 }, limit: 20 }
    });

  if (!equipment) {
    return res.status(404).json({
      message: 'Equipment not found',
      code: 'EQUIPMENT_NOT_FOUND'
    });
  }

  // Check access for technicians
  if (req.user.role === 'technician' && 
      req.user.team && 
      equipment.assignedTeam._id.toString() !== req.user.team.toString()) {
    return res.status(403).json({
      message: 'Access denied. Equipment not assigned to your team.',
      code: 'EQUIPMENT_ACCESS_DENIED'
    });
  }

  res.json({
    equipment: {
      ...equipment.toObject(),
      age: equipment.age,
      warrantyStatus: equipment.warrantyStatus,
      maintenanceStatus: equipment.maintenanceStatus
    }
  });
}));

// @route   POST /api/equipment
// @desc    Create new equipment
// @access  Private (Admin only)
router.post('/', auth, canManageEquipment, equipmentValidation, handleValidationErrors, logUserAction('CREATE_EQUIPMENT'), asyncHandler(async (req, res) => {
  const {
    name,
    serialNumber,
    category,
    subcategory,
    manufacturer,
    model,
    description,
    location,
    assignedTeam,
    primaryTechnician,
    status,
    condition,
    purchaseDate,
    installationDate,
    warrantyExpiry,
    maintenanceInterval,
    specifications,
    criticality,
    cost,
    vendor,
    tags
  } = req.body;

  // Check if serial number is unique
  const existingEquipment = await Equipment.findOne({ serialNumber });
  if (existingEquipment) {
    return res.status(400).json({
      message: 'Equipment with this serial number already exists',
      code: 'SERIAL_NUMBER_EXISTS'
    });
  }

  // Validate assigned team
  const team = await Team.findById(assignedTeam);
  if (!team) {
    return res.status(400).json({
      message: 'Invalid assigned team',
      code: 'INVALID_TEAM'
    });
  }

  // Validate primary technician if provided
  if (primaryTechnician) {
    const technician = await User.findById(primaryTechnician);
    if (!technician || technician.role !== 'technician') {
      return res.status(400).json({
        message: 'Invalid primary technician',
        code: 'INVALID_TECHNICIAN'
      });
    }
  }

  const equipment = new Equipment({
    name,
    serialNumber: serialNumber.toUpperCase(),
    category,
    subcategory,
    manufacturer,
    model,
    description,
    location,
    assignedTeam,
    primaryTechnician,
    status: status || 'Active',
    condition: condition || 'Good',
    purchaseDate,
    installationDate,
    warrantyExpiry,
    maintenanceInterval,
    specifications,
    criticality: criticality || 'Medium',
    cost,
    vendor,
    tags,
    metadata: {
      createdBy: req.user._id
    }
  });

  // Schedule next maintenance if interval is provided
  if (maintenanceInterval && maintenanceInterval.value) {
    equipment.scheduleNextMaintenance();
  }

  await equipment.save();

  const populatedEquipment = await Equipment.findById(equipment._id)
    .populate('assignedTeam', 'name specialization')
    .populate('primaryTechnician', 'name email')
    .populate('metadata.createdBy', 'name email');

  res.status(201).json({
    message: 'Equipment created successfully',
    equipment: populatedEquipment
  });
}));

// @route   PUT /api/equipment/:id
// @desc    Update equipment information
// @access  Private (Admin only)
router.put('/:id', auth, canManageEquipment, [
  param('id').isMongoId().withMessage('Invalid equipment ID'),
  ...equipmentValidation.map(rule => rule.optional())
], handleValidationErrors, logUserAction('UPDATE_EQUIPMENT'), asyncHandler(async (req, res) => {
  const equipment = await Equipment.findById(req.params.id);
  
  if (!equipment) {
    return res.status(404).json({
      message: 'Equipment not found',
      code: 'EQUIPMENT_NOT_FOUND'
    });
  }

  // Check for serial number uniqueness if being updated
  if (req.body.serialNumber && req.body.serialNumber !== equipment.serialNumber) {
    const existingEquipment = await Equipment.findOne({ 
      serialNumber: req.body.serialNumber.toUpperCase(), 
      _id: { $ne: equipment._id } 
    });
    if (existingEquipment) {
      return res.status(400).json({
        message: 'Serial number already exists',
        code: 'SERIAL_NUMBER_EXISTS'
      });
    }
  }

  // Validate team if being updated
  if (req.body.assignedTeam) {
    const team = await Team.findById(req.body.assignedTeam);
    if (!team) {
      return res.status(400).json({
        message: 'Invalid assigned team',
        code: 'INVALID_TEAM'
      });
    }
  }

  const allowedUpdates = [
    'name', 'serialNumber', 'category', 'subcategory', 'manufacturer', 'model',
    'description', 'location', 'assignedTeam', 'primaryTechnician', 'status',
    'condition', 'installationDate', 'warrantyExpiry', 'maintenanceInterval',
    'specifications', 'criticality', 'cost', 'vendor', 'tags'
  ];

  const updates = {};
  Object.keys(req.body).forEach(key => {
    if (allowedUpdates.includes(key)) {
      updates[key] = req.body[key];
    }
  });

  // Update serial number to uppercase
  if (updates.serialNumber) {
    updates.serialNumber = updates.serialNumber.toUpperCase();
  }

  // Update metadata
  updates['metadata.lastModifiedBy'] = req.user._id;

  const updatedEquipment = await Equipment.findByIdAndUpdate(
    req.params.id,
    updates,
    { new: true, runValidators: true }
  ).populate('assignedTeam', 'name specialization')
   .populate('primaryTechnician', 'name email')
   .populate('metadata.lastModifiedBy', 'name email');

  // Reschedule maintenance if interval changed
  if (updates.maintenanceInterval) {
    updatedEquipment.scheduleNextMaintenance();
    await updatedEquipment.save();
  }

  res.json({
    message: 'Equipment updated successfully',
    equipment: updatedEquipment
  });
}));

// @route   DELETE /api/equipment/:id
// @desc    Delete equipment (soft delete)
// @access  Private (Admin only)
router.delete('/:id', auth, canManageEquipment, [
  param('id').isMongoId().withMessage('Invalid equipment ID')
], handleValidationErrors, logUserAction('DELETE_EQUIPMENT'), asyncHandler(async (req, res) => {
  const equipment = await Equipment.findById(req.params.id);
  
  if (!equipment) {
    return res.status(404).json({
      message: 'Equipment not found',
      code: 'EQUIPMENT_NOT_FOUND'
    });
  }

  // Soft delete - set isActive to false
  equipment.isActive = false;
  equipment.status = 'Scrapped';
  equipment.metadata.lastModifiedBy = req.user._id;
  await equipment.save();

  res.json({
    message: 'Equipment deleted successfully'
  });
}));

// @route   GET /api/equipment/maintenance/due
// @desc    Get equipment needing maintenance
// @access  Private (Admin, Technician)
router.get('/maintenance/due', auth, canViewEquipment, [
  query('days').optional().isInt({ min: 1, max: 365 }).withMessage('Days must be between 1 and 365')
], handleValidationErrors, asyncHandler(async (req, res) => {
  const days = parseInt(req.query.days) || 7;
  
  let equipment = await Equipment.findMaintenanceDue(days);
  
  // Filter by team for technicians
  if (req.user.role === 'technician' && req.user.team) {
    equipment = equipment.filter(eq => eq.assignedTeam._id.toString() === req.user.team.toString());
  }

  res.json({
    equipment,
    count: equipment.length,
    dueIn: `${days} days`
  });
}));

// @route   GET /api/equipment/location/:building
// @desc    Get equipment by location
// @access  Private (Admin, Technician)
router.get('/location/:building', auth, canViewEquipment, [
  param('building').trim().notEmpty().withMessage('Building is required'),
  query('floor').optional().trim(),
  query('room').optional().trim()
], handleValidationErrors, asyncHandler(async (req, res) => {
  const { building } = req.params;
  const { floor, room } = req.query;
  
  let equipment = await Equipment.findByLocation(building, floor, room);
  
  // Filter by team for technicians
  if (req.user.role === 'technician' && req.user.team) {
    equipment = equipment.filter(eq => eq.assignedTeam._id.toString() === req.user.team.toString());
  }

  res.json({
    location: { building, floor, room },
    equipment,
    count: equipment.length
  });
}));

// @route   GET /api/equipment/stats/overview
// @desc    Get equipment statistics
// @access  Private (Admin, Technician)
router.get('/stats/overview', auth, canViewEquipment, asyncHandler(async (req, res) => {
  let matchStage = { isActive: true };
  
  // Filter by team for technicians
  if (req.user.role === 'technician' && req.user.team) {
    matchStage.assignedTeam = req.user.team;
  }

  const stats = await Equipment.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        active: { $sum: { $cond: [{ $eq: ['$status', 'Active'] }, 1, 0] } },
        maintenance: { $sum: { $cond: [{ $eq: ['$status', 'Maintenance'] }, 1, 0] } },
        outOfService: { $sum: { $cond: [{ $eq: ['$status', 'Out of Service'] }, 1, 0] } },
        critical: { $sum: { $cond: [{ $eq: ['$criticality', 'Critical'] }, 1, 0] } },
        high: { $sum: { $cond: [{ $eq: ['$criticality', 'High'] }, 1, 0] } },
        medium: { $sum: { $cond: [{ $eq: ['$criticality', 'Medium'] }, 1, 0] } },
        low: { $sum: { $cond: [{ $eq: ['$criticality', 'Low'] }, 1, 0] } }
      }
    }
  ]);

  const categoryDistribution = await Equipment.aggregate([
    { $match: matchStage },
    { $group: { _id: '$category', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);

  const conditionDistribution = await Equipment.aggregate([
    { $match: matchStage },
    { $group: { _id: '$condition', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);

  // Equipment age distribution
  const ageDistribution = await Equipment.aggregate([
    { $match: matchStage },
    {
      $addFields: {
        ageInYears: {
          $floor: {
            $divide: [
              { $subtract: [new Date(), '$purchaseDate'] },
              365.25 * 24 * 60 * 60 * 1000
            ]
          }
        }
      }
    },
    {
      $bucket: {
        groupBy: '$ageInYears',
        boundaries: [0, 1, 3, 5, 10, 20],
        default: '20+',
        output: { count: { $sum: 1 } }
      }
    }
  ]);

  res.json({
    overview: stats[0] || {},
    categoryDistribution,
    conditionDistribution,
    ageDistribution
  });
}));

// @route   POST /api/equipment/:id/schedule-maintenance
// @desc    Schedule next maintenance for equipment
// @access  Private (Admin only)
router.post('/:id/schedule-maintenance', auth, canManageEquipment, [
  param('id').isMongoId().withMessage('Invalid equipment ID')
], handleValidationErrors, logUserAction('SCHEDULE_MAINTENANCE'), asyncHandler(async (req, res) => {
  const equipment = await Equipment.findById(req.params.id);
  
  if (!equipment) {
    return res.status(404).json({
      message: 'Equipment not found',
      code: 'EQUIPMENT_NOT_FOUND'
    });
  }

  if (!equipment.maintenanceInterval || !equipment.maintenanceInterval.value) {
    return res.status(400).json({
      message: 'Equipment has no maintenance interval configured',
      code: 'NO_MAINTENANCE_INTERVAL'
    });
  }

  equipment.scheduleNextMaintenance();
  await equipment.save();

  res.json({
    message: 'Next maintenance scheduled successfully',
    nextMaintenanceDate: equipment.nextMaintenanceDate
  });
}));

// @route   PUT /api/equipment/:id/condition
// @desc    Update equipment condition
// @access  Private (Admin, Technician)
router.put('/:id/condition', auth, canViewEquipment, [
  param('id').isMongoId().withMessage('Invalid equipment ID'),
  body('condition').isIn(['Excellent', 'Good', 'Fair', 'Poor', 'Critical']).withMessage('Invalid condition')
], handleValidationErrors, logUserAction('UPDATE_CONDITION'), asyncHandler(async (req, res) => {
  const { condition } = req.body;
  
  const equipment = await Equipment.findById(req.params.id);
  if (!equipment) {
    return res.status(404).json({
      message: 'Equipment not found',
      code: 'EQUIPMENT_NOT_FOUND'
    });
  }

  // Check access for technicians
  if (req.user.role === 'technician') {
    if (!req.user.team || equipment.assignedTeam.toString() !== req.user.team.toString()) {
      return res.status(403).json({
        message: 'Access denied. Equipment not assigned to your team.',
        code: 'EQUIPMENT_ACCESS_DENIED'
      });
    }
  }

  equipment.condition = condition;
  equipment.metadata.lastModifiedBy = req.user._id;
  await equipment.save();

  res.json({
    message: 'Equipment condition updated successfully',
    condition: equipment.condition
  });
}));

module.exports = router;