## Stripe Webhook Function

This function handles Stripe webhook events and updates the Supabase database accordingly.

### Environment Variables Required:

```
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
SUPABASE_URL=https://[YOUR-PROJECT-ID].supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

### Supported Events:

- checkout.session.completed
- customer.subscription.updated
- customer.subscription.deleted
- invoice.payment_succeeded
- invoice.payment_failed

### Deployment:

Deploy using the Supabase CLI:

```bash
supabase functions deploy stripe-webhook --no-verify-jwt
```