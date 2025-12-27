const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Team name is required'],
    trim: true,
    maxlength: [50, 'Team name cannot exceed 50 characters']
  },
  workshop: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workshop',
    default: null
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  specialization: [{
    type: String,
    required: true,
    enum: [
      'Electrical',
      'Mechanical',
      'HVAC',
      'Plumbing',
      'IT/Electronics',
      'Building Maintenance',
      'Industrial Equipment',
      'Safety Systems',
      'Automotive',
      'General Maintenance'
    ]
  }],
  members: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      enum: ['lead', 'senior', 'junior', 'trainee'],
      default: 'junior'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    isActive: {
      type: Boolean,
      default: true
    }
  }],
  teamLead: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'disbanded'],
    default: 'active'
  },
  maxCapacity: {
    type: Number,
    default: 10,
    min: 1,
    max: 50
  },
  workingHours: {
    start: {
      type: String,
      default: '08:00',
      match: [/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format']
    },
    end: {
      type: String,
      default: '17:00',
      match: [/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format']
    }
  },
  workingDays: [{
    type: String,
    enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
  }],
  location: {
    building: String,
    floor: String,
    department: String
  },
  equipment: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Equipment'
  }],
  performance: {
    completedTasks: { type: Number, default: 0 },
    averageResponseTime: { type: Number, default: 0 }, // in hours
    customerSatisfaction: { type: Number, default: 0 }, // 0-5 rating
    efficiency: { type: Number, default: 0 } // percentage
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
teamSchema.index({ name: 1 });
teamSchema.index({ specialization: 1 });
teamSchema.index({ status: 1 });
teamSchema.index({ 'members.user': 1 });

// Virtual for active members count
teamSchema.virtual('activeMembersCount').get(function() {
  return this.members.filter(member => member.isActive).length;
});

// Virtual for current workload
teamSchema.virtual('currentWorkload', {
  ref: 'MaintenanceRequest',
  localField: '_id',
  foreignField: 'assignedTeam',
  count: true,
  match: { status: { $in: ['new', 'in-progress'] } }
});

// Pre-save middleware to set team lead
teamSchema.pre('save', function(next) {
  if (this.isModified('members') && this.members.length > 0) {
    // Auto-assign team lead if not set
    if (!this.teamLead) {
      const leadMember = this.members.find(member => member.role === 'lead');
      if (leadMember) {
        this.teamLead = leadMember.user;
      }
    }
  }
  next();
});

// Method to add member to team
teamSchema.methods.addMember = function(userId, role = 'junior') {
  // Check if user is already a member
  const existingMember = this.members.find(member => 
    member.user.toString() === userId.toString()
  );
  
  if (existingMember) {
    throw new Error('User is already a member of this team');
  }
  
  // Check capacity
  if (this.activeMembersCount >= this.maxCapacity) {
    throw new Error('Team has reached maximum capacity');
  }
  
  this.members.push({
    user: userId,
    role: role,
    joinedAt: new Date(),
    isActive: true
  });
  
  return this.save();
};

// Method to remove member from team
teamSchema.methods.removeMember = function(userId) {
  const memberIndex = this.members.findIndex(member => 
    member.user.toString() === userId.toString()
  );
  
  if (memberIndex === -1) {
    throw new Error('User is not a member of this team');
  }
  
  // Check if removing team lead
  if (this.teamLead && this.teamLead.toString() === userId.toString()) {
    // Assign new team lead
    const newLead = this.members.find(member => 
      member.user.toString() !== userId.toString() && 
      member.isActive &&
      member.role === 'lead'
    );
    
    if (newLead) {
      this.teamLead = newLead.user;
    } else {
      this.teamLead = null;
    }
  }
  
  this.members.splice(memberIndex, 1);
  return this.save();
};

// Method to update member role
teamSchema.methods.updateMemberRole = function(userId, newRole) {
  const member = this.members.find(member => 
    member.user.toString() === userId.toString()
  );
  
  if (!member) {
    throw new Error('User is not a member of this team');
  }
  
  member.role = newRole;
  
  // Update team lead if needed
  if (newRole === 'lead') {
    this.teamLead = userId;
  }
  
  return this.save();
};

// Static method to find teams by specialization
teamSchema.statics.findBySpecialization = function(specialization) {
  return this.find({
    specialization: { $in: [specialization] },
    status: 'active'
  }).populate('members.user', 'name email role skills');
};

// Static method to get team performance
teamSchema.statics.getTeamPerformance = function(teamId, startDate, endDate) {
  return this.aggregate([
    { $match: { _id: teamId } },
    {
      $lookup: {
        from: 'maintenancerequests',
        localField: '_id',
        foreignField: 'assignedTeam',
        as: 'requests'
      }
    },
    {
      $project: {
        name: 1,
        completedTasks: {
          $size: {
            $filter: {
              input: '$requests',
              cond: {
                $and: [
                  { $eq: ['$$this.status', 'completed'] },
                  { $gte: ['$$this.completedAt', startDate] },
                  { $lte: ['$$this.completedAt', endDate] }
                ]
              }
            }
          }
        },
        totalTasks: { $size: '$requests' }
      }
    }
  ]);
};

module.exports = mongoose.model('Team', teamSchema);