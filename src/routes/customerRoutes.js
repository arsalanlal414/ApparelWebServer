// routes/customerRoutes.js
import express from 'express';
import {
  updateProfile,
  changePassword,
  updatePreferences,
  updateBillingInfo,
  disableAccount,
  // removeAvatar,
  requestPasswordReset,
  profileSettings,
} from '../controllers/customerController.js';
import { upload } from '../middlewares/uploadMiddleware.js'; // Your file upload middleware
import { adminOnly, protect } from '../middlewares/authMiddleware.js'; // Your JWT auth middleware

const router = express.Router();

// All these routes require user authentication.
router.put('/profile', protect, upload.single('avatar'), updateProfile);
router.put('/disable', protect, disableAccount);
router.post('/reset', protect, requestPasswordReset);
router.put('/password', protect, changePassword);
router.put('/preferences', protect, updatePreferences);
router.put('/billing', protect, updateBillingInfo);
router.get('/profile', protect, profileSettings);

export default router;
