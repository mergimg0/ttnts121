"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/admin/programs"
          className="flex h-10 w-10 items-center justify-center border border-neutral-200 hover:bg-neutral-50"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-black uppercase tracking-wide text-black">
            Edit Program
          </h1>
          <p className="text-neutral-500">{formData.name}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Form */}
        <form onSubmit={handleSubmit} className="lg:col-span-2">
          <div className="border border-neutral-200 bg-white p-6 space-y-6">
            {error && (
              <div className="border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500">
                Program Name *
              </label>
              <Input
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
                className="mt-2 rounded-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500">
                Description
              </label>
              <Textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={3}
                className="mt-2 rounded-none"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500">
                  Location *
                </label>
                <select
                  value={formData.location}
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                  required
                  className="mt-2 w-full rounded-none border border-neutral-300 px-3 py-2"
                >
                  <option value="">Select location</option>
                  {LOCATIONS.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500">
                  Service Type *
                </label>
                <select
                  value={formData.serviceType}
                  onChange={(e) =>
                    setFormData({ ...formData, serviceType: e.target.value })
                  }
                  required
                  className="mt-2 w-full rounded-none border border-neutral-300 px-3 py-2"
                >
                  {serviceTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500">
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
                  className="mt-2 rounded-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500">
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
                  className="mt-2 rounded-none"
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
                className="h-4 w-4"
              />
              <label htmlFor="isActive" className="text-sm text-neutral-600">
                Program is active and visible to parents
              </label>
            </div>

            <div className="flex gap-4 pt-4 border-t border-neutral-200">
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
              <Button type="button" variant="secondary" asChild>
                <Link href="/admin/programs">Cancel</Link>
              </Button>
            </div>
          </div>
        </form>

        {/* Sessions sidebar */}
        <div className="border border-neutral-200 bg-white p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold uppercase tracking-wide text-black">
              Sessions
            </h2>
            <Button size="sm" asChild>
              <Link href={`/admin/programs/${id}/sessions/new`}>
                <Plus className="mr-1 h-3 w-3" />
                Add
              </Link>
            </Button>
          </div>

          {sessions.length === 0 ? (
            <p className="text-sm text-neutral-500 py-4 text-center">
              No sessions yet
            </p>
          ) : (
            <div className="space-y-2">
              {sessions.map((session) => (
                <Link
                  key={session.id}
                  href={`/admin/sessions/${session.id}`}
                  className="block border border-neutral-200 p-3 hover:border-black transition-colors"
                >
                  <p className="font-medium text-sm">{session.name}</p>
                  <p className="text-xs text-neutral-500">
                    {session.startTime} - {session.endTime} •{" "}
                    {session.enrolled}/{session.capacity} enrolled
                  </p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
