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
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Stripe-Signature',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  let stripeEvent: Stripe.Event;

  try {
    const sig = event.headers['stripe-signature'];
    if (!sig) {
      console.error('No Stripe signature found in webhook request');
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'No Stripe signature found' }),
      };
    }

    stripeEvent = stripe.webhooks.constructEvent(
      event.body!,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );

    console.log('Webhook signature verified successfully');
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Webhook signature verification failed' }),
    };
  }

  try {
    console.log('Processing webhook event:', stripeEvent.type);

    switch (stripeEvent.type) {
      case 'checkout.session.completed': {
        const session = stripeEvent.data.object as Stripe.Checkout.Session;
        const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
        const userId = session.metadata?.supabase_user_id;

        if (!userId) throw new Error('No user ID in session metadata');

        await supabase
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
          .eq('id', userId);

        console.log('Successfully processed checkout.session.completed');
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = stripeEvent.data.object as Stripe.Subscription;
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

          console.log('Successfully processed customer.subscription.updated');
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = stripeEvent.data.object as Stripe.Subscription;
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

          console.log('Successfully processed customer.subscription.deleted');
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = stripeEvent.data.object as Stripe.Invoice;
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

          console.log('Successfully processed invoice.payment_succeeded');
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = stripeEvent.data.object as Stripe.Invoice;
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

          console.log('Successfully processed invoice.payment_failed');
        }
        break;
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ received: true }),
    };
  } catch (error: any) {
    console.error('Error processing webhook:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: error.message || 'Failed to process webhook',
      }),
    };
  }
};