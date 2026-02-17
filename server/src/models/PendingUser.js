const { DataTypes } = require('sequelize');
const sequelize = require('../database');

const PendingUser = sequelize.define('PendingUser', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  data: {
    type: DataTypes.JSON,
    defaultValue: {}
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'pending' // pending, approved, rejected
  }
});

module.exports = PendingUser;
