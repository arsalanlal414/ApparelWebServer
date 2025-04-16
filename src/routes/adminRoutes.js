import express from 'express';
import { adminOnly, protect } from '../middlewares/authMiddleware.js';
import { disableUserByAdmin, updateCustomerByAdmin, usersList } from '../controllers/adminController.js';

const router = express.Router();

router.get('/users', protect, adminOnly, usersList);
router.patch('/customers/:userId', protect, adminOnly, updateCustomerByAdmin);
router.put('/customers/:userId', protect, adminOnly, disableUserByAdmin);

export default router;  