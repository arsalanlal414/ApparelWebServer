import express from 'express';
import { protect } from '../middlewares/authMiddleware.js';
import { getPayments } from '../controllers/paymentController.js';

const router = express.Router();

router.get('/', protect, getPayments);

export default router;