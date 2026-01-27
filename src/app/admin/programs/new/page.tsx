"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AdminCard } from "@/components/admin/ui/admin-card";
import { AdminSelect } from "@/components/admin/ui/admin-select";
import { ArrowLeft, Loader2 } from "lucide-react";
import { LOCATIONS } from "@/lib/constants";

const serviceTypes = [
  { id: "after-school", name: "After School Club" },
  { id: "group-session", name: "Group Session" },
  { id: "half-term", name: "Half Term Camp" },
  { id: "one-to-one", name: "1:1 Coaching" },
  { id: "birthday-party", name: "Birthday Party" },
];

export default function NewProgramPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/programs", {
        method: "POST",
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
        setError(data.error || "Failed to create program");
      }
    } catch (err) {
      setError("An error occurred");
    } finally {
      setLoading(false);
    }
  };

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
            New Program
          </h1>
          <p className="text-[13px] text-neutral-500">Create a new coaching program</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="max-w-2xl">
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
                placeholder="e.g., After School Club - Spring 2024"
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
                placeholder="Brief description of this program..."
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
                  <option value="">Select type</option>
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
              <Button type="submit" variant="adminPrimary" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Program"
                )}
              </Button>
              <Button type="button" variant="adminSecondary" asChild>
                <Link href="/admin/programs">Cancel</Link>
              </Button>
            </div>
          </div>
        </AdminCard>
      </form>
    </div>
  );
}
