const mongoose = require('mongoose');

const equipmentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Equipment name is required'],
    trim: true,
    maxlength: [100, 'Equipment name cannot exceed 100 characters']
  },
  workshop: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workshop',
    default: null
  },
  serialNumber: {
    type: String,
    required: [true, 'Serial number is required'],
    trim: true,
    uppercase: true
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: [
      'HVAC',
      'Electrical',
      'Mechanical',
      'Plumbing',
      'IT/Electronics',
      'Safety Systems',
      'Building Systems',
      'Industrial Equipment',
      'Automotive',
      'Office Equipment',
      'Medical Equipment',
      'Other'
    ]
  },
  subcategory: {
    type: String,
    trim: true
  },
  manufacturer: {
    type: String,
    trim: true,
    maxlength: [50, 'Manufacturer name cannot exceed 50 characters']
  },
  model: {
    type: String,
    trim: true,
    maxlength: [50, 'Model cannot exceed 50 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  location: {
    building: {
      type: String,
      required: [true, 'Building is required'],
      trim: true
    },
    floor: {
      type: String,
      trim: true
    },
    room: {
      type: String,
      trim: true
    },
    zone: {
      type: String,
      trim: true
    },
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  assignedTeam: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    required: [true, 'Assigned team is required']
  },
  primaryTechnician: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  status: {
    type: String,
    enum: ['Active', 'Maintenance', 'Out of Service', 'Scrapped'],
    default: 'Active',
    required: true
  },
  condition: {
    type: String,
    enum: ['Excellent', 'Good', 'Fair', 'Poor', 'Critical'],
    default: 'Good'
  },
  purchaseDate: {
    type: Date,
    required: [true, 'Purchase date is required']
  },
  installationDate: {
    type: Date
  },
  warrantyExpiry: {
    type: Date
  },
  lastMaintenanceDate: {
    type: Date
  },
  nextMaintenanceDate: {
    type: Date
  },
  maintenanceInterval: {
    value: {
      type: Number,
      min: 1
    },
    unit: {
      type: String,
      enum: ['days', 'weeks', 'months', 'years'],
      default: 'months'
    }
  },
  specifications: {
    power: String,
    voltage: String,
    capacity: String,
    weight: String,
    dimensions: {
      length: Number,
      width: Number,
      height: Number,
      unit: {
        type: String,
        enum: ['mm', 'cm', 'm', 'in', 'ft'],
        default: 'cm'
      }
    }
  },
  criticality: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Critical'],
    default: 'Medium',
    required: true
  },
  cost: {
    purchase: {
      type: Number,
      min: 0
    },
    installation: {
      type: Number,
      min: 0
    },
    annual_maintenance: {
      type: Number,
      min: 0
    }
  },
  vendor: {
    name: String,
    contact: String,
    email: String,
    phone: String
  },
  documents: [{
    name: String,
    type: {
      type: String,
      enum: ['Manual', 'Warranty', 'Certificate', 'Drawing', 'Photo', 'Other']
    },
    filePath: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  qrCode: {
    type: String,
    unique: true,
    sparse: true
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  metadata: {
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    lastModifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
equipmentSchema.index({ serialNumber: 1 });
equipmentSchema.index({ category: 1 });
equipmentSchema.index({ status: 1 });
equipmentSchema.index({ assignedTeam: 1 });
equipmentSchema.index({ location: 1 });
equipmentSchema.index({ criticality: 1 });
equipmentSchema.index({ nextMaintenanceDate: 1 });

// Virtual for maintenance history
equipmentSchema.virtual('maintenanceHistory', {
  ref: 'MaintenanceRequest',
  localField: '_id',
  foreignField: 'equipment'
});

// Virtual for age in years
equipmentSchema.virtual('age').get(function() {
  if (!this.purchaseDate) return 0;
  const now = new Date();
  const diffTime = Math.abs(now - this.purchaseDate);
  const diffYears = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 365.25));
  return diffYears;
});

// Virtual for warranty status
equipmentSchema.virtual('warrantyStatus').get(function() {
  if (!this.warrantyExpiry) return 'Unknown';
  const now = new Date();
  if (now < this.warrantyExpiry) return 'Active';
  return 'Expired';
});

// Virtual for maintenance status
equipmentSchema.virtual('maintenanceStatus').get(function() {
  if (!this.nextMaintenanceDate) return 'Not Scheduled';
  const now = new Date();
  const diffDays = Math.ceil((this.nextMaintenanceDate - now) / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) return 'Overdue';
  if (diffDays <= 7) return 'Due Soon';
  if (diffDays <= 30) return 'Upcoming';
  return 'Scheduled';
});

// Pre-save middleware to generate QR code
equipmentSchema.pre('save', function(next) {
  if (this.isNew && !this.qrCode) {
    this.qrCode = `EQ-${this.serialNumber}-${Date.now()}`;
  }
  next();
});

// Method to schedule next maintenance
equipmentSchema.methods.scheduleNextMaintenance = function() {
  if (this.maintenanceInterval && this.maintenanceInterval.value) {
    const interval = this.maintenanceInterval.value;
    const unit = this.maintenanceInterval.unit;
    const baseDate = this.lastMaintenanceDate || new Date();
    
    let nextDate = new Date(baseDate);
    
    switch (unit) {
      case 'days':
        nextDate.setDate(nextDate.getDate() + interval);
        break;
      case 'weeks':
        nextDate.setDate(nextDate.getDate() + (interval * 7));
        break;
      case 'months':
        nextDate.setMonth(nextDate.getMonth() + interval);
        break;
      case 'years':
        nextDate.setFullYear(nextDate.getFullYear() + interval);
        break;
    }
    
    this.nextMaintenanceDate = nextDate;
  }
};

// Static method to find equipment needing maintenance
equipmentSchema.statics.findMaintenanceDue = function(days = 7) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() + days);
  
  return this.find({
    isActive: true,
    status: { $in: ['Active', 'Maintenance'] },
    nextMaintenanceDate: { $lte: cutoffDate }
  }).populate('assignedTeam', 'name').populate('primaryTechnician', 'name email');
};

// Static method to get equipment by location
equipmentSchema.statics.findByLocation = function(building, floor = null, room = null) {
  const query = { 'location.building': building, isActive: true };
  
  if (floor) query['location.floor'] = floor;
  if (room) query['location.room'] = room;
  
  return this.find(query).populate('assignedTeam', 'name specialization');
};

module.exports = mongoose.model('Equipment', equipmentSchema);