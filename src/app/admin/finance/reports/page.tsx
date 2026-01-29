"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { AdminCard } from "@/components/admin/ui/admin-card";
import { AdminPageHeader } from "@/components/admin/ui/admin-page-header";
import { AdminSelect } from "@/components/admin/ui/admin-select";
import { DateRangePicker } from "@/components/admin/ui/date-range-picker";
import {
  PieChart,
  LineChart,
  StatComparison,
} from "@/components/admin/finance/FinancialChart";
import { Button } from "@/components/ui/button";
import {
  Download,
  RefreshCw,
  AlertCircle,
  Loader2,
  TrendingUp,
  TrendingDown,
  Wallet,
} from "lucide-react";
import {
  DailyFinancial,
  FinancialTrendPoint,
  formatFinancialAmount,
  INCOME_CATEGORY_LABELS,
  EXPENSE_CATEGORY_LABELS,
  INCOME_CATEGORY_COLORS,
  EXPENSE_CATEGORY_COLORS,
  calculateIncomeTotal,
  calculateExpenseTotal,
} from "@/types/financials";

type PeriodType = "weekly" | "monthly" | "custom";

interface ReportData {
  entries: DailyFinancial[];
  totals: {
    income: number;
    expenses: number;
    profit: number;
  };
  incomeBreakdown: Record<string, number>;
  expenseBreakdown: Record<string, number>;
  trendData: FinancialTrendPoint[];
  comparison?: {
    previousIncome: number;
    previousExpenses: number;
    previousProfit: number;
  };
}

function FinanceReportsContent() {
  const searchParams = useSearchParams();
  const shouldExport = searchParams.get("export") === "true";

  // Period selection
  const [periodType, setPeriodType] = useState<PeriodType>("monthly");
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(1); // First day of month
    return date.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split("T")[0];
  });

  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  // Set date range based on period type
  useEffect(() => {
    const now = new Date();
    let start: Date;
    const end: Date = new Date();

    switch (periodType) {
      case "weekly":
        // Start of current week (Monday)
        start = new Date(now);
        const day = start.getDay();
        const diff = start.getDate() - day + (day === 0 ? -6 : 1);
        start.setDate(diff);
        break;
      case "monthly":
        // Start of current month
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case "custom":
        // Don't change dates for custom
        return;
      default:
        start = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    setStartDate(start.toISOString().split("T")[0]);
    setEndDate(end.toISOString().split("T")[0]);
  }, [periodType]);

  // Fetch report data
  const fetchReportData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        startDate,
        endDate,
      });

      const response = await fetch(`/api/admin/finance/reports?${params}`);
      const data = await response.json();

      if (data.success) {
        setReportData(data.data);
      } else {
        setError(data.error || "Failed to load report data");
      }
    } catch (err) {
      console.error("Failed to fetch report:", err);
      setError("Failed to connect to server");
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    fetchReportData();
  }, [fetchReportData]);

  // Handle export
  const handleExport = async () => {
    try {
      setExporting(true);

      const params = new URLSearchParams({
        startDate,
        endDate,
        format: "csv",
      });

      const response = await fetch(`/api/admin/finance/export?${params}`);

      if (!response.ok) {
        throw new Error("Export failed");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `finance-report-${startDate}-to-${endDate}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error("Export failed:", err);
      setError("Failed to export data");
    } finally {
      setExporting(false);
    }
  };

  // Trigger export if URL param set
  useEffect(() => {
    if (shouldExport && reportData && !loading) {
      handleExport();
    }
  }, [shouldExport, reportData, loading]);

  // Prepare chart data
  const incomeChartData = reportData
    ? Object.entries(reportData.incomeBreakdown)
        .filter(([_, value]) => value > 0)
        .map(([key, value]) => ({
          label: INCOME_CATEGORY_LABELS[key] || key,
          value,
          color: INCOME_CATEGORY_COLORS[key] || "#6B7280",
        }))
    : [];

  const expenseChartData = reportData
    ? Object.entries(reportData.expenseBreakdown)
        .filter(([_, value]) => value > 0)
        .map(([key, value]) => ({
          label: EXPENSE_CATEGORY_LABELS[key] || key,
          value,
          color: EXPENSE_CATEGORY_COLORS[key] || "#6B7280",
        }))
    : [];

  const trendChartData = reportData
    ? reportData.trendData.map((point) => ({
        label: point.label,
        value: point.profit,
        secondaryValue: point.income,
      }))
    : [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <AdminPageHeader
        title="Financial Reports"
        subtitle="Analyze income, expenses, and profit trends"
      >
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchReportData}
            disabled={loading}
            className="h-9"
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          <Button
            variant="adminPrimary"
            size="sm"
            onClick={handleExport}
            disabled={exporting || !reportData}
            className="h-9"
          >
            {exporting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            Export CSV
          </Button>
        </div>
      </AdminPageHeader>

      {/* Period Selector */}
      <AdminCard hover={false}>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 items-end">
          <AdminSelect
            label="Period"
            value={periodType}
            onChange={(e) => setPeriodType(e.target.value as PeriodType)}
            options={[
              { value: "weekly", label: "This Week" },
              { value: "monthly", label: "This Month" },
              { value: "custom", label: "Custom Range" },
            ]}
          />

          {periodType === "custom" && (
            <>
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-neutral-500 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="flex h-11 w-full rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm text-neutral-900 transition-all duration-200 focus:outline-none focus:ring-2 focus:border-sky-500 focus:ring-sky-500/20"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-neutral-500 mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate}
                  className="flex h-11 w-full rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm text-neutral-900 transition-all duration-200 focus:outline-none focus:ring-2 focus:border-sky-500 focus:ring-sky-500/20"
                />
              </div>
            </>
          )}

          <div className="text-right">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 mb-1">
              Report Period
            </p>
            <p className="text-sm text-neutral-700">
              {new Date(startDate).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
              })}{" "}
              -{" "}
              {new Date(endDate).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </p>
          </div>
        </div>
      </AdminCard>

      {/* Error State */}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
          <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
        </div>
      ) : reportData ? (
        <>
          {/* Summary Stats */}
          <div className="grid gap-3 grid-cols-3">
            <AdminCard hover={false} className="border-l-4 border-l-emerald-500">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50">
                  <TrendingUp className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                    Total Income
                  </p>
                  <p className="text-xl font-bold text-emerald-600">
                    {formatFinancialAmount(reportData.totals.income)}
                  </p>
                </div>
              </div>
            </AdminCard>

            <AdminCard hover={false} className="border-l-4 border-l-red-500">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50">
                  <TrendingDown className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                    Total Expenses
                  </p>
                  <p className="text-xl font-bold text-red-600">
                    {formatFinancialAmount(reportData.totals.expenses)}
                  </p>
                </div>
              </div>
            </AdminCard>

            <AdminCard
              hover={false}
              className={`border-l-4 ${
                reportData.totals.profit >= 0
                  ? "border-l-emerald-500"
                  : "border-l-red-500"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                    reportData.totals.profit >= 0 ? "bg-emerald-50" : "bg-red-50"
                  }`}
                >
                  <Wallet
                    className={`h-5 w-5 ${
                      reportData.totals.profit >= 0
                        ? "text-emerald-600"
                        : "text-red-600"
                    }`}
                  />
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                    Net Profit
                  </p>
                  <p
                    className={`text-xl font-bold ${
                      reportData.totals.profit >= 0
                        ? "text-emerald-600"
                        : "text-red-600"
                    }`}
                  >
                    {formatFinancialAmount(reportData.totals.profit)}
                  </p>
                </div>
              </div>
            </AdminCard>
          </div>

          {/* Comparison (if available) */}
          {reportData.comparison && (
            <AdminCard hover={false}>
              <h3 className="text-[15px] font-semibold text-neutral-900 mb-6">
                vs Previous Period
              </h3>
              <div className="grid gap-6 sm:grid-cols-3">
                <StatComparison
                  current={reportData.totals.income}
                  previous={reportData.comparison.previousIncome}
                  label="Income"
                />
                <StatComparison
                  current={reportData.totals.expenses}
                  previous={reportData.comparison.previousExpenses}
                  label="Expenses"
                />
                <StatComparison
                  current={reportData.totals.profit}
                  previous={reportData.comparison.previousProfit}
                  label="Profit"
                />
              </div>
            </AdminCard>
          )}

          {/* Charts Row */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Revenue Breakdown */}
            <AdminCard hover={false}>
              <PieChart
                data={incomeChartData}
                title="Revenue by Category"
                size={180}
              />
            </AdminCard>

            {/* Expense Breakdown */}
            <AdminCard hover={false}>
              <PieChart
                data={expenseChartData}
                title="Expenses by Category"
                size={180}
              />
            </AdminCard>
          </div>

          {/* Profit Trend */}
          <AdminCard hover={false}>
            <LineChart
              data={trendChartData}
              title="Profit Trend"
              height={250}
              primaryLabel="Profit"
              secondaryLabel="Income"
              primaryColor="#10B981"
              secondaryColor="#3B82F6"
            />
          </AdminCard>

          {/* Daily Breakdown Table */}
          <AdminCard hover={false}>
            <h3 className="text-[15px] font-semibold text-neutral-900 mb-4">
              Daily Breakdown
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-100">
                    <th className="text-left py-3 px-2 text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                      Date
                    </th>
                    <th className="text-right py-3 px-2 text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                      Income
                    </th>
                    <th className="text-right py-3 px-2 text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                      Expenses
                    </th>
                    <th className="text-right py-3 px-2 text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                      Profit
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.entries.length > 0 ? (
                    reportData.entries.map((entry) => (
                      <tr
                        key={entry.id}
                        className="border-b border-neutral-50 hover:bg-neutral-50/50"
                      >
                        <td className="py-3 px-2">
                          <Link
                            href={`/admin/finance/daily?date=${entry.date}`}
                            className="text-neutral-900 hover:text-sky-600 transition-colors"
                          >
                            <span className="font-medium">{entry.dayName}</span>
                            <span className="text-neutral-500 ml-2">
                              {new Date(entry.date).toLocaleDateString("en-GB", {
                                day: "numeric",
                                month: "short",
                              })}
                            </span>
                          </Link>
                        </td>
                        <td className="py-3 px-2 text-right font-medium text-emerald-600 tabular-nums">
                          {formatFinancialAmount(entry.income.total)}
                        </td>
                        <td className="py-3 px-2 text-right font-medium text-red-600 tabular-nums">
                          {formatFinancialAmount(entry.expenses.total)}
                        </td>
                        <td
                          className={`py-3 px-2 text-right font-bold tabular-nums ${
                            entry.grossProfit >= 0
                              ? "text-emerald-600"
                              : "text-red-600"
                          }`}
                        >
                          {formatFinancialAmount(entry.grossProfit)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={4}
                        className="py-8 text-center text-neutral-500"
                      >
                        No entries for this period
                      </td>
                    </tr>
                  )}
                </tbody>
                {reportData.entries.length > 0 && (
                  <tfoot>
                    <tr className="bg-neutral-50 font-semibold">
                      <td className="py-3 px-2 text-neutral-900">Total</td>
                      <td className="py-3 px-2 text-right text-emerald-600 tabular-nums">
                        {formatFinancialAmount(reportData.totals.income)}
                      </td>
                      <td className="py-3 px-2 text-right text-red-600 tabular-nums">
                        {formatFinancialAmount(reportData.totals.expenses)}
                      </td>
                      <td
                        className={`py-3 px-2 text-right tabular-nums ${
                          reportData.totals.profit >= 0
                            ? "text-emerald-600"
                            : "text-red-600"
                        }`}
                      >
                        {formatFinancialAmount(reportData.totals.profit)}
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </AdminCard>
        </>
      ) : null}

      {/* Back Link */}
      <div className="text-center">
        <Button variant="outline" asChild>
          <Link href="/admin/finance">Back to Finance</Link>
        </Button>
      </div>
    </div>
  );
}

export default function FinanceReportsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
        </div>
      }
    >
      <FinanceReportsContent />
    </Suspense>
  );
}
