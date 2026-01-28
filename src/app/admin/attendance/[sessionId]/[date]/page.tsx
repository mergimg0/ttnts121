"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { TableSkeleton } from "@/components/ui/skeleton";
import { AdminPageHeader } from "@/components/admin/ui/admin-page-header";
import { AdminEmptyState } from "@/components/admin/ui/admin-empty-state";
import { AttendanceSheet, QRScanner } from "@/components/admin/attendance";
import { ArrowLeft, Users, RefreshCw } from "lucide-react";
import { Session, Booking } from "@/types/booking";
import { AttendanceRecord } from "@/types/attendance";

export default function DateAttendancePage() {
  const params = useParams();
  const sessionId = params.sessionId as string;
  const date = params.date as string;

  const [session, setSession] = useState<Session | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      // Fetch session, bookings, and attendance in parallel
      const [sessionRes, bookingsRes, attendanceRes] = await Promise.all([
        fetch(`/api/admin/sessions/${sessionId}`),
        fetch(`/api/admin/bookings?sessionId=${sessionId}&status=confirmed`),
        fetch(`/api/admin/attendance?sessionId=${sessionId}&date=${date}`),
      ]);

      const [sessionData, bookingsData, attendanceData] = await Promise.all([
        sessionRes.json(),
        bookingsRes.json(),
        attendanceRes.json(),
      ]);

      if (sessionData.success) {
        setSession(sessionData.data);
      }

      if (bookingsData.success) {
        // Filter only paid bookings
        const paidBookings = (bookingsData.data as Booking[]).filter(
          (b) => b.paymentStatus === "paid"
        );
        setBookings(paidBookings);
      }

      if (attendanceData.success) {
        setAttendanceRecords(attendanceData.data);
      }
    } catch (error) {
      console.error("Error fetching attendance data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [sessionId, date]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCheckinChange = () => {
    fetchData(true);
  };

  const handleQRSuccess = (childName: string) => {
    fetchData(true);
  };

  const formatDate = (dateStr: string) => {
    const dateObj = new Date(dateStr);
    return dateObj.toLocaleDateString("en-GB", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  // Calculate stats
  const totalEnrolled = bookings.length;
  const checkedIn = attendanceRecords.filter((r) => r.checkedInAt).length;
  const checkedOut = attendanceRecords.filter((r) => r.checkedOutAt).length;
  const attendanceRate = totalEnrolled > 0 ? Math.round((checkedIn / totalEnrolled) * 100) : 0;

  if (loading) {
    return (
      <div className="space-y-8">
        <AdminPageHeader title="Attendance" subtitle="Loading..." />
        <TableSkeleton rows={5} columns={6} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <AdminPageHeader
        title={session?.name || "Session Attendance"}
        subtitle={formatDate(date)}
      >
        <div className="flex gap-2 w-full sm:w-auto">
          <Button variant="adminSecondary" asChild className="flex-1 sm:flex-none">
            <Link href={`/admin/attendance/${sessionId}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Link>
          </Button>
          <QRScanner
            sessionId={sessionId}
            date={date}
            onSuccess={handleQRSuccess}
          />
          <Button
            variant="adminSecondary"
            onClick={() => fetchData(true)}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </AdminPageHeader>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-neutral-200/60 p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <p className="text-[13px] text-neutral-500 mb-1">Enrolled</p>
          <p className="text-2xl font-bold text-neutral-900">{totalEnrolled}</p>
        </div>
        <div className="bg-white rounded-2xl border border-neutral-200/60 p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <p className="text-[13px] text-neutral-500 mb-1">Checked In</p>
          <p className="text-2xl font-bold text-green-600">{checkedIn}</p>
        </div>
        <div className="bg-white rounded-2xl border border-neutral-200/60 p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <p className="text-[13px] text-neutral-500 mb-1">Checked Out</p>
          <p className="text-2xl font-bold text-neutral-600">{checkedOut}</p>
        </div>
        <div className="bg-white rounded-2xl border border-neutral-200/60 p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <p className="text-[13px] text-neutral-500 mb-1">Attendance Rate</p>
          <p className="text-2xl font-bold text-neutral-900">{attendanceRate}%</p>
        </div>
      </div>

      {/* Attendance Sheet */}
      {bookings.length === 0 ? (
        <AdminEmptyState
          icon={Users}
          title="No enrollments"
          description="There are no paid bookings for this session"
        />
      ) : (
        <AttendanceSheet
          sessionId={sessionId}
          sessionName={session?.name || ""}
          date={date}
          bookings={bookings}
          attendanceRecords={attendanceRecords}
          onCheckinChange={handleCheckinChange}
        />
      )}
    </div>
  );
}
