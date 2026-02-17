const { DataTypes } = require('sequelize');
const sequelize = require('../database');

const Jersey = sequelize.define('Jersey', {
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
  // Basic Info
  title: DataTypes.STRING,
  team: DataTypes.STRING,
  league: DataTypes.STRING,
  season: DataTypes.STRING,
  player_name: DataTypes.STRING,
  number: DataTypes.STRING,
  
  // Details
  sport_type: {
    type: DataTypes.STRING,
    defaultValue: 'ice_hockey'
  },
  product_type: {
    type: DataTypes.STRING,
    defaultValue: 'jersey'
  },
  
  // Images
  image_url: DataTypes.STRING, // Main image
  additional_images: {
    type: DataTypes.JSON, // Array of URLs
    defaultValue: []
  },
  
  // Status
  is_game_worn: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  is_for_sale: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
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
  brand: DataTypes.STRING,
  size: DataTypes.STRING,
  color: DataTypes.STRING,

  // Purchase details
  purchase_price: {
    type: DataTypes.FLOAT,
    allowNull: true
  },
  invoice_url: DataTypes.STRING,
  
  // Flexible data field for anything else
  data: {
    type: DataTypes.JSON,
    defaultValue: {}
  }
});

module.exports = Jersey;
