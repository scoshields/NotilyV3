import type { Stripe } from 'stripe';

export interface WebhookHandlerResponse {
  statusCode: number;
  body: string;
  headers: Record<string, string>;
}

export interface WebhookValidationResult {
  event?: Stripe.Event;
  error?: {
    message: string;
    status?: number;
  };
}

export interface WebhookHandlerContext {
  signature: string | null;
  body: string;
  headers: Record<string, string>;
}