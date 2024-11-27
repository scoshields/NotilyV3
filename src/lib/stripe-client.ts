import { loadStripe } from '@stripe/stripe-js';
import { supabase } from './supabase';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

export async function createCheckoutSession(priceId: string) {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('No authenticated session');

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No authenticated user');

    const stripe = await stripePromise;
    if (!stripe) throw new Error('Failed to load Stripe');

    const { data: profile } = await supabase
      .from('users')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single();

    let customerId = profile?.stripe_customer_id;

    if (!customerId) {
      const { data: customer, error: customerError } = await supabase.functions.invoke('create-customer', {
        body: { email: user.email }
      });

      if (customerError) throw customerError;
      customerId = customer.id;

      await supabase
        .from('users')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id);
    }

    const { data: checkoutSession, error: sessionError } = await supabase.functions.invoke('create-checkout-session', {
      body: {
        priceId,
        customerId,
        successUrl: `${window.location.origin}/dashboard?success=true`,
        cancelUrl: `${window.location.origin}/dashboard?canceled=true`,
      }
    });

    if (sessionError) throw sessionError;

    const result = await stripe.redirectToCheckout({
      sessionId: checkoutSession.id
    });

    if (result.error) throw result.error;

  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw error;
  }
}