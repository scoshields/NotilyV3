import { supabase } from '../../supabase';

export async function handleInvoicePaymentSucceeded(invoice: any) {
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

export async function handleInvoicePaymentFailed(invoice: any) {
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