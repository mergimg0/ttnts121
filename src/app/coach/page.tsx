"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useCoachAuth } from "@/components/coach/auth-provider";
import { AdminCard } from "@/components/admin/ui/admin-card";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  Calendar,
  Users,
  ClipboardCheck,
  ChevronRight,
  Clock,
  PoundSterling,
  AlertTriangle,
} from "lucide-react";
import { Session } from "@/types/booking";

interface SessionWithStats extends Session {
  programName?: string;
  todayAttendance?: number;
}

interface HoursSummary {
  totalHours: number;
  approvedHours: number;
  pendingHours: number;
  estimatedEarnings: number;
}

interface RecentHoursEntry {
  date: string;
  hours: number;
  status: "draft" | "submitted" | "approved" | "rejected";
}

export default function CoachDashboardPage() {
  const { user, hasCoachPermission } = useCoachAuth();
  const [sessions, setSessions] = useState<SessionWithStats[]>([]);
  const [hoursSummary, setHoursSummary] = useState<HoursSummary | null>(null);
  const [recentHours, setRecentHours] = useState<RecentHoursEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Determine which permissions the coach has
  const canViewSessions = hasCoachPermission("canViewSessions");
  const canViewTimetable = hasCoachPermission("canViewTimetable");
  const canViewEarnings = hasCoachPermission("canViewEarnings");

  // Check if this is a restricted coach (missing any session/timetable permissions)
  const isRestrictedCoach = !canViewSessions || !canViewTimetable;

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    if (!user) return;

    try {
      // Always fetch hours data (available to all coaches)
      const hoursPromise = fetch("/api/coach/hours").then((res) => res.json());

      // Only fetch sessions if coach has permission
      const sessionsPromise = canViewSessions
        ? fetch("/api/coach/sessions").then((res) => res.json())
        : Promise.resolve({ success: true, data: [] });

      const [hoursData, sessionsData] = await Promise.all([
        hoursPromise,
        sessionsPromise,
      ]);

      if (sessionsData.success) {
        setSessions(sessionsData.data || []);
      }

      if (hoursData.success) {
        setHoursSummary(hoursData.data?.summary || null);
        // Get recent entries (last 5)
        const entries = hoursData.data?.entries || [];
        setRecentHours(
          entries
            .sort(
              (a: RecentHoursEntry, b: RecentHoursEntry) =>
                new Date(b.date).getTime() - new Date(a.date).getTime()
            )
            .slice(0, 5)
        );
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDayOfWeek = (day: number) => {
    const days = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    return days[day] || "Unknown";
  };

  // Format currency
  const formatCurrency = (pence: number) => {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP",
    }).format(pence / 100);
  };

  // Get today's sessions (only if can view sessions)
  const todayDayOfWeek = new Date().getDay();
  const todaySessions = useMemo(
    () => sessions.filter((s) => s.dayOfWeek === todayDayOfWeek),
    [sessions, todayDayOfWeek]
  );

  // Get status color for hours
  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-700";
      case "submitted":
        return "bg-amber-100 text-amber-700";
      case "rejected":
        return "bg-red-100 text-red-700";
      default:
        return "bg-blue-100 text-blue-700";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">
          Welcome back, {user?.firstName || "Coach"}
        </h1>
        <p className="mt-1 text-[13px] text-neutral-500">
          {isRestrictedCoach
            ? "Track your hours and view your earnings"
            : "Manage your assigned sessions and take attendance"}
        </p>
      </div>

      {/* Restricted Access Notice */}
      {isRestrictedCoach && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-amber-800 text-sm font-medium">
                Limited Access Account
              </p>
              <p className="text-amber-700 text-[13px] mt-1">
                Your account has limited access. You can log hours and view
                earnings. Contact an administrator to request additional
                permissions for viewing sessions and timetables.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Quick Action - Log Hours (Always Visible) */}
      <AdminCard hover={false}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-50">
              <Clock className="h-6 w-6 text-sky-600" />
            </div>
            <div>
              <h3 className="font-semibold text-neutral-900">Log Your Hours</h3>
              <p className="text-[13px] text-neutral-500">
                Track your working hours for this month
              </p>
            </div>
          </div>
          <Button variant="adminPrimary" asChild>
            <Link href="/coach/hours">
              <Clock className="mr-2 h-4 w-4" />
              Log Hours
            </Link>
          </Button>
        </div>
      </AdminCard>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Hours This Month (Always Visible) */}
        <AdminCard hover={false}>
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50">
              <Clock className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                Hours This Month
              </p>
              <p className="text-2xl font-semibold tabular-nums text-neutral-900">
                {hoursSummary?.totalHours || 0}h
              </p>
            </div>
          </div>
        </AdminCard>

        {/* Earnings (Conditional) */}
        {canViewEarnings && hoursSummary && (
          <AdminCard hover={false}>
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50">
                <PoundSterling className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                  Est. Earnings
                </p>
                <p className="text-2xl font-semibold tabular-nums text-neutral-900">
                  {formatCurrency(hoursSummary.estimatedEarnings)}
                </p>
              </div>
            </div>
          </AdminCard>
        )}

        {/* Sessions Stats (Conditional) */}
        {canViewSessions && (
          <>
            <AdminCard hover={false}>
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-50">
                  <Calendar className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                    Assigned Sessions
                  </p>
                  <p className="text-2xl font-semibold tabular-nums text-neutral-900">
                    {sessions.length}
                  </p>
                </div>
              </div>
            </AdminCard>

            <AdminCard hover={false}>
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-50">
                  <ClipboardCheck className="h-6 w-6 text-sky-600" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                    Today&apos;s Sessions
                  </p>
                  <p className="text-2xl font-semibold tabular-nums text-neutral-900">
                    {todaySessions.length}
                  </p>
                </div>
              </div>
            </AdminCard>

            <AdminCard hover={false}>
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50">
                  <Users className="h-6 w-6 text-amber-600" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                    Total Participants
                  </p>
                  <p className="text-2xl font-semibold tabular-nums text-neutral-900">
                    {sessions.reduce((acc, s) => acc + s.enrolled, 0)}
                  </p>
                </div>
              </div>
            </AdminCard>
          </>
        )}
      </div>

      {/* Recent Hours Logged (Always Visible) */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-neutral-900">
            Recent Hours Logged
          </h2>
          <Button variant="adminSecondary" size="sm" asChild>
            <Link href="/coach/hours">
              View All
              <ChevronRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>

        {recentHours.length === 0 ? (
          <AdminCard hover={false}>
            <div className="text-center py-8">
              <Clock className="mx-auto h-12 w-12 text-neutral-300" />
              <h3 className="mt-4 text-[15px] font-medium text-neutral-900">
                No hours logged yet
              </h3>
              <p className="mt-1 text-[13px] text-neutral-500">
                Start logging your working hours to track your time.
              </p>
              <Button variant="adminPrimary" size="sm" className="mt-4" asChild>
                <Link href="/coach/hours">Log Hours Now</Link>
              </Button>
            </div>
          </AdminCard>
        ) : (
          <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-100 bg-neutral-50/50">
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                    Hours
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {recentHours.map((entry) => (
                  <tr key={entry.date} className="hover:bg-neutral-50/50">
                    <td className="px-4 py-3 text-[13px] text-neutral-900">
                      {new Date(entry.date).toLocaleDateString("en-GB", {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                      })}
                    </td>
                    <td className="px-4 py-3 text-[13px] font-medium text-neutral-900">
                      {entry.hours}h
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${getStatusColor(entry.status)}`}
                      >
                        {entry.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Today's Sessions (Conditional - only if canViewSessions) */}
      {canViewSessions && todaySessions.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">
            Today&apos;s Sessions
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {todaySessions.map((session) => (
              <AdminCard key={session.id} hover>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <h3 className="font-semibold text-neutral-900">
                      {session.name}
                    </h3>
                    <p className="text-[13px] text-neutral-500">
                      {session.startTime} - {session.endTime}
                    </p>
                    <p className="text-[13px] text-neutral-500">
                      {session.location}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                        {session.enrolled}/{session.capacity} enrolled
                      </span>
                    </div>
                  </div>
                  <Button variant="adminPrimary" size="sm" asChild>
                    <Link href={`/coach/attendance/${session.id}`}>
                      Take Attendance
                    </Link>
                  </Button>
                </div>
              </AdminCard>
            ))}
          </div>
        </div>
      )}

      {/* All Sessions (Conditional - only if canViewSessions) */}
      {canViewSessions && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-neutral-900">
              All Assigned Sessions
            </h2>
            <Button variant="adminSecondary" size="sm" asChild>
              <Link href="/coach/sessions">
                View All
                <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>

          {sessions.length === 0 ? (
            <AdminCard hover={false}>
              <div className="text-center py-8">
                <Calendar className="mx-auto h-12 w-12 text-neutral-300" />
                <h3 className="mt-4 text-[15px] font-medium text-neutral-900">
                  No sessions assigned
                </h3>
                <p className="mt-1 text-[13px] text-neutral-500">
                  You don&apos;t have any sessions assigned yet. Contact an
                  admin to get assigned to sessions.
                </p>
              </div>
            </AdminCard>
          ) : (
            <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-neutral-100 bg-neutral-50/50">
                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                      Session
                    </th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                      Day
                    </th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                      Time
                    </th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                      Enrolled
                    </th>
                    <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {sessions.slice(0, 5).map((session) => (
                    <tr key={session.id} className="hover:bg-neutral-50/50">
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-neutral-900">
                            {session.name}
                          </p>
                          <p className="text-[13px] text-neutral-500">
                            {session.location}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[13px] text-neutral-600">
                        {formatDayOfWeek(session.dayOfWeek)}
                      </td>
                      <td className="px-4 py-3 text-[13px] text-neutral-600">
                        {session.startTime} - {session.endTime}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-700">
                          {session.enrolled}/{session.capacity}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/coach/sessions/${session.id}`}>
                              View
                            </Link>
                          </Button>
                          <Button variant="adminSecondary" size="sm" asChild>
                            <Link href={`/coach/attendance/${session.id}`}>
                              Attendance
                            </Link>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Timetable Quick Link (Conditional - only if canViewTimetable) */}
      {canViewTimetable && (
        <AdminCard hover>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50">
                <Calendar className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-medium text-neutral-900">View Timetable</h3>
                <p className="text-[13px] text-neutral-500">
                  See your weekly schedule at a glance
                </p>
              </div>
            </div>
            <Button variant="adminSecondary" size="sm" asChild>
              <Link href="/coach/timetable">
                Open Timetable
                <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </AdminCard>
      )}
    </div>
  );
}
