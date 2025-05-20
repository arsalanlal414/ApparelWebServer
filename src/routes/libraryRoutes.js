import express from 'express';
import { adminOnly, protect } from '../middlewares/authMiddleware.js';
import { upload } from '../middlewares/uploadlibraryMiddleware.js';
import { createLibrary, getLibraryItems } from '../controllers/libraryController.js';

const router = express.Router();

router.post(
  '/create',
  protect,
  adminOnly,
  upload.array('images', 4),
  createLibrary
);

router.get('/', protect, getLibraryItems);

export default router;