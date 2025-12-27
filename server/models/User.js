const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters']
  },
  role: {
    type: String,
    enum: ['admin', 'technician', 'employee'],
    default: 'employee',
    required: true
  },
  workshop: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workshop',
    default: null
  },
  team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    default: null
  },
  skills: [{
    type: String,
    trim: true
  }],
  phoneNumber: {
    type: String,
    trim: true,
    match: [/^\+?[1-9]\d{1,14}$/, 'Please enter a valid phone number']
  },
  department: {
    type: String,
    trim: true
  },
  employeeId: {
    type: String,
    unique: true,
    sparse: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'active', 'inactive', 'suspended'],
    default: 'pending'
  },
  creationType: {
    type: String,
    enum: ['invited', 'registered', 'system'],
    default: 'registered',
    required: true
  },
  invitedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: String,
  emailVerificationExpires: Date,
  activationToken: String,
  activationExpires: Date,
  lastLogin: {
    type: Date,
    default: null
  },
  passwordResetToken: String,
  passwordResetExpires: Date,
  workload: {
    type: Number,
    default: 0,
    min: 0
  },
  avatar: {
    type: String,
    default: null
  },
  preferences: {
    notifications: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true }
    },
    dashboard: {
      layout: { type: String, default: 'grid' }
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ workshop: 1 });
userSchema.index({ team: 1 });
userSchema.index({ status: 1 });

// Virtual for assigned maintenance requests
userSchema.virtual('assignedRequests', {
  ref: 'MaintenanceRequest',
  localField: '_id',
  foreignField: 'assignedTechnician'
});

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare passwords
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Method to get public profile
userSchema.methods.getPublicProfile = function() {
  const userObject = this.toObject();
  delete userObject.password;
  delete userObject.__v;
  return userObject;
};

// Static method to find available technicians
userSchema.statics.findAvailableTechnicians = function(teamId = null) {
  const query = {
    role: 'technician',
    status: 'active'
  };
  
  if (teamId) {
    query.team = teamId;
  }
  
  return this.find(query)
    .sort({ workload: 1 })
    .populate('team', 'name specialization');
};

module.exports = mongoose.model('User', userSchema);