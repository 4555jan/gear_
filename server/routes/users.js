const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');
const User = require('../models/User');
const Team = require('../models/Team');
const Workshop = require('../models/Workshop');
const { auth, isAdmin, logUserAction } = require('../middleware/auth');
const { handleValidationErrors, asyncHandler } = require('../middleware/validation');
const emailService = require('../services/emailService');
const crypto = require('crypto');

// Validation rules
const userValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('role')
    .isIn(['admin', 'technician', 'employee'])
    .withMessage('Invalid role'),
  body('phoneNumber')
    .optional()
    .matches(/^\+?[1-9]\d{1,14}$/)
    .withMessage('Invalid phone number format')
];

// @route   GET /api/users
// @desc    Get all users with pagination and filters
// @access  Private (Admin only)
router.get('/', auth, isAdmin, [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('role').optional().isIn(['admin', 'technician', 'employee']).withMessage('Invalid role'),
  query('status').optional().isIn(['active', 'inactive', 'suspended']).withMessage('Invalid status'),
  query('search').optional().trim().isLength({ min: 1 }).withMessage('Search term must not be empty')
], handleValidationErrors, asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  
  // Build filter
  const filter = {};
  if (req.query.role) filter.role = req.query.role;
  
  // Only show invited users (must have invitedBy field and creationType = invited)
  filter.creationType = 'invited';
  filter.invitedBy = { $ne: null }; // Must have been invited by someone
  
  // Handle status filter - exclude pending users by default
  if (req.query.status) {
    filter.status = req.query.status;
  } else if (!req.query.includePending) {
    // Default: only show active, inactive, and suspended users
    filter.status = { $in: ['active', 'inactive', 'suspended'] };
  }
  
  // Workshop filter - admin can see all workshops, others only their own
  if (req.user.role !== 'admin') {
    filter.workshop = req.user.workshop;
  } else if (req.query.workshop) {
    filter.workshop = req.query.workshop;
  }
  
  // Search functionality
  if (req.query.search) {
    filter.$or = [
      { name: { $regex: req.query.search, $options: 'i' } },
      { email: { $regex: req.query.search, $options: 'i' } },
      { employeeId: { $regex: req.query.search, $options: 'i' } }
    ];
  }

  const users = await User.find(filter)
    .select('-password')
    .populate('team', 'name specialization')
    .populate('workshop', 'name code')
    .populate('invitedBy', 'name email')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await User.countDocuments(filter);

  res.json({
    users,
    pagination: {
      current: page,
      pages: Math.ceil(total / limit),
      total,
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1
    }
  });
}));

// @route   GET /api/users/:id
// @desc    Get user by ID
// @access  Private (Admin or self)
router.get('/:id', auth, [
  param('id').isMongoId().withMessage('Invalid user ID')
], handleValidationErrors, asyncHandler(async (req, res) => {
  // Check if user can access this profile
  if (req.user.role !== 'admin' && req.user._id.toString() !== req.params.id) {
    return res.status(403).json({
      message: 'Access denied. You can only view your own profile.',
      code: 'ACCESS_DENIED'
    });
  }

  const user = await User.findById(req.params.id)
    .select('-password')
    .populate('team', 'name specialization teamLead')
    .populate({
      path: 'assignedRequests',
      match: { status: { $nin: ['Completed', 'Cancelled'] } },
      select: 'title priority status dueDate equipment',
      populate: {
        path: 'equipment',
        select: 'name serialNumber'
      }
    });

  if (!user) {
    return res.status(404).json({
      message: 'User not found',
      code: 'USER_NOT_FOUND'
    });
  }

  res.json({
    user: user.getPublicProfile(),
    stats: {
      activeRequests: user.assignedRequests ? user.assignedRequests.length : 0,
      workload: user.workload
    }
  });
}));

// @route   POST /api/users/activate/:token
// @desc    Activate user account and set password
// @access  Public
router.post('/activate/:token', [
  param('token').notEmpty().withMessage('Activation token is required'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain uppercase, lowercase, number, and special character'),
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Password confirmation does not match password');
      }
      return true;
    })
], handleValidationErrors, asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  // Hash the token to compare with stored hash
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  // Find user with matching token and check expiration
  const user = await User.findOne({
    activationToken: hashedToken,
    activationExpires: { $gt: Date.now() },
    status: 'pending'
  });

  if (!user) {
    return res.status(400).json({
      message: 'Activation token is invalid or has expired',
      code: 'INVALID_TOKEN'
    });
  }

  // Activate the user account
  user.password = password;
  user.status = 'active';
  user.emailVerified = true;
  user.activationToken = undefined;
  user.activationExpires = undefined;
  await user.save();

  // Generate JWT token for immediate login
  const jwtToken = jwt.sign(
    { id: user._id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '24h' }
  );

  const populatedUser = await User.findById(user._id)
    .select('-password')
    .populate('team', 'name specialization')
    .populate('workshop', 'name code location');

  res.status(200).json({
    message: 'Account activated successfully',
    user: populatedUser.getPublicProfile(),
    token: jwtToken
  });
}));

// @route   POST /api/users
// @desc    Create new user
// @access  Private (Admin only)
router.post('/', auth, isAdmin, [
  ...userValidation,
  body('workshop')
    .optional()
    .isMongoId()
    .withMessage('Invalid workshop ID')
], handleValidationErrors, logUserAction('CREATE_USER'), asyncHandler(async (req, res) => {
  const { name, email, role, phoneNumber, department, employeeId, skills, team, workshop } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).json({
      message: 'User with this email already exists',
      code: 'USER_EXISTS'
    });
  }

  // Check if employee ID is unique (if provided)
  if (employeeId) {
    const existingEmployeeId = await User.findOne({ employeeId });
    if (existingEmployeeId) {
      return res.status(400).json({
        message: 'Employee ID already exists',
        code: 'EMPLOYEE_ID_EXISTS'
      });
    }
  }

  // Validate team if provided
  if (team) {
    const teamDoc = await Team.findById(team);
    if (!teamDoc) {
      return res.status(400).json({
        message: 'Invalid team ID',
        code: 'INVALID_TEAM'
      });
    }
  }

  // Validate workshop if provided
  let workshopDoc = null;
  if (workshop) {
    workshopDoc = await Workshop.findById(workshop);
    if (!workshopDoc) {
      return res.status(400).json({
        message: 'Invalid workshop ID',
        code: 'INVALID_WORKSHOP'
      });
    }
  }

  // Generate activation token
  const activationToken = crypto.randomBytes(32).toString('hex');

  const user = new User({
    name,
    email,
    password: 'temporary-will-be-set-on-activation', // Placeholder password
    role,
    phoneNumber,
    department,
    employeeId,
    skills,
    team,
    workshop,
    status: 'pending', // Set as pending until activated
    creationType: 'invited', // Mark as invited user
    invitedBy: req.user._id, // Track who sent the invitation
    emailVerified: false,
    activationToken: crypto.createHash('sha256').update(activationToken).digest('hex'),
    activationExpires: Date.now() + 7 * 24 * 60 * 60 * 1000 // 7 days
  });

  await user.save();

  // Add user to team if specified
  if (team) {
    const teamDoc = await Team.findById(team);
    try {
      await teamDoc.addMember(user._id, 'junior');
    } catch (error) {
      console.warn('Could not add user to team:', error.message);
    }
  }

  const populatedUser = await User.findById(user._id)
    .select('-password')
    .populate('team', 'name specialization')
    .populate('workshop', 'name code');

  // Send welcome email
  try {
    await emailService.sendActivationEmail(
      email,
      name,
      activationToken,
      workshopDoc ? workshopDoc.name : 'System',
      role
    );
    console.log(`✅ Activation email sent to: ${email}`);
  } catch (emailError) {
    console.error('❌ Failed to send activation email:', emailError.message);
    // Don't fail the user creation if email fails
  }

  res.status(201).json({
    message: 'User invitation sent successfully. They will appear in the system after activation.',
    user: populatedUser.getPublicProfile(),
    emailSent: true
  });
}));

// @route   PUT /api/users/:id
// @desc    Update user information
// @access  Private (Admin or self for limited fields)
router.put('/:id', auth, [
  param('id').isMongoId().withMessage('Invalid user ID'),
  body('name').optional().trim().isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters'),
  body('email').optional().isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('role').optional().isIn(['admin', 'technician', 'employee']).withMessage('Invalid role'),
  body('phoneNumber').optional().matches(/^\+?[1-9]\d{1,14}$/).withMessage('Invalid phone number format'),
  body('status').optional().isIn(['active', 'inactive', 'suspended']).withMessage('Invalid status')
], handleValidationErrors, logUserAction('UPDATE_USER'), asyncHandler(async (req, res) => {
  const userId = req.params.id;
  const isOwnProfile = req.user._id.toString() === userId;
  const isAdmin = req.user.role === 'admin';

  if (!isAdmin && !isOwnProfile) {
    return res.status(403).json({
      message: 'Access denied. You can only update your own profile.',
      code: 'ACCESS_DENIED'
    });
  }

  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({
      message: 'User not found',
      code: 'USER_NOT_FOUND'
    });
  }

  // Define allowed fields based on role
  let allowedUpdates;
  if (isAdmin) {
    allowedUpdates = ['name', 'email', 'role', 'phoneNumber', 'department', 'employeeId', 'skills', 'status', 'team'];
  } else {
    allowedUpdates = ['name', 'phoneNumber', 'skills', 'preferences', 'avatar'];
  }

  // Check for email uniqueness if email is being updated
  if (req.body.email && req.body.email !== user.email) {
    const existingUser = await User.findOne({ 
      email: req.body.email, 
      _id: { $ne: userId } 
    });
    if (existingUser) {
      return res.status(400).json({
        message: 'Email already in use',
        code: 'EMAIL_EXISTS'
      });
    }
  }

  // Handle team change
  if (isAdmin && req.body.team !== undefined) {
    const oldTeam = user.team;
    const newTeam = req.body.team;

    // Remove from old team
    if (oldTeam) {
      try {
        const oldTeamDoc = await Team.findById(oldTeam);
        if (oldTeamDoc) {
          await oldTeamDoc.removeMember(userId);
        }
      } catch (error) {
        console.warn('Could not remove user from old team:', error.message);
      }
    }

    // Add to new team
    if (newTeam) {
      const newTeamDoc = await Team.findById(newTeam);
      if (!newTeamDoc) {
        return res.status(400).json({
          message: 'Invalid team ID',
          code: 'INVALID_TEAM'
        });
      }
      try {
        await newTeamDoc.addMember(userId, 'junior');
      } catch (error) {
        return res.status(400).json({
          message: error.message,
          code: 'TEAM_ASSIGNMENT_ERROR'
        });
      }
    }
  }

  // Build updates object
  const updates = {};
  Object.keys(req.body).forEach(key => {
    if (allowedUpdates.includes(key)) {
      updates[key] = req.body[key];
    }
  });

  const updatedUser = await User.findByIdAndUpdate(
    userId,
    updates,
    { new: true, runValidators: true }
  ).select('-password').populate('team', 'name specialization');

  if (!updatedUser) {
    return res.status(404).json({
      message: 'User not found',
      code: 'USER_NOT_FOUND'
    });
  }

  res.json({
    message: 'User updated successfully',
    user: updatedUser.getPublicProfile()
  });
}));

// @route   DELETE /api/users/:id
// @desc    Delete user (soft delete - set status to inactive)
// @access  Private (Admin only)
router.delete('/:id', auth, isAdmin, [
  param('id').isMongoId().withMessage('Invalid user ID')
], handleValidationErrors, logUserAction('DELETE_USER'), asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  
  if (!user) {
    return res.status(404).json({
      message: 'User not found',
      code: 'USER_NOT_FOUND'
    });
  }

  // Cannot delete self
  if (req.user._id.toString() === req.params.id) {
    return res.status(400).json({
      message: 'Cannot delete your own account',
      code: 'CANNOT_DELETE_SELF'
    });
  }

  // Remove from team if assigned
  if (user.team) {
    try {
      const team = await Team.findById(user.team);
      if (team) {
        await team.removeMember(user._id);
      }
    } catch (error) {
      console.warn('Could not remove user from team during deletion:', error.message);
    }
  }

  // Soft delete - set status to inactive
  user.status = 'inactive';
  user.team = null;
  await user.save();

  res.json({
    message: 'User deactivated successfully'
  });
}));

// @route   GET /api/users/technicians/available
// @desc    Get available technicians
// @access  Private (Admin, Technician for team leads)
router.get('/technicians/available', auth, [
  query('specialization').optional().trim(),
  query('teamId').optional().isMongoId().withMessage('Invalid team ID')
], handleValidationErrors, asyncHandler(async (req, res) => {
  let filter = {
    role: 'technician',
    status: 'active'
  };

  // If specialization is provided, find teams with that specialization
  if (req.query.specialization) {
    const teams = await Team.find({ 
      specialization: { $in: [req.query.specialization] },
      status: 'active'
    });
    const teamIds = teams.map(team => team._id);
    filter.team = { $in: teamIds };
  }

  // If specific team requested
  if (req.query.teamId) {
    filter.team = req.query.teamId;
  }

  const technicians = await User.findAvailableTechnicians(req.query.teamId)
    .select('name email skills workload phoneNumber team')
    .sort({ workload: 1 });

  res.json({
    technicians,
    count: technicians.length
  });
}));

// @route   GET /api/users/stats
// @desc    Get user statistics
// @access  Private (Admin only)
router.get('/statistics/overview', auth, isAdmin, asyncHandler(async (req, res) => {
  const stats = await User.aggregate([
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        active: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
        inactive: { $sum: { $cond: [{ $eq: ['$status', 'inactive'] }, 1, 0] } },
        suspended: { $sum: { $cond: [{ $eq: ['$status', 'suspended'] }, 1, 0] } },
        admins: { $sum: { $cond: [{ $eq: ['$role', 'admin'] }, 1, 0] } },
        technicians: { $sum: { $cond: [{ $eq: ['$role', 'technician'] }, 1, 0] } },
        employees: { $sum: { $cond: [{ $eq: ['$role', 'employee'] }, 1, 0] } },
        withTeams: { $sum: { $cond: [{ $ne: ['$team', null] }, 1, 0] } },
        withoutTeams: { $sum: { $cond: [{ $eq: ['$team', null] }, 1, 0] } }
      }
    }
  ]);

  const roleDistribution = await User.aggregate([
    { $group: { _id: '$role', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);

  const teamDistribution = await User.aggregate([
    { $match: { team: { $ne: null } } },
    {
      $lookup: {
        from: 'teams',
        localField: 'team',
        foreignField: '_id',
        as: 'teamInfo'
      }
    },
    { $unwind: '$teamInfo' },
    { $group: { _id: '$teamInfo.name', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);

  res.json({
    overview: stats[0] || {},
    roleDistribution,
    teamDistribution
  });
}));

// @route   PUT /api/users/:id/workload
// @desc    Update user workload
// @access  Private (Admin only)
router.put('/:id/workload', auth, isAdmin, [
  param('id').isMongoId().withMessage('Invalid user ID'),
  body('workload').isInt({ min: 0, max: 50 }).withMessage('Workload must be between 0 and 50')
], handleValidationErrors, logUserAction('UPDATE_WORKLOAD'), asyncHandler(async (req, res) => {
  const { workload } = req.body;
  
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { workload },
    { new: true, runValidators: true }
  ).select('-password');

  if (!user) {
    return res.status(404).json({
      message: 'User not found',
      code: 'USER_NOT_FOUND'
    });
  }

  res.json({
    message: 'Workload updated successfully',
    user: user.getPublicProfile()
  });
}));

// @route   POST /api/users/forgot-password
// @desc    Send password reset email
// @access  Public
router.post('/forgot-password', [
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email')
], handleValidationErrors, asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email, status: 'active' });
  if (!user) {
    // Don't reveal if user exists for security
    return res.json({
      message: 'If the email exists, a password reset link has been sent.'
    });
  }

  // Generate reset token
  const resetToken = crypto.randomBytes(32).toString('hex');
  user.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  user.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
  await user.save();

  try {
    await emailService.sendPasswordResetEmail(user, resetToken);
    res.json({
      message: 'Password reset email sent successfully.'
    });
  } catch (error) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();
    
    res.status(500).json({
      message: 'Failed to send password reset email. Please try again later.',
      code: 'EMAIL_SEND_FAILED'
    });
  }
}));

// @route   POST /api/users/reset-password
// @desc    Reset password using token
// @access  Public
router.post('/reset-password', [
  body('token').notEmpty().withMessage('Reset token is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], handleValidationErrors, asyncHandler(async (req, res) => {
  const { token, password } = req.body;

  // Hash the token to compare with database
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() }
  });

  if (!user) {
    return res.status(400).json({
      message: 'Invalid or expired reset token',
      code: 'INVALID_TOKEN'
    });
  }

  // Update password and clear reset fields
  user.password = password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  res.json({
    message: 'Password reset successfully'
  });
}));

// @route   POST /api/users/:id/resend-welcome
// @desc    Resend welcome email with new temporary password
// @access  Private (Admin only)
router.post('/:id/resend-welcome', auth, isAdmin, [
  param('id').isMongoId().withMessage('Invalid user ID')
], handleValidationErrors, logUserAction('RESEND_WELCOME'), asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id)
    .populate('workshop', 'name code');
  
  if (!user) {
    return res.status(404).json({
      message: 'User not found',
      code: 'USER_NOT_FOUND'
    });
  }

  // Generate new temporary password
  const temporaryPassword = crypto.randomBytes(8).toString('hex');
  user.password = temporaryPassword;
  await user.save();

  try {
    await emailService.sendWelcomeEmail(user, temporaryPassword, user.workshop);
    res.json({
      message: 'Welcome email sent successfully with new temporary password'
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to send welcome email',
      code: 'EMAIL_SEND_FAILED'
    });
  }
}));

module.exports = router;