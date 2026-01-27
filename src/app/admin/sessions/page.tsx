"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { TableSkeleton } from "@/components/ui/skeleton";
import { AdminPageHeader } from "@/components/admin/ui/admin-page-header";
import { AdminEmptyState } from "@/components/admin/ui/admin-empty-state";
import { AdminTable, AdminTableHead, AdminTableHeader, AdminTableBody, AdminTableRow, AdminTableCell } from "@/components/admin/ui/admin-table";
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
      <div className="space-y-8">
        <AdminPageHeader
          title="Sessions"
          subtitle="Loading..."
        />
        <TableSkeleton rows={6} columns={6} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <AdminPageHeader
        title="Sessions"
        subtitle="Manage individual bookable sessions"
      />

      {/* Sessions List */}
      {sessions.length === 0 ? (
        <AdminEmptyState
          icon={Calendar}
          title="No sessions yet"
          description="Create a program first, then add sessions to it"
          action={
            <Button variant="adminPrimary" asChild>
              <Link href="/admin/programs">View Programs</Link>
            </Button>
          }
        />
      ) : (
        <AdminTable>
          <AdminTableHead>
            <tr>
              <AdminTableHeader>Session</AdminTableHeader>
              <AdminTableHeader>Program</AdminTableHeader>
              <AdminTableHeader>Schedule</AdminTableHeader>
              <AdminTableHeader>Capacity</AdminTableHeader>
              <AdminTableHeader>Price</AdminTableHeader>
              <AdminTableHeader className="text-right">Actions</AdminTableHeader>
            </tr>
          </AdminTableHead>
          <AdminTableBody>
            {sessions.map((session) => {
              const program = programs[session.programId];
              const capacityPercent = Math.round(
                (session.enrolled / session.capacity) * 100
              );

              return (
                <AdminTableRow key={session.id}>
                  <AdminTableCell>
                    <div>
                      <p className="text-sm font-medium text-neutral-900">{session.name}</p>
                      <p className="text-[13px] text-neutral-500">
                        Ages {session.ageMin}-{session.ageMax}
                      </p>
                    </div>
                  </AdminTableCell>
                  <AdminTableCell>
                    <p className="text-sm text-neutral-600">
                      {program?.name || "Unknown"}
                    </p>
                  </AdminTableCell>
                  <AdminTableCell>
                    <p className="text-sm text-neutral-900">
                      {getDayName(session.dayOfWeek)}
                    </p>
                    <p className="text-[13px] text-neutral-500">
                      {formatTime(session.startTime)} - {formatTime(session.endTime)}
                    </p>
                  </AdminTableCell>
                  <AdminTableCell>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-neutral-400" />
                      <span className="text-sm tabular-nums">
                        {session.enrolled}/{session.capacity}
                      </span>
                      <div className="w-16 h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            capacityPercent >= 90
                              ? "bg-red-500"
                              : capacityPercent >= 70
                                ? "bg-amber-500"
                                : "bg-emerald-500"
                          }`}
                          style={{ width: `${capacityPercent}%` }}
                        />
                      </div>
                    </div>
                  </AdminTableCell>
                  <AdminTableCell>
                    <span className="text-sm font-semibold tabular-nums text-neutral-900">
                      {formatPrice(session.price)}
                    </span>
                  </AdminTableCell>
                  <AdminTableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        href={`/admin/sessions/${session.id}`}
                        className="p-2 text-neutral-400 hover:text-neutral-900 transition-colors rounded-lg hover:bg-neutral-100"
                      >
                        <Edit className="h-4 w-4" />
                      </Link>
                      <button
                        onClick={() => handleDelete(session.id)}
                        disabled={deleting === session.id}
                        className="p-2 text-neutral-400 hover:text-red-600 transition-colors rounded-lg hover:bg-red-50 disabled:opacity-50"
                      >
                        {deleting === session.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </AdminTableCell>
                </AdminTableRow>
              );
            })}
          </AdminTableBody>
        </AdminTable>
      )}
    </div>
  );
}
