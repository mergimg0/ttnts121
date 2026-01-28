"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { AdminCard } from "@/components/admin/ui/admin-card";
import { AdminSelect } from "@/components/admin/ui/admin-select";
import { ArrowLeft, Loader2, Lock, LockOpen, AlertTriangle, Trash2 } from "lucide-react";
import { ConfirmDialog } from "@/components/admin/ui/confirm-dialog";
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
  const [toggling, setToggling] = useState(false);
  const [deleting, setDeleting] = useState(false);
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
    lowStockThreshold: 3,
    waitlistEnabled: true,
    // Deposit settings
    depositEnabled: false,
    depositAmount: 0,
    depositPercentage: 25,
    balanceDueDays: 7,
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
          lowStockThreshold: data.data.lowStockThreshold ?? 3,
          waitlistEnabled: data.data.waitlistEnabled ?? true,
          // Deposit settings
          depositEnabled: data.data.depositEnabled ?? false,
          depositAmount: data.data.depositAmount ?? 0,
          depositPercentage: data.data.depositPercentage ?? 25,
          balanceDueDays: data.data.balanceDueDays ?? 7,
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
        toast(`Session "${formData.name}" updated successfully`, "success");
        router.push("/admin/sessions");
      } else {
        setError(data.error || "Failed to update session");
        toast(data.error || "Failed to update session", "error");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred";
      setError(errorMessage);
      toast(errorMessage, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleClosed = async () => {
    if (!session) return;

    setToggling(true);
    try {
      const response = await fetch(`/api/admin/sessions/${id}/toggle-closed`, {
        method: "PATCH",
      });

      const data = await response.json();

      if (data.success) {
        toast(data.message, "success");
        // Update local session state
        setSession({
          ...session,
          isForceClosed: data.data.isForceClosed,
        });
      } else {
        toast(data.error || "Failed to update enrollment status", "error");
      }
    } catch (err) {
      toast("An error occurred while updating enrollment status", "error");
    } finally {
      setToggling(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const response = await fetch(`/api/admin/sessions/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        toast("Session deleted successfully", "success");
        router.push("/admin/sessions");
      } else {
        toast(data.error || "Failed to delete session", "error");
      }
    } catch (err) {
      toast("An error occurred while deleting session", "error");
    } finally {
      setDeleting(false);
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
          href="/admin/sessions"
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-neutral-200 hover:bg-neutral-50 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-xl font-semibold text-neutral-900">
            Edit Session
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
                  Session Name *
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-neutral-400 mb-2">
                    Day of Week *
                  </label>
                  <AdminSelect
                    value={formData.dayOfWeek}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        dayOfWeek: Number(e.target.value),
                      })
                    }
                    required
                  >
                    {daysOfWeek.map((day) => (
                      <option key={day.value} value={day.value}>
                        {day.label}
                      </option>
                    ))}
                  </AdminSelect>
                </div>

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
                      setFormData({
                        ...formData,
                        capacity: Number(e.target.value),
                      })
                    }
                    required
                  />
                </div>
              </div>

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

              <div className="grid gap-4 sm:grid-cols-2">
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
                    Show &quot;X spots left&quot; badge when spots ≤ this number
                  </p>
                </div>
              </div>

              <div className="space-y-3">
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

              {/* Deposit Settings */}
              <div className="pt-6 border-t border-neutral-100">
                <h3 className="text-[13px] font-semibold uppercase tracking-wider text-neutral-700 mb-4">
                  Deposit Settings
                </h3>

                <div className="flex items-center gap-3 mb-4">
                  <input
                    type="checkbox"
                    id="depositEnabled"
                    checked={formData.depositEnabled}
                    onChange={(e) =>
                      setFormData({ ...formData, depositEnabled: e.target.checked })
                    }
                    className="h-4 w-4 rounded border-neutral-300 text-sky-600 focus:ring-sky-500"
                  />
                  <label htmlFor="depositEnabled" className="text-[13px] text-neutral-600">
                    Allow deposit payments (partial payment option)
                  </label>
                </div>

                {formData.depositEnabled && (
                  <div className="ml-7 space-y-4 p-4 bg-neutral-50 rounded-lg border border-neutral-200">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="block text-[11px] font-semibold uppercase tracking-wider text-neutral-400 mb-2">
                          Fixed Deposit Amount (pence)
                        </label>
                        <Input
                          type="number"
                          min={0}
                          step={100}
                          value={formData.depositAmount}
                          onChange={(e) =>
                            setFormData({ ...formData, depositAmount: Number(e.target.value) })
                          }
                          placeholder="e.g., 2000 = £20"
                        />
                        <p className="mt-1 text-[11px] text-neutral-500">
                          Set to 0 to use percentage instead
                        </p>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold uppercase tracking-wider text-neutral-400 mb-2">
                          Deposit Percentage
                        </label>
                        <Input
                          type="number"
                          min={1}
                          max={99}
                          value={formData.depositPercentage}
                          onChange={(e) =>
                            setFormData({ ...formData, depositPercentage: Number(e.target.value) })
                          }
                        />
                        <p className="mt-1 text-[11px] text-neutral-500">
                          Used if fixed amount is 0 (e.g., 25 = 25%)
                        </p>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold uppercase tracking-wider text-neutral-400 mb-2">
                        Balance Due (days before session)
                      </label>
                      <Input
                        type="number"
                        min={1}
                        max={90}
                        value={formData.balanceDueDays}
                        onChange={(e) =>
                          setFormData({ ...formData, balanceDueDays: Number(e.target.value) })
                        }
                      />
                      <p className="mt-1 text-[11px] text-neutral-500">
                        Number of days before session starts when balance must be paid
                      </p>
                    </div>

                    {/* Preview */}
                    <div className="bg-white p-3 rounded border border-neutral-200">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 mb-1">
                        Preview
                      </p>
                      <p className="text-[13px] text-neutral-600">
                        {formData.depositAmount > 0 ? (
                          <>
                            Deposit: <strong>£{(formData.depositAmount / 100).toFixed(2)}</strong>
                            {" | "}
                            Balance: <strong>£{((formData.price - formData.depositAmount) / 100).toFixed(2)}</strong>
                          </>
                        ) : (
                          <>
                            Deposit ({formData.depositPercentage}%): <strong>£{((formData.price * formData.depositPercentage / 100) / 100).toFixed(2)}</strong>
                            {" | "}
                            Balance ({100 - formData.depositPercentage}%): <strong>£{((formData.price * (100 - formData.depositPercentage) / 100) / 100).toFixed(2)}</strong>
                          </>
                        )}
                      </p>
                    </div>
                  </div>
                )}
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
                  <Link href="/admin/sessions">Discard Changes</Link>
                </Button>

                <div className="ml-auto">
                  <ConfirmDialog
                    trigger={
                      <Button type="button" variant="adminDanger" disabled={deleting}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Session
                      </Button>
                    }
                    title="Delete Session?"
                    description="This will permanently delete this session. Any existing bookings will need to be handled separately. This action cannot be undone."
                    confirmText="Delete Session"
                    cancelText="Keep Session"
                    variant="danger"
                    onConfirm={handleDelete}
                  />
                </div>
              </div>
            </div>
          </AdminCard>
        </form>

        {/* Stats sidebar */}
        <AdminCard hover={false}>
          <h2 className="text-[15px] font-semibold text-neutral-900 mb-4">
            Session Stats
          </h2>
          {session && (
            <div className="space-y-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                  Enrollment
                </p>
                <p className="mt-1 text-2xl font-semibold tabular-nums text-neutral-900">
                  {session.enrolled}/{session.capacity}
                </p>
                <div className="mt-2 w-full h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      (session.enrolled / session.capacity) * 100 >= 90
                        ? "bg-red-500"
                        : (session.enrolled / session.capacity) * 100 >= 70
                          ? "bg-amber-500"
                          : "bg-emerald-500"
                    }`}
                    style={{
                      width: `${(session.enrolled / session.capacity) * 100}%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                  Available Spots
                </p>
                <p className="mt-1 text-2xl font-semibold tabular-nums text-neutral-900">
                  {session.capacity - session.enrolled}
                </p>
              </div>

              <div className="pt-4 border-t border-neutral-100 space-y-3">
                <Button variant="adminSecondary" className="w-full" asChild>
                  <Link
                    href={`/admin/bookings?sessionId=${session.id}`}
                  >
                    View Bookings
                  </Link>
                </Button>

                {/* Enrollment Toggle */}
                <div className="pt-3 border-t border-neutral-100">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 mb-2">
                    Enrollment Status
                  </p>
                  {session.isForceClosed ? (
                    <div className="mb-3 flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-200 p-2">
                      <AlertTriangle className="h-4 w-4 text-amber-600" />
                      <span className="text-xs text-amber-700">
                        Enrollment closed manually
                      </span>
                    </div>
                  ) : null}
                  <Button
                    type="button"
                    variant={session.isForceClosed ? "adminSecondary" : "adminDanger"}
                    className="w-full"
                    onClick={handleToggleClosed}
                    disabled={toggling}
                  >
                    {toggling ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Updating...
                      </>
                    ) : session.isForceClosed ? (
                      <>
                        <LockOpen className="mr-2 h-4 w-4" />
                        Reopen Enrollment
                      </>
                    ) : (
                      <>
                        <Lock className="mr-2 h-4 w-4" />
                        Close Enrollment
                      </>
                    )}
                  </Button>
                  <p className="mt-2 text-xs text-neutral-500">
                    {session.isForceClosed
                      ? "Session shows as Sold Out. Click to allow bookings again."
                      : "Mark as Sold Out regardless of capacity remaining."}
                  </p>
                </div>
              </div>
            </div>
          )}
        </AdminCard>
      </div>
    </div>
  );
}
