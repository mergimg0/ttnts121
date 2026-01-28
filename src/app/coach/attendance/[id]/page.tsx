"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { AdminCard } from "@/components/admin/ui/admin-card";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { Loader2, ArrowLeft, Check, X, Clock, Users, Calendar } from "lucide-react";
import { Session, Booking } from "@/types/booking";

interface AttendanceRecord {
  bookingId: string;
  childName: string;
  status: "present" | "absent" | "late" | "pending";
  checkedInAt?: string;
  checkedInBy?: string;
  notes?: string;
}

interface SessionWithAttendance extends Session {
  programName?: string;
  bookings?: Booking[];
  attendance?: AttendanceRecord[];
}

export default function CoachAttendancePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [session, setSession] = useState<SessionWithAttendance | null>(null);
  const [attendance, setAttendance] = useState<Record<string, AttendanceRecord>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSessionAndAttendance();
  }, [id]);

  const fetchSessionAndAttendance = async () => {
    try {
      // Fetch session details with bookings
      const sessionRes = await fetch(`/api/coach/sessions/${id}`);
      const sessionData = await sessionRes.json();

      if (!sessionData.success) {
        setError(sessionData.error || "Failed to fetch session");
        setLoading(false);
        return;
      }

      setSession(sessionData.data);

      // Fetch attendance records
      const attendanceRes = await fetch(`/api/coach/attendance?sessionId=${id}`);
      const attendanceData = await attendanceRes.json();

      if (attendanceData.success) {
        // Convert array to record keyed by bookingId
        const attendanceMap: Record<string, AttendanceRecord> = {};
        (attendanceData.data || []).forEach((record: AttendanceRecord) => {
          attendanceMap[record.bookingId] = record;
        });
        setAttendance(attendanceMap);
      }
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Failed to fetch session data");
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async (bookingId: string, status: "present" | "absent" | "late") => {
    setSaving(bookingId);

    try {
      const response = await fetch("/api/coach/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: id,
          bookingId,
          status,
          date: new Date().toISOString().split("T")[0], // Today's date
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Update local state
        setAttendance((prev) => ({
          ...prev,
          [bookingId]: {
            bookingId,
            childName: session?.bookings?.find((b) => b.id === bookingId)?.childFirstName || "",
            status,
            checkedInAt: new Date().toISOString(),
          },
        }));
        toast(`Marked as ${status}`, "success");
      } else {
        toast(data.error || "Failed to update attendance", "error");
      }
    } catch (err) {
      console.error("Error updating attendance:", err);
      toast("Failed to update attendance", "error");
    } finally {
      setSaving(null);
    }
  };

  const formatDayOfWeek = (day: number) => {
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    return days[day] || "Unknown";
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case "present":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
            <Check className="h-3 w-3" />
            Present
          </span>
        );
      case "absent":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
            <X className="h-3 w-3" />
            Absent
          </span>
        );
      case "late":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
            <Clock className="h-3 w-3" />
            Late
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-500">
            Pending
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="space-y-4">
        <Link
          href="/coach/sessions"
          className="inline-flex items-center gap-2 text-[13px] text-neutral-500 hover:text-neutral-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Sessions
        </Link>
        <AdminCard hover={false}>
          <div className="text-center py-8">
            <p className="text-neutral-500">{error || "Session not found"}</p>
          </div>
        </AdminCard>
      </div>
    );
  }

  const bookings = session.bookings || [];
  const presentCount = Object.values(attendance).filter((a) => a.status === "present").length;
  const absentCount = Object.values(attendance).filter((a) => a.status === "absent").length;
  const lateCount = Object.values(attendance).filter((a) => a.status === "late").length;
  const pendingCount = bookings.length - presentCount - absentCount - lateCount;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href={`/coach/sessions/${id}`}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-neutral-200 hover:bg-neutral-50 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-semibold text-neutral-900">Take Attendance</h1>
          <p className="text-[13px] text-neutral-500">{session.name}</p>
        </div>
      </div>

      {/* Session Info & Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <AdminCard hover={false}>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50">
              <Calendar className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                Day & Time
              </p>
              <p className="text-[13px] font-medium text-neutral-900">
                {formatDayOfWeek(session.dayOfWeek)} {session.startTime}
              </p>
            </div>
          </div>
        </AdminCard>

        <AdminCard hover={false}>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50">
              <Check className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                Present
              </p>
              <p className="text-xl font-semibold tabular-nums text-neutral-900">
                {presentCount + lateCount}/{bookings.length}
              </p>
            </div>
          </div>
        </AdminCard>

        <AdminCard hover={false}>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-50">
              <X className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                Absent
              </p>
              <p className="text-xl font-semibold tabular-nums text-neutral-900">
                {absentCount}
              </p>
            </div>
          </div>
        </AdminCard>

        <AdminCard hover={false}>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-neutral-100">
              <Users className="h-5 w-5 text-neutral-600" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                Pending
              </p>
              <p className="text-xl font-semibold tabular-nums text-neutral-900">
                {pendingCount}
              </p>
            </div>
          </div>
        </AdminCard>
      </div>

      {/* Attendance List */}
      <AdminCard hover={false}>
        <h2 className="text-[15px] font-semibold text-neutral-900 mb-4">
          Participant Attendance
        </h2>

        {bookings.length === 0 ? (
          <div className="text-center py-8">
            <Users className="mx-auto h-12 w-12 text-neutral-300" />
            <h3 className="mt-4 text-[15px] font-medium text-neutral-900">
              No participants
            </h3>
            <p className="mt-1 text-[13px] text-neutral-500">
              There are no bookings for this session yet.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {bookings.map((booking) => {
              const record = attendance[booking.id];
              const isSaving = saving === booking.id;

              return (
                <div
                  key={booking.id}
                  className="flex items-center justify-between p-4 rounded-xl border border-neutral-200 hover:border-neutral-300 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100 text-neutral-600 font-medium">
                      {booking.childFirstName.charAt(0)}
                      {booking.childLastName.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium text-neutral-900">
                        {booking.childFirstName} {booking.childLastName}
                      </p>
                      <p className="text-[13px] text-neutral-500">
                        {booking.parentFirstName} {booking.parentLastName} - {booking.parentPhone}
                      </p>
                      {booking.medicalConditions && (
                        <p className="text-[12px] text-amber-600 mt-0.5">
                          Medical: {booking.medicalConditions}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {getStatusBadge(record?.status)}

                    <div className="flex items-center gap-1">
                      <Button
                        variant={record?.status === "present" ? "adminPrimary" : "adminSecondary"}
                        size="sm"
                        onClick={() => handleCheckIn(booking.id, "present")}
                        disabled={isSaving}
                        className="h-8 w-8 p-0"
                        title="Present"
                      >
                        {isSaving ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Check className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant={record?.status === "late" ? "adminPrimary" : "adminSecondary"}
                        size="sm"
                        onClick={() => handleCheckIn(booking.id, "late")}
                        disabled={isSaving}
                        className="h-8 w-8 p-0"
                        title="Late"
                      >
                        <Clock className="h-4 w-4" />
                      </Button>
                      <Button
                        variant={record?.status === "absent" ? "adminDanger" : "adminSecondary"}
                        size="sm"
                        onClick={() => handleCheckIn(booking.id, "absent")}
                        disabled={isSaving}
                        className="h-8 w-8 p-0"
                        title="Absent"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </AdminCard>
    </div>
  );
}
