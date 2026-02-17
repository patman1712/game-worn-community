const { DataTypes } = require('sequelize');
const sequelize = require('../database');

const CollectionItem = sequelize.define('CollectionItem', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  owner_email: {
    type: DataTypes.STRING,
    allowNull: false
  },
  created_by: {
    type: DataTypes.STRING,
    allowNull: false
  },
  title: DataTypes.STRING,
  
  // Details
  sport_type: {
    type: DataTypes.STRING,
    defaultValue: 'ice_hockey'
  },
  type: {
    type: DataTypes.STRING, // 'puck', 'stick', 'ticket', etc.
    defaultValue: 'other'
  },
  
  // Images
  image_url: DataTypes.STRING,
  additional_images: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  
  // Status
  is_private: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  
  // Stats
  likes_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  
  // Metadata
  description: DataTypes.TEXT,
  
  // Purchase details
  purchase_price: {
    type: DataTypes.FLOAT,
    allowNull: true
  },
  invoice_url: DataTypes.STRING,
  
  data: {
    type: DataTypes.JSON,
    defaultValue: {}
  }
});

module.exports = CollectionItem;
