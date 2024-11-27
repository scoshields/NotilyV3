-- First ensure the user exists in users table
INSERT INTO public.users (
    id,
    email,
    subscription_status,
    subscription_period,
    subscription_start_date,
    subscription_end_date,
    updated_at
)
VALUES (
    '8c722cc7-d539-44fe-aa4e-5245d5da0bca',
    (SELECT email FROM auth.users WHERE id = '8c722cc7-d539-44fe-aa4e-5245d5da0bca'),
    'active',
    'annual',
    NOW(),
    NOW() + INTERVAL '1 year',
    NOW()
)
ON CONFLICT (id) DO UPDATE
SET
    subscription_status = 'active',
    subscription_period = 'annual',
    subscription_start_date = NOW(),
    subscription_end_date = NOW() + INTERVAL '1 year',
    updated_at = NOW();

-- Then create the subscription record
INSERT INTO public.subscriptions (
    user_id,
    subscription_period,
    subscription_status,
    start_date,
    end_date,
    created_at,
    updated_at
)
VALUES (
    '8c722cc7-d539-44fe-aa4e-5245d5da0bca',
    'annual',
    'active',
    NOW(),
    NOW() + INTERVAL '1 year',
    NOW(),
    NOW()
)
ON CONFLICT (user_id) DO UPDATE
SET
    subscription_period = 'annual',
    subscription_status = 'active',
    start_date = NOW(),
    end_date = NOW() + INTERVAL '1 year',
    updated_at = NOW();