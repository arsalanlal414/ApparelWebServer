import express from 'express';
import { getAdminNotifications, getUserNotifications, updateNotificationStatus, updateUserNotifications } from '../controllers/notificationController.js';
import { adminOnly, protect } from '../middlewares/authMiddleware.js';

const router = express.Router();
// Route to get all notifications of a particular user
router.get('/user', protect, getUserNotifications);
router.put('/', protect, updateUserNotifications);
router.put('/:notificationId', protect, updateNotificationStatus);

// Route for admin to access all users' notifications
router.get('/', protect, adminOnly, getAdminNotifications);

export default router;