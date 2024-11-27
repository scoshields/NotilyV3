import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'
import { validateWebhookRequest } from './utils/validate-webhook.ts'
import { handleWebhookEvent } from './handlers/webhook-handlers.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { event, error } = await validateWebhookRequest(req)
    
    if (error) {
      console.error('Webhook validation error:', error)
      return new Response(
        JSON.stringify({ error: error.message }), 
        { 
          status: error.status || 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    if (!event) {
      return new Response(
        JSON.stringify({ error: 'No event constructed' }), 
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    await handleWebhookEvent(event)
    
    return new Response(
      JSON.stringify({ received: true }), 
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  } catch (err) {
    console.error('Error processing webhook:', err)
    return new Response(
      JSON.stringify({ 
        error: err instanceof Error ? err.message : 'Internal server error'
      }), 
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})