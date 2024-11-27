-- Clear data from tables in the correct order to respect foreign key constraints
DELETE FROM therapy_notes;
DELETE FROM sessions;
DELETE FROM clients;

-- Clear subscription data from auth.users
UPDATE auth.users SET 
    subscription_plan = NULL,
    subscription_status = NULL,
    trial_ends_at = NULL,
    subscription_ends_at = NULL,
    stripe_customer_id = NULL,
    stripe_subscription_id = NULL;