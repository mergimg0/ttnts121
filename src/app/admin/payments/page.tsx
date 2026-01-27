"use client";

import { useEffect, useState } from "react";
import {
  DollarSign,
  TrendingUp,
  Calendar,
  Wallet,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  ArrowRight
} from "lucide-react";
import { RevenueCard } from "@/components/admin/stripe/revenue-card";
import { PaymentTable } from "@/components/admin/stripe/payment-table";
import { RefundTable } from "@/components/admin/stripe/refund-table";
import { PaymentStatusBadge } from "@/components/admin/stripe/payment-status-badge";
import { formatPrice } from "@/lib/booking-utils";
import type {
  RevenueMetrics,
  PaymentRecord,
  FailedPayment,
  RefundRecord
} from "@/types/stripe";

interface OverviewData {
  revenue: RevenueMetrics;
  recentPayments: PaymentRecord[];
  failedPayments: FailedPayment[];
  recentRefunds: RefundRecord[];
}

export default function PaymentsPage() {
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const response = await fetch('/api/admin/stripe/overview');
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch data');
      }

      setData(result.data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load payment data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-8">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between">
          <div>
            <div className="h-8 w-48 bg-neutral-100 rounded-lg animate-pulse" />
            <div className="h-4 w-64 bg-neutral-100 rounded-lg animate-pulse mt-2" />
          </div>
          <div className="h-10 w-32 bg-neutral-100 rounded-xl animate-pulse" />
        </div>

        {/* Revenue Cards Skeleton */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 lg:gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 lg:h-36 bg-neutral-100 rounded-xl lg:rounded-2xl animate-pulse" />
          ))}
        </div>

        {/* Tables Skeleton */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 h-96 bg-neutral-100 rounded-2xl animate-pulse" />
          <div className="h-96 bg-neutral-100 rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-50 mb-4">
          <AlertCircle className="h-7 w-7 text-red-500" />
        </div>
        <h3 className="text-lg font-semibold text-neutral-900 mb-2">
          Unable to load payment data
        </h3>
        <p className="text-neutral-500 text-sm mb-6 text-center max-w-md">
          {error}
        </p>
        <button
          onClick={() => fetchData()}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-navy text-white text-sm font-medium hover:bg-navy-deep transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          Try Again
        </button>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">
            Payments
          </h1>
          <p className="text-neutral-500 text-sm mt-1">
            Monitor revenue, transactions, and refunds
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchData(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-neutral-200 bg-white text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <a
            href="https://dashboard.stripe.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#635BFF] text-white text-sm font-medium hover:bg-[#5851e0] transition-colors"
          >
            <span>Stripe Dashboard</span>
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      </div>

      {/* Revenue Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 lg:gap-4">
        <RevenueCard
          title="Today"
          value={formatPrice(data.revenue.today)}
          change={data.revenue.periodComparison.daily !== 0 ? {
            value: data.revenue.periodComparison.daily,
            positive: data.revenue.periodComparison.daily > 0
          } : undefined}
          subtitle="vs yesterday"
          icon={DollarSign}
        />
        <RevenueCard
          title="This Week"
          value={formatPrice(data.revenue.thisWeek)}
          change={data.revenue.periodComparison.weekly !== 0 ? {
            value: data.revenue.periodComparison.weekly,
            positive: data.revenue.periodComparison.weekly > 0
          } : undefined}
          subtitle="vs last week"
          icon={TrendingUp}
        />
        <RevenueCard
          title="This Month"
          value={formatPrice(data.revenue.thisMonth)}
          change={data.revenue.periodComparison.monthly !== 0 ? {
            value: data.revenue.periodComparison.monthly,
            positive: data.revenue.periodComparison.monthly > 0
          } : undefined}
          subtitle="vs last month"
          icon={Calendar}
        />
        <RevenueCard
          title="All Time"
          value={formatPrice(data.revenue.allTime)}
          subtitle={`${data.revenue.paymentCount} payments`}
          icon={Wallet}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Recent Payments */}
        <div className="xl:col-span-2">
          <div className="rounded-2xl border border-neutral-200/60 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
              <h2 className="text-[15px] font-semibold text-neutral-900">
                Recent Payments
              </h2>
              <a
                href="https://dashboard.stripe.com/payments"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[13px] font-medium text-neutral-500 hover:text-sky-600 transition-colors"
              >
                View all
                <ArrowRight className="h-3.5 w-3.5" />
              </a>
            </div>
            <PaymentTable payments={data.recentPayments} />
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Failed Payments */}
          {data.failedPayments.length > 0 && (
            <div className="rounded-2xl border border-red-200/60 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
              <div className="flex items-center gap-2 px-6 py-4 border-b border-red-100 bg-red-50/50">
                <AlertCircle className="h-4 w-4 text-red-500" />
                <h2 className="text-[15px] font-semibold text-red-900">
                  Needs Attention
                </h2>
                <span className="ml-auto inline-flex items-center justify-center h-5 min-w-5 px-1.5 rounded-full bg-red-100 text-[11px] font-semibold text-red-700">
                  {data.failedPayments.length}
                </span>
              </div>
              <div className="divide-y divide-neutral-50">
                {data.failedPayments.slice(0, 5).map((payment) => (
                  <div key={payment.id} className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-neutral-900 truncate">
                          {payment.customerEmail || 'Unknown customer'}
                        </p>
                        <p className="text-[13px] text-red-600 mt-0.5">
                          {payment.failureMessage || 'Payment failed'}
                        </p>
                      </div>
                      <span className="text-sm font-semibold tabular-nums text-neutral-900 flex-shrink-0">
                        {formatPrice(payment.amount)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Refunds */}
          <div className="rounded-2xl border border-neutral-200/60 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
              <h2 className="text-[15px] font-semibold text-neutral-900">
                Recent Refunds
              </h2>
              <a
                href="https://dashboard.stripe.com/refunds"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[13px] font-medium text-neutral-500 hover:text-sky-600 transition-colors"
              >
                View all
                <ArrowRight className="h-3.5 w-3.5" />
              </a>
            </div>
            <div className="p-4">
              <RefundTable refunds={data.recentRefunds} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
