"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight, Calendar, Users, CheckCircle, TrendingUp } from "lucide-react";
import { TableSkeleton } from "@/components/ui/skeleton";
import { AdminCard } from "@/components/admin/ui/admin-card";
import { AdminEmptyState } from "@/components/admin/ui/admin-empty-state";
import { WeeklyAttendanceSummary, SessionType } from "@/types/attendance";
import { AttendanceFilters, AttendanceFilterValues } from "./AttendanceFilters";
import { WeeklyGrid } from "./WeeklyGrid";

interface WeeklyViewProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
}

// Get the Monday of the week containing the given date
function getWeekStart(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday
  d.setDate(diff);
  return d.toISOString().split("T")[0];
}

// Format week range for display
function formatWeekRange(weekStart: string, weekEnd: string): string {
  const start = new Date(weekStart);
  const end = new Date(weekEnd);

  const startMonth = start.toLocaleDateString("en-GB", { month: "short" });
  const endMonth = end.toLocaleDateString("en-GB", { month: "short" });
  const year = end.getFullYear();

  if (startMonth === endMonth) {
    return `${start.getDate()} - ${end.getDate()} ${startMonth} ${year}`;
  }
  return `${start.getDate()} ${startMonth} - ${end.getDate()} ${endMonth} ${year}`;
}

export function WeeklyView({ selectedDate, onDateChange }: WeeklyViewProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [weeklyData, setWeeklyData] = useState<WeeklyAttendanceSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<AttendanceFilterValues>(() => {
    return {
      sessionType: (searchParams.get("sessionType") as SessionType) || "",
      coachId: searchParams.get("coachId") || "",
      location: searchParams.get("location") || "",
    };
  });

  // Calculate current week start
  const weekStart = getWeekStart(new Date(selectedDate));

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

  const fetchWeeklyData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        weekStart,
      });

      if (filters.sessionType) {
        params.set("sessionType", filters.sessionType);
      }
      if (filters.coachId) {
        params.set("coachId", filters.coachId);
      }
      if (filters.location) {
        params.set("location", filters.location);
      }

      const response = await fetch(`/api/admin/attendance/weekly?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setWeeklyData(data.data);
      } else {
        setError(data.error || "Failed to fetch weekly data");
      }
    } catch (err) {
      console.error("Error fetching weekly attendance:", err);
      setError("Failed to fetch weekly attendance data");
    } finally {
      setLoading(false);
    }
  }, [weekStart, filters]);

  useEffect(() => {
    fetchWeeklyData();
  }, [fetchWeeklyData]);

  // Navigate to previous/next week
  const navigateWeek = (direction: number) => {
    const current = new Date(weekStart);
    current.setDate(current.getDate() + direction * 7);
    onDateChange(current.toISOString().split("T")[0]);
  };

  // Handle day click - switch to daily view
  const handleDayClick = (date: string) => {
    // Set the date and switch view mode to daily
    onDateChange(date);
    // Update URL to switch to daily view
    const params = new URLSearchParams(searchParams.toString());
    params.set("view", "daily");
    router.push(`${pathname}?${params.toString()}`);
  };

  const hasActiveFilters = filters.sessionType || filters.coachId || filters.location;

  return (
    <div className="space-y-6">
      {/* Filters */}
      <AttendanceFilters
        filters={filters}
        onFiltersChange={handleFiltersChange}
        dateRange={{
          dateFrom: weekStart,
          dateTo: weeklyData?.weekEnd || weekStart,
        }}
      />

      {/* Week Navigation */}
      <div className="flex items-center justify-between bg-white rounded-2xl border border-neutral-200/60 p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <button
          onClick={() => navigateWeek(-1)}
          className="p-2 text-neutral-400 hover:text-neutral-900 rounded-lg hover:bg-neutral-100 transition-colors"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3">
          <Calendar className="h-5 w-5 text-neutral-400" />
          <div className="text-center">
            <p className="text-lg font-semibold text-neutral-900">
              Week of {formatWeekRange(weekStart, weeklyData?.weekEnd || weekStart)}
            </p>
          </div>
        </div>

        <button
          onClick={() => navigateWeek(1)}
          className="p-2 text-neutral-400 hover:text-neutral-900 rounded-lg hover:bg-neutral-100 transition-colors"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {loading ? (
        <TableSkeleton rows={5} columns={8} />
      ) : error ? (
        <AdminCard>
          <div className="py-8 text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={fetchWeeklyData}
              className="text-sm text-sky-600 hover:text-sky-700 hover:underline"
            >
              Try again
            </button>
          </div>
        </AdminCard>
      ) : weeklyData ? (
        <>
          {/* Week Summary Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl border border-neutral-200/60 p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
              <div className="flex items-center gap-2 mb-1">
                <Calendar className="h-4 w-4 text-neutral-400" />
                <p className="text-[13px] text-neutral-500">
                  Sessions{hasActiveFilters ? " (Filtered)" : ""}
                </p>
              </div>
              <p className="text-2xl font-bold text-neutral-900">{weeklyData.totalSessions}</p>
            </div>
            <div className="bg-white rounded-2xl border border-neutral-200/60 p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
              <div className="flex items-center gap-2 mb-1">
                <Users className="h-4 w-4 text-neutral-400" />
                <p className="text-[13px] text-neutral-500">Total Enrolled</p>
              </div>
              <p className="text-2xl font-bold text-neutral-900">{weeklyData.totalEnrolled}</p>
            </div>
            <div className="bg-white rounded-2xl border border-neutral-200/60 p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <p className="text-[13px] text-neutral-500">Total Attended</p>
              </div>
              <p className="text-2xl font-bold text-green-600">{weeklyData.totalAttended}</p>
            </div>
            <div className="bg-white rounded-2xl border border-neutral-200/60 p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="h-4 w-4 text-neutral-400" />
                <p className="text-[13px] text-neutral-500">Week Rate</p>
              </div>
              <p className="text-2xl font-bold text-neutral-900">{weeklyData.attendanceRate}%</p>
            </div>
          </div>

          {/* Weekly Grid */}
          {weeklyData.totalSessions === 0 ? (
            <AdminEmptyState
              icon={Calendar}
              title={hasActiveFilters ? "No matching sessions" : "No sessions this week"}
              description={
                hasActiveFilters
                  ? "No sessions match your current filters. Try adjusting your filters."
                  : "No sessions are scheduled for this week."
              }
            />
          ) : (
            <AdminCard>
              <div className="p-2">
                <WeeklyGrid data={weeklyData} onDayClick={handleDayClick} />
              </div>
              <div className="px-4 pb-4 pt-2 border-t border-neutral-100 mt-2">
                <p className="text-xs text-neutral-500">
                  Click on a cell to view daily attendance details. Color coding:
                  <span className="inline-flex items-center gap-1 ml-2">
                    <span className="inline-block w-3 h-3 rounded bg-green-100 border border-green-200"></span>
                    <span>&gt;80%</span>
                  </span>
                  <span className="inline-flex items-center gap-1 ml-2">
                    <span className="inline-block w-3 h-3 rounded bg-amber-100 border border-amber-200"></span>
                    <span>50-80%</span>
                  </span>
                  <span className="inline-flex items-center gap-1 ml-2">
                    <span className="inline-block w-3 h-3 rounded bg-red-100 border border-red-200"></span>
                    <span>&lt;50%</span>
                  </span>
                </p>
              </div>
            </AdminCard>
          )}
        </>
      ) : null}
    </div>
  );
}
