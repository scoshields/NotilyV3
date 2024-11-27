import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: any, res: any) {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return res.status(400).send('Webhook signature verification failed');
  }

  try {
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionChange(subscription);
        break;

      case 'customer.subscription.deleted':
        const deletedSubscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeletion(deletedSubscription);
        break;

      case 'invoice.payment_succeeded':
        const invoice = event.data.object as Stripe.Invoice;
        await handleSuccessfulPayment(invoice);
        break;

      case 'invoice.payment_failed':
        const failedInvoice = event.data.object as Stripe.Invoice;
        await handleFailedPayment(failedInvoice);
        break;
    }

    res.json({ received: true });
  } catch (err) {
    console.error('Error processing webhook:', err);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
}

async function handleSubscriptionChange(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;
  const { data: user } = await supabase
    .from('users')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single();

  if (!user) {
    console.error('User not found for customer:', customerId);
    return;
  }

  await supabase
    .from('subscriptions')
    .upsert({
      user_id: user.id,
      stripe_subscription_id: subscription.id,
      status: subscription.status,
      current_period_start: new Date(subscription.current_period_start * 1000),
      current_period_end: new Date(subscription.current_period_end * 1000),
      cancel_at_period_end: subscription.cancel_at_period_end,
    });
}

async function handleSubscriptionDeletion(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;
  const { data: user } = await supabase
    .from('users')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single();

  if (!user) {
    console.error('User not found for customer:', customerId);
    return;
  }

  await supabase
    .from('subscriptions')
    .update({ status: 'canceled' })
    .eq('stripe_subscription_id', subscription.id);
}

async function handleSuccessfulPayment(invoice: Stripe.Invoice) {
  if (!invoice.subscription) return;

  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('user_id')
    .eq('stripe_subscription_id', invoice.subscription)
    .single();

  if (!subscription) {
    console.error('Subscription not found:', invoice.subscription);
    return;
  }

  await supabase.from('payments').insert({
    user_id: subscription.user_id,
    subscription_id: subscription.id,
    stripe_payment_id: invoice.payment_intent as string,
    amount: invoice.amount_paid / 100,
    currency: invoice.currency,
    status: 'succeeded',
  });
}

async function handleFailedPayment(invoice: Stripe.Invoice) {
  if (!invoice.subscription) return;

  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('user_id')
    .eq('stripe_subscription_id', invoice.subscription)
    .single();

  if (!subscription) {
    console.error('Subscription not found:', invoice.subscription);
    return;
  }

  await supabase.from('payments').insert({
    user_id: subscription.user_id,
    subscription_id: subscription.id,
    stripe_payment_id: invoice.payment_intent as string,
    amount: invoice.amount_due / 100,
    currency: invoice.currency,
    status: 'failed',
  });

  await supabase
    .from('subscriptions')
    .update({ status: 'past_due' })
    .eq('stripe_subscription_id', invoice.subscription);
}