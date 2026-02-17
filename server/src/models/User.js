const { DataTypes } = require('sequelize');
const sequelize = require('../database');

const User = sequelize.define('User', {
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
  role: {
    type: DataTypes.STRING,
    defaultValue: 'user' // 'user' or 'admin'
  },
  // Store additional profile data as JSON
  data: {
    type: DataTypes.JSON,
    defaultValue: {}
  },
  hidden_sports: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  accept_messages: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
});

module.exports = User;
