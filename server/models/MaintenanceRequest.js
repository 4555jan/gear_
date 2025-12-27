const mongoose = require('mongoose');

const maintenanceRequestSchema = new mongoose.Schema({
  requestNumber: {
    type: String,
    unique: true,
    required: true
  },
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  type: {
    type: String,
    enum: ['Corrective', 'Preventive', 'Predictive', 'Emergency'],
    required: [true, 'Maintenance type is required']
  },
  equipment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Equipment',
    required: [true, 'Equipment is required']
  },
  location: {
    building: String,
    floor: String,
    room: String,
    specificLocation: String
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Creator is required']
  },
  assignedTechnician: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  assignedTeam: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team'
  },
  status: {
    type: String,
    enum: ['New', 'Assigned', 'In Progress', 'Waiting for Parts', 'On Hold', 'Completed', 'Cancelled', 'Rejected'],
    default: 'New',
    required: true
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Critical', 'Emergency'],
    default: 'Medium',
    required: true
  },
  urgency: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Critical'],
    default: 'Medium'
  },
  impact: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Critical'],
    default: 'Medium'
  },
  scheduledDate: {
    type: Date
  },
  estimatedDuration: {
    type: Number, // in hours
    min: 0
  },
  actualStartDate: {
    type: Date
  },
  actualEndDate: {
    type: Date
  },
  dueDate: {
    type: Date
  },
  completedAt: {
    type: Date
  },
  workNotes: [{
    technician: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    note: {
      type: String,
      required: true,
      maxlength: [1000, 'Note cannot exceed 1000 characters']
    },
    hoursWorked: {
      type: Number,
      min: 0,
      max: 24
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    attachments: [{
      filename: String,
      filePath: String,
      fileSize: Number,
      mimeType: String
    }]
  }],
  partsUsed: [{
    name: {
      type: String,
      required: true
    },
    partNumber: String,
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    unitCost: {
      type: Number,
      min: 0
    },
    supplier: String,
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    requestedAt: {
      type: Date,
      default: Date.now
    }
  }],
  cost: {
    labor: {
      type: Number,
      default: 0,
      min: 0
    },
    parts: {
      type: Number,
      default: 0,
      min: 0
    },
    external: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  category: {
    type: String,
    enum: [
      'Electrical',
      'Mechanical',
      'HVAC',
      'Plumbing',
      'IT/Electronics',
      'Safety',
      'Building',
      'Grounds',
      'Other'
    ]
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  attachments: [{
    filename: String,
    originalName: String,
    filePath: String,
    fileSize: Number,
    mimeType: String,
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  feedback: {
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    comment: String,
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    submittedAt: Date
  },
  recurringMaintenance: {
    isRecurring: {
      type: Boolean,
      default: false
    },
    parentRequest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MaintenanceRequest'
    },
    nextScheduled: Date,
    frequency: {
      value: Number,
      unit: {
        type: String,
        enum: ['days', 'weeks', 'months', 'years']
      }
    }
  },
  downtime: {
    startTime: Date,
    endTime: Date,
    totalMinutes: {
      type: Number,
      default: 0
    },
    impactDescription: String
  },
  approval: {
    required: {
      type: Boolean,
      default: false
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    approvedAt: Date,
    rejectionReason: String
  },
  sla: {
    responseTime: Number, // in hours
    resolutionTime: Number, // in hours
    responseDeadline: Date,
    resolutionDeadline: Date,
    isSLABreached: {
      type: Boolean,
      default: false
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
maintenanceRequestSchema.index({ requestNumber: 1 });
maintenanceRequestSchema.index({ status: 1 });
maintenanceRequestSchema.index({ priority: 1 });
maintenanceRequestSchema.index({ equipment: 1 });
maintenanceRequestSchema.index({ assignedTechnician: 1 });
maintenanceRequestSchema.index({ assignedTeam: 1 });
maintenanceRequestSchema.index({ createdBy: 1 });
maintenanceRequestSchema.index({ scheduledDate: 1 });
maintenanceRequestSchema.index({ dueDate: 1 });
maintenanceRequestSchema.index({ createdAt: 1 });
maintenanceRequestSchema.index({ type: 1 });

// Virtual for total cost
maintenanceRequestSchema.virtual('totalCost').get(function() {
  return (this.cost.labor || 0) + (this.cost.parts || 0) + (this.cost.external || 0);
});

// Virtual for total hours worked
maintenanceRequestSchema.virtual('totalHoursWorked').get(function() {
  return this.workNotes.reduce((total, note) => total + (note.hoursWorked || 0), 0);
});

// Virtual for duration in minutes
maintenanceRequestSchema.virtual('duration').get(function() {
  if (this.actualStartDate && this.actualEndDate) {
    return Math.round((this.actualEndDate - this.actualStartDate) / (1000 * 60));
  }
  return 0;
});

// Virtual for age in days
maintenanceRequestSchema.virtual('ageInDays').get(function() {
  const now = new Date();
  return Math.floor((now - this.createdAt) / (1000 * 60 * 60 * 24));
});

// Virtual for overdue status
maintenanceRequestSchema.virtual('isOverdue').get(function() {
  if (!this.dueDate || this.status === 'Completed') return false;
  return new Date() > this.dueDate;
});

// Pre-save middleware to generate request number
maintenanceRequestSchema.pre('save', async function(next) {
  if (this.isNew && !this.requestNumber) {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    
    // Find the last request number for this month
    const lastRequest = await this.constructor
      .findOne({ requestNumber: new RegExp(`^MR-${year}${month}`) })
      .sort({ requestNumber: -1 });
    
    let sequence = 1;
    if (lastRequest) {
      const lastSequence = parseInt(lastRequest.requestNumber.split('-')[2]);
      sequence = lastSequence + 1;
    }
    
    this.requestNumber = `MR-${year}${month}-${String(sequence).padStart(4, '0')}`;
  }
  
  // Auto-calculate SLA deadlines
  if (this.isModified('priority') || this.isNew) {
    const slaHours = {
      'Emergency': { response: 0.5, resolution: 4 },
      'Critical': { response: 2, resolution: 8 },
      'High': { response: 4, resolution: 24 },
      'Medium': { response: 8, resolution: 72 },
      'Low': { response: 24, resolution: 168 }
    };
    
    const sla = slaHours[this.priority];
    if (sla) {
      const created = this.createdAt || new Date();
      this.sla = {
        ...this.sla,
        responseTime: sla.response,
        resolutionTime: sla.resolution,
        responseDeadline: new Date(created.getTime() + (sla.response * 60 * 60 * 1000)),
        resolutionDeadline: new Date(created.getTime() + (sla.resolution * 60 * 60 * 1000))
      };
    }
  }
  
  // Update completion timestamp
  if (this.isModified('status') && this.status === 'Completed') {
    this.completedAt = new Date();
    this.actualEndDate = this.actualEndDate || new Date();
  }
  
  // Update start timestamp
  if (this.isModified('status') && this.status === 'In Progress' && !this.actualStartDate) {
    this.actualStartDate = new Date();
  }
  
  next();
});

// Method to add work note
maintenanceRequestSchema.methods.addWorkNote = function(technicianId, note, hoursWorked = 0, attachments = []) {
  this.workNotes.push({
    technician: technicianId,
    note,
    hoursWorked,
    attachments,
    timestamp: new Date()
  });
  return this.save();
};

// Method to calculate total parts cost
maintenanceRequestSchema.methods.calculatePartsCost = function() {
  const total = this.partsUsed.reduce((sum, part) => {
    return sum + (part.quantity * (part.unitCost || 0));
  }, 0);
  
  this.cost.parts = total;
  return total;
};

// Static method to find overdue requests
maintenanceRequestSchema.statics.findOverdue = function() {
  const now = new Date();
  return this.find({
    status: { $nin: ['Completed', 'Cancelled', 'Rejected'] },
    dueDate: { $lt: now }
  }).populate('equipment', 'name serialNumber')
    .populate('assignedTechnician', 'name email')
    .populate('assignedTeam', 'name');
};

// Static method to get maintenance statistics
maintenanceRequestSchema.statics.getStatistics = function(startDate, endDate, filters = {}) {
  const matchStage = {
    createdAt: { $gte: startDate, $lte: endDate },
    ...filters
  };
  
  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        completed: { $sum: { $cond: [{ $eq: ['$status', 'Completed'] }, 1, 0] } },
        inProgress: { $sum: { $cond: [{ $eq: ['$status', 'In Progress'] }, 1, 0] } },
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
        },
        totalCost: { $sum: { $add: ['$cost.labor', '$cost.parts', '$cost.external'] } }
      }
    }
  ]);
};

module.exports = mongoose.model('MaintenanceRequest', maintenanceRequestSchema);