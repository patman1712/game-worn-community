const { DataTypes } = require('sequelize');
const sequelize = require('../database');

const SiteContent = sequelize.define('SiteContent', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  content_type: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true // 'impressum', 'agb', etc.
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  data: {
    type: DataTypes.JSON,
    defaultValue: {}
  }
});

module.exports = SiteContent;