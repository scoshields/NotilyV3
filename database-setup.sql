-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table if not exists
CREATE TABLE IF NOT EXISTS public.users (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email text,
    trial_start_date timestamptz,
    subscription_status text CHECK (subscription_status IN ('active', 'inactive', 'cancelled', 'trialing', 'past_due')),
    subscription_period text CHECK (subscription_period IN ('monthly', 'annual')),
    subscription_start_date timestamptz,
    subscription_end_date timestamptz,
    stripe_customer_id text,
    stripe_subscription_id text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Create function to update trial status
CREATE OR REPLACE FUNCTION update_trial_status()
RETURNS trigger AS $$
BEGIN
    -- Check if trial has expired (14 days) and status is still 'trialing'
    IF OLD.subscription_status = 'trialing' AND 
       OLD.trial_start_date + INTERVAL '14 days' < NOW() THEN
        NEW.subscription_status = 'cancelled';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update trial status
DROP TRIGGER IF EXISTS check_trial_status ON users;
CREATE TRIGGER check_trial_status
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_trial_status();

-- Create function to ensure user record exists
CREATE OR REPLACE FUNCTION ensure_user_record(user_id uuid, user_email text)
RETURNS void AS $$
BEGIN
    INSERT INTO public.users (id, email, trial_start_date, subscription_status, created_at, updated_at)
    VALUES (user_id, user_email, now(), 'trialing', now(), now())
    ON CONFLICT (id) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT ALL ON public.users TO authenticated;
GRANT ALL ON public.users TO service_role;
GRANT EXECUTE ON FUNCTION ensure_user_record TO authenticated;
GRANT EXECUTE ON FUNCTION ensure_user_record TO service_role;
GRANT EXECUTE ON FUNCTION update_trial_status TO authenticated;
GRANT EXECUTE ON FUNCTION update_trial_status TO service_role;

-- Create or replace updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop and recreate trigger
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();