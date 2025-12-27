const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const Workshop = require('./models/Workshop');
const User = require('./models/User');

async function setupWorkshops() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Check if workshops exist
    const existingWorkshops = await Workshop.find({});
    if (existingWorkshops.length > 0) {
      console.log('ℹ️ Workshops already exist. Exiting...');
      return;
    }

    console.log('🏭 Creating default workshop...');
    
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
        email: 'main@workshop.com'
      },
      specializations: ['Mechanical', 'Electrical', 'HVAC', 'General'],
      status: 'active',
      createdBy: null
    });

    await mainWorkshop.save();
    console.log('✅ Main workshop created');

    // Update existing admin users to belong to this workshop
    const adminUsers = await User.find({ role: 'admin' });
    for (const admin of adminUsers) {
      if (!admin.workshop) {
        admin.workshop = mainWorkshop._id;
        await admin.save();
        console.log(`✅ Updated admin user: ${admin.email}`);
      }
    }

    // Update workshop creator
    if (adminUsers.length > 0) {
      mainWorkshop.createdBy = adminUsers[0]._id;
      await mainWorkshop.save();
    }

    console.log('✅ Workshop setup completed!');
    console.log('\n🏭 Workshop Created:');
    console.log('Main Workshop (MAIN) - Primary maintenance workshop');

  } catch (error) {
    console.error('❌ Setup failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('📚 Database connection closed');
  }
}

setupWorkshops();