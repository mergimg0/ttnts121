"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { TableSkeleton } from "@/components/ui/skeleton";
import { AdminPageHeader } from "@/components/admin/ui/admin-page-header";
import { AdminEmptyState } from "@/components/admin/ui/admin-empty-state";
import { ArrowLeft, Calendar, ClipboardCheck, ChevronRight } from "lucide-react";
import { Session } from "@/types/booking";

export default function SessionAttendancePage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;

  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [dates, setDates] = useState<string[]>([]);

  useEffect(() => {
    fetchSessionAndDates();
  }, [sessionId]);

  const fetchSessionAndDates = async () => {
    setLoading(true);
    try {
      // Fetch session details
      const sessionResponse = await fetch(`/api/admin/sessions/${sessionId}`);
      const sessionData = await sessionResponse.json();

      if (sessionData.success) {
        setSession(sessionData.data);
        generateSessionDates(sessionData.data);
      }
    } catch (error) {
      console.error("Error fetching session:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateSessionDates = (session: Session) => {
    // Generate list of dates this session runs on
    const startDate = session.startDate instanceof Date
      ? session.startDate
      : new Date((session.startDate as { seconds: number }).seconds * 1000);
    const endDate = session.endDate instanceof Date
      ? session.endDate
      : new Date((session.endDate as { seconds: number }).seconds * 1000);

    const sessionDays = session.daysOfWeek || [session.dayOfWeek];
    const generatedDates: string[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const current = new Date(startDate);
    while (current <= endDate) {
      if (sessionDays.includes(current.getDay())) {
        generatedDates.push(current.toISOString().split("T")[0]);
      }
      current.setDate(current.getDate() + 1);
    }

    // Sort by date descending (most recent first), but future dates at the end
    generatedDates.sort((a, b) => {
      const dateA = new Date(a);
      const dateB = new Date(b);
      const aIsFuture = dateA > today;
      const bIsFuture = dateB > today;

      if (aIsFuture && !bIsFuture) return 1;
      if (!aIsFuture && bIsFuture) return -1;
      return dateB.getTime() - dateA.getTime();
    });

    setDates(generatedDates);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-GB", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const isToday = (dateStr: string) => {
    return dateStr === new Date().toISOString().split("T")[0];
  };

  const isFuture = (dateStr: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return new Date(dateStr) > today;
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <AdminPageHeader title="Session Attendance" subtitle="Loading..." />
        <TableSkeleton rows={5} columns={3} />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="space-y-8">
        <AdminPageHeader title="Session Not Found" subtitle="The requested session could not be found" />
        <Button variant="adminSecondary" onClick={() => router.push("/admin/attendance")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Attendance
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <AdminPageHeader
        title={session.name}
        subtitle="Select a date to view attendance"
      >
        <Button variant="adminSecondary" asChild>
          <Link href="/admin/attendance">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>
      </AdminPageHeader>

      {/* Session Info */}
      <div className="bg-white rounded-2xl border border-neutral-200/60 p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-neutral-500 mb-1">Location</p>
            <p className="font-medium">{session.location}</p>
          </div>
          <div>
            <p className="text-neutral-500 mb-1">Time</p>
            <p className="font-medium">{session.startTime} - {session.endTime}</p>
          </div>
          <div>
            <p className="text-neutral-500 mb-1">Capacity</p>
            <p className="font-medium">{session.enrolled} / {session.capacity}</p>
          </div>
          <div>
            <p className="text-neutral-500 mb-1">Age Range</p>
            <p className="font-medium">{session.ageMin} - {session.ageMax} years</p>
          </div>
        </div>
      </div>

      {/* Date List */}
      {dates.length === 0 ? (
        <AdminEmptyState
          icon={Calendar}
          title="No session dates"
          description="This session has no scheduled dates"
        />
      ) : (
        <div className="bg-white rounded-2xl border border-neutral-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
          <div className="divide-y divide-neutral-50">
            {dates.map((date) => (
              <Link
                key={date}
                href={`/admin/attendance/${sessionId}/${date}`}
                className={`flex items-center justify-between p-4 hover:bg-neutral-50/50 transition-colors ${
                  isFuture(date) ? "opacity-50" : ""
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-xl ${
                      isToday(date)
                        ? "bg-sky-100 text-sky-600"
                        : "bg-neutral-100 text-neutral-500"
                    }`}
                  >
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-neutral-900">
                      {formatDate(date)}
                    </p>
                    {isToday(date) && (
                      <span className="text-[11px] font-semibold text-sky-600 uppercase tracking-wider">
                        Today
                      </span>
                    )}
                    {isFuture(date) && (
                      <span className="text-[11px] text-neutral-400">
                        Upcoming
                      </span>
                    )}
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-neutral-300" />
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
