import { loadStripe } from '@stripe/stripe-js';
import { supabase } from './supabase';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

export const redirectToPayment = async (plan: 'monthly' | 'annual') => {
  try {
    const stripe = await stripePromise;
    if (!stripe) throw new Error('Stripe failed to load');

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('No authenticated session');

    const priceId = plan === 'monthly' 
      ? import.meta.env.VITE_STRIPE_MONTHLY_PRICE_ID 
      : import.meta.env.VITE_STRIPE_ANNUAL_PRICE_ID;

    const response = await fetch('/.netlify/functions/create-checkout-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        priceId,
        successUrl: `${window.location.origin}/dashboard/profile?success=true`,
        cancelUrl: `${window.location.origin}/dashboard/profile?canceled=true`,
      }),
    });

    const text = await response.text();
    let data;
    
    try {
      data = JSON.parse(text);
    } catch (e) {
      console.error('Failed to parse response:', text);
      throw new Error('Invalid response from server');
    }

    if (!response.ok) {
      throw new Error(data.error || 'Failed to create checkout session');
    }

    if (!data.sessionId) {
      throw new Error('No session ID returned');
    }

    const { error: redirectError } = await stripe.redirectToCheckout({ 
      sessionId: data.sessionId 
    });
    
    if (redirectError) throw redirectError;
  } catch (error) {
    console.error('Error in redirectToPayment:', error);
    throw error;
  }
};