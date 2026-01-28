"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useCoachAuth } from "@/components/coach/auth-provider";
import { AdminCard } from "@/components/admin/ui/admin-card";
import { Button } from "@/components/ui/button";
import { Loader2, Calendar, MapPin, Clock, Users } from "lucide-react";
import { Session } from "@/types/booking";

interface SessionWithProgram extends Session {
  programName?: string;
}

export default function CoachSessionsPage() {
  const { user } = useCoachAuth();
  const [sessions, setSessions] = useState<SessionWithProgram[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAssignedSessions();
  }, [user]);

  const fetchAssignedSessions = async () => {
    if (!user) return;

    try {
      const response = await fetch("/api/coach/sessions");
      const data = await response.json();
      if (data.success) {
        setSessions(data.data);
      }
    } catch (error) {
      console.error("Error fetching sessions:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDayOfWeek = (day: number) => {
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    return days[day] || "Unknown";
  };

  // Group sessions by day of week
  const sessionsByDay = sessions.reduce((acc, session) => {
    const day = session.dayOfWeek;
    if (!acc[day]) {
      acc[day] = [];
    }
    acc[day].push(session);
    return acc;
  }, {} as Record<number, SessionWithProgram[]>);

  // Sort days starting from today
  const today = new Date().getDay();
  const sortedDays = Object.keys(sessionsByDay)
    .map(Number)
    .sort((a, b) => {
      const aOffset = (a - today + 7) % 7;
      const bOffset = (b - today + 7) % 7;
      return aOffset - bOffset;
    });

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
        <h1 className="text-2xl font-semibold text-neutral-900">My Sessions</h1>
        <p className="mt-1 text-[13px] text-neutral-500">
          View and manage your assigned sessions
        </p>
      </div>

      {sessions.length === 0 ? (
        <AdminCard hover={false}>
          <div className="text-center py-12">
            <Calendar className="mx-auto h-12 w-12 text-neutral-300" />
            <h3 className="mt-4 text-[15px] font-medium text-neutral-900">
              No sessions assigned
            </h3>
            <p className="mt-1 text-[13px] text-neutral-500">
              You don&apos;t have any sessions assigned yet. Contact an admin to get assigned to sessions.
            </p>
          </div>
        </AdminCard>
      ) : (
        <div className="space-y-8">
          {sortedDays.map((day) => {
            const daySessions = sessionsByDay[day];
            const isToday = day === today;

            return (
              <div key={day}>
                <h2 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center gap-2">
                  {formatDayOfWeek(day)}
                  {isToday && (
                    <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                      Today
                    </span>
                  )}
                </h2>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {daySessions.map((session) => (
                    <AdminCard key={session.id} hover>
                      <div className="space-y-3">
                        <div>
                          <h3 className="font-semibold text-neutral-900">{session.name}</h3>
                          {session.programName && (
                            <p className="text-[13px] text-neutral-500">{session.programName}</p>
                          )}
                        </div>

                        <div className="space-y-2 text-[13px] text-neutral-600">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-neutral-400" />
                            {session.startTime} - {session.endTime}
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-neutral-400" />
                            {session.location}
                          </div>
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-neutral-400" />
                            {session.enrolled}/{session.capacity} enrolled
                          </div>
                        </div>

                        <div className="flex items-center gap-2 pt-2 border-t border-neutral-100">
                          <Button variant="adminSecondary" size="sm" className="flex-1" asChild>
                            <Link href={`/coach/sessions/${session.id}`}>
                              View Details
                            </Link>
                          </Button>
                          <Button variant="adminPrimary" size="sm" className="flex-1" asChild>
                            <Link href={`/coach/attendance/${session.id}`}>
                              Attendance
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </AdminCard>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
