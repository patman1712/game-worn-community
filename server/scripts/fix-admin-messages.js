const sequelize = require('../src/database');
const User = require('../src/models/User');

const fixAdmin = async () => {
  try {
    await sequelize.authenticate();
    console.log('Connection has been established successfully.');
    
    // Find admin user
    const admin = await User.findOne({ where: { role: 'admin' } });
    
    if (!admin) {
      console.log('No admin user found.');
      return;
    }
    
    console.log('Found admin:', admin.email);
    console.log('Current accept_messages:', admin.accept_messages);
    console.log('Current data:', admin.data);
    
    // Update accept_messages to true
    admin.accept_messages = true;
    
    // Also ensure it's set in data JSON if that's being used anywhere
    const newData = admin.data || {};
    newData.accept_messages = true;
    admin.data = newData;
    
    await admin.save();
    
    console.log('Updated admin user successfully.');
    console.log('New accept_messages:', admin.accept_messages);
    
  } catch (error) {
    console.error('Error updating admin:', error);
  } finally {
    await sequelize.close();
  }
};

fixAdmin();
