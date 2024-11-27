export interface StripeSubscription {
  id: string;
  customer: string;
  status: 'active' | 'canceled' | 'past_due' | 'unpaid';
  current_period_start: number;
  current_period_end: number;
  cancel_at_period_end: boolean;
  plan: {
    id: string;
    nickname: string;
    amount: number;
    interval: 'month' | 'year';
  };
}

export interface StripePrice {
  id: string;
  unit_amount: number;
  currency: string;
  recurring: {
    interval: 'month' | 'year';
  };
  product: string;
}

export interface StripeCustomer {
  id: string;
  email: string;
  metadata: {
    supabase_user_id: string;
  };
}