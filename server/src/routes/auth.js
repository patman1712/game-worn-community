const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const PendingUser = require('../models/PendingUser');

const Jersey = require('../models/Jersey');
const CollectionItem = require('../models/CollectionItem');
const Message = require('../models/Message');
const Comment = require('../models/Comment');

const JWT_SECRET = 'your-secret-key-change-this-in-production';

// Register
router.post('/register', async (req, res) => {
  try {
    const { email, password, data } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Check if pending user exists
    const existingPending = await PendingUser.findOne({ where: { email } });
    if (existingPending) {
      return res.status(400).json({ error: 'Registration already pending' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create pending user
    const pendingUser = await PendingUser.create({
      email,
      password: hashedPassword,
      data: data || {}
    });

    res.status(201).json({ message: 'Registration pending approval', pendingUser });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET);
    
    res.json({ token, user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get Current User
router.get('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token provided' });

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findByPk(decoded.id);
    
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    res.json(user);
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

// Update Current User
router.patch('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token provided' });

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findByPk(decoded.id);
    
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    const { 
      display_name, 
      real_name, 
      location, 
      show_email, 
      show_location, 
      accept_messages, 
      hidden_sports 
    } = req.body;

    const currentData = user.data || {};
    const newData = {
      ...currentData,
    };

    if (display_name !== undefined) newData.display_name = display_name;
    if (real_name !== undefined) newData.real_name = real_name;
    if (location !== undefined) newData.location = location;
    if (show_email !== undefined) newData.show_email = show_email;
    if (show_location !== undefined) newData.show_location = show_location;
    if (hidden_sports !== undefined) user.hidden_sports = hidden_sports;
    if (accept_messages !== undefined) user.accept_messages = accept_messages;
    
    user.data = newData;
    await user.save();

    // If display_name changed, update it in all related entities
    if (display_name && display_name !== currentData.display_name) {
        const email = user.email;
        
        // Update Comments (they store user_name)
        await Comment.update(
            { user_name: display_name },
            { where: { user_email: email } }
        );
        
        // Note: Jerseys store owner_email, and created_by is also usually email.
        // The display name is mostly fetched dynamically via user.data.display_name in frontend.
        // However, if we store owner_name anywhere in Jersey.data, we should update it.
        // Since we don't have easy JSON path updates in all SQL dialects via Sequelize easily without raw queries,
        // and our frontend fetches the latest User profile anyway to display the name, 
        // updating Comments is the most critical part where the name is static.
    }
    
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin: Approve User
router.post('/approve', async (req, res) => {
  try {
    const { pendingUserId } = req.body;
    const pendingUser = await PendingUser.findByPk(pendingUserId);
    
    if (!pendingUser) return res.status(404).json({ error: 'Pending user not found' });
    
    // Create real user
    const user = await User.create({
      email: pendingUser.email,
      password: pendingUser.password,
      data: pendingUser.data
    });
    
    // Remove pending user
    await pendingUser.destroy();
    
    res.json({ message: 'User approved', user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// Admin: Manage User (Update/Block/Delete)
router.post('/manage-user', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token provided' });
    
    const decoded = jwt.verify(token, JWT_SECRET);
    // Check role in token OR fetch user to be sure
    const adminUser = await User.findByPk(decoded.id);
    if (!adminUser || (adminUser.role !== 'admin' && adminUser.data?.role !== 'admin')) {
        return res.status(403).json({ error: 'Unauthorized' });
    }
    
    const { action, userId, updates } = req.body;
    if (action === 'delete') {
      const targetUser = await User.findByPk(userId);
      if (!targetUser) return res.status(404).json({ error: 'User not found' });
      
      const email = targetUser.email;
      
      // 1. Delete Jerseys
      await Jersey.destroy({ where: { owner_email: email } });
      await Jersey.destroy({ where: { created_by: email } });
      
      // 2. Delete CollectionItems
      await CollectionItem.destroy({ where: { owner_email: email } });
      await CollectionItem.destroy({ where: { created_by: email } });
      
      // 3. Delete Messages (Sent & Received)
      await Message.destroy({ where: { sender_email: email } });
      await Message.destroy({ where: { receiver_email: email } });
      
      // 4. Delete Likes
      await JerseyLike.destroy({ where: { user_email: email } });
      
      // 5. Delete User
      await targetUser.destroy();
      
      return res.json({ message: 'User and all related data deleted' });
    }
    
    if (action === 'block') {
      const targetUser = await User.findByPk(userId);
      if (!targetUser) return res.status(404).json({ error: 'User not found' });
      const currentData = targetUser.data || {};
      targetUser.data = { ...currentData, is_blocked: true };
      await targetUser.save();
      return res.json({ message: 'User blocked', user: targetUser });
    }
    
    if (action === 'unblock') {
      const targetUser = await User.findByPk(userId);
      if (!targetUser) return res.status(404).json({ error: 'User not found' });
      const currentData = targetUser.data || {};
      targetUser.data = { ...currentData, is_blocked: false };
      await targetUser.save();
      return res.json({ message: 'User unblocked', user: targetUser });
    }
    
    if (action === 'update') {
      const targetUser = await User.findByPk(userId);
      if (!targetUser) return res.status(404).json({ error: 'User not found' });
      const currentData = targetUser.data || {};
      
      // Update top-level fields if provided
      if (updates.role) targetUser.role = updates.role;
      if (updates.accept_messages !== undefined) targetUser.accept_messages = updates.accept_messages;
      
      // Update data JSON
      targetUser.data = {
        ...currentData,
        ...updates
      };
      
      await targetUser.save();
      return res.json({ message: 'User updated', user: targetUser });
    }
    
    res.status(400).json({ error: 'Invalid action' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
