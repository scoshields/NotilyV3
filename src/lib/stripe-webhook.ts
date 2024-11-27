import { supabase } from './supabase';

export async function handleStripeWebhook(event: any) {
  const { type, data: { object } } = event;

  try {
    switch (type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(object);
        break;
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(object);
        break;
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(object);
        break;
      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(object);
        break;
      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(object);
        break;
    }
  } catch (error) {
    console.error(`Error handling webhook ${type}:`, error);
    throw error;
  }
}

async function handleCheckoutCompleted(session: any) {
  const userId = session.metadata?.supabase_user_id;
  if (!userId) throw new Error('No user ID in session metadata');

  await supabase
    .from('users')
    .update({
      subscription_status: 'active',
      subscription_period: session.mode === 'subscription' ? 'monthly' : 'annual',
      stripe_subscription_id: session.subscription,
      stripe_customer_id: session.customer,
      subscription_start_date: new Date().toISOString(),
      subscription_end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', userId);
}

async function handleSubscriptionUpdated(subscription: any) {
  const { data: users } = await supabase
    .from('users')
    .select('id')
    .eq('stripe_subscription_id', subscription.id);

  if (users?.[0]) {
    await supabase
      .from('users')
      .update({
        subscription_status: subscription.status,
        subscription_end_date: new Date(subscription.current_period_end * 1000).toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', users[0].id);
  }
}

async function handleSubscriptionDeleted(subscription: any) {
  const { data: users } = await supabase
    .from('users')
    .select('id')
    .eq('stripe_subscription_id', subscription.id);

  if (users?.[0]) {
    await supabase
      .from('users')
      .update({
        subscription_status: 'cancelled',
        subscription_end_date: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', users[0].id);
  }
}

async function handleInvoicePaymentSucceeded(invoice: any) {
  if (!invoice.subscription) return;

  const { data: users } = await supabase
    .from('users')
    .select('id')
    .eq('stripe_subscription_id', invoice.subscription);

  if (users?.[0]) {
    await supabase
      .from('users')
      .update({
        subscription_status: 'active',
        updated_at: new Date().toISOString()
      })
      .eq('id', users[0].id);
  }
}

async function handleInvoicePaymentFailed(invoice: any) {
  if (!invoice.subscription) return;

  const { data: users } = await supabase
    .from('users')
    .select('id')
    .eq('stripe_subscription_id', invoice.subscription);

  if (users?.[0]) {
    await supabase
      .from('users')
      .update({
        subscription_status: 'past_due',
        updated_at: new Date().toISOString()
      })
      .eq('id', users[0].id);
  }
}