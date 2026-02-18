const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

// Ensure uploads directory exists
// Allow override via env var for production volumes
const uploadDir = process.env.UPLOAD_DIR || path.join(__dirname, '../../uploads');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Use memory storage to allow image processing with sharp
const storage = multer.memoryStorage();

const upload = multer({ storage: storage });

router.post('/', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  
  // Cleanup old file if requested
  const oldUrl = req.body.oldUrl;
  if (oldUrl) {
      try {
          const oldFilename = path.basename(oldUrl);
          const oldPath = path.join(uploadDir, oldFilename);
          if (fs.existsSync(oldPath)) {
              fs.unlinkSync(oldPath);
              console.log('Deleted old file:', oldFilename);
          }
      } catch (e) {
          console.error('Failed to delete old file:', e);
      }
  }
  
  try {
    // Generate unique filename with .webp extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const filename = uniqueSuffix + '.webp';
    const filepath = path.join(uploadDir, filename);

    // Process image: resize to max 1200px width/height, convert to webp, compress
    await sharp(req.file.buffer)
      .resize(1200, 1200, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .webp({ quality: 80 })
      .toFile(filepath);

    // Return the URL that the frontend can use to access the file
    const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${filename}`;
    res.json({ url: fileUrl });

  } catch (err) {
    console.error('Image processing failed, falling back to original file:', err);
    
    // Fallback: save original file if processing fails (e.g. not an image)
    try {
      const originalFilename = Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(req.file.originalname);
      const originalPath = path.join(uploadDir, originalFilename);
      fs.writeFileSync(originalPath, req.file.buffer);
      
      const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${originalFilename}`;
      res.json({ url: fileUrl });
    } catch (writeErr) {
      console.error('Failed to save original file:', writeErr);
      res.status(500).json({ error: 'Failed to upload file' });
    }
  }
});

module.exports = router;
