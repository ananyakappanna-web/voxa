const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authenticateToken } = require('../middleware/auth');

// Ensure uploads directory exists
const uploadDir = path.resolve(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer storage engine
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, 'media-' + uniqueSuffix + ext);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed.'));
    }
  }
});

// POST /api/upload
router.post('/', authenticateToken, upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      // Check if image is provided as base64 in body
      if (req.body.imageBase64) {
        const matches = req.body.imageBase64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          const ext = matches[1].split('/')[1] || 'jpg';
          const buffer = Buffer.from(matches[2], 'base64');
          const filename = `media-${Date.now()}-${Math.round(Math.random() * 1e9)}.${ext}`;
          const filePath = path.join(uploadDir, filename);
          fs.writeFileSync(filePath, buffer);
          const fileUrl = `/uploads/${filename}`;
          return res.json({ url: fileUrl });
        }
      }
      return res.status(400).json({ error: 'No image uploaded.' });
    }

    const fileUrl = `/uploads/${req.file.filename}`;
    return res.json({ url: fileUrl });
  } catch (err) {
    console.error('Upload error:', err);
    return res.status(500).json({ error: 'Failed to upload image' });
  }
});

module.exports = router;
