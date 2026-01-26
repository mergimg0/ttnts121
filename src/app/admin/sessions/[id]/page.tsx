"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Session } from "@/types/booking";

const daysOfWeek = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
];

export default function EditSessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    dayOfWeek: 1,
    startTime: "16:00",
    endTime: "17:00",
    ageMin: 5,
    ageMax: 12,
    capacity: 15,
    price: 1000,
    isActive: true,
  });

  useEffect(() => {
    fetchSession();
  }, [id]);

  const fetchSession = async () => {
    try {
      const response = await fetch(`/api/admin/sessions/${id}`);
      const data = await response.json();
      if (data.success) {
        setSession(data.data);
        setFormData({
          name: data.data.name,
          dayOfWeek: data.data.dayOfWeek,
          startTime: data.data.startTime,
          endTime: data.data.endTime,
          ageMin: data.data.ageMin,
          ageMax: data.data.ageMax,
          capacity: data.data.capacity,
          price: data.data.price,
          isActive: data.data.isActive,
        });
      }
    } catch (error) {
      console.error("Error fetching session:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/sessions/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        router.push("/admin/sessions");
      } else {
        setError(data.error || "Failed to update session");
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
          href="/admin/sessions"
          className="flex h-10 w-10 items-center justify-center border border-neutral-200 hover:bg-neutral-50"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-black uppercase tracking-wide text-black">
            Edit Session
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
                Session Name *
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

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500">
                  Day of Week *
                </label>
                <select
                  value={formData.dayOfWeek}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      dayOfWeek: Number(e.target.value),
                    })
                  }
                  required
                  className="mt-2 w-full rounded-none border border-neutral-300 px-3 py-2"
                >
                  {daysOfWeek.map((day) => (
                    <option key={day.value} value={day.value}>
                      {day.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500">
                  Capacity *
                </label>
                <Input
                  type="number"
                  min={1}
                  max={100}
                  value={formData.capacity}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      capacity: Number(e.target.value),
                    })
                  }
                  required
                  className="mt-2 rounded-none"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500">
                  Start Time *
                </label>
                <Input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) =>
                    setFormData({ ...formData, startTime: e.target.value })
                  }
                  required
                  className="mt-2 rounded-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500">
                  End Time *
                </label>
                <Input
                  type="time"
                  value={formData.endTime}
                  onChange={(e) =>
                    setFormData({ ...formData, endTime: e.target.value })
                  }
                  required
                  className="mt-2 rounded-none"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500">
                  Minimum Age *
                </label>
                <Input
                  type="number"
                  min={3}
                  max={18}
                  value={formData.ageMin}
                  onChange={(e) =>
                    setFormData({ ...formData, ageMin: Number(e.target.value) })
                  }
                  required
                  className="mt-2 rounded-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500">
                  Maximum Age *
                </label>
                <Input
                  type="number"
                  min={3}
                  max={18}
                  value={formData.ageMax}
                  onChange={(e) =>
                    setFormData({ ...formData, ageMax: Number(e.target.value) })
                  }
                  required
                  className="mt-2 rounded-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500">
                Price (in pence) *
              </label>
              <Input
                type="number"
                min={0}
                step={100}
                value={formData.price}
                onChange={(e) =>
                  setFormData({ ...formData, price: Number(e.target.value) })
                }
                required
                className="mt-2 rounded-none"
              />
              <p className="mt-1 text-xs text-neutral-500">
                Enter price in pence (e.g., 1000 = £10.00)
              </p>
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
                Session is active and available for booking
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
                <Link href="/admin/sessions">Cancel</Link>
              </Button>
            </div>
          </div>
        </form>

        {/* Stats sidebar */}
        <div className="border border-neutral-200 bg-white p-6">
          <h2 className="font-bold uppercase tracking-wide text-black mb-4">
            Session Stats
          </h2>
          {session && (
            <div className="space-y-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                  Enrollment
                </p>
                <p className="mt-1 text-2xl font-bold">
                  {session.enrolled}/{session.capacity}
                </p>
                <div className="mt-2 w-full h-2 bg-neutral-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${
                      (session.enrolled / session.capacity) * 100 >= 90
                        ? "bg-red-500"
                        : (session.enrolled / session.capacity) * 100 >= 70
                          ? "bg-yellow-500"
                          : "bg-green-500"
                    }`}
                    style={{
                      width: `${(session.enrolled / session.capacity) * 100}%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                  Available Spots
                </p>
                <p className="mt-1 text-2xl font-bold">
                  {session.capacity - session.enrolled}
                </p>
              </div>

              <div className="pt-4 border-t border-neutral-200">
                <Button variant="secondary" className="w-full" asChild>
                  <Link
                    href={`/admin/bookings?sessionId=${session.id}`}
                  >
                    View Bookings
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
