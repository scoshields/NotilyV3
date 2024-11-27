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
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const token = event.headers.authorization?.split('Bearer ')[1];
    if (!token) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Unauthorized' }),
      };
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Unauthorized' }),
      };
    }

    const { subscriptionId } = JSON.parse(event.body || '{}');
    if (!subscriptionId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Subscription ID is required' }),
      };
    }

    // Verify subscription exists and belongs to user
    const { data: userData } = await supabase
      .from('users')
      .select('stripe_subscription_id, stripe_customer_id')
      .eq('id', user.id)
      .single();

    if (userData?.stripe_subscription_id !== subscriptionId) {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ error: 'Invalid subscription' }),
      };
    }

    // Cancel the subscription immediately in Stripe
    const subscription = await stripe.subscriptions.del(subscriptionId);

    // Update user record
    const { error: updateError } = await supabase
      .from('users')
      .update({
        subscription_status: 'cancelled',
        subscription_end_date: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (updateError) {
      throw updateError;
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: 'Subscription cancelled successfully',
        cancelAt: subscription.canceled_at,
      }),
    };
  } catch (error: any) {
    console.error('Error cancelling subscription:', error);
    return {
      statusCode: error.statusCode || 500,
      headers,
      body: JSON.stringify({
        error: error.message || 'Failed to cancel subscription',
      }),
    };
  }
};