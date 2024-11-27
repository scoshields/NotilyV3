export interface StripeWebhookEvent {
  type: string;
  data: {
    object: any;
  };
}

export interface StripeCheckoutSession {
  id: string;
  customer: string;
  subscription: string;
  metadata: {
    supabase_user_id?: string;
  };
  mode: 'subscription' | 'payment';
}

export interface StripeSubscription {
  id: string;
  status: string;
  current_period_end: number;
}

export interface StripeInvoice {
  id: string;
  subscription: string | null;
  status: string;
}