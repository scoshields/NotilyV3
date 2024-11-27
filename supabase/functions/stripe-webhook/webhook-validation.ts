import Stripe from 'https://esm.sh/stripe@14.17.0'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2023-10-16',
})

interface ValidationResult {
  event?: Stripe.Event
  error?: {
    message: string
    status?: number
  }
}

export async function validateWebhookRequest(req: Request): Promise<ValidationResult> {
  const signature = req.headers.get('stripe-signature')
  if (!signature) {
    return {
      error: {
        message: 'No Stripe signature found',
        status: 400
      }
    }
  }

  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')
  if (!webhookSecret) {
    console.error('Missing STRIPE_WEBHOOK_SECRET environment variable')
    return {
      error: {
        message: 'Webhook configuration error',
        status: 500
      }
    }
  }

  try {
    const body = await req.text()
    console.log('Webhook request received:', {
      signature,
      bodyLength: body.length,
      headers: Object.fromEntries(req.headers.entries())
    })

    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    console.log('Webhook event constructed successfully:', event.type)
    
    return { event }
  } catch (err) {
    console.error('Webhook validation error:', err)
    return {
      error: {
        message: err instanceof Error ? err.message : 'Invalid webhook signature',
        status: 400
      }
    }
  }
}