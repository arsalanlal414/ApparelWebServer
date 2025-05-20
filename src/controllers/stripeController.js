import Stripe from 'stripe';
import User from '../models/User.js';
import { createOrGetCustomer, createSubscription } from '../services/stripeService.js';
import Notification from '../models/Notification.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2022-11-15',
});

export const createCheckoutSession = async (req, res) => {
  try {
    const userId = req.user.id;
    const subscriptionPlan = req.body.plan; // "starter" or "premium"

    console.log("userId: ", userId);
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const priceId = {
      starter: process.env.STRIPE_PRICE_ID_STARTER,
      premium: process.env.STRIPE_PRICE_ID_PREMIUM,
    }[subscriptionPlan];

    if (!priceId) {
      return res.status(400).json({ success: false, message: "Invalid subscription plan" });
    }

    // Use your production frontend URL; fallback to localhost for development
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const successUrl = `${clientUrl}/subscription`;
    const cancelUrl = `${clientUrl}/subscription`;

    const session = await createSubscription(user, priceId, successUrl, cancelUrl);
    
    // await Notification.create({ type: 'success', title: 'New Subscription', message: 'Subscription created successfully', recipient: user._id });

    res.status(200).json({ success: true, sessionId: session.id });
  } catch (error) {
    console.error("Checkout Session Error:", error);
    res.status(500).json({ success: false, message: "Failed to create checkout session", error: error.message });
  }
};
