"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { TableSkeleton } from "@/components/ui/skeleton";
import { AdminPageHeader } from "@/components/admin/ui/admin-page-header";
import { AdminCard } from "@/components/admin/ui/admin-card";
import { AdminEmptyState } from "@/components/admin/ui/admin-empty-state";
import { AdminBadge } from "@/components/admin/ui/admin-badge";
import { AdminSelect } from "@/components/admin/ui/admin-select";
import {
  Calendar,
  Users,
  Trophy,
  ChevronLeft,
  ChevronRight,
  Eye,
  UserPlus,
  ClipboardCheck,
} from "lucide-react";
import {
  GDSDay,
  GDSAgeGroup,
  GDS_DAY_LABELS,
  GDS_AGE_GROUP_LABELS,
  GDSSessionSummary,
  GDSAgeGroupSummary,
} from "@/types/gds";
import { cn } from "@/lib/utils";

// Day tabs for GDS
const GDS_DAYS: GDSDay[] = ["monday", "wednesday", "saturday"];

// Age groups available
const AGE_GROUPS: GDSAgeGroup[] = ["Y1-Y2", "Y3-Y4", "Y5-Y6", "Y6-Y7"];

export default function GDSOverviewPage() {
  const [selectedDay, setSelectedDay] = useState<GDSDay>("monday");
  const [selectedAgeGroup, setSelectedAgeGroup] = useState<GDSAgeGroup | "all">("all");
  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  const [sessions, setSessions] = useState<GDSSessionSummary[]>([]);
  const [summaryData, setSummaryData] = useState<GDSAgeGroupSummary[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [summaryLoading, setSummaryLoading] = useState(true);

  // Format date range for API
  const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
  const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
  const startDate = startOfMonth.toISOString().split("T")[0];
  const endDate = endOfMonth.toISOString().split("T")[0];

  // Fetch sessions for the month
  const fetchSessions = useCallback(async () => {
    setSessionsLoading(true);
    try {
      const params = new URLSearchParams({
        day: selectedDay,
        startDate,
        endDate,
      });
      if (selectedAgeGroup !== "all") {
        params.set("ageGroup", selectedAgeGroup);
      }
      const response = await fetch(`/api/admin/gds/attendance?${params.toString()}`);
      const data = await response.json();
      if (data.success) {
        setSessions(data.data || []);
      }
    } catch (error) {
      console.error("Error fetching sessions:", error);
    } finally {
      setSessionsLoading(false);
    }
  }, [selectedDay, selectedAgeGroup, startDate, endDate]);

  // Fetch age group summary stats
  const fetchSummary = useCallback(async () => {
    setSummaryLoading(true);
    try {
      const response = await fetch(`/api/admin/gds/students/summary?day=${selectedDay}`);
      const data = await response.json();
      if (data.success) {
        setSummaryData(data.data || []);
      }
    } catch (error) {
      console.error("Error fetching summary:", error);
    } finally {
      setSummaryLoading(false);
    }
  }, [selectedDay]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  // Calculate calendar data
  const calendarDays = useMemo(() => {
    const days: (Date | null)[] = [];
    const firstDay = startOfMonth.getDay();

    // Add empty days for padding
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    // Add actual days
    for (let d = 1; d <= endOfMonth.getDate(); d++) {
      days.push(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), d));
    }

    return days;
  }, [currentMonth, startOfMonth, endOfMonth]);

  // Get sessions mapped by date
  const sessionsByDate = useMemo(() => {
    const map = new Map<string, GDSSessionSummary[]>();
    sessions.forEach((session) => {
      const existing = map.get(session.date) || [];
      map.set(session.date, [...existing, session]);
    });
    return map;
  }, [sessions]);

  // Calculate overall stats
  const overallStats = useMemo(() => {
    if (sessions.length === 0) {
      return { totalSessions: 0, avgAttendance: 0, totalPlayerOfSession: 0 };
    }

    const totalSessions = sessions.length;
    const avgAttendance = totalSessions > 0
      ? Math.round(sessions.reduce((acc, s) => acc + s.attendanceRate, 0) / totalSessions)
      : 0;
    const totalPlayerOfSession = sessions.filter((s) => s.playerOfSession).length;

    return { totalSessions, avgAttendance, totalPlayerOfSession };
  }, [sessions]);

  const navigateMonth = (delta: number) => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(newDate.getMonth() + delta);
    setCurrentMonth(newDate);
  };

  const formatMonthYear = (date: Date) => {
    return date.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
  };

  const getDayNumber = (day: GDSDay): number => {
    switch (day) {
      case "monday": return 1;
      case "wednesday": return 3;
      case "saturday": return 6;
    }
  };

  const isGDSDay = (date: Date): boolean => {
    return date.getDay() === getDayNumber(selectedDay);
  };

  const getAttendanceVariant = (rate: number): "success" | "warning" | "error" => {
    if (rate >= 80) return "success";
    if (rate >= 50) return "warning";
    return "error";
  };

  const isLoading = sessionsLoading || summaryLoading;

  return (
    <div className="space-y-8">
      {/* Header */}
      <AdminPageHeader
        title="GDS Management"
        subtitle="Group Development Sessions - Attendance & Student Roster"
      >
        <div className="flex gap-2">
          <Button variant="adminSecondary" asChild>
            <Link href="/admin/gds/students">
              <Users className="mr-2 h-4 w-4" />
              Students
            </Link>
          </Button>
        </div>
      </AdminPageHeader>

      {/* Day Tabs */}
      <div className="flex gap-2">
        {GDS_DAYS.map((day) => (
          <button
            key={day}
            onClick={() => setSelectedDay(day)}
            className={cn(
              "px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
              selectedDay === day
                ? "bg-sky-600 text-white shadow-sm"
                : "bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-50"
            )}
          >
            {GDS_DAY_LABELS[day]}
          </button>
        ))}
      </div>

      {/* Filters Row */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="w-full sm:w-48">
          <AdminSelect
            label="Age Group"
            value={selectedAgeGroup}
            onChange={(e) => setSelectedAgeGroup(e.target.value as GDSAgeGroup | "all")}
            options={[
              { value: "all", label: "All Age Groups" },
              ...AGE_GROUPS.map((ag) => ({ value: ag, label: GDS_AGE_GROUP_LABELS[ag] })),
            ]}
          />
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminCard hover={false}>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50">
              <Calendar className="h-5 w-5 text-sky-600" />
            </div>
            <div>
              <p className="text-[13px] text-neutral-500">Sessions This Month</p>
              <p className="text-xl font-bold text-neutral-900">
                {isLoading ? "-" : overallStats.totalSessions}
              </p>
            </div>
          </div>
        </AdminCard>

        <AdminCard hover={false}>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50">
              <ClipboardCheck className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-[13px] text-neutral-500">Avg Attendance</p>
              <p className="text-xl font-bold text-neutral-900">
                {isLoading ? "-" : `${overallStats.avgAttendance}%`}
              </p>
            </div>
          </div>
        </AdminCard>

        <AdminCard hover={false}>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50">
              <Trophy className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-[13px] text-neutral-500">Player of Session</p>
              <p className="text-xl font-bold text-neutral-900">
                {isLoading ? "-" : overallStats.totalPlayerOfSession}
              </p>
            </div>
          </div>
        </AdminCard>

        <AdminCard hover={false}>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50">
              <Users className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-[13px] text-neutral-500">Active Students</p>
              <p className="text-xl font-bold text-neutral-900">
                {summaryLoading
                  ? "-"
                  : summaryData.reduce((acc, s) => acc + s.activeStudents, 0)}
              </p>
            </div>
          </div>
        </AdminCard>
      </div>

      {/* Calendar View */}
      <AdminCard padding={false}>
        <div className="p-4 lg:p-6 border-b border-neutral-100">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-neutral-900">
              Session Calendar
            </h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigateMonth(-1)}
                className="p-2 text-neutral-400 hover:text-neutral-900 rounded-lg hover:bg-neutral-100 transition-colors"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <span className="text-sm font-medium text-neutral-700 min-w-[140px] text-center">
                {formatMonthYear(currentMonth)}
              </span>
              <button
                onClick={() => navigateMonth(1)}
                className="p-2 text-neutral-400 hover:text-neutral-900 rounded-lg hover:bg-neutral-100 transition-colors"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="p-4 lg:p-6">
            <TableSkeleton rows={5} columns={7} />
          </div>
        ) : (
          <div className="p-4 lg:p-6">
            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
              {/* Header row */}
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div
                  key={day}
                  className="text-center text-[11px] font-semibold uppercase tracking-wider text-neutral-400 py-2"
                >
                  {day}
                </div>
              ))}

              {/* Calendar days */}
              {calendarDays.map((date, idx) => {
                if (!date) {
                  return <div key={`empty-${idx}`} className="h-24" />;
                }

                const dateStr = date.toISOString().split("T")[0];
                const dateSessions = sessionsByDate.get(dateStr) || [];
                const isTrainingDay = isGDSDay(date);
                const isToday = dateStr === new Date().toISOString().split("T")[0];
                const isPast = date < new Date(new Date().setHours(0, 0, 0, 0));

                return (
                  <div
                    key={dateStr}
                    className={cn(
                      "h-24 p-1.5 rounded-lg border transition-all",
                      isTrainingDay
                        ? "bg-sky-50/50 border-sky-200"
                        : "border-neutral-100",
                      isToday && "ring-2 ring-sky-500"
                    )}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className={cn(
                          "text-xs font-medium",
                          isToday ? "text-sky-600" : "text-neutral-600"
                        )}
                      >
                        {date.getDate()}
                      </span>
                      {isTrainingDay && dateSessions.length === 0 && !isPast && (
                        <span className="text-[10px] text-sky-500">GDS</span>
                      )}
                    </div>

                    {/* Session info */}
                    {dateSessions.length > 0 && (
                      <Link
                        href={`/admin/gds/attendance/${dateStr}`}
                        className="block"
                      >
                        <div className="space-y-1">
                          {dateSessions.slice(0, 2).map((session, i) => (
                            <div
                              key={i}
                              className="text-[10px] bg-white rounded px-1.5 py-0.5 border border-neutral-200 truncate hover:bg-neutral-50 transition-colors"
                            >
                              <span className="font-medium">{session.ageGroup}</span>
                              <span className="text-neutral-400 ml-1">
                                {session.totalAttendees}/{session.expectedAttendees}
                              </span>
                            </div>
                          ))}
                          {dateSessions.length > 2 && (
                            <span className="text-[10px] text-neutral-400">
                              +{dateSessions.length - 2} more
                            </span>
                          )}
                        </div>
                      </Link>
                    )}

                    {/* Quick add for future GDS days without sessions */}
                    {isTrainingDay && dateSessions.length === 0 && !isPast && (
                      <Link
                        href={`/admin/gds/attendance/${dateStr}`}
                        className="mt-1 flex items-center justify-center text-[10px] text-sky-500 hover:text-sky-700"
                      >
                        <UserPlus className="h-3 w-3 mr-0.5" />
                        Take
                      </Link>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </AdminCard>

      {/* Age Group Summary */}
      {summaryData.length > 0 && (
        <AdminCard>
          <h3 className="text-lg font-semibold text-neutral-900 mb-4">
            Age Group Summary
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {summaryData.map((summary) => (
              <div
                key={summary.ageGroup}
                className="p-4 rounded-xl bg-neutral-50 border border-neutral-100"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="font-semibold text-neutral-900">
                    {GDS_AGE_GROUP_LABELS[summary.ageGroup]}
                  </span>
                  <AdminBadge variant="info">
                    {summary.activeStudents} active
                  </AdminBadge>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Total Students</span>
                    <span className="font-medium">{summary.totalStudents}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Avg Attendance</span>
                    <span className="font-medium">{summary.averageAttendance}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Sessions Held</span>
                    <span className="font-medium">{summary.totalSessions}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </AdminCard>
      )}
    </div>
  );
}
