const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body } = require('express-validator');
const User = require('../models/User');
const { handleValidationErrors, asyncHandler } = require('../middleware/validation');
const { auth } = require('../middleware/auth');

// Validation rules
const registerValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  body('role')
    .optional()
    .isIn(['admin', 'technician', 'employee'])
    .withMessage('Invalid role')
];

const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

const changePasswordValidation = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters'),
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Password confirmation does not match new password');
      }
      return true;
    })
];

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public (but should be restricted in production)
router.post('/register', registerValidation, handleValidationErrors, asyncHandler(async (req, res) => {
  const { name, email, password, role, phoneNumber, department, employeeId } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).json({
      message: 'User with this email already exists',
      code: 'USER_EXISTS'
    });
  }

  // Create new user
  const user = new User({
    name,
    email,
    password,
    role: role || 'employee',
    phoneNumber,
    department,
    employeeId,
    status: 'active'
  });

  await user.save();

  // Generate JWT token
  const token = jwt.sign(
    { 
      id: user._id, 
      role: user.role,
      email: user.email 
    },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  // Update last login
  user.lastLogin = new Date();
  await user.save();

  res.status(201).json({
    message: 'User registered successfully',
    token,
    user: user.getPublicProfile()
  });
}));

// @route   POST /api/auth/login
// @desc    Authenticate user and get token
// @access  Public
router.post('/login', loginValidation, handleValidationErrors, asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Find user by email
  const user = await User.findOne({ email }).populate('team', 'name specialization');
  if (!user) {
    return res.status(401).json({
      message: 'Invalid credentials',
      code: 'INVALID_CREDENTIALS'
    });
  }

  // Check account status
  if (user.status !== 'active') {
    return res.status(401).json({
      message: 'Account is inactive. Contact administrator.',
      code: 'ACCOUNT_INACTIVE'
    });
  }

  // Check password
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    return res.status(401).json({
      message: 'Invalid credentials',
      code: 'INVALID_CREDENTIALS'
    });
  }

  // Generate JWT token
  const token = jwt.sign(
    { 
      id: user._id, 
      role: user.role,
      email: user.email 
    },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  // Update last login
  user.lastLogin = new Date();
  await user.save();

  res.json({
    message: 'Login successful',
    token,
    user: user.getPublicProfile()
  });
}));

// @route   GET /api/auth/me
// @desc    Get current user profile
// @access  Private
router.get('/me', auth, asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id)
    .select('-password')
    .populate('team', 'name specialization members')
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

// @route   PUT /api/auth/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', auth, [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('phoneNumber')
    .optional()
    .matches(/^\+?[1-9]\d{1,14}$/)
    .withMessage('Invalid phone number format'),
  body('skills')
    .optional()
    .isArray()
    .withMessage('Skills must be an array'),
  body('preferences')
    .optional()
    .isObject()
    .withMessage('Preferences must be an object')
], handleValidationErrors, asyncHandler(async (req, res) => {
  const allowedUpdates = ['name', 'phoneNumber', 'skills', 'preferences', 'avatar'];
  const updates = {};

  // Only allow specific fields to be updated
  Object.keys(req.body).forEach(key => {
    if (allowedUpdates.includes(key)) {
      updates[key] = req.body[key];
    }
  });

  const user = await User.findByIdAndUpdate(
    req.user.id,
    updates,
    { new: true, runValidators: true }
  ).select('-password').populate('team', 'name specialization');

  if (!user) {
    return res.status(404).json({
      message: 'User not found',
      code: 'USER_NOT_FOUND'
    });
  }

  res.json({
    message: 'Profile updated successfully',
    user: user.getPublicProfile()
  });
}));

// @route   PUT /api/auth/change-password
// @desc    Change user password
// @access  Private
router.put('/change-password', auth, changePasswordValidation, handleValidationErrors, asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user.id);
  if (!user) {
    return res.status(404).json({
      message: 'User not found',
      code: 'USER_NOT_FOUND'
    });
  }

  // Verify current password
  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    return res.status(400).json({
      message: 'Current password is incorrect',
      code: 'INVALID_CURRENT_PASSWORD'
    });
  }

  // Update password
  user.password = newPassword;
  await user.save();

  res.json({
    message: 'Password changed successfully'
  });
}));

// @route   POST /api/auth/forgot-password
// @desc    Send password reset email
// @access  Public
router.post('/forgot-password', [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email')
], handleValidationErrors, asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    // Don't reveal if email exists or not for security
    return res.json({
      message: 'If an account with that email exists, a password reset link has been sent.'
    });
  }

  // Generate reset token (in production, implement proper email service)
  const resetToken = jwt.sign(
    { id: user._id, purpose: 'password_reset' },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );

  // In production, send email with reset link
  console.log(`Password reset token for ${email}: ${resetToken}`);

  res.json({
    message: 'If an account with that email exists, a password reset link has been sent.',
    // Remove this in production
    resetToken: process.env.NODE_ENV === 'development' ? resetToken : undefined
  });
}));

// @route   POST /api/auth/reset-password
// @desc    Reset password with token
// @access  Public
router.post('/reset-password', [
  body('token')
    .notEmpty()
    .withMessage('Reset token is required'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters')
], handleValidationErrors, asyncHandler(async (req, res) => {
  const { token, password } = req.body;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (decoded.purpose !== 'password_reset') {
      return res.status(400).json({
        message: 'Invalid reset token',
        code: 'INVALID_RESET_TOKEN'
      });
    }

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(400).json({
        message: 'Invalid reset token',
        code: 'INVALID_RESET_TOKEN'
      });
    }

    // Update password
    user.password = password;
    await user.save();

    res.json({
      message: 'Password reset successfully'
    });
  } catch (error) {
    return res.status(400).json({
      message: 'Invalid or expired reset token',
      code: 'INVALID_RESET_TOKEN'
    });
  }
}));

// @route   POST /api/auth/logout
// @desc    Logout user (client-side token removal)
// @access  Private
router.post('/logout', auth, (req, res) => {
  // In a stateless JWT setup, logout is mainly handled client-side
  // In production, you might want to blacklist tokens
  res.json({
    message: 'Logged out successfully'
  });
});

// @route   GET /api/auth/verify
// @desc    Verify if token is valid
// @access  Private
router.get('/verify', auth, (req, res) => {
  res.json({
    valid: true,
    user: req.user.getPublicProfile()
  });
});

module.exports = router;