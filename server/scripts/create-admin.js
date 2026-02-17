const bcrypt = require('bcryptjs');
const sequelize = require('../src/database');
const User = require('../src/models/User');

const createAdmin = async () => {
  try {
    await sequelize.authenticate();
    console.log('Connection has been established successfully.');
    
    // Create tables if they don't exist
    await sequelize.sync();

    const email = 'admin@example.com';
    const password = 'admin'; // You should change this!
    
    // Check if admin already exists
    const existingAdmin = await User.findOne({ where: { email } });
    if (existingAdmin) {
      console.log('Admin user already exists.');
      process.exit(0);
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    const admin = await User.create({
      email,
      password: hashedPassword,
      role: 'admin',
      data: {
        display_name: 'Admin User',
        avatar_url: '', // Optional
      }
    });

    console.log(`Admin user created successfully!`);
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    
  } catch (error) {
    console.error('Unable to create admin user:', error);
  } finally {
    await sequelize.close();
  }
};

createAdmin();
