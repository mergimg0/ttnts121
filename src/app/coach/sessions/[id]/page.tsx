"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AdminCard } from "@/components/admin/ui/admin-card";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, MapPin, Clock, Users, Calendar, ClipboardCheck } from "lucide-react";
import { Session, Booking } from "@/types/booking";

interface SessionWithBookings extends Session {
  programName?: string;
  bookings?: Booking[];
}

export default function CoachSessionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [session, setSession] = useState<SessionWithBookings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSession();
  }, [id]);

  const fetchSession = async () => {
    try {
      const response = await fetch(`/api/coach/sessions/${id}`);
      const data = await response.json();

      if (data.success) {
        setSession(data.data);
      } else {
        setError(data.error || "Failed to fetch session");
      }
    } catch (err) {
      console.error("Error fetching session:", err);
      setError("Failed to fetch session");
    } finally {
      setLoading(false);
    }
  };

  const formatDayOfWeek = (day: number) => {
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    return days[day] || "Unknown";
  };

  const calculateAge = (dob: Date | { toDate?: () => Date }) => {
    const birthDate = dob instanceof Date ? dob : (dob.toDate ? dob.toDate() : new Date(dob as unknown as string));
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
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

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/coach/sessions"
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-neutral-200 hover:bg-neutral-50 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-semibold text-neutral-900">{session.name}</h1>
          {session.programName && (
            <p className="text-[13px] text-neutral-500">{session.programName}</p>
          )}
        </div>
        <Button variant="adminPrimary" asChild>
          <Link href={`/coach/attendance/${session.id}`}>
            <ClipboardCheck className="mr-2 h-4 w-4" />
            Take Attendance
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Session Details */}
        <AdminCard hover={false} className="lg:col-span-1">
          <h2 className="text-[15px] font-semibold text-neutral-900 mb-4">
            Session Details
          </h2>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50">
                <Calendar className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                  Day
                </p>
                <p className="text-[13px] text-neutral-900">
                  {formatDayOfWeek(session.dayOfWeek)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-50">
                <Clock className="h-5 w-5 text-sky-600" />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                  Time
                </p>
                <p className="text-[13px] text-neutral-900">
                  {session.startTime} - {session.endTime}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50">
                <MapPin className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                  Location
                </p>
                <p className="text-[13px] text-neutral-900">{session.location}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50">
                <Users className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                  Enrollment
                </p>
                <p className="text-[13px] text-neutral-900">
                  {session.enrolled}/{session.capacity} participants
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-neutral-100">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 mb-1">
                Age Range
              </p>
              <p className="text-[13px] text-neutral-900">
                {session.ageMin} - {session.ageMax} years old
              </p>
            </div>
          </div>
        </AdminCard>

        {/* Participant List */}
        <AdminCard hover={false} className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[15px] font-semibold text-neutral-900">
              Participants ({session.bookings?.length || 0})
            </h2>
          </div>

          {!session.bookings || session.bookings.length === 0 ? (
            <div className="text-center py-8">
              <Users className="mx-auto h-12 w-12 text-neutral-300" />
              <h3 className="mt-4 text-[15px] font-medium text-neutral-900">
                No participants yet
              </h3>
              <p className="mt-1 text-[13px] text-neutral-500">
                Bookings will appear here once participants register.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-6">
              <table className="w-full min-w-[500px]">
                <thead>
                  <tr className="border-b border-neutral-100">
                    <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                      Child
                    </th>
                    <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                      Age
                    </th>
                    <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                      Parent/Guardian
                    </th>
                    <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                      Medical Notes
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {session.bookings.map((booking) => (
                    <tr key={booking.id} className="hover:bg-neutral-50/50">
                      <td className="px-6 py-3">
                        <p className="font-medium text-neutral-900">
                          {booking.childFirstName} {booking.childLastName}
                        </p>
                      </td>
                      <td className="px-6 py-3 text-[13px] text-neutral-600">
                        {calculateAge(booking.childDOB)} years
                      </td>
                      <td className="px-6 py-3 text-[13px] text-neutral-600">
                        {booking.parentFirstName} {booking.parentLastName}
                      </td>
                      <td className="px-6 py-3">
                        <p className="text-[13px] text-neutral-600">{booking.parentPhone}</p>
                        <p className="text-[12px] text-neutral-400">{booking.parentEmail}</p>
                      </td>
                      <td className="px-6 py-3 text-[13px] text-neutral-600">
                        {booking.medicalConditions ? (
                          <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                            {booking.medicalConditions}
                          </span>
                        ) : (
                          <span className="text-neutral-400">None</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </AdminCard>
      </div>
    </div>
  );
}
