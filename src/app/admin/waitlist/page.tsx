"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { TableSkeleton } from "@/components/ui/skeleton";
import { AdminPageHeader } from "@/components/admin/ui/admin-page-header";
import { AdminCard } from "@/components/admin/ui/admin-card";
import { AdminEmptyState } from "@/components/admin/ui/admin-empty-state";
import { AdminBadge } from "@/components/admin/ui/admin-badge";
import { ResponsiveTable, MobileCard, MobileCardRow } from "@/components/admin/mobile-table";
import { Loader2, Users, Mail, Trash2, CheckCircle } from "lucide-react";
import { WaitlistEntry, Session, Program } from "@/types/booking";

export default function WaitlistPage() {
  const [entries, setEntries] = useState<WaitlistEntry[]>([]);
  const [sessions, setSessions] = useState<Record<string, Session>>({});
  const [programs, setPrograms] = useState<Record<string, Program>>({});
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [waitlistRes, sessionsRes, programsRes] = await Promise.all([
        fetch("/api/admin/waitlist"),
        fetch("/api/admin/sessions"),
        fetch("/api/admin/programs"),
      ]);

      const [waitlistData, sessionsData, programsData] = await Promise.all([
        waitlistRes.json(),
        sessionsRes.json(),
        programsRes.json(),
      ]);

      if (waitlistData.success) {
        setEntries(waitlistData.data);
      }

      if (sessionsData.success) {
        const sessionMap: Record<string, Session> = {};
        sessionsData.data.forEach((s: Session) => {
          sessionMap[s.id] = s;
        });
        setSessions(sessionMap);
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

  const handleNotify = async (entry: WaitlistEntry) => {
    setProcessing(entry.id);
    try {
      const response = await fetch(`/api/admin/waitlist/${entry.id}/notify`, {
        method: "POST",
      });
      const data = await response.json();
      if (data.success) {
        setEntries(
          entries.map((e) =>
            e.id === entry.id
              ? { ...e, status: "notified", notifiedAt: new Date() }
              : e
          )
        );
      } else {
        alert(data.error || "Failed to send notification");
      }
    } catch (error) {
      console.error("Error notifying:", error);
    } finally {
      setProcessing(null);
    }
  };

  const handleRemove = async (id: string) => {
    if (!confirm("Are you sure you want to remove this waitlist entry?")) {
      return;
    }

    setProcessing(id);
    try {
      const response = await fetch(`/api/admin/waitlist/${id}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (data.success) {
        setEntries(entries.filter((e) => e.id !== id));
      } else {
        alert(data.error || "Failed to remove entry");
      }
    } catch (error) {
      console.error("Error removing entry:", error);
    } finally {
      setProcessing(null);
    }
  };

  const formatDate = (date: any): string => {
    if (!date) return "-";
    const d = date._seconds ? new Date(date._seconds * 1000) : new Date(date);
    return d.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <AdminPageHeader
          title="Waitlist"
          subtitle="Loading..."
        />
        <TableSkeleton rows={6} columns={6} />
      </div>
    );
  }

  // Group entries by status
  const pendingEntries = entries.filter((e) => e.status === "waiting");
  const notifiedEntries = entries.filter((e) => e.status === "notified");
  const convertedEntries = entries.filter((e) => e.status === "converted");

  return (
    <div className="space-y-8">
      {/* Header */}
      <AdminPageHeader
        title="Waitlist"
        subtitle={`${entries.length} total entries • ${pendingEntries.length} waiting`}
      />

      {/* Stats */}
      <div className="grid gap-2 grid-cols-3">
        <AdminCard className="p-3 lg:p-6">
          <p className="text-[10px] lg:text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
            Waiting
          </p>
          <p className="mt-0.5 lg:mt-1 text-lg lg:text-2xl font-semibold tabular-nums text-neutral-900">
            {pendingEntries.length}
          </p>
        </AdminCard>
        <AdminCard className="p-3 lg:p-6">
          <p className="text-[10px] lg:text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
            Notified
          </p>
          <p className="mt-0.5 lg:mt-1 text-lg lg:text-2xl font-semibold tabular-nums text-amber-600">
            {notifiedEntries.length}
          </p>
        </AdminCard>
        <AdminCard className="p-3 lg:p-6">
          <p className="text-[10px] lg:text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
            Converted
          </p>
          <p className="mt-0.5 lg:mt-1 text-lg lg:text-2xl font-semibold tabular-nums text-emerald-600">
            {convertedEntries.length}
          </p>
        </AdminCard>
      </div>

      {/* Waitlist Entries */}
      {entries.length === 0 ? (
        <AdminEmptyState
          icon={Users}
          title="No waitlist entries"
          description="When sessions are full, parents can join the waitlist"
        />
      ) : (
        <ResponsiveTable
          mobileView={
            entries.map((entry) => {
              const session = sessions[entry.sessionId];
              const program = session ? programs[session.programId] : null;

              return (
                <MobileCard key={entry.id}>
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-neutral-900">
                        {entry.childFirstName} {entry.childLastName}
                      </p>
                      <p className="text-[12px] text-neutral-500">{entry.ageGroup}</p>
                    </div>
                    <AdminBadge
                      variant={
                        entry.status === "waiting"
                          ? "info"
                          : entry.status === "notified"
                            ? "warning"
                            : "success"
                      }
                    >
                      {entry.status}
                    </AdminBadge>
                  </div>
                  <MobileCardRow label="Parent">
                    <span className="text-[12px]">{entry.parentEmail}</span>
                  </MobileCardRow>
                  <MobileCardRow label="Session">
                    {session?.name || "Unknown"}
                  </MobileCardRow>
                  <MobileCardRow label="Added">
                    {formatDate(entry.createdAt)}
                  </MobileCardRow>
                  <div className="pt-2 border-t border-neutral-100 flex gap-2">
                    {entry.status === "waiting" && (
                      <button
                        onClick={() => handleNotify(entry)}
                        disabled={processing === entry.id}
                        className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-[12px] font-medium text-sky-600 hover:bg-sky-50 rounded-lg transition-colors disabled:opacity-50"
                      >
                        {processing === entry.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Mail className="h-3.5 w-3.5" />
                        )}
                        Notify
                      </button>
                    )}
                    {entry.status === "notified" && (
                      <span className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-[12px] font-medium text-emerald-600">
                        <CheckCircle className="h-3.5 w-3.5" />
                        Notified
                      </span>
                    )}
                    <button
                      onClick={() => handleRemove(entry.id)}
                      disabled={processing === entry.id}
                      className="p-1.5 text-neutral-400 hover:text-red-600 transition-colors rounded-lg hover:bg-red-50 disabled:opacity-50"
                    >
                      {processing === entry.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </MobileCard>
              );
            })
          }
        >
          <AdminCard hover={false} padding={false}>
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-100">
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                    Child
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                    Parent
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                    Session
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                    Added
                  </th>
                  <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-50">
                {entries.map((entry) => {
                  const session = sessions[entry.sessionId];
                  const program = session ? programs[session.programId] : null;

                  return (
                    <tr key={entry.id} className="group hover:bg-neutral-50/50 transition-colors">
                      <td className="px-4 py-4">
                        <div>
                          <p className="text-sm font-medium text-neutral-900">
                            {entry.childFirstName} {entry.childLastName}
                          </p>
                          <p className="text-[13px] text-neutral-500">
                            {entry.ageGroup}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div>
                          <p className="text-sm text-neutral-600">
                            {entry.parentFirstName} {entry.parentLastName}
                          </p>
                          <p className="text-[13px] text-neutral-500">
                            {entry.parentEmail}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div>
                          <p className="text-sm text-neutral-600">
                            {session?.name || "Unknown"}
                          </p>
                          <p className="text-[13px] text-neutral-500">
                            {program?.name || ""}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <AdminBadge
                          variant={
                            entry.status === "waiting"
                              ? "info"
                              : entry.status === "notified"
                                ? "warning"
                                : "success"
                          }
                        >
                          {entry.status}
                        </AdminBadge>
                      </td>
                      <td className="px-4 py-4 text-[13px] text-neutral-500">
                        {formatDate(entry.createdAt)}
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {entry.status === "waiting" && (
                            <button
                              onClick={() => handleNotify(entry)}
                              disabled={processing === entry.id}
                              className="p-2 text-neutral-400 hover:text-sky-600 transition-colors rounded-lg hover:bg-sky-50 disabled:opacity-50"
                              title="Send notification email"
                            >
                              {processing === entry.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Mail className="h-4 w-4" />
                              )}
                            </button>
                          )}
                          {entry.status === "notified" && (
                            <span
                              className="p-2 text-emerald-500"
                              title="Already notified"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </span>
                          )}
                          <button
                            onClick={() => handleRemove(entry.id)}
                            disabled={processing === entry.id}
                            className="p-2 text-neutral-400 hover:text-red-600 transition-colors rounded-lg hover:bg-red-50 disabled:opacity-50"
                          >
                            {processing === entry.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </AdminCard>
        </ResponsiveTable>
      )}
    </div>
  );
}
