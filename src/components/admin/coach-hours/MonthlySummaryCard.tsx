"use client";

import { AdminCard } from "@/components/admin/ui/admin-card";
import { formatCurrency, formatHours } from "@/types/coach";
import { Clock, TrendingUp, TrendingDown, Minus, PoundSterling, Calendar, CheckCircle } from "lucide-react";

interface MonthlySummaryCardProps {
  totalHours: number;
  totalEarnings: number;
  previousMonthHours?: number;
  percentageChange?: number;
  verifiedDays: number;
  unverifiedDays: number;
  loading?: boolean;
}

export function MonthlySummaryCard({
  totalHours,
  totalEarnings,
  previousMonthHours,
  percentageChange,
  verifiedDays,
  unverifiedDays,
  loading = false,
}: MonthlySummaryCardProps) {
  const getTrendIcon = () => {
    if (percentageChange === undefined || percentageChange === 0) {
      return <Minus className="h-4 w-4 text-neutral-400" />;
    }
    if (percentageChange > 0) {
      return <TrendingUp className="h-4 w-4 text-emerald-500" />;
    }
    return <TrendingDown className="h-4 w-4 text-red-500" />;
  };

  const getTrendColor = () => {
    if (percentageChange === undefined || percentageChange === 0) {
      return "text-neutral-500";
    }
    if (percentageChange > 0) {
      return "text-emerald-600";
    }
    return "text-red-600";
  };

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <AdminCard key={i} hover={false}>
            <div className="animate-pulse">
              <div className="h-10 w-10 rounded-xl bg-neutral-200" />
              <div className="mt-3 h-8 w-20 rounded bg-neutral-200" />
              <div className="mt-1 h-4 w-24 rounded bg-neutral-100" />
            </div>
          </AdminCard>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {/* Total Hours */}
      <AdminCard hover={false}>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-100">
            <Clock className="h-5 w-5 text-sky-600" />
          </div>
          <div>
            <p className="text-2xl font-semibold tabular-nums">
              {formatHours(totalHours)}
            </p>
            <p className="text-xs text-neutral-500">Total Hours</p>
          </div>
        </div>
      </AdminCard>

      {/* Total Earnings */}
      <AdminCard hover={false}>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100">
            <PoundSterling className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-2xl font-semibold tabular-nums">
              {formatCurrency(totalEarnings)}
            </p>
            <p className="text-xs text-neutral-500">Total Earnings</p>
          </div>
        </div>
      </AdminCard>

      {/* Comparison to Previous Month */}
      <AdminCard hover={false}>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100">
            {getTrendIcon()}
          </div>
          <div>
            <div className="flex items-baseline gap-1">
              <p className={`text-2xl font-semibold tabular-nums ${getTrendColor()}`}>
                {percentageChange !== undefined
                  ? `${percentageChange > 0 ? "+" : ""}${percentageChange.toFixed(1)}%`
                  : "N/A"}
              </p>
            </div>
            <p className="text-xs text-neutral-500">
              {previousMonthHours !== undefined
                ? `vs ${formatHours(previousMonthHours)} last month`
                : "No previous data"}
            </p>
          </div>
        </div>
      </AdminCard>

      {/* Verification Status */}
      <AdminCard hover={false}>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100">
            <CheckCircle className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <p className="text-2xl font-semibold tabular-nums">
              {verifiedDays}/{verifiedDays + unverifiedDays}
            </p>
            <p className="text-xs text-neutral-500">Days Verified</p>
          </div>
        </div>
      </AdminCard>
    </div>
  );
}

interface CoachSummaryStatsProps {
  totalCoaches: number;
  totalHours: number;
  totalEarnings: number;
  fullyVerified: number;
  loading?: boolean;
}

export function CoachSummaryStats({
  totalCoaches,
  totalHours,
  totalEarnings,
  fullyVerified,
  loading = false,
}: CoachSummaryStatsProps) {
  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <AdminCard key={i} hover={false}>
            <div className="animate-pulse">
              <div className="h-10 w-10 rounded-xl bg-neutral-200" />
              <div className="mt-3 h-8 w-20 rounded bg-neutral-200" />
              <div className="mt-1 h-4 w-24 rounded bg-neutral-100" />
            </div>
          </AdminCard>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {/* Total Coaches */}
      <AdminCard hover={false}>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-100">
            <Calendar className="h-5 w-5 text-sky-600" />
          </div>
          <div>
            <p className="text-2xl font-semibold tabular-nums">{totalCoaches}</p>
            <p className="text-xs text-neutral-500">Coaches</p>
          </div>
        </div>
      </AdminCard>

      {/* Total Hours */}
      <AdminCard hover={false}>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100">
            <Clock className="h-5 w-5 text-purple-600" />
          </div>
          <div>
            <p className="text-2xl font-semibold tabular-nums">
              {formatHours(totalHours)}
            </p>
            <p className="text-xs text-neutral-500">Total Hours</p>
          </div>
        </div>
      </AdminCard>

      {/* Total Earnings */}
      <AdminCard hover={false}>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100">
            <PoundSterling className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-2xl font-semibold tabular-nums">
              {formatCurrency(totalEarnings)}
            </p>
            <p className="text-xs text-neutral-500">Total Payroll</p>
          </div>
        </div>
      </AdminCard>

      {/* Verified */}
      <AdminCard hover={false}>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100">
            <CheckCircle className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <p className="text-2xl font-semibold tabular-nums">
              {fullyVerified}/{totalCoaches}
            </p>
            <p className="text-xs text-neutral-500">Fully Verified</p>
          </div>
        </div>
      </AdminCard>
    </div>
  );
}
