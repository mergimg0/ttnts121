// Stripe admin dashboard types

// Revenue metrics for dashboard
export interface RevenueMetrics {
  today: number;
  thisWeek: number;
  thisMonth: number;
  allTime: number;
  paymentCount: number;
  periodComparison: {
    daily: number;    // % change vs yesterday
    weekly: number;   // % change vs last week
    monthly: number;  // % change vs last month
  };
}

// Payment record for display
export interface PaymentRecord {
  id: string;
  amount: number;
  currency: string;
  status: 'succeeded' | 'pending' | 'failed' | 'canceled' | 'requires_payment_method';
  customerEmail: string | null;
  customerName: string | null;
  description: string | null;
  created: number; // Unix timestamp
  stripeUrl: string;
  metadata?: Record<string, string>;
}

// Failed payment for follow-up
export interface FailedPayment extends PaymentRecord {
  failureCode: string | null;
  failureMessage: string | null;
  lastAttempt: number;
}

// Refund record
export interface RefundRecord {
  id: string;
  paymentIntentId: string | null;
  amount: number;
  currency: string;
  status: 'pending' | 'succeeded' | 'failed' | 'canceled';
  reason: string | null;
  created: number;
  customerEmail: string | null;
}

// API response types
export interface StripeOverviewResponse {
  success: boolean;
  data?: {
    revenue: RevenueMetrics;
    recentPayments: PaymentRecord[];
    failedPayments: FailedPayment[];
    recentRefunds: RefundRecord[];
  };
  error?: string;
}

export interface StripePaymentsResponse {
  success: boolean;
  data?: PaymentRecord[];
  hasMore?: boolean;
  nextCursor?: string;
  error?: string;
}

export interface StripeRefundsResponse {
  success: boolean;
  data?: RefundRecord[];
  error?: string;
}
