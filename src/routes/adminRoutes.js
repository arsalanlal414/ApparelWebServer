import express from 'express';
import { adminOnly, protect } from '../middlewares/authMiddleware.js';
import {
  disableUserByAdmin,
  updateCustomerByAdmin,
  usersList,
  customersList,
  getUserById,
  updateUserProfileByAdmin,
  changeUserPasswordByAdmin,
  updateUserPreferencesByAdmin,
  updateUserBillingByAdmin
} from '../controllers/adminController.js';
import { upload } from '../middlewares/uploadMiddleware.js';
import { contentUpload } from '../middlewares/contentUploadMiddleware.js';
import { createContent, getCotent, updateContentStatus } from '../controllers/contentController.js';

const router = express.Router();

// User listing routes
router.get('/users', protect, adminOnly, usersList);
router.get('/customers', protect, adminOnly, customersList);
router.get('/users/:userId', protect, adminOnly, getUserById);

// User management routes
router.patch('/customers/:userId', protect, adminOnly, updateCustomerByAdmin);
router.put('/users/:userId/disable', protect, adminOnly, disableUserByAdmin);
router.put('/users/:userId/profile', protect, adminOnly, upload.single('avatar'), updateUserProfileByAdmin);
router.put('/users/:userId/password', protect, adminOnly, changeUserPasswordByAdmin);
router.put('/users/:userId/preferences', protect, adminOnly, updateUserPreferencesByAdmin);
router.put('/users/:userId/billing', protect, adminOnly, updateUserBillingByAdmin);

// Content management routes
router.get('/content', protect, adminOnly, getCotent);
router.patch('/content/:contentId', protect, adminOnly, updateContentStatus);

export default router;