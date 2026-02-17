const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { Resend } = require('resend');
const User = require('../models/User');
const PendingUser = require('../models/PendingUser');
const SystemSetting = require('../models/SystemSetting'); // Import SystemSetting

const Jersey = require('../models/Jersey');
const CollectionItem = require('../models/CollectionItem');
const Message = require('../models/Message');
const Comment = require('../models/Comment');
const JerseyLike = require('../models/JerseyLike'); // Added missing import

const JWT_SECRET = 'your-secret-key-change-this-in-production';

// Helper to send email
const sendEmail = async (to, subject, text) => {
    // 1. Load Settings from DB
    let resendConfig = null;
    try {
        const resendSetting = await SystemSetting.findByPk('resend_config');
        if (resendSetting && resendSetting.value) {
            resendConfig = resendSetting.value;
        }
    } catch (e) {
        console.error('Failed to load settings from DB:', e);
    }
    
    // 2. Try Resend API (HTTP based, bypasses SMTP blocking)
    if (resendConfig && resendConfig.apiKey) {
        try {
            const resend = new Resend(resendConfig.apiKey);
            const fromEmail = resendConfig.from || 'onboarding@resend.dev';
            
            const data = await resend.emails.send({
                from: fromEmail,
                to,
                subject,
                text
            });
            
            if (data.error) {
                console.error('Resend API Error:', data.error);
                throw new Error(data.error.message);
            }
            
            console.log(`Email sent via Resend to ${to}`, data);
            return;
        } catch (error) {
            console.error('Resend failed:', error);
        }
    }
    
    // 3. Fallback: Just log if no config
    console.log('---------------------------------------------------');
    console.log(`[Mock Email - No Config] To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body: ${text}`);
    console.log('---------------------------------------------------');
};

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
      return res.status(401).json({ error: 'Email Adresse oder Passwort falsch' });
    }

    // Check if user is blocked - Robust JSON handling
    let userData = user.data;
    if (typeof userData === 'string') {
        try {
            userData = JSON.parse(userData);
        } catch (e) {
            console.error('Error parsing user data for blocked check:', e);
            userData = {};
        }
    }

    if (userData && userData.is_blocked) {
      return res.status(403).json({ error: 'Ihr Account wurde gesperrt.' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Email Adresse oder Passwort falsch' });
    }

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET);
    
    res.json({ token, user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Forgot Password
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ where: { email } });
        
        if (!user) {
            return res.json({ message: 'Falls ein Konto mit dieser E-Mail existiert, wurde ein Link zum Zurücksetzen gesendet.' });
        }
        
        // Generate Token
        const token = crypto.randomBytes(32).toString('hex');
        const expires = Date.now() + 3600000; // 1 hour
        
        // Save to User data
        let currentData = user.data || {};
        if (typeof currentData === 'string') {
            try { currentData = JSON.parse(currentData); } catch(e) { currentData = {}; }
        }
        
        user.data = {
            ...currentData,
            reset_token: token,
            reset_token_expires: expires
        };
        user.changed('data', true);
        await user.save();
        
        // Send Email
        const resetLink = `${req.headers.origin || 'https://www.game-worn-community.de'}/reset-password?token=${token}`;
        
        await sendEmail(
            email,
            'Passwort zurücksetzen - Game-Worn Community',
            `Hallo,\n\nDu hast angefordert, dein Passwort zurückzusetzen.\nBitte klicke auf den folgenden Link:\n\n${resetLink}\n\nDieser Link ist 1 Stunde gültig.\n\nFalls du dies nicht angefordert hast, ignoriere diese Email.`
        );
        
        res.json({ message: 'Falls ein Konto mit dieser E-Mail existiert, wurde ein Link zum Zurücksetzen gesendet.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Reset Password
router.post('/reset-password', async (req, res) => {
    try {
        const { token, newPassword } = req.body;
        
        // Find user with token
        // Since we store it in JSON, we iterate (low user count assumed)
        const users = await User.findAll();
        const user = users.find(u => {
            let d = u.data || {};
            if (typeof d === 'string') { try { d = JSON.parse(d); } catch(e) { d = {}; } }
            return d.reset_token === token && d.reset_token_expires > Date.now();
        });
        
        if (!user) {
            return res.status(400).json({ error: 'Ungültiger oder abgelaufener Link.' });
        }
        
        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        
        // Update user
        let currentData = user.data || {};
        if (typeof currentData === 'string') { try { currentData = JSON.parse(currentData); } catch(e) { currentData = {}; } }
        
        // Remove token
        delete currentData.reset_token;
        delete currentData.reset_token_expires;
        
        user.password = hashedPassword;
        user.data = currentData;
        user.changed('data', true);
        await user.save();
        
        res.json({ message: 'Passwort erfolgreich geändert. Du kannst dich jetzt einloggen.' });
        
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
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
    
    // Check if user is blocked - Robust JSON handling
    let userData = user.data;
    if (typeof userData === 'string') {
        try {
            userData = JSON.parse(userData);
        } catch (e) {
            userData = {};
        }
    }
    
    if (userData && userData.is_blocked) {
      return res.status(403).json({ error: 'Ihr Account wurde gesperrt.' });
    }
    
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
    }
    
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Change Password
router.post('/change-password', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token provided' });

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findByPk(decoded.id);
    
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: 'Missing fields' });
    }

    // Verify current password
    const validPassword = await bcrypt.compare(currentPassword, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid current password' });
    }

    // Set new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    res.json({ message: 'Password updated successfully' });
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
      
      let currentData = targetUser.data || {};
      if (typeof currentData === 'string') {
          try { currentData = JSON.parse(currentData); } catch(e) { currentData = {}; }
      }
      
      targetUser.data = { ...currentData, is_blocked: true };
      targetUser.changed('data', true); // Force update
      await targetUser.save();
      return res.json({ message: 'User blocked', user: targetUser });
    }
    
    if (action === 'unblock') {
      const targetUser = await User.findByPk(userId);
      if (!targetUser) return res.status(404).json({ error: 'User not found' });
      
      let currentData = targetUser.data || {};
      if (typeof currentData === 'string') {
          try { currentData = JSON.parse(currentData); } catch(e) { currentData = {}; }
      }
      
      targetUser.data = { ...currentData, is_blocked: false };
      targetUser.changed('data', true); // Force update
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
