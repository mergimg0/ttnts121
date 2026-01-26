"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
            New Program
          </h1>
          <p className="text-neutral-500">Create a new coaching program</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="max-w-2xl">
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
              placeholder="e.g., After School Club - Spring 2024"
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
              placeholder="Brief description of this program..."
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
                <option value="">Select type</option>
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
        </div>

        <div className="mt-6 flex gap-4">
          <Button type="submit" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              "Create Program"
            )}
          </Button>
          <Button type="button" variant="secondary" asChild>
            <Link href="/admin/programs">Cancel</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}
