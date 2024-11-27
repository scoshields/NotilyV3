import { supabaseAdmin } from '../supabase';
import type { Stripe } from 'stripe';

export async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  if (!invoice.subscription) return;

  const { data: users, error: selectError } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('stripe_subscription_id', invoice.subscription);

  if (selectError) throw selectError;
  if (!users?.length) return;

  const { error: updateError } = await supabaseAdmin
    .from('users')
    .update({
      subscription_status: 'active',
      updated_at: new Date().toISOString()
    })
    .eq('id', users[0].id);

  if (updateError) throw updateError;
}

export async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  if (!invoice.subscription) return;

  const { data: users, error: selectError } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('stripe_subscription_id', invoice.subscription);

  if (selectError) throw selectError;
  if (!users?.length) return;

  const { error: updateError } = await supabaseAdmin
    .from('users')
    .update({
      subscription_status: 'past_due',
      updated_at: new Date().toISOString()
    })
    .eq('id', users[0].id);

  if (updateError) throw updateError;
}