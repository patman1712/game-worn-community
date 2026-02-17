const { DataTypes } = require('sequelize');
const sequelize = require('../database');

const Message = sequelize.define('Message', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  sender_email: {
    type: DataTypes.STRING,
    allowNull: false
  },
  receiver_email: {
    type: DataTypes.STRING,
    allowNull: false
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  conversation_id: {
    type: DataTypes.STRING,
    allowNull: false
  },
  read: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  type: {
    type: DataTypes.STRING, // 'text', 'image', etc.
    defaultValue: 'text'
  },
  data: {
    type: DataTypes.JSON,
    defaultValue: {}
  }
});

module.exports = Message;
