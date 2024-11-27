import { Handler } from '@netlify/functions';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const sig = event.headers['stripe-signature'];
  let stripeEvent;

  try {
    stripeEvent = stripe.webhooks.constructEvent(
      event.body!,
      sig!,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return { statusCode: 400, body: 'Webhook signature verification failed' };
  }

  try {
    console.log('Processing webhook event:', stripeEvent.type);

    switch (stripeEvent.type) {
      case 'checkout.session.completed': {
        const session = stripeEvent.data.object as Stripe.Checkout.Session;
        const customerId = session.customer as string;
        const subscriptionId = session.subscription as string;
        const clientReferenceId = session.client_reference_id;

        console.log('Processing completed checkout session:', session.id);

        // Get subscription details
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const period = subscription.items.data[0].price.recurring?.interval === 'year' ? 'annual' : 'monthly';

        // Get user by client reference ID or customer ID
        const { data: users } = await supabase
          .from('users')
          .select('id, email')
          .or(`id.eq.${clientReferenceId},stripe_customer_id.eq.${customerId}`);

        if (users && users[0]) {
          const userId = users[0].id;
          console.log('Updating subscription for user:', userId);

          // Update user record
          await supabase
            .from('users')
            .update({
              subscription_status: 'active',
              subscription_period: period,
              stripe_subscription_id: subscriptionId,
              stripe_customer_id: customerId,
              subscription_start_date: new Date(subscription.current_period_start * 1000).toISOString(),
              subscription_end_date: new Date(subscription.current_period_end * 1000).toISOString()
            })
            .eq('id', userId);

          console.log('Successfully updated subscription records');
        } else {
          console.error('User not found for reference:', clientReferenceId);
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = stripeEvent.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        console.log('Processing subscription update:', subscription.id);

        const { data: users } = await supabase
          .from('users')
          .select('id')
          .eq('stripe_customer_id', customerId);

        if (users && users[0]) {
          const userId = users[0].id;

          await supabase
            .from('users')
            .update({
              subscription_status: subscription.status,
              subscription_end_date: new Date(subscription.current_period_end * 1000).toISOString()
            })
            .eq('id', userId);

          console.log('Successfully updated subscription status');
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = stripeEvent.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        console.log('Processing subscription deletion:', subscription.id);

        const { data: users } = await supabase
          .from('users')
          .select('id')
          .eq('stripe_customer_id', customerId);

        if (users && users[0]) {
          const userId = users[0].id;

          await supabase
            .from('users')
            .update({
              subscription_status: 'cancelled',
              subscription_end_date: new Date().toISOString()
            })
            .eq('id', userId);

          console.log('Successfully marked subscription as cancelled');
        }
        break;
      }
    }

    return { statusCode: 200, body: JSON.stringify({ received: true }) };
  } catch (err) {
    console.error('Error processing webhook:', err);
    return { statusCode: 500, body: JSON.stringify({ error: 'Webhook processing failed' }) };
  }
};