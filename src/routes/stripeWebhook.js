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

        const customer = await stripe.customers.retrieve(paymentInvoiceData.customer);
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
          billingAddress: customer.address || paymentInvoiceData.customer_address || {
            line1: '',
            line2: '',
            city: '',
            state: '',
            postal_code: '',
            country: ''
          },
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
