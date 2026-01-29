"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight, Calendar, ClipboardCheck, Users, CalendarDays } from "lucide-react";
import { TableSkeleton } from "@/components/ui/skeleton";
import { AdminCard } from "@/components/admin/ui/admin-card";
import { MonthlyAttendanceSummary, SessionType } from "@/types/attendance";
import { AttendanceFilters, AttendanceFilterValues } from "./AttendanceFilters";
import { MonthlyCalendar } from "./MonthlyCalendar";

interface MonthlyViewProps {
  onNavigateToDay: (date: string) => void;
}

const DEFAULT_FILTERS: AttendanceFilterValues = {
  sessionType: "",
  coachId: "",
  location: "",
};

export function MonthlyView({ onNavigateToDay }: MonthlyViewProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // State for current month/year
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return { month: now.getMonth() + 1, year: now.getFullYear() };
  });

  // State for data
  const [summary, setSummary] = useState<MonthlyAttendanceSummary | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters state
  const [filters, setFilters] = useState<AttendanceFilterValues>(() => {
    return {
      sessionType: (searchParams.get("sessionType") as SessionType) || "",
      coachId: searchParams.get("coachId") || "",
      location: searchParams.get("location") || "",
    };
  });

  // Sync filters to URL
  const updateURL = useCallback(
    (newFilters: AttendanceFilterValues) => {
      const params = new URLSearchParams(searchParams.toString());

      if (newFilters.sessionType) {
        params.set("sessionType", newFilters.sessionType);
      } else {
        params.delete("sessionType");
      }

      if (newFilters.coachId) {
        params.set("coachId", newFilters.coachId);
      } else {
        params.delete("coachId");
      }

      if (newFilters.location) {
        params.set("location", newFilters.location);
      } else {
        params.delete("location");
      }

      const newURL = params.toString() ? `${pathname}?${params.toString()}` : pathname;
      router.replace(newURL, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  const handleFiltersChange = (newFilters: AttendanceFilterValues) => {
    setFilters(newFilters);
    updateURL(newFilters);
  };

  // Fetch monthly data
  const fetchMonthlyData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        month: String(currentMonth.month),
        year: String(currentMonth.year),
      });

      // Add filters
      if (filters.sessionType) {
        params.set("sessionType", filters.sessionType);
      }
      if (filters.coachId) {
        params.set("coachId", filters.coachId);
      }
      if (filters.location) {
        params.set("location", filters.location);
      }

      const response = await fetch(`/api/admin/attendance/monthly?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setSummary(data.data);
      }
    } catch (error) {
      console.error("Error fetching monthly attendance:", error);
    } finally {
      setLoading(false);
    }
  }, [currentMonth, filters]);

  useEffect(() => {
    fetchMonthlyData();
  }, [fetchMonthlyData]);

  // Navigation handlers
  const navigateMonth = (delta: number) => {
    setCurrentMonth((prev) => {
      let newMonth = prev.month + delta;
      let newYear = prev.year;

      if (newMonth > 12) {
        newMonth = 1;
        newYear++;
      } else if (newMonth < 1) {
        newMonth = 12;
        newYear--;
      }

      return { month: newMonth, year: newYear };
    });
  };

  const goToCurrentMonth = () => {
    const now = new Date();
    setCurrentMonth({ month: now.getMonth() + 1, year: now.getFullYear() });
  };

  // Format month/year for display
  const formatMonthYear = () => {
    const date = new Date(currentMonth.year, currentMonth.month - 1);
    return date.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
  };

  // Calculate stats
  const stats = summary
    ? {
        totalDays: summary.dailyRates.length,
        totalSessions: summary.dailyRates.reduce((sum, d) => sum + d.sessionCount, 0),
        avgRate: summary.averageAttendanceRate,
      }
    : null;

  const hasActiveFilters = filters.sessionType || filters.coachId || filters.location;

  return (
    <div className="space-y-6">
      {/* Filters */}
      <AttendanceFilters filters={filters} onFiltersChange={handleFiltersChange} />

      {/* Month Navigation */}
      <div className="flex items-center justify-between bg-white rounded-2xl border border-neutral-200/60 p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <button
          onClick={() => navigateMonth(-1)}
          className="p-2 text-neutral-400 hover:text-neutral-900 rounded-lg hover:bg-neutral-100 transition-colors"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3">
          <Calendar className="h-5 w-5 text-neutral-400" />
          <div className="text-center">
            <h3 className="text-lg font-semibold text-neutral-900">{formatMonthYear()}</h3>
            <button
              onClick={goToCurrentMonth}
              className="text-[13px] text-sky-600 hover:text-sky-700 hover:underline"
            >
              Go to current month
            </button>
          </div>
        </div>

        <button
          onClick={() => navigateMonth(1)}
          className="p-2 text-neutral-400 hover:text-neutral-900 rounded-lg hover:bg-neutral-100 transition-colors"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {loading ? (
        <TableSkeleton rows={6} columns={7} />
      ) : (
        <>
          {/* Summary Stats */}
          {stats && (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              <AdminCard hover={false}>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50">
                    <CalendarDays className="h-5 w-5 text-sky-600" />
                  </div>
                  <div>
                    <p className="text-[13px] text-neutral-500">
                      Days with Sessions{hasActiveFilters ? " (Filtered)" : ""}
                    </p>
                    <p className="text-xl font-bold text-neutral-900">{stats.totalDays}</p>
                  </div>
                </div>
              </AdminCard>

              <AdminCard hover={false}>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50">
                    <Users className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-[13px] text-neutral-500">Total Sessions</p>
                    <p className="text-xl font-bold text-neutral-900">{stats.totalSessions}</p>
                  </div>
                </div>
              </AdminCard>

              <AdminCard hover={false} className="col-span-2 lg:col-span-1">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50">
                    <ClipboardCheck className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-[13px] text-neutral-500">Average Attendance</p>
                    <p className="text-xl font-bold text-neutral-900">{stats.avgRate}%</p>
                  </div>
                </div>
              </AdminCard>
            </div>
          )}

          {/* Calendar */}
          {summary && (
            <MonthlyCalendar
              year={currentMonth.year}
              month={currentMonth.month}
              dailyRates={summary.dailyRates}
              onDayClick={onNavigateToDay}
            />
          )}

          {/* Empty state if no data */}
          {summary && summary.dailyRates.length === 0 && (
            <AdminCard>
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100 mb-4">
                  <Calendar className="h-6 w-6 text-neutral-400" />
                </div>
                <h3 className="text-lg font-semibold text-neutral-900 mb-2">No sessions this month</h3>
                <p className="text-sm text-neutral-500 max-w-md">
                  {hasActiveFilters
                    ? "No sessions match your current filters for this month. Try adjusting your filters."
                    : "There are no scheduled sessions for this month."}
                </p>
              </div>
            </AdminCard>
          )}
        </>
      )}
    </div>
  );
}
