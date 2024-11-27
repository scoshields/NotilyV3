import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.17.0'

// Initialize Stripe
const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2023-10-16',
})

// Initialize Supabase client with service role key
const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const subscription = await stripe.subscriptions.retrieve(session.subscription as string)
  const userId = session.metadata?.supabase_user_id

  if (!userId) throw new Error('No user ID in session metadata')

  const { error } = await supabaseAdmin
    .from('users')
    .update({
      subscription_status: 'active',
      subscription_period: subscription.items.data[0].price.recurring?.interval === 'year' ? 'annual' : 'monthly',
      stripe_subscription_id: subscription.id,
      stripe_customer_id: session.customer as string,
      subscription_start_date: new Date(subscription.current_period_start * 1000).toISOString(),
      subscription_end_date: new Date(subscription.current_period_end * 1000).toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', userId)

  if (error) throw error
}

export async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const { data: users, error: selectError } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('stripe_subscription_id', subscription.id)

  if (selectError) throw selectError
  if (!users?.length) return

  const { error: updateError } = await supabaseAdmin
    .from('users')
    .update({
      subscription_status: subscription.status,
      subscription_end_date: new Date(subscription.current_period_end * 1000).toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', users[0].id)

  if (updateError) throw updateError
}

export async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const { data: users, error: selectError } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('stripe_subscription_id', subscription.id)

  if (selectError) throw selectError
  if (!users?.length) return

  const { error: updateError } = await supabaseAdmin
    .from('users')
    .update({
      subscription_status: 'cancelled',
      subscription_end_date: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', users[0].id)

  if (updateError) throw updateError
}

export async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  if (!invoice.subscription) return

  const { data: users, error: selectError } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('stripe_subscription_id', invoice.subscription)

  if (selectError) throw selectError
  if (!users?.length) return

  const { error: updateError } = await supabaseAdmin
    .from('users')
    .update({
      subscription_status: 'active',
      updated_at: new Date().toISOString()
    })
    .eq('id', users[0].id)

  if (updateError) throw updateError
}

export async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  if (!invoice.subscription) return

  const { data: users, error: selectError } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('stripe_subscription_id', invoice.subscription)

  if (selectError) throw selectError
  if (!users?.length) return

  const { error: updateError } = await supabaseAdmin
    .from('users')
    .update({
      subscription_status: 'past_due',
      updated_at: new Date().toISOString()
    })
    .eq('id', users[0].id)

  if (updateError) throw updateError
}