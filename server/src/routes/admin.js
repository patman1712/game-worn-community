const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const archiver = require('archiver');
const User = require('../models/User');
const SystemSetting = require('../models/SystemSetting');
const nodemailer = require('nodemailer');

const JWT_SECRET = 'your-secret-key-change-this-in-production';

// Middleware to check for Admin
const requireAdmin = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token provided' });
    
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findByPk(decoded.id);
    
    if (!user || (user.role !== 'admin' && user.data?.role !== 'admin')) {
      return res.status(403).json({ error: 'Unauthorized: Admins only' });
    }
    
    req.adminUser = user;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// --- SMTP Settings ---

// Get SMTP Settings
router.get('/settings/smtp', requireAdmin, async (req, res) => {
    try {
        const setting = await SystemSetting.findByPk('smtp_config');
        res.json(setting ? setting.value : {});
    } catch (error) {
        console.error('Error fetching SMTP settings:', error);
        res.status(500).json({ error: error.message });
    }
});

// Update SMTP Settings
router.post('/settings/smtp', requireAdmin, async (req, res) => {
    try {
        const config = req.body;
        
        // Basic validation
        if (!config.host || !config.user) {
             return res.status(400).json({ error: 'Host and User are required' });
        }
        
        let setting = await SystemSetting.findByPk('smtp_config');
        if (setting) {
            setting.value = config;
            setting.changed('value', true); // Force update because JSON
            await setting.save();
        } else {
            await SystemSetting.create({
                key: 'smtp_config',
                value: config
            });
        }
        
        res.json({ message: 'Settings saved' });
    } catch (error) {
        console.error('Error saving SMTP settings:', error);
        res.status(500).json({ error: error.message });
    }
});

// Test Email
router.post('/settings/smtp/test', requireAdmin, async (req, res) => {
    try {
        const { config, to } = req.body;
        
        // Use provided config for test
        const transporter = nodemailer.createTransport({
            host: config.host,
            port: config.port || 587,
            secure: config.secure === true, // Check if boolean true
            auth: {
                user: config.user,
                pass: config.pass,
            },
        });
        
        await transporter.verify();
        
        const info = await transporter.sendMail({
            from: config.from || config.user,
            to: to || req.adminUser.email,
            subject: 'Test Email - Game-Worn Community',
            text: 'Dies ist eine Test-Email. Deine SMTP Einstellungen funktionieren!',
        });
        
        res.json({ 
            message: 'Test Email sent successfully', 
            details: `MessageID: ${info.messageId}, Response: ${info.response}`
        });
    } catch (error) {
        console.error('SMTP Test Failed:', error);
        res.status(400).json({ error: 'SMTP Test Failed: ' + error.message });
    }
});

// Full System Backup
router.get('/backup/full', requireAdmin, async (req, res) => {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `backup-full-${timestamp}.zip`;

    // Set headers for download
    res.attachment(filename);

    const archive = archiver('zip', {
      zlib: { level: 9 } // Sets the compression level.
    });

    // Listen for all archive data to be written
    // 'close' event is fired only when a file descriptor is involved
    res.on('close', function() {
      console.log(archive.pointer() + ' total bytes');
      console.log('archiver has been finalized and the output file descriptor has closed.');
    });

    // This event is fired when the data source is drained no matter what was the data source.
    // It is not part of this library but rather from the NodeJS Stream API.
    // @see: https://nodejs.org/api/stream.html#stream_event_end
    res.on('end', function() {
      console.log('Data has been drained');
    });

    // warnings are java.lang.Exception
    archive.on('warning', function(err) {
      if (err.code === 'ENOENT') {
        // log warning
        console.warn('Backup warning:', err);
      } else {
        // throw error
        throw err;
      }
    });

    // good practice to catch this error explicitly
    archive.on('error', function(err) {
      console.error('Backup error:', err);
      res.status(500).send({error: err.message});
    });

    // pipe archive data to the response
    archive.pipe(res);

    // 1. Add Database - Try multiple locations
    const storagePath = process.env.DATABASE_STORAGE || path.join(__dirname, '../../database.sqlite');
    
    const possibleDbPaths = [
        storagePath, // The actual configured path
        path.join(__dirname, '../../database.sqlite'), // server root
        path.join(__dirname, '../../../database.sqlite'), // project root (local dev)
        path.join(process.cwd(), 'database.sqlite'), // current working directory
        path.join(process.cwd(), 'server/database.sqlite'), // inside server dir
        '/app/database.sqlite', // common docker path
        '/data/database.sqlite' // common volume path
    ];

    let dbAdded = false;
    // Use Set to avoid duplicates
    const uniquePaths = [...new Set(possibleDbPaths)];
    
    for (const dbPath of uniquePaths) {
        // Resolve to absolute path
        const absolutePath = path.resolve(dbPath);
        if (fs.existsSync(absolutePath)) {
            console.log('Adding DB from:', absolutePath);
            archive.file(absolutePath, { name: 'database.sqlite' });
            dbAdded = true;
            break;
        }
    }
    
    if (!dbAdded) {
        console.warn('WARNING: database.sqlite not found in any standard location!');
        // Debug info: List where we looked
        const debugInfo = `Could not find database.sqlite.\nLooked in:\n${uniquePaths.map(p => path.resolve(p)).join('\n')}\n\nCurrent CWD: ${process.cwd()}\nDATABASE_STORAGE env: ${process.env.DATABASE_STORAGE}`;
        archive.append(debugInfo, { name: 'DB_MISSING_DEBUG.txt' });
    }

    // 2. Add Uploads
    // Use env var or default path, same as index.js
    const uploadDir = process.env.UPLOAD_DIR || path.join(__dirname, '../../uploads');
    if (fs.existsSync(uploadDir)) {
      archive.directory(uploadDir, 'uploads');
    }

    // Finalize the archive (ie we are done appending files but streams have to finish yet)
    // 'close', 'end' or 'finish' may be fired right after calling this method so register to them beforehand
    await archive.finalize();

  } catch (error) {
    console.error('Backup request failed:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: error.message });
    }
  }
});

module.exports = router;