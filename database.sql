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

-- Create function to check trial expiration
CREATE OR REPLACE FUNCTION check_trial_expiration()
RETURNS trigger AS $$
BEGIN
    -- If trial has expired (more than 14 days), update status to cancelled
    IF NEW.subscription_status = 'trialing' AND 
       NEW.trial_start_date < NOW() - INTERVAL '14 days' THEN
        NEW.subscription_status := 'cancelled';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for trial expiration
DROP TRIGGER IF EXISTS check_trial_expiration_trigger ON users;
CREATE TRIGGER check_trial_expiration_trigger
    BEFORE INSERT OR UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION check_trial_expiration();

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own data" ON public.users;
DROP POLICY IF EXISTS "Users can update own data" ON public.users;
DROP POLICY IF EXISTS "Users can insert own data" ON public.users;
DROP POLICY IF EXISTS "Service role can do anything" ON public.users;

-- Create policies
CREATE POLICY "Users can view own data"
    ON public.users FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own data"
    ON public.users FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own data"
    ON public.users FOR INSERT
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Service role can do anything"
    ON public.users
    USING (current_user = 'service_role')
    WITH CHECK (current_user = 'service_role');

-- Create function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.users (id, email, trial_start_date, subscription_status, created_at, updated_at)
    VALUES (
        NEW.id,
        NEW.email,
        now(),
        'trialing',
        now(),
        now()
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for automatic user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Grant necessary permissions
GRANT ALL ON public.users TO authenticated;
GRANT ALL ON public.users TO service_role;
GRANT EXECUTE ON FUNCTION public.handle_new_user TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user TO service_role;
GRANT EXECUTE ON FUNCTION public.check_trial_expiration TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_trial_expiration TO service_role;