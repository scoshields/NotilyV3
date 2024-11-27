import { supabase } from '../../supabase';

export async function handleSubscriptionUpdated(subscription: any) {
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

export async function handleSubscriptionDeleted(subscription: any) {
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