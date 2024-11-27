import { supabase } from '../../supabase';

export async function handleCheckoutCompleted(session: any) {
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