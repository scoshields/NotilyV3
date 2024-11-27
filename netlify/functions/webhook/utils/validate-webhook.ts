import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

interface ValidationResult {
  event?: Stripe.Event;
  error?: {
    message: string;
    status?: number;
  };
}

export async function validateWebhookRequest(body: string, signature: string | null): Promise<ValidationResult> {
  if (!signature) {
    return {
      error: {
        message: 'No Stripe signature found',
        status: 400
      }
    };
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('Missing STRIPE_WEBHOOK_SECRET environment variable');
    return {
      error: {
        message: 'Webhook configuration error',
        status: 500
      }
    };
  }

  try {
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    return { event };
  } catch (err) {
    console.error('Webhook validation error:', err);
    return {
      error: {
        message: err instanceof Error ? err.message : 'Invalid webhook signature',
        status: 400
      }
    };
  }
}