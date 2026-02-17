const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const archiver = require('archiver');
const User = require('../models/User');

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
    const possibleDbPaths = [
        path.join(__dirname, '../../database.sqlite'), // server root
        path.join(__dirname, '../../../database.sqlite'), // project root (local dev)
        path.join(process.cwd(), 'database.sqlite'), // current working directory
        path.join(process.cwd(), 'server/database.sqlite') // inside server dir
    ];

    let dbAdded = false;
    for (const dbPath of possibleDbPaths) {
        if (fs.existsSync(dbPath)) {
            console.log('Adding DB from:', dbPath);
            archive.file(dbPath, { name: 'database.sqlite' });
            dbAdded = true;
            break;
        }
    }
    
    if (!dbAdded) {
        console.warn('WARNING: database.sqlite not found in any standard location!');
        // Create a dummy file to warn user inside the zip
        archive.append('WARNING: database.sqlite could not be found during backup.', { name: 'DB_MISSING_WARNING.txt' });
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