const MaintenanceRequest = require('../models/MaintenanceRequest');
const Equipment = require('../models/Equipment');
const Team = require('../models/Team');
const User = require('../models/User');
const emailService = require('../services/emailService');
const { body, param, query } = require('express-validator');
const { handleValidationErrors, asyncHandler } = require('../middleware/validation');

class MaintenanceController {
  
  // Create new maintenance request
  static createRequest = asyncHandler(async (req, res) => {
    try {
      const {
        title,
        description,
        type,
        equipment,
        priority = 'Medium',
        urgency = 'Medium',
        impact = 'Medium',
        scheduledDate,
        estimatedDuration,
        dueDate,
        location
      } = req.body;

      // 1. Find Equipment
      const equipmentDoc = await Equipment.findById(equipment);
      if (!equipmentDoc) {
        return res.status(404).json({ 
          error: 'Equipment not found',
          code: 'EQUIPMENT_NOT_FOUND'
        });
      }

      // Generate unique request number
      const requestCount = await MaintenanceRequest.countDocuments();
      const requestNumber = `MR-${Date.now()}-${String(requestCount + 1).padStart(4, '0')}`;

      // 2. Create Request
      const request = await MaintenanceRequest.create({
        requestNumber,
        title,
        description,
        type,
        equipment: equipmentDoc._id,
        priority,
        urgency,
        impact,
        scheduledDate,
        estimatedDuration,
        dueDate,
        location,
        createdBy: req.user._id,
        status: 'New'
      });

      // Populate the created request
      const populatedRequest = await MaintenanceRequest.findById(request._id)
        .populate('equipment', 'name serialNumber category')
        .populate('createdBy', 'name email')
        .populate('assignedTechnician', 'name email')
        .populate('assignedTeam', 'name specialization');

      res.status(201).json({
        message: 'Maintenance request created successfully',
        request: populatedRequest
      });

    } catch (err) {
      console.error('Error creating maintenance request:', err);
      res.status(500).json({ 
        error: err.message,
        code: 'CREATION_FAILED'
      });
    }
  });

  // Get all maintenance requests with filters
  static getAllRequests = asyncHandler(async (req, res) => {
    try {
      const {
        page = 1,
        limit = 10,
        status,
        type,
        priority,
        assignedTechnician,
        assignedTeam,
        equipment,
        search,
        workshop
      } = req.query;

      const skip = (parseInt(page) - 1) * parseInt(limit);

      // Build filter
      const filter = {};

      if (status) filter.status = status;
      if (type) filter.type = type;
      if (priority) filter.priority = priority;
      if (assignedTechnician) filter.assignedTechnician = assignedTechnician;
      if (assignedTeam) filter.assignedTeam = assignedTeam;
      if (equipment) filter.equipment = equipment;

      // Workshop filter for multi-workshop support
      if (req.user.role !== 'admin' && req.user.workshop) {
        // Non-admin users can only see requests from their workshop
        const equipmentIds = await Equipment.find({ workshop: req.user.workshop }).distinct('_id');
        filter.equipment = { $in: equipmentIds };
      } else if (workshop) {
        const equipmentIds = await Equipment.find({ workshop }).distinct('_id');
        filter.equipment = { $in: equipmentIds };
      }

      // Search functionality
      if (search) {
        filter.$or = [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { requestNumber: { $regex: search, $options: 'i' } }
        ];
      }

      const requests = await MaintenanceRequest.find(filter)
        .populate('equipment', 'name serialNumber category')
        .populate('createdBy', 'name email role')
        .populate('assignedTechnician', 'name email phoneNumber')
        .populate('assignedTeam', 'name specialization')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

      const total = await MaintenanceRequest.countDocuments(filter);

      res.json({
        requests,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / parseInt(limit)),
          total,
          hasNext: page < Math.ceil(total / parseInt(limit)),
          hasPrev: page > 1
        }
      });

    } catch (err) {
      console.error('Error fetching maintenance requests:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // Get request by ID
  static getRequestById = asyncHandler(async (req, res) => {
    try {
      const request = await MaintenanceRequest.findById(req.params.id)
        .populate('equipment', 'name serialNumber category location specifications')
        .populate('createdBy', 'name email role department')
        .populate('assignedTechnician', 'name email phoneNumber skills')
        .populate('assignedTeam', 'name specialization members')
        .populate('workNotes.technician', 'name email');

      if (!request) {
        return res.status(404).json({ 
          error: 'Maintenance request not found',
          code: 'REQUEST_NOT_FOUND'
        });
      }

      res.json({ request });

    } catch (err) {
      console.error('Error fetching maintenance request:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // Assign technician to request
  static assignRequest = asyncHandler(async (req, res) => {
    try {
      const { technicianId, teamId } = req.body;

      const request = await MaintenanceRequest.findById(req.params.id);
      if (!request) {
        return res.status(404).json({ 
          error: 'Maintenance request not found',
          code: 'REQUEST_NOT_FOUND'
        });
      }

      // Validate technician if provided
      if (technicianId) {
        const technician = await User.findById(technicianId);
        if (!technician || technician.role !== 'technician') {
          return res.status(400).json({ 
            error: 'Invalid technician',
            code: 'INVALID_TECHNICIAN'
          });
        }
        request.assignedTechnician = technicianId;
      }

      // Validate team if provided
      if (teamId) {
        const team = await Team.findById(teamId);
        if (!team) {
          return res.status(400).json({ 
            error: 'Invalid team',
            code: 'INVALID_TEAM'
          });
        }
        request.assignedTeam = teamId;
      }

      request.status = 'Assigned';
      await request.save();

      // Send email notification
      if (technicianId) {
        try {
          const technician = await User.findById(technicianId);
          await emailService.sendMaintenanceNotification(technician, request);
        } catch (emailError) {
          console.error('Failed to send assignment email:', emailError);
        }
      }

      const populatedRequest = await MaintenanceRequest.findById(request._id)
        .populate('equipment', 'name serialNumber')
        .populate('assignedTechnician', 'name email')
        .populate('assignedTeam', 'name specialization');

      res.json({
        message: 'Request assigned successfully',
        request: populatedRequest
      });

    } catch (err) {
      console.error('Error assigning request:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // Update request status/stage
  static updateStage = asyncHandler(async (req, res) => {
    try {
      const { status, workNote, hoursWorked, partsUsed } = req.body;

      const request = await MaintenanceRequest.findById(req.params.id);
      if (!request) {
        return res.status(404).json({ 
          error: 'Maintenance request not found',
          code: 'REQUEST_NOT_FOUND'
        });
      }

      // Update basic fields
      const updateData = {};
      if (status) updateData.status = status;

      // Set timestamps based on status
      if (status === 'In Progress' && !request.actualStartDate) {
        updateData.actualStartDate = new Date();
      }
      if (status === 'Completed') {
        updateData.actualEndDate = new Date();
        updateData.completedAt = new Date();
      }

      // Add work note if provided
      if (workNote) {
        const note = {
          technician: req.user._id,
          note: workNote,
          hoursWorked: hoursWorked || 0,
          timestamp: new Date()
        };
        updateData.$push = { workNotes: note };
      }

      // Add parts used if provided
      if (partsUsed && Array.isArray(partsUsed) && partsUsed.length > 0) {
        const partsWithRequestedBy = partsUsed.map(part => ({
          ...part,
          requestedBy: req.user._id,
          requestedAt: new Date()
        }));
        updateData.$push = { 
          ...updateData.$push,
          partsUsed: { $each: partsWithRequestedBy }
        };
      }

      const updatedRequest = await MaintenanceRequest.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true, runValidators: true }
      )
        .populate('equipment', 'name serialNumber')
        .populate('assignedTechnician', 'name email')
        .populate('assignedTeam', 'name specialization');

      res.json({
        message: 'Request updated successfully',
        request: updatedRequest
      });

    } catch (err) {
      console.error('Error updating request stage:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // Add work note to request
  static addWorkNote = asyncHandler(async (req, res) => {
    try {
      const { note, hoursWorked = 0, attachments = [] } = req.body;

      const request = await MaintenanceRequest.findById(req.params.id);
      if (!request) {
        return res.status(404).json({ 
          error: 'Maintenance request not found',
          code: 'REQUEST_NOT_FOUND'
        });
      }

      const workNote = {
        technician: req.user._id,
        note,
        hoursWorked,
        attachments,
        timestamp: new Date()
      };

      request.workNotes.push(workNote);
      await request.save();

      const populatedRequest = await MaintenanceRequest.findById(request._id)
        .populate('workNotes.technician', 'name email');

      res.json({
        message: 'Work note added successfully',
        workNotes: populatedRequest.workNotes
      });

    } catch (err) {
      console.error('Error adding work note:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // Get dashboard statistics
  static getDashboardStats = asyncHandler(async (req, res) => {
    try {
      const { workshop } = req.query;
      
      // Build base filter for workshop
      let equipmentFilter = {};
      if (req.user.role !== 'admin' && req.user.workshop) {
        equipmentFilter.workshop = req.user.workshop;
      } else if (workshop) {
        equipmentFilter.workshop = workshop;
      }

      const equipmentIds = await Equipment.find(equipmentFilter).distinct('_id');
      const requestFilter = { equipment: { $in: equipmentIds } };

      const stats = await MaintenanceRequest.aggregate([
        { $match: requestFilter },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            new: { $sum: { $cond: [{ $eq: ['$status', 'New'] }, 1, 0] } },
            assigned: { $sum: { $cond: [{ $eq: ['$status', 'Assigned'] }, 1, 0] } },
            inProgress: { $sum: { $cond: [{ $eq: ['$status', 'In Progress'] }, 1, 0] } },
            completed: { $sum: { $cond: [{ $eq: ['$status', 'Completed'] }, 1, 0] } },
            cancelled: { $sum: { $cond: [{ $eq: ['$status', 'Cancelled'] }, 1, 0] } },
            critical: { $sum: { $cond: [{ $eq: ['$priority', 'Critical'] }, 1, 0] } },
            emergency: { $sum: { $cond: [{ $eq: ['$priority', 'Emergency'] }, 1, 0] } },
            overdue: { 
              $sum: { 
                $cond: [
                  { 
                    $and: [
                      { $ne: ['$status', 'Completed'] },
                      { $ne: ['$status', 'Cancelled'] },
                      { $lt: ['$dueDate', new Date()] }
                    ]
                  }, 
                  1, 
                  0
                ]
              }
            }
          }
        }
      ]);

      const typeDistribution = await MaintenanceRequest.aggregate([
        { $match: requestFilter },
        { $group: { _id: '$type', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]);

      const priorityDistribution = await MaintenanceRequest.aggregate([
        { $match: requestFilter },
        { $group: { _id: '$priority', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]);

      res.json({
        overview: stats[0] || {},
        typeDistribution,
        priorityDistribution
      });

    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // Auto-assign request to available technician
  static autoAssignRequest = asyncHandler(async (req, res) => {
    try {
      const request = await MaintenanceRequest.findById(req.params.id)
        .populate('equipment');

      if (!request) {
        return res.status(404).json({ 
          error: 'Maintenance request not found',
          code: 'REQUEST_NOT_FOUND'
        });
      }

      // Find available technicians based on equipment specialization
      const equipmentCategory = request.equipment.category;
      const availableTechnicians = await User.findAvailableTechnicians()
        .where('skills').in([equipmentCategory])
        .sort({ workload: 1 })
        .limit(1);

      if (availableTechnicians.length === 0) {
        return res.status(400).json({ 
          error: 'No available technicians found for this equipment type',
          code: 'NO_AVAILABLE_TECHNICIANS'
        });
      }

      const assignedTechnician = availableTechnicians[0];
      
      request.assignedTechnician = assignedTechnician._id;
      request.status = 'Assigned';
      await request.save();

      // Update technician workload
      assignedTechnician.workload += 1;
      await assignedTechnician.save();

      // Send notification email
      try {
        await emailService.sendMaintenanceNotification(assignedTechnician, request);
      } catch (emailError) {
        console.error('Failed to send auto-assignment email:', emailError);
      }

      res.json({
        message: 'Request auto-assigned successfully',
        assignedTo: {
          technician: assignedTechnician.name,
          email: assignedTechnician.email
        }
      });

    } catch (err) {
      console.error('Error auto-assigning request:', err);
      res.status(500).json({ error: err.message });
    }
  });

}

module.exports = MaintenanceController;