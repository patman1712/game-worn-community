const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const archiver = require('archiver');
const sharp = require('sharp');
const User = require('../models/User');
const SystemSetting = require('../models/SystemSetting');

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

// --- Resend Settings ---

// Get Resend Settings
router.get('/settings/resend', requireAdmin, async (req, res) => {
    try {
        const setting = await SystemSetting.findByPk('resend_config');
        res.json(setting ? setting.value : {});
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update Resend Settings
router.post('/settings/resend', requireAdmin, async (req, res) => {
    try {
        const config = req.body;
        if (!config.apiKey) return res.status(400).json({ error: 'API Key required' });
        
        let setting = await SystemSetting.findByPk('resend_config');
        if (setting) {
            setting.value = config;
            setting.changed('value', true);
            await setting.save();
        } else {
            await SystemSetting.create({ key: 'resend_config', value: config });
        }
        res.json({ message: 'Resend Settings saved' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Test Resend
router.post('/settings/resend/test', requireAdmin, async (req, res) => {
    try {
        const { config, to } = req.body;
        const { Resend } = require('resend'); // Import here to ensure it's available
        const resend = new Resend(config.apiKey);
        
        const data = await resend.emails.send({
            from: config.from || 'onboarding@resend.dev',
            to: to || req.adminUser.email,
            subject: 'Test Email (Resend)',
            text: 'Resend API works!'
        });
        
        if (data.error) throw new Error(data.error.message);
        
        res.json({ message: 'Test Email sent successfully', details: JSON.stringify(data) });
    } catch (error) {
        res.status(400).json({ error: error.message });
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

// Manual Image Optimization Trigger
router.post('/optimize-images', requireAdmin, async (req, res) => {
    try {
        const uploadDir = process.env.UPLOAD_DIR || path.join(__dirname, '../../uploads');
        
        if (!fs.existsSync(uploadDir)) {
            return res.status(404).json({ error: 'Upload directory not found' });
        }

        const files = fs.readdirSync(uploadDir);
        let processed = 0;
        let skipped = 0;
        let errors = 0;
        let totalSavedBytes = 0;

        // Process in chunks to avoid blocking event loop too long
        // But for this simple implementation, we'll just loop
        for (const file of files) {
            const filePath = path.join(uploadDir, file);
            const ext = path.extname(file).toLowerCase();
            
            // Skip non-image files
            if (!['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) {
                continue;
            }

            try {
                const stats = fs.statSync(filePath);
                const originalSize = stats.size;
                
                // Skip files smaller than 300KB unless dimensions are huge
                // We use sharp metadata which is fast
                const metadata = await sharp(filePath).metadata();
                
                const isTooLargeDimension = metadata.width > 1200 || metadata.height > 1200;
                const isTooLargeFile = originalSize > 300 * 1024; // > 300KB

                if (!isTooLargeDimension && !isTooLargeFile) {
                    skipped++;
                    continue;
                }

                // Process image
                let pipeline = sharp(filePath)
                    .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true });

                if (ext === '.jpg' || ext === '.jpeg') {
                    pipeline = pipeline.jpeg({ quality: 80, mozjpeg: true });
                } else if (ext === '.png') {
                    pipeline = pipeline.png({ quality: 80, compressionLevel: 8 });
                } else if (ext === '.webp') {
                    pipeline = pipeline.webp({ quality: 80 });
                }

                const buffer = await pipeline.toBuffer();
                
                // Only overwrite if we actually saved space
                if (buffer.length < originalSize) {
                    fs.writeFileSync(filePath, buffer);
                    processed++;
                    totalSavedBytes += (originalSize - buffer.length);
                } else {
                    skipped++;
                }

            } catch (err) {
                console.error(`Error processing ${file}:`, err.message);
                errors++;
            }
        }

        res.json({
            success: true,
            message: 'Optimization complete',
            details: {
                processed,
                skipped,
                errors,
                savedMB: (totalSavedBytes / (1024 * 1024)).toFixed(2)
            }
        });

    } catch (error) {
        console.error('Optimization failed:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;