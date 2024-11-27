import { supabaseAdmin } from '../supabase';
import type { Stripe } from 'stripe';

export async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const { data: users, error: selectError } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('stripe_subscription_id', subscription.id);

  if (selectError) throw selectError;
  if (!users?.length) return;

  const { error: updateError } = await supabaseAdmin
    .from('users')
    .update({
      subscription_status: subscription.status,
      subscription_end_date: new Date(subscription.current_period_end * 1000).toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', users[0].id);

  if (updateError) throw updateError;
}

export async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const { data: users, error: selectError } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('stripe_subscription_id', subscription.id);

  if (selectError) throw selectError;
  if (!users?.length) return;

  const { error: updateError } = await supabaseAdmin
    .from('users')
    .update({
      subscription_status: 'cancelled',
      subscription_end_date: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', users[0].id);

  if (updateError) throw updateError;
}