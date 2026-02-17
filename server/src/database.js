const { Sequelize } = require('sequelize');
const path = require('path');

// Use environment variable for storage path if provided (for production volumes)
const storagePath = process.env.DATABASE_STORAGE || path.join(__dirname, '..', 'database.sqlite');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: storagePath,
  logging: false
});

module.exports = sequelize;
