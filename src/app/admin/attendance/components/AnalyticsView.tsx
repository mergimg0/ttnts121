"use client";

import { useEffect, useState, useCallback } from "react";
import { AdminCard } from "@/components/admin/ui/admin-card";
import { AdminSelect } from "@/components/admin/ui/admin-select";
import {
  AttendanceFilters,
  AttendanceFilterValues,
} from "./AttendanceFilters";
import { AttendanceTrendChart } from "./AttendanceTrendChart";
import { AtRiskStudentsTable } from "./AtRiskStudentsTable";
import { AttendanceAnalytics } from "@/types/attendance";
import {
  TrendingUp,
  Users,
  Calendar,
  BarChart3,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

type PeriodOption = "7" | "30" | "90" | "term";

interface AnalyticsViewProps {
  className?: string;
}

const PERIOD_OPTIONS = [
  { value: "7", label: "Last 7 days" },
  { value: "30", label: "Last 30 days" },
  { value: "90", label: "Last 90 days" },
  { value: "term", label: "This term" },
];

// Helper to calculate term dates (roughly)
function getTermDates(): { start: string; end: string } {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  // Simple term estimation:
  // Spring: Jan-Mar
  // Summer: Apr-Jul
  // Autumn: Sep-Dec
  let termStart: Date;
  let termEnd: Date;

  if (month >= 0 && month <= 2) {
    // Spring term
    termStart = new Date(year, 0, 6); // Jan 6
    termEnd = new Date(year, 2, 31); // Mar 31
  } else if (month >= 3 && month <= 6) {
    // Summer term
    termStart = new Date(year, 3, 15); // Apr 15
    termEnd = new Date(year, 6, 20); // Jul 20
  } else if (month >= 8 && month <= 11) {
    // Autumn term
    termStart = new Date(year, 8, 4); // Sep 4
    termEnd = new Date(year, 11, 20); // Dec 20
  } else {
    // August (summer holiday) - use previous term
    termStart = new Date(year, 3, 15);
    termEnd = new Date(year, 6, 20);
  }

  // Don't return future dates
  if (termEnd > now) {
    termEnd = now;
  }

  return {
    start: termStart.toISOString().split("T")[0],
    end: termEnd.toISOString().split("T")[0],
  };
}

function getDateRange(period: PeriodOption): { dateFrom: string; dateTo: string } {
  const now = new Date();
  const dateTo = now.toISOString().split("T")[0];

  if (period === "term") {
    const term = getTermDates();
    return { dateFrom: term.start, dateTo: term.end };
  }

  const days = parseInt(period);
  const dateFrom = new Date(now);
  dateFrom.setDate(dateFrom.getDate() - days);

  return {
    dateFrom: dateFrom.toISOString().split("T")[0],
    dateTo,
  };
}

export function AnalyticsView({ className }: AnalyticsViewProps) {
  const [period, setPeriod] = useState<PeriodOption>("30");
  const [filters, setFilters] = useState<AttendanceFilterValues>({
    sessionType: "",
    coachId: "",
    location: "",
  });
  const [analytics, setAnalytics] = useState<AttendanceAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { dateFrom, dateTo } = getDateRange(period);
      const params = new URLSearchParams({
        dateFrom,
        dateTo,
      });

      if (filters.sessionType) {
        params.set("sessionType", filters.sessionType);
      }
      if (filters.coachId) {
        params.set("coachId", filters.coachId);
      }

      const response = await fetch(
        `/api/admin/attendance/analytics?${params.toString()}`
      );
      const data = await response.json();

      if (data.success) {
        setAnalytics(data.data);
      } else {
        setError(data.error || "Failed to fetch analytics");
      }
    } catch (err) {
      console.error("Error fetching analytics:", err);
      setError("Failed to fetch analytics data");
    } finally {
      setLoading(false);
    }
  }, [period, filters]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const formatDateRange = () => {
    if (!analytics) return "";
    const start = new Date(analytics.period.start);
    const end = new Date(analytics.period.end);
    return `${start.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
    })} - ${end.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })}`;
  };

  const getRateColor = (rate: number) => {
    if (rate >= 80) return "text-emerald-600";
    if (rate >= 60) return "text-amber-600";
    return "text-red-600";
  };

  if (loading) {
    return (
      <div className={cn("space-y-6", className)}>
        <AdminCard>
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="h-8 w-8 text-neutral-400 animate-spin mb-4" />
            <p className="text-sm text-neutral-500">Loading analytics...</p>
          </div>
        </AdminCard>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn("space-y-6", className)}>
        <AdminCard>
          <div className="flex flex-col items-center justify-center py-16">
            <AlertCircle className="h-8 w-8 text-red-400 mb-4" />
            <p className="text-sm text-red-600">{error}</p>
            <button
              onClick={fetchAnalytics}
              className="mt-4 text-sm text-blue-600 hover:text-blue-700"
            >
              Try again
            </button>
          </div>
        </AdminCard>
      </div>
    );
  }

  if (!analytics) {
    return null;
  }

  // Calculate totals for KPI cards
  const totalSessions = analytics.trendData.length;
  const totalStudents = analytics.atRiskStudents.reduce(
    (sum, s) => sum + s.enrolled,
    0
  );

  return (
    <div className={cn("space-y-6", className)}>
      {/* Period Selector & Filters */}
      <AdminCard>
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex-shrink-0 w-full sm:w-48">
              <AdminSelect
                label="Period"
                value={period}
                onChange={(e) => setPeriod(e.target.value as PeriodOption)}
                options={PERIOD_OPTIONS}
              />
            </div>
            <div className="flex-1 text-sm text-neutral-500 sm:text-right">
              {formatDateRange()}
            </div>
          </div>
          <AttendanceFilters
            filters={filters}
            onFiltersChange={setFilters}
            hideExport={true}
          />
        </div>
      </AdminCard>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <AdminCard>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 mb-1">
                Overall Attendance
              </p>
              <p
                className={cn(
                  "text-3xl font-bold tabular-nums",
                  getRateColor(analytics.overallRate)
                )}
              >
                {analytics.overallRate}%
              </p>
            </div>
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </AdminCard>

        <AdminCard>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 mb-1">
                Days with Sessions
              </p>
              <p className="text-3xl font-bold text-neutral-900 tabular-nums">
                {totalSessions}
              </p>
            </div>
            <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-purple-600" />
            </div>
          </div>
        </AdminCard>

        <AdminCard>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 mb-1">
                At-Risk Students
              </p>
              <p
                className={cn(
                  "text-3xl font-bold tabular-nums",
                  analytics.atRiskStudents.length > 0
                    ? "text-amber-600"
                    : "text-emerald-600"
                )}
              >
                {analytics.atRiskStudents.length}
              </p>
            </div>
            <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center">
              <Users className="w-5 h-5 text-amber-600" />
            </div>
          </div>
        </AdminCard>
      </div>

      {/* Trend Chart */}
      <AdminCard>
        <AttendanceTrendChart
          data={analytics.trendData}
          title="Attendance Trend"
          height={280}
        />
      </AdminCard>

      {/* Session Type Breakdown */}
      {analytics.bySessionType.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AdminCard>
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-4 h-4 text-neutral-500" />
              <h4 className="text-[13px] font-semibold text-neutral-900">
                By Session Type
              </h4>
            </div>
            <div className="space-y-4">
              {analytics.bySessionType.map((item, index) => (
                <div key={index} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-neutral-700">{item.type}</span>
                    <span
                      className={cn(
                        "font-medium tabular-nums",
                        getRateColor(item.rate)
                      )}
                    >
                      {item.rate}%
                    </span>
                  </div>
                  <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-500",
                        item.rate >= 80
                          ? "bg-emerald-500"
                          : item.rate >= 60
                            ? "bg-amber-500"
                            : "bg-red-500"
                      )}
                      style={{ width: `${item.rate}%` }}
                    />
                  </div>
                  <p className="text-xs text-neutral-400">
                    {item.count} enrolled students
                  </p>
                </div>
              ))}
            </div>
          </AdminCard>

          <AdminCard>
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-4 h-4 text-neutral-500" />
              <h4 className="text-[13px] font-semibold text-neutral-900">
                By Day of Week
              </h4>
            </div>
            <div className="space-y-3">
              {analytics.byDayOfWeek.map((item, index) => (
                <div key={index} className="flex items-center gap-4">
                  <span className="w-10 text-sm font-medium text-neutral-600">
                    {item.day}
                  </span>
                  <div className="flex-1 h-6 bg-neutral-100 rounded-lg overflow-hidden relative">
                    <div
                      className={cn(
                        "h-full rounded-lg transition-all duration-500",
                        item.avgRate >= 80
                          ? "bg-emerald-500"
                          : item.avgRate >= 60
                            ? "bg-amber-500"
                            : "bg-red-500"
                      )}
                      style={{ width: `${item.avgRate}%` }}
                    />
                    <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-neutral-900 mix-blend-darken">
                      {item.avgRate}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
            {analytics.byDayOfWeek.length === 0 && (
              <p className="text-sm text-neutral-500 text-center py-8">
                No day breakdown available
              </p>
            )}
          </AdminCard>
        </div>
      )}

      {/* At-Risk Students Table */}
      <AdminCard>
        <AtRiskStudentsTable students={analytics.atRiskStudents} />
      </AdminCard>
    </div>
  );
}
