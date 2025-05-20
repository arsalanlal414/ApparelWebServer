// services/stripeService.js
import Stripe from 'stripe';
import User from '../models/User.js';
import Notification from '../models/Notification.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2022-11-15',
});

export const createOrGetCustomer = async (user) => {
  if (user.stripeCustomerId) {
    return user.stripeCustomerId;
  }
  const customer = await stripe.customers.create({
    email: user.email,
    name: user.name,
  });

  // Removed subscription-related code as it is unrelated to customer creation
  user.stripeCustomerId = customer.id;
  await user.save();
  return customer.id;
};

// export const createSubscription = async (user, priceId, successUrl, cancelUrl) => {
//   const customerId = await createOrGetCustomer(user);
//   const session = await stripe.checkout.sessions.create({
//     mode: 'subscription',
//     payment_method_types: ['card'],
//     customer: customerId,
//     billing_address_collection: 'required',
//     line_items: [{ price: priceId, quantity: 1 }],
//     success_url: successUrl,
//     cancel_url: cancelUrl,
//   });
//   // first it new subscription or renewed subscription then store the notification in the database
//   return session;
// };

export const createSubscription = async (user, priceId, successUrl, cancelUrl) => {
  try {
    const customerId = await createOrGetCustomer(user);

    // Check if user already has a subscription
    const isRenewal = user.subscription && user.subscription.subscriptionId;

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      customer: customerId,
      billing_address_collection: 'required',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
    });

    // Create notification based on subscription type
    await Notification.create({
      recipient: user._id,
      type: 'subscription',
      title: isRenewal ? 'Subscription Renewal' : 'New Subscription',
      message: isRenewal
        ? 'Subscription renewal process has started'
        : 'Subscription process has started',
      status: 'unread'
    });

    return session;
  } catch (error) {
    console.error('Subscription creation error:', error);
    throw new Error('Failed to create subscription');
  }
};

export const updateSubscriptionStatus = async (subscriptionId, status, customer) => {

  console.log("my customer: ", customer)
  const user = await User.findOne({ "subscription.subscriptionId": subscriptionId });

  if (!user) {
    // If no user is found with the subscriptionId, check if the customer exists
    if (customer) {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);

      // Add subscription details to the customer if they don't already have one
      await User.findOneAndUpdate(
        { stripeCustomerId: customer },
        {
          subscription: {
            subscriptionId: subscription.id,
            plan: subscription.items.data[0].price.id,
            status: subscription.status,
            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
          },
        },
        { new: true }
      );
    }
  } else {
    // Update the subscription status if the user already exists
    await User.findOneAndUpdate(
      { "subscription.subscriptionId": subscriptionId },
      { "subscription.status": status },
      { new: true }
    );
  }
};
