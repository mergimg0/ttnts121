"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { TableSkeleton } from "@/components/ui/skeleton";
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
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black uppercase tracking-wide text-black">
              Waitlist
            </h1>
            <p className="text-neutral-500">Loading...</p>
          </div>
        </div>
        <TableSkeleton rows={6} columns={6} />
      </div>
    );
  }

  // Group entries by status
  const pendingEntries = entries.filter((e) => e.status === "waiting");
  const notifiedEntries = entries.filter((e) => e.status === "notified");
  const convertedEntries = entries.filter((e) => e.status === "converted");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black uppercase tracking-wide text-black">
          Waitlist
        </h1>
        <p className="text-neutral-500">
          {entries.length} total entries • {pendingEntries.length} waiting
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="border border-neutral-200 bg-white p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-neutral-500">
            Waiting
          </p>
          <p className="mt-1 text-2xl font-bold text-black">
            {pendingEntries.length}
          </p>
        </div>
        <div className="border border-neutral-200 bg-white p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-neutral-500">
            Notified
          </p>
          <p className="mt-1 text-2xl font-bold text-yellow-600">
            {notifiedEntries.length}
          </p>
        </div>
        <div className="border border-neutral-200 bg-white p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-neutral-500">
            Converted
          </p>
          <p className="mt-1 text-2xl font-bold text-green-600">
            {convertedEntries.length}
          </p>
        </div>
      </div>

      {/* Waitlist Entries */}
      {entries.length === 0 ? (
        <div className="border border-neutral-200 bg-white p-12 text-center">
          <Users className="mx-auto h-12 w-12 text-neutral-300" />
          <h3 className="mt-4 font-bold text-black">No waitlist entries</h3>
          <p className="mt-2 text-neutral-500">
            When sessions are full, parents can join the waitlist
          </p>
        </div>
      ) : (
        <div className="border border-neutral-200 bg-white">
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50">
                <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-neutral-500">
                  Child
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-neutral-500">
                  Parent
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-neutral-500">
                  Session
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-neutral-500">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-neutral-500">
                  Added
                </th>
                <th className="px-6 py-3 text-right text-xs font-bold uppercase tracking-wider text-neutral-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {entries.map((entry) => {
                const session = sessions[entry.sessionId];
                const program = session ? programs[session.programId] : null;

                return (
                  <tr key={entry.id} className="hover:bg-neutral-50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-black">
                          {entry.childFirstName} {entry.childLastName}
                        </p>
                        <p className="text-sm text-neutral-500">
                          {entry.ageGroup}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm text-neutral-600">
                          {entry.parentFirstName} {entry.parentLastName}
                        </p>
                        <p className="text-sm text-neutral-500">
                          {entry.parentEmail}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm text-neutral-600">
                          {session?.name || "Unknown"}
                        </p>
                        <p className="text-sm text-neutral-500">
                          {program?.name || ""}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 text-xs font-bold uppercase ${
                          entry.status === "waiting"
                            ? "bg-blue-100 text-blue-700"
                            : entry.status === "notified"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-green-100 text-green-700"
                        }`}
                      >
                        {entry.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-neutral-600">
                      {formatDate(entry.createdAt)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {entry.status === "waiting" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleNotify(entry)}
                            disabled={processing === entry.id}
                            title="Send notification email"
                          >
                            {processing === entry.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Mail className="h-4 w-4" />
                            )}
                          </Button>
                        )}
                        {entry.status === "notified" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-green-600"
                            disabled
                            title="Already notified"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemove(entry.id)}
                          disabled={processing === entry.id}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          {processing === entry.id ? (
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
