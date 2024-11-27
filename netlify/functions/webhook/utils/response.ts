import { WebhookHandlerResponse } from '../types';
import { WEBHOOK_CONFIG } from '../config';

export function createWebhookResponse(
  statusCode: number,
  body: Record<string, any>
): WebhookHandlerResponse {
  return {
    statusCode,
    headers: WEBHOOK_CONFIG.headers,
    body: JSON.stringify(body)
  };
}

export function createErrorResponse(
  statusCode: number,
  error: string
): WebhookHandlerResponse {
  return createWebhookResponse(statusCode, { error });
}

export function createSuccessResponse(
  data: Record<string, any> = { received: true }
): WebhookHandlerResponse {
  return createWebhookResponse(200, data);
}