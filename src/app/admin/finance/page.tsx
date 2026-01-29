"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminCard } from "@/components/admin/ui/admin-card";
import { AdminPageHeader } from "@/components/admin/ui/admin-page-header";
import { AdminQuickAction } from "@/components/admin/ui/admin-quick-action";
import { AdminEmptyState } from "@/components/admin/ui/admin-empty-state";
import { StatsCard } from "@/components/admin/stats-card";
import { Button } from "@/components/ui/button";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Calendar,
  BarChart3,
  PlusCircle,
  FileText,
  RefreshCw,
  AlertCircle,
  ArrowRight,
  PiggyBank,
} from "lucide-react";
import {
  DailyFinancial,
  formatFinancialAmount,
  calculateIncomeTotal,
  calculateExpenseTotal,
  calculateGrossProfit,
} from "@/types/financials";

interface FinancialSummary {
  today: {
    income: number;
    expenses: number;
    profit: number;
  };
  thisWeek: {
    income: number;
    expenses: number;
    profit: number;
  };
  thisMonth: {
    income: number;
    expenses: number;
    profit: number;
  };
  recentEntries: DailyFinancial[];
}

export default function FinanceDashboard() {
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch summary data
      const response = await fetch("/api/admin/finance/summary");
      const data = await response.json();

      if (data.success) {
        setSummary(data.data);
      } else {
        setError(data.error || "Failed to load financial summary");
      }
    } catch (err) {
      console.error("Failed to fetch financial summary:", err);
      setError("Failed to connect to server");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  // Format today's date
  const today = new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  if (loading && !summary) {
    return (
      <div className="space-y-8">
        <div className="h-8 w-48 bg-neutral-100 rounded-lg animate-pulse" />
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="h-32 bg-neutral-100 rounded-xl animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  if (error && !summary) {
    return (
      <div className="space-y-8">
        <AdminPageHeader
          title="Finance"
          subtitle="Track income, expenses, and profit"
        />
        <AdminCard hover={false}>
          <div className="py-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50 mx-auto mb-4">
              <AlertCircle className="h-6 w-6 text-red-500" />
            </div>
            <p className="text-neutral-900 font-medium mb-2">
              Failed to load financial data
            </p>
            <p className="text-neutral-500 text-sm mb-4">{error}</p>
            <Button variant="outline" onClick={fetchSummary}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
          </div>
        </AdminCard>
      </div>
    );
  }

  // Check for empty state - no data at all
  if (!loading && !error && !summary) {
    return (
      <div className="space-y-8">
        <AdminPageHeader
          title="Finance"
          subtitle="Track income, expenses, and profit"
        />
        <AdminEmptyState
          icon={PiggyBank}
          title="No financial data yet"
          description="Start tracking your income and expenses by adding your first daily entry."
          action={
            <Button variant="adminPrimary" asChild>
              <Link href="/admin/finance/daily">
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Today's Entry
              </Link>
            </Button>
          }
        />
      </div>
    );
  }

  // Use fallback data for partial data scenarios
  const data: FinancialSummary = summary || {
    today: { income: 0, expenses: 0, profit: 0 },
    thisWeek: { income: 0, expenses: 0, profit: 0 },
    thisMonth: { income: 0, expenses: 0, profit: 0 },
    recentEntries: [],
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <AdminPageHeader
        title="Finance"
        subtitle="Track income, expenses, and profit"
      >
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchSummary}
            disabled={loading}
            className="h-9"
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          <Button variant="adminPrimary" asChild>
            <Link href="/admin/finance/daily">
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Entry
            </Link>
          </Button>
        </div>
      </AdminPageHeader>

      {/* Today's Date Banner */}
      <div className="text-center py-3 bg-gradient-to-r from-sky-50 to-transparent rounded-xl">
        <p className="text-sm text-neutral-600">{today}</p>
      </div>

      {/* Today's Stats */}
      <div>
        <h2 className="text-[13px] font-semibold uppercase tracking-wider text-neutral-500 mb-4">
          Today
        </h2>
        <div className="grid gap-3 grid-cols-3">
          <StatsCard
            title="Income"
            value={formatFinancialAmount(data.today.income)}
            icon={TrendingUp}
            className="border-l-4 border-l-emerald-500"
          />
          <StatsCard
            title="Expenses"
            value={formatFinancialAmount(data.today.expenses)}
            icon={TrendingDown}
            className="border-l-4 border-l-red-500"
          />
          <StatsCard
            title="Profit"
            value={formatFinancialAmount(data.today.profit)}
            icon={Wallet}
            className={`border-l-4 ${
              data.today.profit >= 0
                ? "border-l-emerald-500"
                : "border-l-red-500"
            }`}
          />
        </div>
      </div>

      {/* Weekly & Monthly Stats */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* This Week */}
        <AdminCard hover={false}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[15px] font-semibold text-neutral-900">
              This Week
            </h2>
            <Calendar className="h-4 w-4 text-neutral-400" />
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-neutral-50">
              <span className="text-sm text-neutral-600">Income</span>
              <span className="text-sm font-semibold text-emerald-600">
                {formatFinancialAmount(data.thisWeek.income)}
              </span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-neutral-50">
              <span className="text-sm text-neutral-600">Expenses</span>
              <span className="text-sm font-semibold text-red-600">
                {formatFinancialAmount(data.thisWeek.expenses)}
              </span>
            </div>
            <div className="flex items-center justify-between py-3">
              <span className="text-sm font-medium text-neutral-900">
                Profit
              </span>
              <span
                className={`text-lg font-bold ${
                  data.thisWeek.profit >= 0
                    ? "text-emerald-600"
                    : "text-red-600"
                }`}
              >
                {formatFinancialAmount(data.thisWeek.profit)}
              </span>
            </div>
          </div>
        </AdminCard>

        {/* This Month */}
        <AdminCard hover={false}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[15px] font-semibold text-neutral-900">
              This Month
            </h2>
            <Calendar className="h-4 w-4 text-neutral-400" />
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-neutral-50">
              <span className="text-sm text-neutral-600">Income</span>
              <span className="text-sm font-semibold text-emerald-600">
                {formatFinancialAmount(data.thisMonth.income)}
              </span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-neutral-50">
              <span className="text-sm text-neutral-600">Expenses</span>
              <span className="text-sm font-semibold text-red-600">
                {formatFinancialAmount(data.thisMonth.expenses)}
              </span>
            </div>
            <div className="flex items-center justify-between py-3">
              <span className="text-sm font-medium text-neutral-900">
                Profit
              </span>
              <span
                className={`text-lg font-bold ${
                  data.thisMonth.profit >= 0
                    ? "text-emerald-600"
                    : "text-red-600"
                }`}
              >
                {formatFinancialAmount(data.thisMonth.profit)}
              </span>
            </div>
          </div>
        </AdminCard>
      </div>

      {/* Quick Actions & Recent Entries */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Quick Actions */}
        <AdminCard hover={false}>
          <h2 className="text-[15px] font-semibold text-neutral-900 mb-4">
            Quick Actions
          </h2>
          <div className="space-y-3">
            <AdminQuickAction
              href="/admin/finance/daily"
              icon={PlusCircle}
              label="Add Daily Entry"
              description="Log today's income and expenses"
            />
            <AdminQuickAction
              href="/admin/finance/reports"
              icon={BarChart3}
              label="View Reports"
              description="Detailed financial reports and charts"
            />
            <AdminQuickAction
              href="/admin/finance/reports?export=true"
              icon={FileText}
              label="Export Data"
              description="Download financial data as CSV"
            />
          </div>
        </AdminCard>

        {/* Recent Entries */}
        <AdminCard hover={false}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[15px] font-semibold text-neutral-900">
              Recent Entries
            </h2>
            <Link
              href="/admin/finance/daily"
              className="inline-flex items-center gap-1 text-[13px] font-medium text-neutral-500 hover:text-sky-600 transition-colors"
            >
              View all
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="space-y-3">
            {data.recentEntries && data.recentEntries.length > 0 ? (
              data.recentEntries.slice(0, 5).map((entry) => (
                <Link
                  key={entry.id}
                  href={`/admin/finance/daily?date=${entry.date}`}
                  className="flex items-center justify-between py-3 border-b border-neutral-50 last:border-0 hover:bg-neutral-50/50 -mx-2 px-2 rounded-lg transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium text-neutral-900">
                      {entry.dayName}
                    </p>
                    <p className="text-[13px] text-neutral-500">
                      {new Date(entry.date).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p
                      className={`text-sm font-semibold ${
                        entry.grossProfit >= 0
                          ? "text-emerald-600"
                          : "text-red-600"
                      }`}
                    >
                      {formatFinancialAmount(entry.grossProfit)}
                    </p>
                    <p className="text-[11px] text-neutral-400">profit</p>
                  </div>
                </Link>
              ))
            ) : (
              <div className="py-8 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-neutral-50 mx-auto mb-3">
                  <Wallet className="h-6 w-6 text-neutral-400" />
                </div>
                <p className="text-neutral-500 text-sm mb-3">
                  No entries yet
                </p>
                <Button variant="adminPrimary" size="sm" asChild>
                  <Link href="/admin/finance/daily">Add First Entry</Link>
                </Button>
              </div>
            )}
          </div>
        </AdminCard>
      </div>
    </div>
  );
}
