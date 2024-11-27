import { supabase } from '../supabase';
import { handleCheckoutCompleted } from './handlers/checkout';
import { handleSubscriptionUpdated, handleSubscriptionDeleted } from './handlers/subscription';
import { handleInvoicePaymentSucceeded, handleInvoicePaymentFailed } from './handlers/invoice';

export async function handleStripeWebhook(event: any) {
  const { type, data: { object } } = event;

  try {
    switch (type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(object);
        break;
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(object);
        break;
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(object);
        break;
      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(object);
        break;
      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(object);
        break;
    }
  } catch (error) {
    console.error(`Error handling webhook ${type}:`, error);
    throw error;
  }
}