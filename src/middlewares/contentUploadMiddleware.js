import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Define storage strategy for content uploads
const contentStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/content';
    fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    const timestamp = Date.now();
    const filename = `pixel-${timestamp}${ext}`;

    req.generatedFilename = filename;

    cb(null, filename);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPEG/PNG images are allowed'), false);
  }
};

export const contentUpload = multer({
  storage: contentStorage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB limit
});