// // services/stripeService.js
// import Stripe from 'stripe';
// import User from '../models/User.js';

// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
//   apiVersion: '2022-11-15', // use your current Stripe API version
// });

// /**
//  * Create a Stripe customer if not already created,
//  * then update the user with stripeCustomerId.
//  */
// export const createOrGetCustomer = async (user) => {
//   if (user.stripeCustomerId) {
//     return user.stripeCustomerId;
//   }
//   // Create a new customer on Stripe
//   const customer = await stripe.customers.create({
//     email: user.email,
//     name: user.name,
//   });
//   user.stripeCustomerId = customer.id;
//   await user.save();
//   return customer.id;
// };

// /**
//  * Create a subscription for a user on Stripe.
//  * You must supply a price ID (which you create in your Stripe dashboard).
//  */
// export const createSubscription = async (user, priceId) => {
//   const customerId = await createOrGetCustomer(user);

//   // Create subscription on Stripe with trial period if needed
//   const subscription = await stripe.subscriptions.create({
//     customer: customerId,
//     items: [{ price: priceId }],
//     payment_behavior: 'default_incomplete', // Optionally, set up payment behavior
//     expand: ['latest_invoice.payment_intent'],
//   });

//   // Update user with subscription info
//   user.subscription = {
//     subscriptionId: subscription.id,
//     plan: priceId, // or assign custom plan name here
//     status: subscription.status,
//     currentPeriodEnd: new Date(subscription.current_period_end * 1000),
//   };
//   await user.save();

//   return subscription;
// };

// /**
//  * Optionally, handle subscription updates from Stripe webhooks.
//  */
// export const updateSubscriptionStatus = async (subscriptionId, status) => {
//   await User.findOneAndUpdate(
//     { "subscription.subscriptionId": subscriptionId },
//     { "subscription.status": status }
//   );
// };






// services/stripeService.js
import Stripe from 'stripe';
import User from '../models/User.js';

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

export const createSubscription = async (user, priceId, successUrl, cancelUrl) => {
  const customerId = await createOrGetCustomer(user);
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    customer: customerId,
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
  });
  return session;
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
