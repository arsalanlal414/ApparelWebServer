// // controllers/stripeController.js
// import Stripe from 'stripe';
// import User from '../models/User.js';

// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
//   apiVersion: '2022-11-15', // use the current Stripe API version
// });

// export const createCheckoutSession = async (req, res) => {
//   try {
//     const userId = req.user.id;
//     const subscriptionPlan = req.body.plan;
//     const user = await User.findById(userId);
//     if (!user) {
//       return res.status(404).json({ success: false, msg: "User not found" });
//     }

//     // Determine the price ID based on the plan:
//     const priceId = {
//       starter: process.env.STRIPE_PRICE_ID_STARTER,
//       premium: process.env.STRIPE_PRICE_ID_PREMIUM,
//     }[subscriptionPlan];

//     console.log({myPriceId: priceId});

//     if (!priceId) {
//       return res.status(400).json({ success: false, msg: "Invalid subscription plan" });
//     }

//     // Ensure the client URL is set properly, with fallback to localhost:
//     const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
//     const successUrl = `${clientUrl}/create`;
//     const cancelUrl = `${clientUrl}/create`;

//     // Create (or reuse) the Stripe customer
//     let customerId = user.stripeCustomerId;
//     if (!customerId) {
//       const customer = await stripe.customers.create({
//         email: user.email,
//         name: user.name,
//       });
//       customerId = customer.id;
//       user.stripeCustomerId = customerId;
//       await user.save();
//     }

//     // Create a Stripe Checkout Session for subscription mode:
//     const session = await stripe.checkout.sessions.create({
//       mode: 'subscription',
//       payment_method_types: ['card'],
//       customer: customerId,
//       line_items: [
//         {
//           price: priceId,
//           quantity: 1,
//         },
//       ],
//       success_url: successUrl,
//       cancel_url: cancelUrl,
//     });

//     res.status(200).json({ sessionId: session.id });
//   } catch (error) {
//     console.error("Checkout Session Error:", error);
//     res.status(500).json({ msg: "Failed to create checkout session", error: error.message });
//   }
// };



// updated

// controllers/stripeController.js
import Stripe from 'stripe';
import User from '../models/User.js';
import { createOrGetCustomer, createSubscription } from '../services/stripeService.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2022-11-15',
});

export const createCheckoutSession = async (req, res) => {
  try {
    const userId = req.user.id;
    const subscriptionPlan = req.body.plan; // "starter" or "premium"
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, msg: "User not found" });

    const priceId = {
      starter: process.env.STRIPE_PRICE_ID_STARTER,
      premium: process.env.STRIPE_PRICE_ID_PREMIUM,
    }[subscriptionPlan];

    if (!priceId) {
      return res.status(400).json({ success: false, msg: "Invalid subscription plan" });
    }

    // Use your production frontend URL; fallback to localhost for development
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const successUrl = `${clientUrl}/subscription`;
    const cancelUrl = `${clientUrl}/subscription`;

    const session = await createSubscription(user, priceId, successUrl, cancelUrl);

    res.status(200).json({ success: true, sessionId: session.id });
  } catch (error) {
    console.error("Checkout Session Error:", error);
    res.status(500).json({ success: false, msg: "Failed to create checkout session", error: error.message });
  }
};
