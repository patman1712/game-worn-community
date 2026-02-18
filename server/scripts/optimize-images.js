const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// Adjust path: scripts are in server/scripts, uploads are in server/uploads
const uploadDir = process.env.UPLOAD_DIR || path.join(__dirname, '../uploads');

if (!fs.existsSync(uploadDir)) {
    console.error('Upload directory not found:', uploadDir);
    process.exit(1);
}

async function optimizeImages() {
    console.log('=================================================');
    console.log('       STARTING IMAGE OPTIMIZATION (Retroactive)  ');
    console.log('=================================================');
    console.log(`Target Directory: ${uploadDir}`);
    
    const files = fs.readdirSync(uploadDir);
    console.log(`Found ${files.length} files. Scanning...`);
    
    let processed = 0;
    let skipped = 0;
    let errors = 0;
    let totalSavedBytes = 0;

    for (const [index, file] of files.entries()) {
        const filePath = path.join(uploadDir, file);
        const ext = path.extname(file).toLowerCase();
        
        // Skip non-image files
        if (!['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) {
            continue;
        }

        try {
            const stats = fs.statSync(filePath);
            const originalSize = stats.size;
            
            // Skip files smaller than 200KB to save processing time and quality
            // Unless they are huge in dimensions
            const metadata = await sharp(filePath).metadata();
            
            const isTooLargeDimension = metadata.width > 1200 || metadata.height > 1200;
            const isTooLargeFile = originalSize > 300 * 1024; // > 300KB

            if (!isTooLargeDimension && !isTooLargeFile) {
                skipped++;
                if (index % 10 === 0) process.stdout.write('.');
                continue;
            }

            // Process image
            // Keep format (jpeg->jpeg, png->png) to preserve DB links
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
                process.stdout.write('✓');
            } else {
                skipped++;
                process.stdout.write('.');
            }

        } catch (err) {
            console.error(`\nError processing ${file}:`, err.message);
            errors++;
        }
    }

    console.log('\n\n=================================================');
    console.log('       OPTIMIZATION COMPLETE');
    console.log('=================================================');
    console.log(`Processed (Optimized): ${processed}`);
    console.log(`Skipped (Already good): ${skipped}`);
    console.log(`Errors: ${errors}`);
    console.log(`Total Space Saved: ${(totalSavedBytes / (1024 * 1024)).toFixed(2)} MB`);
    console.log('=================================================');
}

optimizeImages();
