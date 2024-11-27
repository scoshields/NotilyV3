import { Handler } from '@netlify/functions';
import { validateWebhookRequest } from './webhook/utils/validate-webhook';
import { handleCheckoutCompleted } from './webhook/handlers/checkout';
import { handleSubscriptionUpdated, handleSubscriptionDeleted } from './webhook/handlers/subscription';
import { handleInvoicePaymentSucceeded, handleInvoicePaymentFailed } from './webhook/handlers/invoice';
import { createErrorResponse, createSuccessResponse } from './webhook/utils/response';
import { WEBHOOK_CONFIG } from './webhook/config';

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { 
      statusCode: 200, 
      headers: WEBHOOK_CONFIG.headers
    };
  }

  if (event.httpMethod !== 'POST') {
    return createErrorResponse(405, 'Method not allowed');
  }

  try {
    const signature = event.headers['stripe-signature'];
    const { event: stripeEvent, error } = await validateWebhookRequest(event.body!, signature);

    if (error) {
      return createErrorResponse(error.status || 400, error.message);
    }

    if (!stripeEvent) {
      return createErrorResponse(400, 'No event constructed');
    }

    console.log('Processing webhook event:', stripeEvent.type);

    switch (stripeEvent.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(stripeEvent.data.object);
        break;
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(stripeEvent.data.object);
        break;
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(stripeEvent.data.object);
        break;
      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(stripeEvent.data.object);
        break;
      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(stripeEvent.data.object);
        break;
    }

    return createSuccessResponse();
  } catch (err) {
    console.error('Error processing webhook:', err);
    return createErrorResponse(
      500,
      err instanceof Error ? err.message : 'Internal server error'
    );
  }
}