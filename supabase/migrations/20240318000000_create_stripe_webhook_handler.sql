-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS handle_stripe_webhook(jsonb);
DROP FUNCTION IF EXISTS stripe_webhook_handler(jsonb);

-- Create webhook handler function
CREATE OR REPLACE FUNCTION stripe_webhook_handler(
    payload JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    event_type TEXT;
    event_data JSONB;
    user_id UUID;
    subscription_id TEXT;
    customer_id TEXT;
    result JSONB;
BEGIN
    -- Extract event information
    event_type := payload->>'type';
    event_data := payload->'data'->'object';
    
    -- Process different event types
    CASE event_type
        WHEN 'checkout.session.completed' THEN
            user_id := (event_data->'metadata'->>'supabase_user_id')::UUID;
            subscription_id := event_data->>'subscription';
            customer_id := event_data->>'customer';

            UPDATE users
            SET subscription_status = 'active',
                subscription_period = CASE 
                    WHEN event_data->'items'->'data'->0->'price'->'recurring'->>'interval' = 'year' 
                    THEN 'annual' 
                    ELSE 'monthly' 
                END,
                stripe_subscription_id = subscription_id,
                stripe_customer_id = customer_id,
                subscription_start_date = NOW(),
                subscription_end_date = NOW() + INTERVAL '1 month',
                updated_at = NOW()
            WHERE id = user_id;

            result := jsonb_build_object('status', 'success', 'event', 'checkout.session.completed');

        WHEN 'customer.subscription.updated' THEN
            subscription_id := event_data->>'id';
            
            UPDATE users
            SET subscription_status = (event_data->>'status'),
                subscription_end_date = to_timestamp((event_data->>'current_period_end')::bigint),
                updated_at = NOW()
            WHERE stripe_subscription_id = subscription_id;

            result := jsonb_build_object('status', 'success', 'event', 'subscription.updated');

        WHEN 'customer.subscription.deleted' THEN
            subscription_id := event_data->>'id';
            
            UPDATE users
            SET subscription_status = 'cancelled',
                subscription_end_date = NOW(),
                updated_at = NOW()
            WHERE stripe_subscription_id = subscription_id;

            result := jsonb_build_object('status', 'success', 'event', 'subscription.deleted');

        WHEN 'invoice.payment_succeeded' THEN
            subscription_id := event_data->>'subscription';
            
            IF subscription_id IS NOT NULL THEN
                UPDATE users
                SET subscription_status = 'active',
                    updated_at = NOW()
                WHERE stripe_subscription_id = subscription_id;
            END IF;

            result := jsonb_build_object('status', 'success', 'event', 'invoice.succeeded');

        WHEN 'invoice.payment_failed' THEN
            subscription_id := event_data->>'subscription';
            
            IF subscription_id IS NOT NULL THEN
                UPDATE users
                SET subscription_status = 'past_due',
                    updated_at = NOW()
                WHERE stripe_subscription_id = subscription_id;
            END IF;

            result := jsonb_build_object('status', 'success', 'event', 'invoice.failed');

        ELSE
            result := jsonb_build_object('status', 'ignored', 'event', event_type);
    END CASE;

    RETURN result;
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'status', 'error',
            'message', SQLERRM,
            'event', event_type
        );
END;
$$;

-- Grant execute permission to authenticated users and service role
GRANT EXECUTE ON FUNCTION stripe_webhook_handler TO authenticated;
GRANT EXECUTE ON FUNCTION stripe_webhook_handler TO service_role;