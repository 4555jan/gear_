const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const User = require('./models/User');
const Workshop = require('./models/Workshop');
const Team = require('./models/Team');
const Equipment = require('./models/Equipment');
const MaintenanceRequest = require('./models/MaintenanceRequest');

async function initializeDatabase() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    console.log('🗑️ Clearing existing data...');
    await User.deleteMany({});
    await Workshop.deleteMany({});
    await Team.deleteMany({});
    await Equipment.deleteMany({});
    await MaintenanceRequest.deleteMany({});
    console.log('✅ Database cleared');

    console.log('🏭 Creating workshops...');
    
    // Create main workshop
    const mainWorkshop = new Workshop({
      name: 'Main Workshop',
      code: 'MAIN',
      description: 'Primary maintenance workshop for all operations',
      location: {
        address: '123 Industrial Ave',
        city: 'Industrial City',
        state: 'CA',
        country: 'USA',
        zipCode: '12345'
      },
      contact: {
        phone: '+1-555-0100',
        email: 'main@workshop.com',
        manager: {
          name: 'Workshop Manager',
          email: 'manager@workshop.com',
          phone: '+1-555-0101'
        }
      },
      operatingHours: {
        monday: { start: '08:00', end: '17:00', isOpen: true },
        tuesday: { start: '08:00', end: '17:00', isOpen: true },
        wednesday: { start: '08:00', end: '17:00', isOpen: true },
        thursday: { start: '08:00', end: '17:00', isOpen: true },
        friday: { start: '08:00', end: '17:00', isOpen: true },
        saturday: { start: '09:00', end: '15:00', isOpen: false },
        sunday: { start: '09:00', end: '15:00', isOpen: false }
      },
      specializations: ['Mechanical', 'Electrical', 'HVAC', 'General'],
      capacity: {
        maxUsers: 100,
        maxEquipment: 500,
        maxTeams: 20
      },
      settings: {
        timezone: 'America/Los_Angeles',
        currency: 'USD',
        language: 'en',
        maintenanceSettings: {
          defaultPriority: 'Medium',
          autoAssign: true,
          requireApproval: false
        }
      },
      status: 'active',
      createdBy: null // Will be set after creating admin user
    });

    // Create secondary workshop
    const secondaryWorkshop = new Workshop({
      name: 'Secondary Workshop',
      code: 'SEC',
      description: 'Secondary workshop for specialized maintenance',
      location: {
        address: '456 Tech Blvd',
        city: 'Tech City',
        state: 'CA',
        country: 'USA',
        zipCode: '54321'
      },
      contact: {
        phone: '+1-555-0200',
        email: 'secondary@workshop.com',
        manager: {
          name: 'Secondary Manager',
          email: 'secmanager@workshop.com',
          phone: '+1-555-0201'
        }
      },
      operatingHours: {
        monday: { start: '07:00', end: '16:00', isOpen: true },
        tuesday: { start: '07:00', end: '16:00', isOpen: true },
        wednesday: { start: '07:00', end: '16:00', isOpen: true },
        thursday: { start: '07:00', end: '16:00', isOpen: true },
        friday: { start: '07:00', end: '16:00', isOpen: true },
        saturday: { start: '08:00', end: '12:00', isOpen: true },
        sunday: { start: '08:00', end: '12:00', isOpen: false }
      },
      specializations: ['Electronics', 'Industrial', 'Automotive'],
      capacity: {
        maxUsers: 75,
        maxEquipment: 300,
        maxTeams: 15
      },
      settings: {
        timezone: 'America/Los_Angeles',
        currency: 'USD',
        language: 'en',
        maintenanceSettings: {
          defaultPriority: 'High',
          autoAssign: false,
          requireApproval: true
        }
      },
      status: 'active',
      createdBy: null // Will be set after creating admin user
    });

    console.log('💾 Saving workshops...');
    await mainWorkshop.save();
    await secondaryWorkshop.save();
    console.log('✅ Workshops created');

    console.log('👤 Creating users...');
    
    // Create Super Admin (can manage all workshops)
    const superAdmin = new User({
      name: 'Super Administrator',
      email: 'admin@gearguard.com',
      password: await bcrypt.hash('admin123', 12),
      role: 'admin',
      workshop: mainWorkshop._id,
      phoneNumber: '+1-555-1000',
      department: 'Administration',
      employeeId: 'ADMIN001',
      skills: ['Management', 'System Administration'],
      status: 'active'
    });

    // Create Workshop Admin for Main Workshop
    const workshopAdmin = new User({
      name: 'Main Workshop Admin',
      email: 'workshop.admin@gearguard.com',
      password: await bcrypt.hash('admin123', 12),
      role: 'admin',
      workshop: mainWorkshop._id,
      phoneNumber: '+1-555-1001',
      department: 'Workshop Management',
      employeeId: 'WADMIN001',
      skills: ['Workshop Management', 'Team Leadership'],
      status: 'active'
    });

    // Create Technician for Main Workshop
    const mainTechnician = new User({
      name: 'John Technician',
      email: 'john.tech@gearguard.com',
      password: await bcrypt.hash('tech123', 12),
      role: 'technician',
      workshop: mainWorkshop._id,
      phoneNumber: '+1-555-2001',
      department: 'Maintenance',
      employeeId: 'TECH001',
      skills: ['Electrical', 'Mechanical', 'HVAC'],
      status: 'active'
    });

    // Create Employee for Main Workshop
    const mainEmployee = new User({
      name: 'Jane Employee',
      email: 'jane.emp@gearguard.com',
      password: await bcrypt.hash('emp123', 12),
      role: 'employee',
      workshop: mainWorkshop._id,
      phoneNumber: '+1-555-3001',
      department: 'Operations',
      employeeId: 'EMP001',
      skills: ['Equipment Operation', 'Safety Protocols'],
      status: 'active'
    });

    // Create Technician for Secondary Workshop
    const secondaryTechnician = new User({
      name: 'Mike Technician',
      email: 'mike.tech@gearguard.com',
      password: await bcrypt.hash('tech123', 12),
      role: 'technician',
      workshop: secondaryWorkshop._id,
      phoneNumber: '+1-555-2002',
      department: 'Specialized Maintenance',
      employeeId: 'TECH002',
      skills: ['Electronics', 'Industrial Systems', 'Automotive'],
      status: 'active'
    });

    console.log('💾 Saving users...');
    await superAdmin.save();
    await workshopAdmin.save();
    await mainTechnician.save();
    await mainEmployee.save();
    await secondaryTechnician.save();

    // Update workshops with createdBy
    await Workshop.findByIdAndUpdate(mainWorkshop._id, { createdBy: superAdmin._id });
    await Workshop.findByIdAndUpdate(secondaryWorkshop._id, { createdBy: superAdmin._id });

    console.log('✅ Users created');

    console.log('🏢 Creating teams...');
    
    // Create team for Main Workshop
    const mainTeam = new Team({
      name: 'Main Maintenance Team',
      workshop: mainWorkshop._id,
      description: 'Primary maintenance team for general operations',
      specialization: ['Mechanical', 'Electrical', 'HVAC'],
      teamLead: mainTechnician._id,
      members: [
        {
          user: mainTechnician._id,
          role: 'lead',
          joinedAt: new Date(),
          skills: ['Electrical', 'Mechanical', 'HVAC']
        }
      ],
      capacity: {
        maxMembers: 10,
        currentWorkload: 0
      },
      workingHours: {
        start: '08:00',
        end: '17:00',
        timezone: 'America/Los_Angeles'
      },
      status: 'active'
    });

    // Create team for Secondary Workshop
    const secondaryTeam = new Team({
      name: 'Specialized Maintenance Team',
      workshop: secondaryWorkshop._id,
      description: 'Specialized team for electronics and industrial equipment',
      specialization: ['Electronics', 'Industrial Equipment'],
      teamLead: secondaryTechnician._id,
      members: [
        {
          user: secondaryTechnician._id,
          role: 'lead',
          joinedAt: new Date(),
          skills: ['Electronics', 'Industrial Systems']
        }
      ],
      capacity: {
        maxMembers: 8,
        currentWorkload: 0
      },
      workingHours: {
        start: '07:00',
        end: '16:00',
        timezone: 'America/Los_Angeles'
      },
      status: 'active'
    });

    console.log('💾 Saving teams...');
    await mainTeam.save();
    await secondaryTeam.save();

    // Update users with team assignments
    await User.findByIdAndUpdate(mainTechnician._id, { team: mainTeam._id });
    await User.findByIdAndUpdate(secondaryTechnician._id, { team: secondaryTeam._id });

    console.log('✅ Teams created');

    console.log('🛠️ Database initialization completed successfully!');
    console.log('\n📋 Login Credentials:');
    console.log('Super Admin: admin@gearguard.com / admin123');
    console.log('Workshop Admin: workshop.admin@gearguard.com / admin123');
    console.log('Main Technician: john.tech@gearguard.com / tech123');
    console.log('Secondary Technician: mike.tech@gearguard.com / tech123');
    console.log('Employee: jane.emp@gearguard.com / emp123');
    console.log('\n🏭 Workshops Created:');
    console.log('Main Workshop (MAIN) - General maintenance');
    console.log('Secondary Workshop (SEC) - Specialized maintenance');

    process.exit(0);

  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  }
}

// Run initialization
initializeDatabase();