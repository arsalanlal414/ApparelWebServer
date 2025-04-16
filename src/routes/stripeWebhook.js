// // routes/stripeWebhook.js
// import express from 'express';
// import { updateSubscriptionStatus } from '../services/stripeService.js';
// import Stripe from 'stripe';


// const router = express.Router();

// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
//   apiVersion: '2022-11-15',
// });

// // Stripe webhook secret
// const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

// router.post('/', express.raw({ type: 'application/json' }), (req, res) => {
//   const sig = req.headers['stripe-signature'];
//   let event;
//   const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET

//   try {
//     event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
//   } catch (err) {
//     console.error("Webhook signature verification failed.", err.message);
//     return res.status(400).send(`Webhook Error: ${err.message}`);
//   }

//   const data = event.data.object;

//   switch (event.type) {
//     case 'checkout.session.completed':
//       console.log("✅ Checkout session completed:", event.data);
//       // Grant access / store subscription
//       break;

//     case 'invoice.paid':
//       console.log("✅ Invoice paid:", event.data);
//       // Continue subscription, mark payment complete
//       break;

//     case 'invoice.payment_failed':
//       console.warn("❌ Invoice payment failed:", event.data);
//       // Notify user, retry logic
//       break;

//     case 'customer.subscription.updated':
//       console.log("🔄 Subscription updated:", event.data);
//       // Update plan level
//       break;

//     case 'customer.subscription.deleted':
//       console.log("🗑️ Subscription cancelled:", event.data);
//       // Revoke access
//       break;

//     case 'payment_intent.payment_failed':
//       console.warn("❌ Payment intent failed:", event.data);
//       break;

//     default:
//       console.log(`ℹ️ Unhandled event: ${event.type}`);
//   }

//   res.status(200).send("Received");
// });

// export default router;




// // routes/stripeWebhook.js
// import express from 'express';
// import Stripe from 'stripe';
// import { updateSubscriptionStatus } from '../services/stripeService.js';

// const router = express.Router();
// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2022-11-15' });
// const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

// router.post('/', express.raw({ type: 'application/json' }), async (req, res) => {
//   const sig = req.headers['stripe-signature'];
//   let event;

//   try {
//     event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
//   } catch (err) {
//     console.error("Webhook signature verification failed:", err.message);
//     return res.status(400).send(`Webhook Error: ${err.message}`);
//   }

//   const data = event.data.object;

//   switch (event.type) {
//     case 'checkout.session.completed':
//       console.log("✅ Checkout session completed:", data);
//       // Optionally update user subscription details here if you want
//       break;
//     case 'invoice.paid':
//       console.log("✅ Invoice paid:", data);
//       break;
//     case 'invoice.payment_failed':
//       console.warn("❌ Invoice payment failed:", data);
//       break;
//     case 'customer.subscription.updated':
//       console.log("🔄 Subscription updated:", data);
//       updateSubscriptionStatus(data.id, data.status);
//       break;
//     case 'customer.subscription.deleted':
//       console.log("🗑️ Subscription cancelled:", data);
//       updateSubscriptionStatus(data.id, data.status);
//       break;
//     case 'customer.subscription.updated':
//       console.log("🔄 Subscription updated:", event.data.object);
//       // Extract subscription info and update user record accordingly
//       await updateSubscriptionStatus(event.data.object.id, event.data.object.status);
//       break;
//     default:
//       console.log(`ℹ️ Unhandled event type: ${event.type}`);
//   }

//   res.status(200).send("Received");
// });

// export default router;




import express from 'express';
import Stripe from 'stripe';
import { updateSubscriptionStatus } from '../services/stripeService.js';
import Payment from '../models/Payment.js';
import User from '../models/User.js';

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2022-11-15',
});

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

router.post('/', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error("Webhook signature verification failed.", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  const data = event.data.object;

  // Process events
  switch (event.type) {
    case 'checkout.session.completed':
      console.log("✅ Checkout session completed:", event.data.object);
      // Update user subscription here if needed by retrieving session.subscription
      break;
    case 'invoice.paid':
      console.log("✅ Invoice paid:", event.data.object);

      const paymentInvoiceData = event.data.object
      const user = await User.findOne({ stripeCustomerId: paymentInvoiceData.customer });

      console.log("test user: ", user)
      if (user) {
        await Payment.create({
          user: user._id,
          stripeCustomerId: paymentInvoiceData.customer,
          paymentIntentId: paymentInvoiceData.payment_intent,
          invoiceId: paymentInvoiceData.id,
          subscriptionId: paymentInvoiceData.subscription,
          amount: paymentInvoiceData.amount_paid / 100, // Stripe stores in cents
          currency: paymentInvoiceData.currency,
          status: paymentInvoiceData.status,
          description: paymentInvoiceData.description || 'Stripe invoice payment',
          receiptUrl: paymentInvoiceData.hosted_invoice_url,
          paymentMethod: 'card', // or use: data.payment_method_types[0]
        });
      }
      break;
    case 'customer.subscription.updated':
      console.log("🔄 Subscription updated:", event.data.object);
      await updateSubscriptionStatus(event.data.object.id, event.data.object.status, event.data.object.customer);
      break;
    case 'customer.subscription.deleted':
      console.log("🗑️ Subscription cancelled:", event.data.object);
      await updateSubscriptionStatus(event.data.object.id, event.data.object.status, );
      break;

    case 'invoice.payment_failed':
      console.log("❌ Invoice payment failed:", event.data.object);

      const data = event.data.object

      const failedUser = await User.findOne({ stripeCustomerId: data.customer });
      if (failedUser) {
        await Payment.create({
          user: failedUser._id,
          stripeCustomerId: data.customer,
          invoiceId: data.id,
          subscriptionId: data.subscription,
          amount: data.amount_due / 100,
          currency: data.currency,
          status: 'failed',
          description: data.description || 'Stripe payment failed',
          paymentMethod: 'card',
        });
      }
      break;
    // Handle other events as needed
    default:
      console.log(`ℹ️ Unhandled event type: ${event.type}`);
  }

  res.status(200).send("Received");
});

export default router;
