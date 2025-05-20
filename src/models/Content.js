import mongoose from 'mongoose';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const generateRandomId = (length = 4) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

const contentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    contentId: {
      type: String,
      unique: true,
    },
    title: {
      type: String,
    },
    image: {
      type: String,
      required: [true, 'Image is required'],
    },
    imageSize: {
      type: Number, // File size in bytes
    },
    dimensions: {
      width: Number,
      height: Number,
    },
    category: {
      type: [String],
      default: [],
    },
    size: {
      type: String,
    },
    status: {
      type: String,
      enum: ['approved', 'rejected', 'draft'],
      default: 'draft',
    },
  },
  { timestamps: true }
);

// Helper function to get file size
const getFileSize = (filePath) => {
  try {
    // Convert relative path to absolute
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const absolutePath = path.join(__dirname, '../../', filePath);

    // Get file stats
    const stats = fs.statSync(absolutePath);
    return stats.size; // size in bytes
  } catch (error) {
    console.error('Error getting file size:', error);
    return 0;
  }
};

// Helper function to create normalized image name
const createImageName = (originalPath) => {
  const ext = path.extname(originalPath).toLowerCase();
  const timestamp = Date.now();
  return `pixel-${timestamp}${ext}`;
};

contentSchema.pre('save', async function (next) {
  // Generate contentId if not exists
  if (!this.contentId) {
    let isUnique = false;
    let newContentId;

    while (!isUnique) {
      newContentId = `IMG-${generateRandomId(4)}`;
      const existingContent = await this.constructor.findOne({ contentId: newContentId });
      if (!existingContent) {
        isUnique = true;
      }
    }

    this.contentId = newContentId;
  }

  // Calculate image size if image exists
  if (this.image && this.isModified('image')) {
    // Get file size
    this.imageSize = getFileSize(this.image);

    // Title is now set in the controller, no need to set it here

    // Set size in human-readable format (KB/MB)
    const sizeInKB = Math.round(this.imageSize / 1024);

    if (sizeInKB > 1024) {
      this.size = `${(sizeInKB / 1024).toFixed(2)} MB`;
    } else {
      this.size = `${sizeInKB} KB`;
    }
  }

  next();
});

const Content = mongoose.model('Content', contentSchema);

export default Content;