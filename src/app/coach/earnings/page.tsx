"use client";

import { useEffect, useState, useCallback } from "react";
import { useCoachAuth } from "@/components/coach/auth-provider";
import { AdminCard } from "@/components/admin/ui/admin-card";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  PoundSterling,
  TrendingUp,
  Clock,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Download,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface MonthlyEarnings {
  month: string; // "2026-01"
  totalHours: number;
  approvedHours: number;
  pendingHours: number;
  earnings: number; // in pence
  status: "pending" | "paid" | "partial";
  paidAmount?: number; // in pence
  paidAt?: string;
}

interface EarningsSummary {
  hourlyRate: number; // in pence
  totalEarnings: number; // in pence (all time approved)
  totalPaid: number; // in pence
  pendingPayment: number; // in pence
  currentMonthHours: number;
  currentMonthEarnings: number;
}

interface PaymentHistory {
  id: string;
  month: string;
  amount: number; // in pence
  hours: number;
  paidAt: string;
  reference?: string;
}

export default function CoachEarningsPage() {
  const { user } = useCoachAuth();
  const [currentYear, setCurrentYear] = useState<number>(
    () => new Date().getFullYear()
  );
  const [monthlyData, setMonthlyData] = useState<MonthlyEarnings[]>([]);
  const [summary, setSummary] = useState<EarningsSummary>({
    hourlyRate: 1500,
    totalEarnings: 0,
    totalPaid: 0,
    pendingPayment: 0,
    currentMonthHours: 0,
    currentMonthEarnings: 0,
  });
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistory[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch earnings data
  const fetchEarnings = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/coach/earnings?year=${currentYear}`);
      const data = await response.json();
      if (data.success) {
        setMonthlyData(data.data.monthly || []);
        setSummary(data.data.summary || summary);
        setPaymentHistory(data.data.payments || []);
      }
    } catch (error) {
      console.error("Error fetching earnings:", error);
    } finally {
      setLoading(false);
    }
  }, [user, currentYear]);

  useEffect(() => {
    fetchEarnings();
  }, [fetchEarnings]);

  // Year navigation
  const goToPreviousYear = () => setCurrentYear((y) => y - 1);
  const goToNextYear = () => setCurrentYear((y) => y + 1);
  const goToCurrentYear = () => setCurrentYear(new Date().getFullYear());
  const isCurrentYear = currentYear === new Date().getFullYear();

  // Format currency
  const formatCurrency = (pence: number) => {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP",
    }).format(pence / 100);
  };

  // Format month name
  const formatMonth = (monthStr: string) => {
    const [year, month] = monthStr.split("-");
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString("en-GB", { month: "long" });
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return (
          <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
            Paid
          </span>
        );
      case "partial":
        return (
          <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
            Partial
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-600">
            Pending
          </span>
        );
    }
  };

  if (loading && monthlyData.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
      </div>
    );
  }

  // Get all months for the year (even if no data)
  const allMonths = Array.from({ length: 12 }, (_, i) => {
    const monthNum = String(i + 1).padStart(2, "0");
    const monthStr = `${currentYear}-${monthNum}`;
    const existingData = monthlyData.find((m) => m.month === monthStr);
    return (
      existingData || {
        month: monthStr,
        totalHours: 0,
        approvedHours: 0,
        pendingHours: 0,
        earnings: 0,
        status: "pending" as const,
      }
    );
  });

  // Only show months up to current month if viewing current year
  const displayMonths = isCurrentYear
    ? allMonths.slice(0, new Date().getMonth() + 1)
    : allMonths;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">Earnings</h1>
        <p className="mt-1 text-[13px] text-neutral-500">
          View your earnings summary and payment history
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminCard hover={false}>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100">
              <PoundSterling className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-neutral-500">Total Earnings</p>
              <p className="text-lg font-semibold text-neutral-900">
                {formatCurrency(summary.totalEarnings)}
              </p>
            </div>
          </div>
        </AdminCard>

        <AdminCard hover={false}>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-neutral-500">Total Paid</p>
              <p className="text-lg font-semibold text-neutral-900">
                {formatCurrency(summary.totalPaid)}
              </p>
            </div>
          </div>
        </AdminCard>

        <AdminCard hover={false}>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100">
              <TrendingUp className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-neutral-500">Pending Payment</p>
              <p className="text-lg font-semibold text-neutral-900">
                {formatCurrency(summary.pendingPayment)}
              </p>
            </div>
          </div>
        </AdminCard>

        <AdminCard hover={false}>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100">
              <Clock className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-neutral-500">Hourly Rate</p>
              <p className="text-lg font-semibold text-neutral-900">
                {formatCurrency(summary.hourlyRate)}/hr
              </p>
            </div>
          </div>
        </AdminCard>
      </div>

      {/* Year Navigator */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="adminSecondary"
            size="icon"
            onClick={goToPreviousYear}
            className="h-9 w-9"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <div className="flex items-center gap-2 min-w-[100px] justify-center">
            <Calendar className="h-4 w-4 text-neutral-400" />
            <span className="text-sm font-medium text-neutral-900">
              {currentYear}
            </span>
          </div>

          <Button
            variant="adminSecondary"
            size="icon"
            onClick={goToNextYear}
            className="h-9 w-9"
            disabled={isCurrentYear}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>

          {!isCurrentYear && (
            <Button
              variant="adminGhost"
              size="sm"
              onClick={goToCurrentYear}
              className="ml-2 h-9 px-3"
            >
              This Year
            </Button>
          )}
        </div>
      </div>

      {/* Monthly Breakdown */}
      <AdminCard hover={false}>
        <h2 className="text-lg font-semibold text-neutral-900 mb-4">
          Monthly Breakdown
        </h2>

        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-100">
                <th className="py-3 px-4 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500">
                  Month
                </th>
                <th className="py-3 px-4 text-right text-xs font-semibold uppercase tracking-wider text-neutral-500">
                  Hours
                </th>
                <th className="py-3 px-4 text-right text-xs font-semibold uppercase tracking-wider text-neutral-500">
                  Approved
                </th>
                <th className="py-3 px-4 text-right text-xs font-semibold uppercase tracking-wider text-neutral-500">
                  Earnings
                </th>
                <th className="py-3 px-4 text-center text-xs font-semibold uppercase tracking-wider text-neutral-500">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {displayMonths.reverse().map((month, index) => (
                <tr
                  key={month.month}
                  className={cn(
                    "border-b border-neutral-50 hover:bg-neutral-50 transition-colors",
                    index === 0 && "bg-emerald-50/30"
                  )}
                >
                  <td className="py-3 px-4 text-sm font-medium text-neutral-900">
                    {formatMonth(month.month)}
                  </td>
                  <td className="py-3 px-4 text-sm text-right text-neutral-600">
                    {month.totalHours}h
                  </td>
                  <td className="py-3 px-4 text-sm text-right text-neutral-600">
                    {month.approvedHours}h
                  </td>
                  <td className="py-3 px-4 text-sm text-right font-medium text-neutral-900">
                    {formatCurrency(month.earnings)}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {getStatusBadge(month.status)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden space-y-3">
          {displayMonths.reverse().map((month, index) => (
            <div
              key={month.month}
              className={cn(
                "rounded-xl border border-neutral-100 p-4",
                index === 0 && "bg-emerald-50/30 border-emerald-200/50"
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-neutral-900">
                  {formatMonth(month.month)}
                </span>
                {getStatusBadge(month.status)}
              </div>
              <div className="grid grid-cols-3 gap-2 text-[13px]">
                <div>
                  <span className="text-neutral-500">Hours:</span>
                  <span className="ml-1 text-neutral-900">
                    {month.totalHours}h
                  </span>
                </div>
                <div>
                  <span className="text-neutral-500">Approved:</span>
                  <span className="ml-1 text-neutral-900">
                    {month.approvedHours}h
                  </span>
                </div>
                <div>
                  <span className="text-neutral-500">Earnings:</span>
                  <span className="ml-1 font-medium text-neutral-900">
                    {formatCurrency(month.earnings)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {displayMonths.length === 0 && (
          <div className="text-center py-8">
            <Calendar className="mx-auto h-12 w-12 text-neutral-300" />
            <p className="mt-4 text-[13px] text-neutral-500">
              No earnings data for this year
            </p>
          </div>
        )}
      </AdminCard>

      {/* Payment History */}
      {paymentHistory.length > 0 && (
        <AdminCard hover={false}>
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">
            Payment History
          </h2>

          <div className="space-y-3">
            {paymentHistory.map((payment) => (
              <div
                key={payment.id}
                className="flex items-center justify-between rounded-xl border border-neutral-100 p-4"
              >
                <div>
                  <p className="text-sm font-medium text-neutral-900">
                    {formatMonth(payment.month)} {payment.month.split("-")[0]}
                  </p>
                  <p className="text-xs text-neutral-500">
                    {new Date(payment.paidAt).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                    {payment.reference && ` - Ref: ${payment.reference}`}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-neutral-900">
                    {formatCurrency(payment.amount)}
                  </p>
                  <p className="text-xs text-neutral-500">
                    {payment.hours} hours
                  </p>
                </div>
              </div>
            ))}
          </div>
        </AdminCard>
      )}

      {/* Rate Information */}
      <AdminCard hover={false} className="bg-gradient-to-r from-blue-50/50 to-transparent">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 flex-shrink-0">
            <PoundSterling className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-neutral-900">
              Rate Information
            </h3>
            <p className="mt-1 text-[13px] text-neutral-600">
              Your current hourly rate is{" "}
              <span className="font-semibold">
                {formatCurrency(summary.hourlyRate)}
              </span>{" "}
              per hour. Earnings are calculated based on approved hours only.
              Payments are typically processed at the end of each month.
            </p>
            <p className="mt-2 text-[13px] text-neutral-500">
              If you have questions about your rate or payments, please contact
              the admin team.
            </p>
          </div>
        </div>
      </AdminCard>
    </div>
  );
}
