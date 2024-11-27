import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

export const createStripeCustomer = async (email: string, userId: string) => {
  const customer = await stripe.customers.create({
    email,
    metadata: {
      supabase_user_id: userId,
    },
  });
  return customer;
};

export const createStripeSubscription = async (customerId: string, priceId: string) => {
  const subscription = await stripe.subscriptions.create({
    customer: customerId,
    items: [{ price: priceId }],
    payment_behavior: 'default_incomplete',
    payment_settings: { save_default_payment_method: 'on_subscription' },
    expand: ['latest_invoice.payment_intent'],
  });
  return subscription;
};

export const cancelStripeSubscription = async (subscriptionId: string) => {
  const subscription = await stripe.subscriptions.cancel(subscriptionId);
  return subscription;
};

export const getStripeSubscription = async (subscriptionId: string) => {
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  return subscription;
};

export const updateStripeSubscription = async (subscriptionId: string, updates: Stripe.SubscriptionUpdateParams) => {
  const subscription = await stripe.subscriptions.update(subscriptionId, updates);
  return subscription;
};