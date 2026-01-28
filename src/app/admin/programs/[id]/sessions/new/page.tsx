"use client";

import { useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { DateRangePicker } from "@/components/admin/ui/date-range-picker";
import { DaySelector, calculateOccurrences } from "@/components/admin/ui/day-selector";
import { ArrowLeft, Loader2, Calendar } from "lucide-react";

export default function NewSessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: programId } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get default dates (today to 3 months from now)
  const today = new Date().toISOString().split("T")[0];
  const threeMonthsLater = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  const [formData, setFormData] = useState({
    name: "",
    daysOfWeek: [1] as number[], // Default to Monday
    startDate: today,
    endDate: threeMonthsLater,
    startTime: "16:00",
    endTime: "17:00",
    ageMin: 5,
    ageMax: 12,
    capacity: 15,
    price: 1000,
    isActive: true,
    lowStockThreshold: 3,
    waitlistEnabled: true,
  });

  const occurrences = calculateOccurrences(
    formData.startDate,
    formData.endDate,
    formData.daysOfWeek
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.daysOfWeek.length === 0) {
      setError("Please select at least one day of the week");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          // For backward compatibility, also set dayOfWeek to first selected day
          dayOfWeek: formData.daysOfWeek[0],
          programId,
          enrolled: 0,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast(`Session "${formData.name}" created successfully`, "success");
        router.push(`/admin/programs/${programId}`);
      } else {
        setError(data.error || "Failed to create session");
        toast(data.error || "Failed to create session", "error");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred";
      setError(errorMessage);
      toast(errorMessage, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href={`/admin/programs/${programId}`}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-neutral-200 hover:bg-neutral-50 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-xl font-semibold text-neutral-900">
            New Session
          </h1>
          <p className="text-[13px] text-neutral-500">Add a new session to this program</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="max-w-2xl">
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 space-y-6">
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-neutral-400 mb-2">
              Session Name *
            </label>
            <Input
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
              placeholder="e.g., Monday Juniors"
            />
          </div>

          {/* Date Range */}
          <div className="pt-4 border-t border-neutral-100">
            <h3 className="text-sm font-medium text-neutral-700 mb-4">Schedule</h3>
            <DateRangePicker
              startDate={formData.startDate}
              endDate={formData.endDate}
              onStartDateChange={(date) => setFormData({ ...formData, startDate: date })}
              onEndDateChange={(date) => setFormData({ ...formData, endDate: date })}
            />
          </div>

          {/* Day Selector */}
          <div>
            <DaySelector
              selectedDays={formData.daysOfWeek}
              onChange={(days) => setFormData({ ...formData, daysOfWeek: days })}
              multiple={true}
            />
          </div>

          {/* Session count preview */}
          {occurrences > 0 && (
            <div className="flex items-center gap-2 rounded-xl bg-sky-50 border border-sky-200 p-3">
              <Calendar className="h-4 w-4 text-sky-600" />
              <span className="text-sm text-sky-700">
                <strong>{occurrences}</strong> session{occurrences !== 1 ? "s" : ""} from{" "}
                {new Date(formData.startDate).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                })}{" "}
                to{" "}
                {new Date(formData.endDate).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </span>
            </div>
          )}

          {/* Times */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-neutral-400 mb-2">
                Start Time *
              </label>
              <Input
                type="time"
                value={formData.startTime}
                onChange={(e) =>
                  setFormData({ ...formData, startTime: e.target.value })
                }
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-neutral-400 mb-2">
                End Time *
              </label>
              <Input
                type="time"
                value={formData.endTime}
                onChange={(e) =>
                  setFormData({ ...formData, endTime: e.target.value })
                }
                required
              />
            </div>
          </div>

          {/* Capacity */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-neutral-400 mb-2">
              Capacity *
            </label>
            <Input
              type="number"
              min={1}
              max={100}
              value={formData.capacity}
              onChange={(e) =>
                setFormData({ ...formData, capacity: Number(e.target.value) })
              }
              required
            />
          </div>

          {/* Age Range */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-neutral-400 mb-2">
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
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-neutral-400 mb-2">
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
              />
            </div>
          </div>

          {/* Price */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-neutral-400 mb-2">
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
            />
            <p className="mt-1.5 text-[13px] text-neutral-500">
              Enter price in pence (e.g., 1000 = £10.00)
            </p>
          </div>

          {/* Low Stock Threshold */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-neutral-400 mb-2">
              Low Stock Threshold
            </label>
            <Input
              type="number"
              min={1}
              max={20}
              value={formData.lowStockThreshold}
              onChange={(e) =>
                setFormData({ ...formData, lowStockThreshold: Number(e.target.value) })
              }
            />
            <p className="mt-1.5 text-[13px] text-neutral-500">
              Show &quot;X spots left&quot; badge when spots remaining ≤ this number
            </p>
          </div>

          {/* Toggles */}
          <div className="space-y-3 pt-4 border-t border-neutral-100">
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
                Session is active and available for booking
              </label>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="waitlistEnabled"
                checked={formData.waitlistEnabled}
                onChange={(e) =>
                  setFormData({ ...formData, waitlistEnabled: e.target.checked })
                }
                className="h-4 w-4 rounded border-neutral-300 text-sky-600 focus:ring-sky-500"
              />
              <label htmlFor="waitlistEnabled" className="text-[13px] text-neutral-600">
                Enable waitlist when session is full
              </label>
            </div>
          </div>
        </div>

        <div className="mt-6 flex gap-4">
          <Button type="submit" variant="adminPrimary" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              "Create Session"
            )}
          </Button>
          <Button type="button" variant="adminSecondary" asChild>
            <Link href={`/admin/programs/${programId}`}>Discard</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}
