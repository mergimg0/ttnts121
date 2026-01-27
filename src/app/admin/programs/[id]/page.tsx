"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AdminCard } from "@/components/admin/ui/admin-card";
import { AdminSelect } from "@/components/admin/ui/admin-select";
import { ArrowLeft, Loader2, Plus } from "lucide-react";
import { LOCATIONS } from "@/lib/constants";
import { Program, Session } from "@/types/booking";

const serviceTypes = [
  { id: "after-school", name: "After School Club" },
  { id: "group-session", name: "Group Session" },
  { id: "half-term", name: "Half Term Camp" },
  { id: "one-to-one", name: "1:1 Coaching" },
  { id: "birthday-party", name: "Birthday Party" },
];

export default function EditProgramPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    location: "",
    serviceType: "",
    dateRange: {
      start: "",
      end: "",
    },
    isActive: true,
  });

  useEffect(() => {
    fetchProgram();
    fetchSessions();
  }, [id]);

  const fetchProgram = async () => {
    try {
      const response = await fetch(`/api/admin/programs/${id}`);
      const data = await response.json();
      if (data.success) {
        const program = data.data;
        setFormData({
          name: program.name,
          description: program.description || "",
          location: program.location,
          serviceType: program.serviceType,
          dateRange: {
            start: formatDateForInput(program.dateRange.start),
            end: formatDateForInput(program.dateRange.end),
          },
          isActive: program.isActive,
        });
      }
    } catch (error) {
      console.error("Error fetching program:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSessions = async () => {
    try {
      const response = await fetch(`/api/admin/sessions?programId=${id}`);
      const data = await response.json();
      if (data.success) {
        setSessions(data.data);
      }
    } catch (error) {
      console.error("Error fetching sessions:", error);
    }
  };

  const formatDateForInput = (date: any): string => {
    if (!date) return "";
    const d = date._seconds ? new Date(date._seconds * 1000) : new Date(date);
    return d.toISOString().split("T")[0];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/programs/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          dateRange: {
            start: new Date(formData.dateRange.start),
            end: new Date(formData.dateRange.end),
          },
        }),
      });

      const data = await response.json();

      if (data.success) {
        router.push("/admin/programs");
      } else {
        setError(data.error || "Failed to update program");
      }
    } catch (err) {
      setError("An error occurred");
    } finally {
      setSaving(false);
    }
  };

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
      <div className="flex items-center gap-4">
        <Link
          href="/admin/programs"
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-neutral-200 hover:bg-neutral-50 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-xl font-semibold text-neutral-900">
            Edit Program
          </h1>
          <p className="text-[13px] text-neutral-500">{formData.name}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Form */}
        <form onSubmit={handleSubmit} className="lg:col-span-2">
          <AdminCard hover={false}>
            {error && (
              <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="space-y-6">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-neutral-400 mb-2">
                  Program Name *
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-neutral-400 mb-2">
                  Description
                </label>
                <Textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={3}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-neutral-400 mb-2">
                    Location *
                  </label>
                  <AdminSelect
                    value={formData.location}
                    onChange={(e) =>
                      setFormData({ ...formData, location: e.target.value })
                    }
                    required
                  >
                    <option value="">Select location</option>
                    {LOCATIONS.map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        {loc.name}
                      </option>
                    ))}
                  </AdminSelect>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-neutral-400 mb-2">
                    Service Type *
                  </label>
                  <AdminSelect
                    value={formData.serviceType}
                    onChange={(e) =>
                      setFormData({ ...formData, serviceType: e.target.value })
                    }
                    required
                  >
                    {serviceTypes.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.name}
                      </option>
                    ))}
                  </AdminSelect>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-neutral-400 mb-2">
                    Start Date *
                  </label>
                  <Input
                    type="date"
                    value={formData.dateRange.start}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        dateRange: { ...formData.dateRange, start: e.target.value },
                      })
                    }
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-neutral-400 mb-2">
                    End Date *
                  </label>
                  <Input
                    type="date"
                    value={formData.dateRange.end}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        dateRange: { ...formData.dateRange, end: e.target.value },
                      })
                    }
                    required
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) =>
                    setFormData({ ...formData, isActive: e.target.checked })
                  }
                  className="h-4 w-4 rounded border-neutral-300 text-sky-600 focus:ring-sky-500"
                />
                <label htmlFor="isActive" className="text-[13px] text-neutral-600">
                  Program is active and visible to parents
                </label>
              </div>

              <div className="flex gap-3 pt-6 border-t border-neutral-100">
                <Button type="submit" variant="adminPrimary" disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
                <Button type="button" variant="adminSecondary" asChild>
                  <Link href="/admin/programs">Cancel</Link>
                </Button>
              </div>
            </div>
          </AdminCard>
        </form>

        {/* Sessions sidebar */}
        <AdminCard hover={false}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[15px] font-semibold text-neutral-900">
              Sessions
            </h2>
            <Button size="sm" variant="adminPrimary" asChild>
              <Link href={`/admin/programs/${id}/sessions/new`}>
                <Plus className="mr-1 h-3 w-3" />
                Add
              </Link>
            </Button>
          </div>

          {sessions.length === 0 ? (
            <p className="text-[13px] text-neutral-500 py-8 text-center">
              No sessions yet
            </p>
          ) : (
            <div className="space-y-2">
              {sessions.map((session) => (
                <Link
                  key={session.id}
                  href={`/admin/sessions/${session.id}`}
                  className="block rounded-xl border border-neutral-100 p-3 hover:border-neutral-300 hover:bg-neutral-50/50 transition-all duration-200"
                >
                  <p className="text-sm font-medium text-neutral-900">{session.name}</p>
                  <p className="text-[13px] text-neutral-500 mt-0.5">
                    {session.startTime} - {session.endTime} •{" "}
                    <span className="tabular-nums">{session.enrolled}/{session.capacity}</span> enrolled
                  </p>
                </Link>
              ))}
            </div>
          )}
        </AdminCard>
      </div>
    </div>
  );
}
