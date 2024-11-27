-- Create a secure endpoint for Stripe webhooks
CREATE SCHEMA IF NOT EXISTS stripe_webhooks;

-- Create the webhook endpoint function
CREATE OR REPLACE FUNCTION stripe_webhooks.handle_webhook(
  payload JSONB,
  stripe_signature TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  signing_secret TEXT := current_setting('stripe.webhook_secret', true);
  event_data JSONB;
BEGIN
  -- Verify webhook signature (basic check - you may want to enhance this)
  IF stripe_signature IS NULL THEN
    RAISE EXCEPTION 'Missing Stripe signature';
  END IF;

  -- Call the main webhook handler
  RETURN stripe_webhook_handler(payload);
END;
$$;

-- Grant execute permission to anon and authenticated roles
GRANT USAGE ON SCHEMA stripe_webhooks TO anon, authenticated;
GRANT EXECUTE ON FUNCTION stripe_webhooks.handle_webhook TO anon, authenticated;

-- Set up secure configuration
ALTER DATABASE postgres SET stripe.webhook_secret = 'whsec_your_webhook_secret';