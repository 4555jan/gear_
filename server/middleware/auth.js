const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Authenticate user with JWT
const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        message: 'Access denied. No token provided.',
        code: 'NO_TOKEN'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id)
      .select('-password')
      .populate('team', 'name specialization');
    
    if (!user) {
      return res.status(401).json({ 
        message: 'Invalid token. User not found.',
        code: 'USER_NOT_FOUND'
      });
    }

    if (user.status !== 'active') {
      return res.status(401).json({ 
        message: 'Account is inactive. Contact administrator.',
        code: 'ACCOUNT_INACTIVE'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        message: 'Invalid token format.',
        code: 'INVALID_TOKEN'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        message: 'Token has expired. Please login again.',
        code: 'TOKEN_EXPIRED'
      });
    }

    console.error('Auth middleware error:', error);
    res.status(500).json({ 
      message: 'Authentication server error.',
      code: 'AUTH_SERVER_ERROR'
    });
  }
};

// Role-based authorization middleware
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        message: 'Authentication required.',
        code: 'AUTH_REQUIRED'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `Access denied. Required roles: ${allowedRoles.join(', ')}. Your role: ${req.user.role}`,
        code: 'INSUFFICIENT_PRIVILEGES',
        requiredRoles: allowedRoles,
        userRole: req.user.role
      });
    }

    next();
  };
};

// Check if user is admin
const isAdmin = authorize('admin');

// Check if user is admin or technician
const isTechnicianOrAdmin = authorize('admin', 'technician');

// Check if user can manage teams (admin only)
const canManageTeams = authorize('admin');

// Check if user can manage equipment (admin, technician)
const canManageEquipment = authorize('admin', 'technician');

// Check if user can view equipment (admin, technician)
const canViewEquipment = authorize('admin', 'technician');

// Check if user can create maintenance requests (all roles)
const canCreateMaintenance = authorize('admin', 'technician', 'employee');

// Check if user can assign technicians (admin, team leads)
const canAssignTechnicians = async (req, res, next) => {
  try {
    if (req.user.role === 'admin') {
      return next();
    }

    // Check if user is a team lead
    if (req.user.role === 'technician' && req.user.team) {
      const Team = require('../models/Team');
      const team = await Team.findById(req.user.team);
      
      if (team && team.teamLead && team.teamLead.toString() === req.user._id.toString()) {
        return next();
      }
    }

    return res.status(403).json({ 
      message: 'Access denied. Only admins and team leads can assign technicians.',
      code: 'CANNOT_ASSIGN_TECHNICIANS'
    });
  } catch (error) {
    console.error('Assignment authorization error:', error);
    res.status(500).json({ 
      message: 'Authorization server error.',
      code: 'AUTH_SERVER_ERROR'
    });
  }
};

// Check if user can access specific maintenance request
const canAccessMaintenanceRequest = async (req, res, next) => {
  try {
    const MaintenanceRequest = require('../models/MaintenanceRequest');
    const requestId = req.params.id || req.params.requestId;
    
    if (!requestId) {
      return res.status(400).json({ 
        message: 'Request ID is required.',
        code: 'REQUEST_ID_REQUIRED'
      });
    }

    const maintenanceRequest = await MaintenanceRequest.findById(requestId);
    
    if (!maintenanceRequest) {
      return res.status(404).json({ 
        message: 'Maintenance request not found.',
        code: 'REQUEST_NOT_FOUND'
      });
    }

    // Admin can access all requests
    if (req.user.role === 'admin') {
      req.maintenanceRequest = maintenanceRequest;
      return next();
    }

    // Assigned technician can access their requests
    if (req.user.role === 'technician' && 
        maintenanceRequest.assignedTechnician && 
        maintenanceRequest.assignedTechnician.toString() === req.user._id.toString()) {
      req.maintenanceRequest = maintenanceRequest;
      return next();
    }

    // Request creator can access their own requests
    if (maintenanceRequest.createdBy.toString() === req.user._id.toString()) {
      req.maintenanceRequest = maintenanceRequest;
      return next();
    }

    return res.status(403).json({ 
      message: 'Access denied. You can only access your own requests or assigned requests.',
      code: 'REQUEST_ACCESS_DENIED'
    });
  } catch (error) {
    console.error('Maintenance request access error:', error);
    res.status(500).json({ 
      message: 'Authorization server error.',
      code: 'AUTH_SERVER_ERROR'
    });
  }
};

// Rate limiting for sensitive operations
const sensitiveOperationLimiter = (req, res, next) => {
  // This can be enhanced with Redis for distributed systems
  // For now, we'll use simple in-memory tracking
  const userOperations = global.userOperations || {};
  const userId = req.user._id.toString();
  const now = Date.now();
  
  if (!userOperations[userId]) {
    userOperations[userId] = [];
  }
  
  // Remove operations older than 1 hour
  userOperations[userId] = userOperations[userId].filter(
    timestamp => now - timestamp < 3600000
  );
  
  // Check if user has exceeded limit (10 sensitive operations per hour)
  if (userOperations[userId].length >= 10) {
    return res.status(429).json({ 
      message: 'Too many sensitive operations. Please try again later.',
      code: 'RATE_LIMIT_EXCEEDED'
    });
  }
  
  userOperations[userId].push(now);
  global.userOperations = userOperations;
  
  next();
};

// Middleware to log user actions
const logUserAction = (action) => {
  return (req, res, next) => {
    const originalSend = res.send;
    
    res.send = function(body) {
      // Log successful actions (status codes 200-299)
      if (res.statusCode >= 200 && res.statusCode < 300) {
        console.log(`[USER_ACTION] ${req.user.email} - ${action} - ${req.method} ${req.originalUrl} - ${res.statusCode}`);
        
        // You can enhance this to store in database for audit trail
        // const AuditLog = require('../models/AuditLog');
        // AuditLog.create({
        //   user: req.user._id,
        //   action,
        //   method: req.method,
        //   url: req.originalUrl,
        //   statusCode: res.statusCode,
        //   ip: req.ip,
        //   userAgent: req.get('User-Agent')
        // });
      }
      
      originalSend.call(this, body);
    };
    
    next();
  };
};

module.exports = {
  auth,
  authorize,
  isAdmin,
  isTechnicianOrAdmin,
  canManageTeams,
  canManageEquipment,
  canViewEquipment,
  canCreateMaintenance,
  canAssignTechnicians,
  canAccessMaintenanceRequest,
  sensitiveOperationLimiter,
  logUserAction
};