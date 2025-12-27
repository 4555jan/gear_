const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');
const Workshop = require('../models/Workshop');
const User = require('../models/User');
const { auth, isAdmin, logUserAction } = require('../middleware/auth');
const { handleValidationErrors, asyncHandler } = require('../middleware/validation');

// @route   GET /api/workshops
// @desc    Get all workshops with pagination and filters
// @access  Private
router.get('/', auth, [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('status').optional().isIn(['active', 'inactive', 'maintenance']).withMessage('Invalid status'),
  query('search').optional().trim().isLength({ min: 1 }).withMessage('Search term must not be empty')
], handleValidationErrors, asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  
  // Build filter
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  
  // Search functionality
  if (req.query.search) {
    filter.$or = [
      { name: { $regex: req.query.search, $options: 'i' } },
      { code: { $regex: req.query.search, $options: 'i' } },
      { description: { $regex: req.query.search, $options: 'i' } }
    ];
  }

  const workshops = await Workshop.find(filter)
    .populate('createdBy', 'name email')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  // Get stats for each workshop
  const workshopsWithStats = await Promise.all(
    workshops.map(async (workshop) => {
      const stats = await workshop.getStats();
      return {
        ...workshop.toObject(),
        stats
      };
    })
  );

  const total = await Workshop.countDocuments(filter);

  res.json({
    workshops: workshopsWithStats,
    pagination: {
      current: page,
      pages: Math.ceil(total / limit),
      total,
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1
    }
  });
}));

// @route   GET /api/workshops/:id
// @desc    Get workshop by ID
// @access  Private
router.get('/:id', auth, [
  param('id').isMongoId().withMessage('Invalid workshop ID')
], handleValidationErrors, asyncHandler(async (req, res) => {
  const workshop = await Workshop.findById(req.params.id)
    .populate('createdBy', 'name email')
    .populate('usersCount')
    .populate('teamsCount')
    .populate('equipmentCount');

  if (!workshop) {
    return res.status(404).json({
      message: 'Workshop not found',
      code: 'WORKSHOP_NOT_FOUND'
    });
  }

  // Check if user has access to this workshop (admin or user belongs to workshop)
  if (req.user.role !== 'admin' && req.user.workshop?.toString() !== req.params.id) {
    return res.status(403).json({
      message: 'Access denied. You can only view your own workshop.',
      code: 'ACCESS_DENIED'
    });
  }

  const stats = await workshop.getStats();

  res.json({
    workshop: {
      ...workshop.toObject(),
      stats
    }
  });
}));

// @route   POST /api/workshops
// @desc    Create new workshop
// @access  Private (Admin only)
router.post('/', auth, isAdmin, [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Workshop name must be between 2 and 100 characters'),
  body('code')
    .trim()
    .isLength({ min: 2, max: 10 })
    .withMessage('Workshop code must be between 2 and 10 characters')
    .isAlphanumeric()
    .withMessage('Workshop code must contain only letters and numbers'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  body('specializations')
    .optional()
    .isArray()
    .withMessage('Specializations must be an array')
], handleValidationErrors, logUserAction('CREATE_WORKSHOP'), asyncHandler(async (req, res) => {
  const { name, code, description, location, contact, operatingHours, specializations, capacity, settings } = req.body;

  // Check if workshop code already exists
  const existingWorkshop = await Workshop.findOne({ 
    code: code.toUpperCase() 
  });
  if (existingWorkshop) {
    return res.status(400).json({
      message: 'Workshop with this code already exists',
      code: 'WORKSHOP_CODE_EXISTS'
    });
  }

  const workshop = new Workshop({
    name,
    code: code.toUpperCase(),
    description,
    location,
    contact,
    operatingHours,
    specializations,
    capacity,
    settings,
    createdBy: req.user._id,
    status: 'active'
  });

  await workshop.save();

  const populatedWorkshop = await Workshop.findById(workshop._id)
    .populate('createdBy', 'name email');

  res.status(201).json({
    message: 'Workshop created successfully',
    workshop: populatedWorkshop
  });
}));

// @route   PUT /api/workshops/:id
// @desc    Update workshop information
// @access  Private (Admin only)
router.put('/:id', auth, isAdmin, [
  param('id').isMongoId().withMessage('Invalid workshop ID'),
  body('name').optional().trim().isLength({ min: 2, max: 100 }).withMessage('Workshop name must be between 2 and 100 characters'),
  body('code').optional().trim().isLength({ min: 2, max: 10 }).withMessage('Workshop code must be between 2 and 10 characters'),
  body('status').optional().isIn(['active', 'inactive', 'maintenance']).withMessage('Invalid status')
], handleValidationErrors, logUserAction('UPDATE_WORKSHOP'), asyncHandler(async (req, res) => {
  const workshop = await Workshop.findById(req.params.id);
  
  if (!workshop) {
    return res.status(404).json({
      message: 'Workshop not found',
      code: 'WORKSHOP_NOT_FOUND'
    });
  }

  // Check for code uniqueness if code is being updated
  if (req.body.code && req.body.code.toUpperCase() !== workshop.code) {
    const existingWorkshop = await Workshop.findOne({ 
      code: req.body.code.toUpperCase(), 
      _id: { $ne: req.params.id } 
    });
    if (existingWorkshop) {
      return res.status(400).json({
        message: 'Workshop code already in use',
        code: 'WORKSHOP_CODE_EXISTS'
      });
    }
  }

  // Build updates object
  const allowedUpdates = [
    'name', 'code', 'description', 'location', 'contact', 
    'operatingHours', 'specializations', 'capacity', 'settings', 'status'
  ];
  
  const updates = {};
  Object.keys(req.body).forEach(key => {
    if (allowedUpdates.includes(key)) {
      updates[key] = key === 'code' ? req.body[key].toUpperCase() : req.body[key];
    }
  });

  const updatedWorkshop = await Workshop.findByIdAndUpdate(
    req.params.id,
    updates,
    { new: true, runValidators: true }
  ).populate('createdBy', 'name email');

  res.json({
    message: 'Workshop updated successfully',
    workshop: updatedWorkshop
  });
}));

// @route   DELETE /api/workshops/:id
// @desc    Delete workshop (soft delete - set status to inactive)
// @access  Private (Admin only)
router.delete('/:id', auth, isAdmin, [
  param('id').isMongoId().withMessage('Invalid workshop ID')
], handleValidationErrors, logUserAction('DELETE_WORKSHOP'), asyncHandler(async (req, res) => {
  const workshop = await Workshop.findById(req.params.id);
  
  if (!workshop) {
    return res.status(404).json({
      message: 'Workshop not found',
      code: 'WORKSHOP_NOT_FOUND'
    });
  }

  // Check if workshop has active users
  const activeUsers = await User.countDocuments({ 
    workshop: req.params.id, 
    status: 'active' 
  });

  if (activeUsers > 0) {
    return res.status(400).json({
      message: `Cannot delete workshop. It has ${activeUsers} active user(s). Please transfer or deactivate users first.`,
      code: 'WORKSHOP_HAS_ACTIVE_USERS'
    });
  }

  // Soft delete - set status to inactive
  workshop.status = 'inactive';
  await workshop.save();

  res.json({
    message: 'Workshop deactivated successfully'
  });
}));

// @route   GET /api/workshops/:id/users
// @desc    Get users in a workshop
// @access  Private
router.get('/:id/users', auth, [
  param('id').isMongoId().withMessage('Invalid workshop ID'),
  query('role').optional().isIn(['admin', 'technician', 'employee']).withMessage('Invalid role'),
  query('status').optional().isIn(['active', 'inactive', 'suspended']).withMessage('Invalid status')
], handleValidationErrors, asyncHandler(async (req, res) => {
  // Check if user has access to this workshop
  if (req.user.role !== 'admin' && req.user.workshop?.toString() !== req.params.id) {
    return res.status(403).json({
      message: 'Access denied. You can only view users from your own workshop.',
      code: 'ACCESS_DENIED'
    });
  }

  const filter = { workshop: req.params.id };
  if (req.query.role) filter.role = req.query.role;
  if (req.query.status) filter.status = req.query.status;

  const users = await User.find(filter)
    .select('-password')
    .populate('team', 'name specialization')
    .sort({ createdAt: -1 });

  res.json({
    users,
    count: users.length
  });
}));

// @route   GET /api/workshops/my/workshop
// @desc    Get current user's workshop
// @access  Private
router.get('/my/workshop', auth, asyncHandler(async (req, res) => {
  if (!req.user.workshop) {
    return res.status(404).json({
      message: 'No workshop assigned',
      code: 'NO_WORKSHOP_ASSIGNED'
    });
  }

  const workshop = await Workshop.findById(req.user.workshop)
    .populate('createdBy', 'name email');

  if (!workshop) {
    return res.status(404).json({
      message: 'Workshop not found',
      code: 'WORKSHOP_NOT_FOUND'
    });
  }

  const stats = await workshop.getStats();

  res.json({
    workshop: {
      ...workshop.toObject(),
      stats
    }
  });
}));

module.exports = router;