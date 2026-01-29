"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { TableSkeleton } from "@/components/ui/skeleton";
import { ResponsiveTable, MobileCard, MobileCardRow } from "@/components/admin/mobile-table";
import { AdminEmptyState } from "@/components/admin/ui/admin-empty-state";
import { AdminBadge } from "@/components/admin/ui/admin-badge";
import { ClipboardCheck, Eye, Calendar, ChevronLeft, ChevronRight, Users } from "lucide-react";
import { AttendanceSummary } from "@/types/attendance";

interface DailyViewProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
}

export function DailyView({ selectedDate, onDateChange }: DailyViewProps) {
  const [summary, setSummary] = useState<AttendanceSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAttendanceSummary();
  }, [selectedDate]);

  const fetchAttendanceSummary = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/admin/attendance?summary=true&date=${selectedDate}`
      );
      const data = await response.json();
      if (data.success) {
        setSummary(data.data);
      }
    } catch (error) {
      console.error("Error fetching attendance summary:", error);
    } finally {
      setLoading(false);
    }
  };

  const navigateDate = (days: number) => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + days);
    onDateChange(date.toISOString().split("T")[0]);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-GB", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const getAttendanceVariant = (rate: number): "success" | "warning" | "error" => {
    if (rate >= 80) return "success";
    if (rate >= 50) return "warning";
    return "error";
  };

  if (loading) {
    return <TableSkeleton rows={5} columns={5} />;
  }

  return (
    <div className="space-y-6">
      {/* Date Navigation */}
      <div className="flex items-center justify-between bg-white rounded-2xl border border-neutral-200/60 p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <button
          onClick={() => navigateDate(-1)}
          className="p-2 text-neutral-400 hover:text-neutral-900 rounded-lg hover:bg-neutral-100 transition-colors"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3">
          <Calendar className="h-5 w-5 text-neutral-400" />
          <div className="text-center">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => onDateChange(e.target.value)}
              className="text-lg font-semibold text-neutral-900 bg-transparent border-none focus:outline-none cursor-pointer"
            />
            <p className="text-[13px] text-neutral-500">{formatDate(selectedDate)}</p>
          </div>
        </div>

        <button
          onClick={() => navigateDate(1)}
          className="p-2 text-neutral-400 hover:text-neutral-900 rounded-lg hover:bg-neutral-100 transition-colors"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Summary Stats */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-neutral-200/60 p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
            <p className="text-[13px] text-neutral-500 mb-1">Sessions Today</p>
            <p className="text-2xl font-bold text-neutral-900">{summary.totalSessions}</p>
          </div>
          <div className="bg-white rounded-2xl border border-neutral-200/60 p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
            <p className="text-[13px] text-neutral-500 mb-1">Total Enrolled</p>
            <p className="text-2xl font-bold text-neutral-900">{summary.totalEnrolled}</p>
          </div>
          <div className="bg-white rounded-2xl border border-neutral-200/60 p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
            <p className="text-[13px] text-neutral-500 mb-1">Checked In</p>
            <p className="text-2xl font-bold text-green-600">{summary.totalAttended}</p>
          </div>
          <div className="bg-white rounded-2xl border border-neutral-200/60 p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
            <p className="text-[13px] text-neutral-500 mb-1">Attendance Rate</p>
            <p className="text-2xl font-bold text-neutral-900">{summary.attendanceRate}%</p>
          </div>
        </div>
      )}

      {/* Sessions List */}
      {!summary || summary.sessions.length === 0 ? (
        <AdminEmptyState
          icon={ClipboardCheck}
          title="No sessions scheduled"
          description={`No sessions are scheduled for ${formatDate(selectedDate)}`}
        />
      ) : (
        <ResponsiveTable
          mobileView={
            summary.sessions.map((session) => (
              <MobileCard key={session.sessionId}>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-neutral-900">
                      {session.sessionName}
                    </p>
                  </div>
                  <AdminBadge
                    variant={getAttendanceVariant(
                      session.enrolledCount > 0
                        ? Math.round((session.attendedCount / session.enrolledCount) * 100)
                        : 0
                    )}
                  >
                    {session.attendedCount}/{session.enrolledCount}
                  </AdminBadge>
                </div>

                <MobileCardRow label="Enrolled">
                  <span className="text-sm font-medium">{session.enrolledCount}</span>
                </MobileCardRow>

                <MobileCardRow label="Checked In">
                  <span className="text-sm font-medium text-green-600">
                    {session.attendedCount}
                  </span>
                </MobileCardRow>

                <MobileCardRow label="Checked Out">
                  <span className="text-sm font-medium text-neutral-600">
                    {session.checkedOutCount}
                  </span>
                </MobileCardRow>

                <div className="pt-3 border-t border-neutral-100">
                  <Button variant="adminSecondary" size="sm" asChild className="w-full">
                    <Link href={`/admin/attendance/${session.sessionId}/${selectedDate}`}>
                      <Eye className="mr-2 h-4 w-4" />
                      View Attendance
                    </Link>
                  </Button>
                </div>
              </MobileCard>
            ))
          }
        >
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-100">
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                  Session
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                  Enrolled
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                  Checked In
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                  Checked Out
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                  Rate
                </th>
                <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-50">
              {summary.sessions.map((session) => {
                const rate =
                  session.enrolledCount > 0
                    ? Math.round((session.attendedCount / session.enrolledCount) * 100)
                    : 0;

                return (
                  <tr
                    key={session.sessionId}
                    className="group hover:bg-neutral-50/50 transition-colors"
                  >
                    <td className="px-4 py-4">
                      <p className="text-sm font-medium text-neutral-900">
                        {session.sessionName}
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1.5">
                        <Users className="h-4 w-4 text-neutral-400" />
                        <span className="text-sm font-medium text-neutral-900">
                          {session.enrolledCount}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm font-semibold text-green-600">
                        {session.attendedCount}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm text-neutral-600">
                        {session.checkedOutCount}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <AdminBadge variant={getAttendanceVariant(rate)}>
                        {rate}%
                      </AdminBadge>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <Link
                        href={`/admin/attendance/${session.sessionId}/${selectedDate}`}
                        className="p-2 text-neutral-400 hover:text-neutral-900 transition-colors rounded-lg hover:bg-neutral-100 inline-flex"
                      >
                        <Eye className="h-4 w-4" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </ResponsiveTable>
      )}
    </div>
  );
}
