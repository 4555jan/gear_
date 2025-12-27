const Equipment = require('../models/Equipment');
const User = require('../models/User');
const Team = require('../models/Team');
const MaintenanceRequest = require('../models/MaintenanceRequest');
const { asyncHandler } = require('../middleware/validation');

class EquipmentController {

  // Create new equipment
  static createEquipment = asyncHandler(async (req, res) => {
    try {
      const {
        name,
        serialNumber,
        category,
        manufacturer,
        model,
        specifications,
        location,
        purchaseDate,
        warrantyExpiry,
        status = 'Active',
        workshop
      } = req.body;

      // Check if serial number exists within the same workshop
      const existingEquipment = await Equipment.findOne({ 
        serialNumber: serialNumber.toUpperCase(),
        workshop: workshop || req.user.workshop
      });
      
      if (existingEquipment) {
        return res.status(400).json({
          error: 'Equipment with this serial number already exists in the workshop',
          code: 'DUPLICATE_SERIAL_NUMBER'
        });
      }

      const equipment = await Equipment.create({
        name,
        serialNumber: serialNumber.toUpperCase(),
        category,
        manufacturer,
        model,
        specifications,
        location,
        purchaseDate,
        warrantyExpiry,
        status,
        workshop: workshop || req.user.workshop,
        createdBy: req.user._id
      });

      const populatedEquipment = await Equipment.findById(equipment._id)
        .populate('workshop', 'name code')
        .populate('createdBy', 'name email');

      res.status(201).json({
        message: 'Equipment created successfully',
        equipment: populatedEquipment
      });

    } catch (err) {
      console.error('Error creating equipment:', err);
      res.status(500).json({ 
        error: err.message,
        code: 'CREATION_FAILED'
      });
    }
  });

  // Get all equipment with filters
  static getAllEquipment = asyncHandler(async (req, res) => {
    try {
      const {
        page = 1,
        limit = 10,
        category,
        status,
        workshop,
        search
      } = req.query;

      const skip = (parseInt(page) - 1) * parseInt(limit);

      // Build filter
      const filter = {};
      
      if (category) filter.category = category;
      if (status) filter.status = status;
      
      // Workshop filter
      if (req.user.role !== 'admin' && req.user.workshop) {
        filter.workshop = req.user.workshop;
      } else if (workshop) {
        filter.workshop = workshop;
      }

      // Search functionality
      if (search) {
        filter.$or = [
          { name: { $regex: search, $options: 'i' } },
          { serialNumber: { $regex: search, $options: 'i' } },
          { manufacturer: { $regex: search, $options: 'i' } },
          { model: { $regex: search, $options: 'i' } }
        ];
      }

      const equipment = await Equipment.find(filter)
        .populate('workshop', 'name code')
        .populate('createdBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

      const total = await Equipment.countDocuments(filter);

      res.json({
        equipment,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / parseInt(limit)),
          total,
          hasNext: page < Math.ceil(total / parseInt(limit)),
          hasPrev: page > 1
        }
      });

    } catch (err) {
      console.error('Error fetching equipment:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // Get equipment by ID with maintenance history
  static getEquipmentById = asyncHandler(async (req, res) => {
    try {
      const equipment = await Equipment.findById(req.params.id)
        .populate('workshop', 'name code location')
        .populate('createdBy', 'name email role');

      if (!equipment) {
        return res.status(404).json({
          error: 'Equipment not found',
          code: 'EQUIPMENT_NOT_FOUND'
        });
      }

      // Get maintenance history
      const maintenanceHistory = await MaintenanceRequest.find({
        equipment: equipment._id
      })
        .populate('assignedTechnician', 'name email')
        .populate('createdBy', 'name email')
        .sort({ createdAt: -1 })
        .limit(10);

      // Calculate maintenance statistics
      const maintenanceStats = await MaintenanceRequest.aggregate([
        { $match: { equipment: equipment._id } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            completed: { $sum: { $cond: [{ $eq: ['$status', 'Completed'] }, 1, 0] } },
            pending: { $sum: { $cond: [{ $ne: ['$status', 'Completed'] }, 1, 0] } },
            avgDuration: { 
              $avg: { 
                $cond: [
                  { $and: [{ $ne: ['$actualStartDate', null] }, { $ne: ['$actualEndDate', null] }] },
                  { $divide: [{ $subtract: ['$actualEndDate', '$actualStartDate'] }, 1000 * 60 * 60] },
                  null
                ]
              }
            }
          }
        }
      ]);

      res.json({
        equipment,
        maintenanceHistory,
        maintenanceStats: maintenanceStats[0] || {
          total: 0,
          completed: 0,
          pending: 0,
          avgDuration: 0
        }
      });

    } catch (err) {
      console.error('Error fetching equipment:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // Update equipment
  static updateEquipment = asyncHandler(async (req, res) => {
    try {
      const equipment = await Equipment.findById(req.params.id);
      
      if (!equipment) {
        return res.status(404).json({
          error: 'Equipment not found',
          code: 'EQUIPMENT_NOT_FOUND'
        });
      }

      // Check if user can update this equipment
      if (req.user.role !== 'admin' && equipment.workshop?.toString() !== req.user.workshop?.toString()) {
        return res.status(403).json({
          error: 'Access denied',
          code: 'ACCESS_DENIED'
        });
      }

      // Check serial number uniqueness if being updated
      if (req.body.serialNumber && req.body.serialNumber !== equipment.serialNumber) {
        const existingEquipment = await Equipment.findOne({
          serialNumber: req.body.serialNumber.toUpperCase(),
          workshop: equipment.workshop,
          _id: { $ne: equipment._id }
        });

        if (existingEquipment) {
          return res.status(400).json({
            error: 'Equipment with this serial number already exists in the workshop',
            code: 'DUPLICATE_SERIAL_NUMBER'
          });
        }
      }

      const allowedUpdates = [
        'name', 'category', 'manufacturer', 'model', 
        'specifications', 'location', 'purchaseDate', 
        'warrantyExpiry', 'status', 'description'
      ];

      const updates = {};
      Object.keys(req.body).forEach(key => {
        if (allowedUpdates.includes(key)) {
          updates[key] = key === 'serialNumber' ? req.body[key].toUpperCase() : req.body[key];
        }
      });

      const updatedEquipment = await Equipment.findByIdAndUpdate(
        req.params.id,
        updates,
        { new: true, runValidators: true }
      )
        .populate('workshop', 'name code')
        .populate('createdBy', 'name email');

      res.json({
        message: 'Equipment updated successfully',
        equipment: updatedEquipment
      });

    } catch (err) {
      console.error('Error updating equipment:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // Delete equipment
  static deleteEquipment = asyncHandler(async (req, res) => {
    try {
      const equipment = await Equipment.findById(req.params.id);
      
      if (!equipment) {
        return res.status(404).json({
          error: 'Equipment not found',
          code: 'EQUIPMENT_NOT_FOUND'
        });
      }

      // Check if equipment has active maintenance requests
      const activeRequests = await MaintenanceRequest.countDocuments({
        equipment: equipment._id,
        status: { $nin: ['Completed', 'Cancelled'] }
      });

      if (activeRequests > 0) {
        return res.status(400).json({
          error: `Cannot delete equipment. It has ${activeRequests} active maintenance request(s).`,
          code: 'HAS_ACTIVE_REQUESTS'
        });
      }

      // Soft delete - set status to inactive
      equipment.status = 'Decommissioned';
      equipment.decommissionedAt = new Date();
      await equipment.save();

      res.json({
        message: 'Equipment decommissioned successfully'
      });

    } catch (err) {
      console.error('Error deleting equipment:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // Get equipment dashboard statistics
  static getDashboardStats = asyncHandler(async (req, res) => {
    try {
      const { workshop } = req.query;
      
      // Build filter for workshop
      let filter = {};
      if (req.user.role !== 'admin' && req.user.workshop) {
        filter.workshop = req.user.workshop;
      } else if (workshop) {
        filter.workshop = workshop;
      }

      const stats = await Equipment.aggregate([
        { $match: filter },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            active: { $sum: { $cond: [{ $eq: ['$status', 'Active'] }, 1, 0] } },
            inactive: { $sum: { $cond: [{ $eq: ['$status', 'Inactive'] }, 1, 0] } },
            maintenance: { $sum: { $cond: [{ $eq: ['$status', 'Under Maintenance'] }, 1, 0] } },
            decommissioned: { $sum: { $cond: [{ $eq: ['$status', 'Decommissioned'] }, 1, 0] } }
          }
        }
      ]);

      const categoryDistribution = await Equipment.aggregate([
        { $match: filter },
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]);

      const statusDistribution = await Equipment.aggregate([
        { $match: filter },
        { $group: { _id: '$status', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]);

      res.json({
        overview: stats[0] || {},
        categoryDistribution,
        statusDistribution
      });

    } catch (err) {
      console.error('Error fetching equipment stats:', err);
      res.status(500).json({ error: err.message });
    }
  });

}

module.exports = EquipmentController;