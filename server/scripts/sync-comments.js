
const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');

// Setup Sequelize
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, '../database.sqlite'),
  logging: false
});

// Define Models
const User = sequelize.define('User', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  email: { type: DataTypes.STRING, allowNull: false, unique: true },
  data: { type: DataTypes.JSON, defaultValue: {} }
});

const Comment = sequelize.define('Comment', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  user_email: { type: DataTypes.STRING, allowNull: false },
  user_name: { type: DataTypes.STRING, allowNull: false },
  comment: { type: DataTypes.TEXT, allowNull: false }
});

async function syncComments() {
  try {
    console.log('Syncing comment names...');
    
    const users = await User.findAll();
    console.log(`Found ${users.length} users.`);
    
    for (const user of users) {
      const userData = user.data || {};
      // Check for display_name in various places
      let displayName = userData.display_name;
      
      // Fallback if no display_name
      if (!displayName) {
          displayName = userData.name || user.email.split('@')[0];
      }
      
      if (displayName) {
        console.log(`Updating comments for ${user.email} to "${displayName}"...`);
        
        const [updatedCount] = await Comment.update(
          { user_name: displayName },
          { where: { user_email: user.email } }
        );
        
        if (updatedCount > 0) {
            console.log(`  -> Updated ${updatedCount} comments.`);
        }
      }
    }
    
    console.log('Done.');
  } catch (error) {
    console.error('Error:', error);
  }
}

syncComments();
