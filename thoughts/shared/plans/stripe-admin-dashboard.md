# Implementation Plan: Stripe Admin Dashboard Integration

Generated: 2026-01-27

## Goal

Create a comprehensive Stripe/Payments admin section for the TTNTS121 kids football coaching website. The section will provide revenue analytics, payment history, failed payment tracking, and refund management with an Apple-esque design aesthetic.

## Research Summary

### Stripe API Best Practices (2024-2026)
- Use `stripe.paymentIntents.list()` for payment history (more granular than checkout sessions)
- Use `stripe.balanceTransactions.list()` for accurate revenue calculations
- Use `stripe.charges.list()` with `expand: ['data.customer']` for customer details
- Use `stripe.refunds.list()` for refund tracking
- Implement server-side caching (unstable_cache or Redis) for performance
- Rate limits: 100 requests/second in live mode, be mindful with list operations

### Apple-esque Design Principles
- Generous whitespace (padding: 24px-32px on cards)
- Subtle shadows (`shadow-sm` or custom `0 1px 3px rgba(0,0,0,0.08)`)
- Refined typography (font-medium for labels, tabular-nums for numbers)
- Micro-interactions (subtle hover states, smooth transitions)
- Monochrome with accent colors sparingly
- Clear visual hierarchy

## Existing Codebase Analysis

### Current Admin Structure
```
/src/app/admin/
  layout.tsx       - Auth wrapper + sidebar layout (lg:pl-64)
  page.tsx         - Dashboard with StatsCard grid
  /programs/       - CRUD pages
  /sessions/       - CRUD pages
  /bookings/       - List + detail pages
  /waitlist/       - List page
```

### Current Patterns
- **API Routes**: `NextResponse.json({ success: true, data: ... })`
- **Types**: Defined in `/src/types/booking.ts`
- **Styling**: Tailwind + CSS variables (--brand-navy, --sky, --neutral-*)
- **Components**: StatsCard accepts `title`, `value`, `description`, `icon`, `trend`
- **Navigation**: Sidebar `navItems` array with `label`, `href`, `icon`

### Existing Stripe Setup
- `stripe` instance exported from `/src/lib/stripe.ts`
- API version: `2025-12-15.clover`
- Webhook handling exists at `/api/webhooks/stripe/`
- Bookings store `stripePaymentIntentId` and `stripeSessionId`

## Implementation Phases

### Phase 1: Types and API Foundation

**Files to create:**
- `/src/types/stripe.ts` - TypeScript interfaces for Stripe admin data

**Steps:**

1. Create `/src/types/stripe.ts`:
```typescript
// Revenue metrics
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
  status: 'succeeded' | 'pending' | 'failed' | 'canceled';
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
  paymentIntentId: string;
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
```

**Acceptance criteria:**
- [ ] Types compile without errors
- [ ] Types exported from `/src/types/stripe.ts`

---

### Phase 2: API Routes

**Files to create:**
- `/src/app/api/admin/stripe/overview/route.ts` - Main dashboard data
- `/src/app/api/admin/stripe/payments/route.ts` - Paginated payment list
- `/src/app/api/admin/stripe/refunds/route.ts` - Refund list

**Steps:**

1. Create `/src/app/api/admin/stripe/overview/route.ts`:
```typescript
import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { unstable_cache } from "next/cache";

// Cache revenue calculation for 5 minutes
const getRevenueMetrics = unstable_cache(
  async () => {
    const now = new Date();
    const startOfToday = new Date(now.setHours(0, 0, 0, 0));
    const startOfWeek = new Date(now);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Get balance transactions for accurate revenue
    const [todayTxns, weekTxns, monthTxns, allTimeTxns] = await Promise.all([
      stripe.balanceTransactions.list({
        created: { gte: Math.floor(startOfToday.getTime() / 1000) },
        type: 'charge',
        limit: 100,
      }),
      stripe.balanceTransactions.list({
        created: { gte: Math.floor(startOfWeek.getTime() / 1000) },
        type: 'charge',
        limit: 100,
      }),
      stripe.balanceTransactions.list({
        created: { gte: Math.floor(startOfMonth.getTime() / 1000) },
        type: 'charge',
        limit: 100,
      }),
      stripe.balanceTransactions.list({
        type: 'charge',
        limit: 100,
      }),
    ]);

    // Calculate totals (net amounts to account for fees)
    const sumNet = (txns: typeof todayTxns) =>
      txns.data.reduce((sum, t) => sum + t.net, 0);

    return {
      today: sumNet(todayTxns),
      thisWeek: sumNet(weekTxns),
      thisMonth: sumNet(monthTxns),
      allTime: sumNet(allTimeTxns),
      paymentCount: monthTxns.data.length,
      periodComparison: { daily: 0, weekly: 0, monthly: 0 }, // Calculate from historical
    };
  },
  ['stripe-revenue'],
  { revalidate: 300 } // 5 minutes
);

export async function GET() {
  try {
    const [revenue, payments, failedPayments, refunds] = await Promise.all([
      getRevenueMetrics(),
      stripe.paymentIntents.list({
        limit: 10,
        expand: ['data.customer', 'data.latest_charge'],
      }),
      stripe.paymentIntents.list({
        limit: 10,
        expand: ['data.customer', 'data.latest_charge'],
      }).then(res => res.data.filter(p => p.status === 'requires_payment_method')),
      stripe.refunds.list({ limit: 5, expand: ['data.payment_intent'] }),
    ]);

    // Transform to response format
    const recentPayments = payments.data
      .filter(p => p.status === 'succeeded')
      .map(p => ({
        id: p.id,
        amount: p.amount,
        currency: p.currency,
        status: p.status,
        customerEmail: typeof p.customer === 'object' ? p.customer?.email : null,
        customerName: typeof p.customer === 'object' ? p.customer?.name : null,
        description: p.description,
        created: p.created,
        stripeUrl: `https://dashboard.stripe.com/payments/${p.id}`,
        metadata: p.metadata,
      }));

    return NextResponse.json({
      success: true,
      data: { revenue, recentPayments, failedPayments: [], recentRefunds: [] },
    });
  } catch (error) {
    console.error('Stripe overview error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch Stripe data' },
      { status: 500 }
    );
  }
}
```

2. Create `/src/app/api/admin/stripe/payments/route.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '25');
    const startingAfter = searchParams.get('cursor') || undefined;
    const status = searchParams.get('status'); // succeeded, failed, pending

    const payments = await stripe.paymentIntents.list({
      limit,
      starting_after: startingAfter,
      expand: ['data.customer', 'data.latest_charge'],
    });

    // Filter by status if provided
    let filtered = payments.data;
    if (status) {
      filtered = filtered.filter(p => p.status === status);
    }

    const records = filtered.map(p => ({
      id: p.id,
      amount: p.amount,
      currency: p.currency,
      status: p.status,
      customerEmail: typeof p.customer === 'object' ? p.customer?.email : null,
      customerName: typeof p.customer === 'object' ? p.customer?.name : null,
      description: p.description,
      created: p.created,
      stripeUrl: `https://dashboard.stripe.com/payments/${p.id}`,
      metadata: p.metadata,
    }));

    return NextResponse.json({
      success: true,
      data: records,
      hasMore: payments.has_more,
      nextCursor: payments.data[payments.data.length - 1]?.id,
    });
  } catch (error) {
    console.error('Stripe payments error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch payments' },
      { status: 500 }
    );
  }
}
```

3. Create `/src/app/api/admin/stripe/refunds/route.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '25');

    const refunds = await stripe.refunds.list({
      limit,
      expand: ['data.payment_intent', 'data.payment_intent.customer'],
    });

    const records = refunds.data.map(r => {
      const pi = r.payment_intent as Stripe.PaymentIntent | null;
      const customer = pi?.customer as Stripe.Customer | null;

      return {
        id: r.id,
        paymentIntentId: typeof r.payment_intent === 'string' ? r.payment_intent : pi?.id,
        amount: r.amount,
        currency: r.currency,
        status: r.status,
        reason: r.reason,
        created: r.created,
        customerEmail: customer?.email || null,
      };
    });

    return NextResponse.json({ success: true, data: records });
  } catch (error) {
    console.error('Stripe refunds error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch refunds' },
      { status: 500 }
    );
  }
}
```

**Acceptance criteria:**
- [ ] `/api/admin/stripe/overview` returns revenue metrics + recent data
- [ ] `/api/admin/stripe/payments` returns paginated payment list
- [ ] `/api/admin/stripe/refunds` returns refund list
- [ ] All routes handle errors gracefully
- [ ] Caching implemented for overview route

---

### Phase 3: UI Components

**Files to create:**
- `/src/components/admin/stripe/revenue-card.tsx` - Apple-style metric card
- `/src/components/admin/stripe/payment-table.tsx` - Payments list
- `/src/components/admin/stripe/payment-status-badge.tsx` - Status indicator
- `/src/components/admin/stripe/refund-table.tsx` - Refunds list

**Steps:**

1. Create `/src/components/admin/stripe/revenue-card.tsx`:
```typescript
"use client";

import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface RevenueCardProps {
  title: string;
  value: string;
  subtitle?: string;
  change?: {
    value: number;
    positive: boolean;
  };
  icon: LucideIcon;
  className?: string;
}

export function RevenueCard({
  title,
  value,
  subtitle,
  change,
  icon: Icon,
  className,
}: RevenueCardProps) {
  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl bg-white p-6",
        "border border-neutral-200/60",
        "shadow-[0_1px_3px_rgba(0,0,0,0.04)]",
        "hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)]",
        "transition-all duration-300 ease-out",
        className
      )}
    >
      {/* Subtle gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-sky-50/0 to-sky-50/0 group-hover:from-sky-50/30 group-hover:to-transparent transition-all duration-500" />

      <div className="relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-[13px] font-medium text-neutral-500 tracking-wide">
            {title}
          </span>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-50 group-hover:bg-sky-50 transition-colors">
            <Icon className="h-[18px] w-[18px] text-neutral-400 group-hover:text-sky-500 transition-colors" />
          </div>
        </div>

        {/* Value */}
        <div className="mb-1">
          <span className="text-[32px] font-semibold tracking-tight text-neutral-900 tabular-nums">
            {value}
          </span>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-2">
          {change && (
            <span
              className={cn(
                "inline-flex items-center text-[13px] font-medium tabular-nums",
                change.positive ? "text-emerald-600" : "text-red-500"
              )}
            >
              {change.positive ? "+" : ""}{change.value}%
            </span>
          )}
          {subtitle && (
            <span className="text-[13px] text-neutral-400">
              {subtitle}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
```

2. Create `/src/components/admin/stripe/payment-status-badge.tsx`:
```typescript
import { cn } from "@/lib/utils";

type PaymentStatus = 'succeeded' | 'pending' | 'failed' | 'canceled' | 'requires_payment_method';

const statusConfig: Record<PaymentStatus, { label: string; className: string }> = {
  succeeded: {
    label: 'Paid',
    className: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  },
  pending: {
    label: 'Pending',
    className: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  },
  failed: {
    label: 'Failed',
    className: 'bg-red-50 text-red-700 ring-red-600/20',
  },
  canceled: {
    label: 'Canceled',
    className: 'bg-neutral-100 text-neutral-600 ring-neutral-500/20',
  },
  requires_payment_method: {
    label: 'Action Required',
    className: 'bg-orange-50 text-orange-700 ring-orange-600/20',
  },
};

export function PaymentStatusBadge({ status }: { status: string }) {
  const config = statusConfig[status as PaymentStatus] || statusConfig.pending;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5",
        "text-[11px] font-semibold ring-1 ring-inset",
        config.className
      )}
    >
      {config.label}
    </span>
  );
}
```

3. Create `/src/components/admin/stripe/payment-table.tsx`:
```typescript
"use client";

import { ExternalLink } from "lucide-react";
import { PaymentRecord } from "@/types/stripe";
import { PaymentStatusBadge } from "./payment-status-badge";
import { formatPrice } from "@/lib/booking-utils";

interface PaymentTableProps {
  payments: PaymentRecord[];
  loading?: boolean;
}

export function PaymentTable({ payments, loading }: PaymentTableProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 bg-neutral-100 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (payments.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-neutral-500">No payments found</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-neutral-100">
            <th className="text-left py-3 px-4 text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
              Customer
            </th>
            <th className="text-left py-3 px-4 text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
              Amount
            </th>
            <th className="text-left py-3 px-4 text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
              Date
            </th>
            <th className="text-left py-3 px-4 text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
              Status
            </th>
            <th className="text-right py-3 px-4 text-[11px] font-semibold uppercase tracking-wider text-neutral-400">

            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-50">
          {payments.map((payment) => (
            <tr
              key={payment.id}
              className="group hover:bg-neutral-50/50 transition-colors"
            >
              <td className="py-4 px-4">
                <div>
                  <p className="text-sm font-medium text-neutral-900">
                    {payment.customerName || 'Guest'}
                  </p>
                  <p className="text-[13px] text-neutral-500">
                    {payment.customerEmail || 'No email'}
                  </p>
                </div>
              </td>
              <td className="py-4 px-4">
                <span className="text-sm font-semibold tabular-nums text-neutral-900">
                  {formatPrice(payment.amount)}
                </span>
              </td>
              <td className="py-4 px-4">
                <span className="text-sm text-neutral-600">
                  {new Date(payment.created * 1000).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
                <span className="text-[13px] text-neutral-400 ml-2">
                  {new Date(payment.created * 1000).toLocaleTimeString('en-GB', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </td>
              <td className="py-4 px-4">
                <PaymentStatusBadge status={payment.status} />
              </td>
              <td className="py-4 px-4 text-right">
                <a
                  href={payment.stripeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[13px] font-medium text-neutral-400 hover:text-sky-600 transition-colors"
                >
                  View
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

4. Create `/src/components/admin/stripe/refund-table.tsx`:
```typescript
"use client";

import { RefundRecord } from "@/types/stripe";
import { formatPrice } from "@/lib/booking-utils";
import { cn } from "@/lib/utils";

interface RefundTableProps {
  refunds: RefundRecord[];
  loading?: boolean;
}

const reasonLabels: Record<string, string> = {
  duplicate: 'Duplicate',
  fraudulent: 'Fraudulent',
  requested_by_customer: 'Customer Request',
};

export function RefundTable({ refunds, loading }: RefundTableProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-14 bg-neutral-100 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (refunds.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-neutral-500 text-sm">No refunds processed</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {refunds.map((refund) => (
        <div
          key={refund.id}
          className="flex items-center justify-between p-4 rounded-xl bg-neutral-50/50 hover:bg-neutral-50 transition-colors"
        >
          <div className="flex items-center gap-4">
            <div
              className={cn(
                "h-2 w-2 rounded-full",
                refund.status === 'succeeded' ? 'bg-emerald-500' : 'bg-amber-500'
              )}
            />
            <div>
              <p className="text-sm font-medium text-neutral-900">
                {refund.customerEmail || 'Unknown customer'}
              </p>
              <p className="text-[13px] text-neutral-500">
                {reasonLabels[refund.reason || ''] || 'Refund processed'}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold tabular-nums text-neutral-900">
              -{formatPrice(refund.amount)}
            </p>
            <p className="text-[12px] text-neutral-400">
              {new Date(refund.created * 1000).toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'short',
              })}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
```

**Acceptance criteria:**
- [ ] RevenueCard renders with gradient hover effect
- [ ] PaymentTable displays data with proper formatting
- [ ] PaymentStatusBadge shows correct colors per status
- [ ] RefundTable shows refund list
- [ ] All components handle loading and empty states

---

### Phase 4: Admin Page

**Files to create:**
- `/src/app/admin/payments/page.tsx` - Main payments dashboard

**Steps:**

1. Create `/src/app/admin/payments/page.tsx`:
```typescript
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  DollarSign,
  TrendingUp,
  CreditCard,
  AlertCircle,
  RotateCcw,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import { RevenueCard } from "@/components/admin/stripe/revenue-card";
import { PaymentTable } from "@/components/admin/stripe/payment-table";
import { RefundTable } from "@/components/admin/stripe/refund-table";
import { StripeOverviewResponse } from "@/types/stripe";
import { formatPrice } from "@/lib/booking-utils";

export default function PaymentsPage() {
  const [data, setData] = useState<StripeOverviewResponse['data'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/admin/stripe/overview');
        const json = await res.json();
        if (json.success) {
          setData(json.data);
        } else {
          setError(json.error);
        }
      } catch (err) {
        setError('Failed to load payment data');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <p className="text-neutral-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
            Payments
          </h1>
          <p className="text-neutral-500 mt-1">
            Revenue overview and payment history
          </p>
        </div>
        <a
          href="https://dashboard.stripe.com"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-neutral-900 text-white text-sm font-medium hover:bg-neutral-800 transition-colors"
        >
          Stripe Dashboard
          <ExternalLink className="h-4 w-4" />
        </a>
      </div>

      {/* Revenue Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <RevenueCard
          title="Today"
          value={loading ? '...' : formatPrice(data?.revenue.today || 0)}
          change={data?.revenue.periodComparison.daily ? {
            value: data.revenue.periodComparison.daily,
            positive: data.revenue.periodComparison.daily >= 0,
          } : undefined}
          subtitle="vs yesterday"
          icon={DollarSign}
        />
        <RevenueCard
          title="This Week"
          value={loading ? '...' : formatPrice(data?.revenue.thisWeek || 0)}
          change={data?.revenue.periodComparison.weekly ? {
            value: data.revenue.periodComparison.weekly,
            positive: data.revenue.periodComparison.weekly >= 0,
          } : undefined}
          subtitle="vs last week"
          icon={TrendingUp}
        />
        <RevenueCard
          title="This Month"
          value={loading ? '...' : formatPrice(data?.revenue.thisMonth || 0)}
          change={data?.revenue.periodComparison.monthly ? {
            value: data.revenue.periodComparison.monthly,
            positive: data.revenue.periodComparison.monthly >= 0,
          } : undefined}
          subtitle="vs last month"
          icon={CreditCard}
        />
        <RevenueCard
          title="All Time"
          value={loading ? '...' : formatPrice(data?.revenue.allTime || 0)}
          subtitle={`${data?.revenue.paymentCount || 0} payments`}
          icon={TrendingUp}
        />
      </div>

      {/* Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Payments - Takes 2 columns */}
        <div className="lg:col-span-2 rounded-2xl border border-neutral-200/60 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <div className="flex items-center justify-between p-6 border-b border-neutral-100">
            <h2 className="text-[15px] font-semibold text-neutral-900">
              Recent Payments
            </h2>
            <Link
              href="/admin/payments/all"
              className="text-[13px] font-medium text-neutral-400 hover:text-sky-600 transition-colors flex items-center gap-1"
            >
              View all
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="p-2">
            <PaymentTable
              payments={data?.recentPayments || []}
              loading={loading}
            />
          </div>
        </div>

        {/* Sidebar - Refunds and Failed */}
        <div className="space-y-6">
          {/* Failed Payments */}
          <div className="rounded-2xl border border-neutral-200/60 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
            <div className="flex items-center justify-between p-5 border-b border-neutral-100">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-amber-500" />
                <h2 className="text-[15px] font-semibold text-neutral-900">
                  Needs Attention
                </h2>
              </div>
              {(data?.failedPayments.length || 0) > 0 && (
                <span className="inline-flex items-center justify-center h-5 min-w-5 px-1.5 rounded-full bg-amber-100 text-amber-700 text-[11px] font-bold">
                  {data?.failedPayments.length}
                </span>
              )}
            </div>
            <div className="p-4">
              {loading ? (
                <div className="h-20 bg-neutral-100 rounded-lg animate-pulse" />
              ) : (data?.failedPayments.length || 0) > 0 ? (
                <div className="space-y-3">
                  {data?.failedPayments.slice(0, 3).map((payment) => (
                    <div
                      key={payment.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-amber-50/50"
                    >
                      <div>
                        <p className="text-sm font-medium text-neutral-900">
                          {payment.customerEmail || 'Unknown'}
                        </p>
                        <p className="text-[12px] text-neutral-500">
                          {formatPrice(payment.amount)}
                        </p>
                      </div>
                      <a
                        href={payment.stripeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[12px] font-medium text-amber-600 hover:text-amber-700"
                      >
                        Resolve
                      </a>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-neutral-500 text-center py-4">
                  No failed payments
                </p>
              )}
            </div>
          </div>

          {/* Recent Refunds */}
          <div className="rounded-2xl border border-neutral-200/60 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
            <div className="flex items-center justify-between p-5 border-b border-neutral-100">
              <div className="flex items-center gap-2">
                <RotateCcw className="h-4 w-4 text-neutral-400" />
                <h2 className="text-[15px] font-semibold text-neutral-900">
                  Recent Refunds
                </h2>
              </div>
            </div>
            <div className="p-4">
              <RefundTable
                refunds={data?.recentRefunds || []}
                loading={loading}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
```

**Acceptance criteria:**
- [ ] Page renders with revenue cards grid
- [ ] Recent payments table displays correctly
- [ ] Failed payments section shows alerts
- [ ] Refunds section displays recent refunds
- [ ] Loading states work correctly
- [ ] Error state displays message
- [ ] Stripe dashboard link works

---

### Phase 5: Navigation Update

**Files to modify:**
- `/src/components/admin/sidebar.tsx` - Add Payments nav item

**Steps:**

1. Update `navItems` array in sidebar.tsx:
```typescript
const navItems = [
  {
    label: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
  },
  {
    label: "Programs",
    href: "/admin/programs",
    icon: Calendar,
  },
  {
    label: "Sessions",
    href: "/admin/sessions",
    icon: ClipboardList,
  },
  {
    label: "Bookings",
    href: "/admin/bookings",
    icon: CreditCard,
  },
  {
    label: "Payments",      // NEW
    href: "/admin/payments",
    icon: DollarSign,       // Import from lucide-react
  },
  {
    label: "Waitlist",
    href: "/admin/waitlist",
    icon: Users,
  },
];
```

2. Add `DollarSign` to the imports at the top of the file.

**Acceptance criteria:**
- [ ] "Payments" appears in sidebar navigation
- [ ] Active state works correctly on /admin/payments
- [ ] Icon displays properly

---

## File Structure Summary

```
src/
  app/
    admin/
      payments/
        page.tsx              # Main payments dashboard
        all/
          page.tsx            # Full payments list (optional Phase 6)
    api/
      admin/
        stripe/
          overview/
            route.ts          # Dashboard metrics
          payments/
            route.ts          # Paginated payments list
          refunds/
            route.ts          # Refunds list
  components/
    admin/
      stripe/
        revenue-card.tsx      # Apple-style metric card
        payment-table.tsx     # Payments list component
        payment-status-badge.tsx  # Status indicator
        refund-table.tsx      # Refunds list component
  types/
    stripe.ts                 # TypeScript interfaces
```

## Testing Strategy

1. **Manual Testing:**
   - Verify revenue numbers match Stripe dashboard
   - Test with various payment statuses (succeeded, failed, pending)
   - Test pagination on full payments list
   - Verify Stripe dashboard links open correctly
   - Test mobile responsiveness

2. **Edge Cases:**
   - No payments in Stripe account
   - Network errors fetching Stripe data
   - Invalid/expired API key handling
   - Very large payment amounts (formatting)

3. **Performance:**
   - Verify caching reduces API calls
   - Test with many payments (pagination)
   - Check initial load time

## Risks & Considerations

| Risk | Mitigation |
|------|------------|
| Stripe rate limits | Implement caching (5 min for overview), paginate lists |
| Test vs Live mode confusion | Add visual indicator for test mode in UI |
| Sensitive data exposure | API routes are admin-only (auth checked by layout) |
| Currency formatting | Use existing `formatPrice()` utility |
| Timezone issues | Display dates in user's local timezone via browser |

## Estimated Complexity

| Phase | Effort | Risk |
|-------|--------|------|
| Phase 1: Types | Low | Low |
| Phase 2: API Routes | Medium | Medium (Stripe API complexity) |
| Phase 3: UI Components | Medium | Low |
| Phase 4: Admin Page | Medium | Low |
| Phase 5: Navigation | Low | Low |

**Total Estimate:** 4-6 hours for full implementation

## Future Enhancements (Optional)

1. **Phase 6:** Full payments list page with filters and search
2. **Phase 7:** Manual refund initiation from admin
3. **Phase 8:** Payment link generation for custom amounts
4. **Phase 9:** Revenue charts with date range selector
5. **Phase 10:** Email notifications for failed payments
