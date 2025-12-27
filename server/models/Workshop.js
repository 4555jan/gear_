const mongoose = require('mongoose');

const workshopSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Workshop name is required'],
    trim: true,
    maxlength: [100, 'Workshop name cannot exceed 100 characters']
  },
  code: {
    type: String,
    required: [true, 'Workshop code is required'],
    unique: true,
    uppercase: true,
    trim: true,
    maxlength: [10, 'Workshop code cannot exceed 10 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  location: {
    address: {
      type: String,
      trim: true
    },
    city: {
      type: String,
      trim: true
    },
    state: {
      type: String,
      trim: true
    },
    country: {
      type: String,
      trim: true
    },
    zipCode: {
      type: String,
      trim: true
    },
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  contact: {
    phone: {
      type: String,
      trim: true
    },
    email: {
      type: String,
      trim: true,
      lowercase: true
    },
    manager: {
      name: String,
      email: String,
      phone: String
    }
  },
  operatingHours: {
    monday: { start: String, end: String, isOpen: { type: Boolean, default: true } },
    tuesday: { start: String, end: String, isOpen: { type: Boolean, default: true } },
    wednesday: { start: String, end: String, isOpen: { type: Boolean, default: true } },
    thursday: { start: String, end: String, isOpen: { type: Boolean, default: true } },
    friday: { start: String, end: String, isOpen: { type: Boolean, default: true } },
    saturday: { start: String, end: String, isOpen: { type: Boolean, default: false } },
    sunday: { start: String, end: String, isOpen: { type: Boolean, default: false } }
  },
  specializations: [{
    type: String,
    enum: [
      'Mechanical',
      'Electrical',
      'HVAC',
      'Plumbing',
      'Automotive',
      'Industrial',
      'Electronics',
      'Welding',
      'Fabrication',
      'Painting',
      'General'
    ]
  }],
  capacity: {
    maxUsers: {
      type: Number,
      default: 100
    },
    maxEquipment: {
      type: Number,
      default: 500
    },
    maxTeams: {
      type: Number,
      default: 20
    }
  },
  settings: {
    timezone: {
      type: String,
      default: 'UTC'
    },
    currency: {
      type: String,
      default: 'USD'
    },
    language: {
      type: String,
      default: 'en'
    },
    maintenanceSettings: {
      defaultPriority: {
        type: String,
        enum: ['Low', 'Medium', 'High', 'Critical'],
        default: 'Medium'
      },
      autoAssign: {
        type: Boolean,
        default: true
      },
      requireApproval: {
        type: Boolean,
        default: false
      }
    }
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'maintenance'],
    default: 'active'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
workshopSchema.index({ code: 1 });
workshopSchema.index({ name: 1 });
workshopSchema.index({ status: 1 });
workshopSchema.index({ 'specializations': 1 });

// Virtual for users count
workshopSchema.virtual('usersCount', {
  ref: 'User',
  localField: '_id',
  foreignField: 'workshop',
  count: true
});

// Virtual for teams count
workshopSchema.virtual('teamsCount', {
  ref: 'Team',
  localField: '_id',
  foreignField: 'workshop',
  count: true
});

// Virtual for equipment count
workshopSchema.virtual('equipmentCount', {
  ref: 'Equipment',
  localField: '_id',
  foreignField: 'workshop',
  count: true
});

// Method to get workshop statistics
workshopSchema.methods.getStats = async function() {
  const User = mongoose.model('User');
  const Team = mongoose.model('Team');
  const Equipment = mongoose.model('Equipment');
  const MaintenanceRequest = mongoose.model('MaintenanceRequest');

  const [users, teams, equipment, maintenance] = await Promise.all([
    User.countDocuments({ workshop: this._id }),
    Team.countDocuments({ workshop: this._id }),
    Equipment.countDocuments({ workshop: this._id }),
    MaintenanceRequest.countDocuments({ workshop: this._id })
  ]);

  return {
    users,
    teams,
    equipment,
    maintenanceRequests: maintenance
  };
};

// Static method to find workshops by specialization
workshopSchema.statics.findBySpecialization = function(specialization) {
  return this.find({
    specializations: { $in: [specialization] },
    status: 'active'
  });
};

module.exports = mongoose.model('Workshop', workshopSchema);