"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { TableSkeleton } from "@/components/ui/skeleton";
import { Edit, Trash2, Calendar, Users, Loader2 } from "lucide-react";
import { Session, Program } from "@/types/booking";
import { formatPrice, formatTime, getDayName } from "@/lib/booking-utils";

export default function SessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [programs, setPrograms] = useState<Record<string, Program>>({});
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [sessionsRes, programsRes] = await Promise.all([
        fetch("/api/admin/sessions"),
        fetch("/api/admin/programs"),
      ]);

      const sessionsData = await sessionsRes.json();
      const programsData = await programsRes.json();

      if (sessionsData.success) {
        setSessions(sessionsData.data);
      }

      if (programsData.success) {
        const programMap: Record<string, Program> = {};
        programsData.data.forEach((p: Program) => {
          programMap[p.id] = p;
        });
        setPrograms(programMap);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this session?")) {
      return;
    }

    setDeleting(id);
    try {
      const response = await fetch(`/api/admin/sessions/${id}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (data.success) {
        setSessions(sessions.filter((s) => s.id !== id));
      } else {
        alert(data.error || "Failed to delete session");
      }
    } catch (error) {
      console.error("Error deleting session:", error);
    } finally {
      setDeleting(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black uppercase tracking-wide text-black">
              Sessions
            </h1>
            <p className="text-neutral-500">Loading...</p>
          </div>
        </div>
        <TableSkeleton rows={6} columns={7} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-wide text-black">
            Sessions
          </h1>
          <p className="text-neutral-500">
            Manage individual bookable sessions
          </p>
        </div>
      </div>

      {/* Sessions List */}
      {sessions.length === 0 ? (
        <div className="border border-neutral-200 bg-white p-12 text-center">
          <Calendar className="mx-auto h-12 w-12 text-neutral-300" />
          <h3 className="mt-4 font-bold text-black">No sessions yet</h3>
          <p className="mt-2 text-neutral-500">
            Create a program first, then add sessions to it
          </p>
          <Button asChild className="mt-6">
            <Link href="/admin/programs">View Programs</Link>
          </Button>
        </div>
      ) : (
        <div className="border border-neutral-200 bg-white">
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50">
                <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-neutral-500">
                  Session
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-neutral-500">
                  Program
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-neutral-500">
                  Schedule
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-neutral-500">
                  Capacity
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-neutral-500">
                  Price
                </th>
                <th className="px-6 py-3 text-right text-xs font-bold uppercase tracking-wider text-neutral-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {sessions.map((session) => {
                const program = programs[session.programId];
                const capacityPercent = Math.round(
                  (session.enrolled / session.capacity) * 100
                );

                return (
                  <tr key={session.id} className="hover:bg-neutral-50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-black">{session.name}</p>
                        <p className="text-sm text-neutral-500">
                          Ages {session.ageMin}-{session.ageMax}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-neutral-600">
                        {program?.name || "Unknown"}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-neutral-600">
                        {getDayName(session.dayOfWeek)}
                      </p>
                      <p className="text-sm text-neutral-500">
                        {formatTime(session.startTime)} -{" "}
                        {formatTime(session.endTime)}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-neutral-400" />
                        <span className="text-sm">
                          {session.enrolled}/{session.capacity}
                        </span>
                        <div className="w-16 h-2 bg-neutral-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${
                              capacityPercent >= 90
                                ? "bg-red-500"
                                : capacityPercent >= 70
                                  ? "bg-yellow-500"
                                  : "bg-green-500"
                            }`}
                            style={{ width: `${capacityPercent}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-medium">
                        {formatPrice(session.price)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/admin/sessions/${session.id}`}>
                            <Edit className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(session.id)}
                          disabled={deleting === session.id}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          {deleting === session.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
