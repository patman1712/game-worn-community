const { DataTypes } = require('sequelize');
const sequelize = require('../database');

const SystemSetting = sequelize.define('SystemSetting', {
  key: {
    type: DataTypes.STRING,
    primaryKey: true
  },
  value: {
    type: DataTypes.JSON,
    allowNull: false
  }
});

module.exports = SystemSetting;