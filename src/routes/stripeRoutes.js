import express from 'express';
import { createCheckoutSession } from '../controllers/stripeController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Protected route: the user must be authenticated
router.post('/create-subscription', protect, createCheckoutSession);

// You can also add routes for webhooks (see below for webhook handling)

export default router;
