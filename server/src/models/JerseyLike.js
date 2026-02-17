const { DataTypes } = require('sequelize');
const sequelize = require('../database');

const JerseyLike = sequelize.define('JerseyLike', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  jersey_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  user_email: {
    type: DataTypes.STRING,
    allowNull: false
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
});

module.exports = JerseyLike;
