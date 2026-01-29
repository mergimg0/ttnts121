"use client";

import { useEffect, useState, useCallback } from "react";
import { useCoachAuth } from "@/components/coach/auth-provider";
import { AdminCard } from "@/components/admin/ui/admin-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import {
  Loader2,
  Calendar,
  Clock,
  ChevronLeft,
  ChevronRight,
  Save,
  CheckCircle,
  AlertCircle,
  PoundSterling,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface HoursEntry {
  id?: string;
  coachId: string;
  date: string; // ISO date "2026-01-29"
  hours: number;
  notes?: string;
  status: "draft" | "submitted" | "approved" | "rejected";
  submittedAt?: string;
  approvedAt?: string;
  approvedBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface MonthlySummary {
  totalHours: number;
  approvedHours: number;
  pendingHours: number;
  estimatedEarnings: number;
  hourlyRate: number;
}

export default function CoachHoursPage() {
  const { user } = useCoachAuth();
  const [currentMonth, setCurrentMonth] = useState<Date>(() => new Date());
  const [entries, setEntries] = useState<HoursEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingDate, setEditingDate] = useState<string | null>(null);
  const [editingHours, setEditingHours] = useState<string>("");
  const [editingNotes, setEditingNotes] = useState<string>("");
  const [summary, setSummary] = useState<MonthlySummary>({
    totalHours: 0,
    approvedHours: 0,
    pendingHours: 0,
    estimatedEarnings: 0,
    hourlyRate: 1500, // Default: 15 GBP/hour in pence
  });

  // Get month string for API
  const getMonthString = (date: Date) => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  };

  // Fetch hours entries for the current month
  const fetchEntries = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      const month = getMonthString(currentMonth);
      const response = await fetch(`/api/coach/hours?month=${month}`);
      const data = await response.json();
      if (data.success) {
        setEntries(data.data.entries || []);
        setSummary(data.data.summary || summary);
      }
    } catch (error) {
      console.error("Error fetching hours:", error);
    } finally {
      setLoading(false);
    }
  }, [user, currentMonth]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  // Month navigation
  const goToPreviousMonth = () => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(newDate.getMonth() - 1);
    setCurrentMonth(newDate);
  };

  const goToNextMonth = () => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(newDate.getMonth() + 1);
    setCurrentMonth(newDate);
  };

  const goToCurrentMonth = () => {
    setCurrentMonth(new Date());
  };

  const isCurrentMonth =
    currentMonth.getMonth() === new Date().getMonth() &&
    currentMonth.getFullYear() === new Date().getFullYear();

  // Format month display
  const monthDisplay = currentMonth.toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
  });

  // Get days in month
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay(); // 0 = Sunday

    const days: { date: string; dayNum: number; isWeekend: boolean }[] = [];

    // Add empty slots for days before the first of the month
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push({ date: "", dayNum: 0, isWeekend: false });
    }

    // Add actual days
    for (let day = 1; day <= daysInMonth; day++) {
      const dateObj = new Date(year, month, day);
      const dateStr = dateObj.toISOString().split("T")[0];
      const dayOfWeek = dateObj.getDay();
      days.push({
        date: dateStr,
        dayNum: day,
        isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
      });
    }

    return days;
  };

  const days = getDaysInMonth(currentMonth);

  // Get entry for a specific date
  const getEntryForDate = (date: string): HoursEntry | undefined => {
    return entries.find((e) => e.date === date);
  };

  // Handle clicking on a day to edit
  const handleDayClick = (date: string) => {
    if (!date) return;

    const entry = getEntryForDate(date);
    if (entry?.status === "approved") {
      toast("This entry has been approved and cannot be edited", "warning");
      return;
    }

    setEditingDate(date);
    setEditingHours(entry?.hours?.toString() || "");
    setEditingNotes(entry?.notes || "");
  };

  // Save hours entry
  const handleSave = async () => {
    if (!editingDate || !user) return;

    const hours = parseFloat(editingHours);
    if (isNaN(hours) || hours < 0 || hours > 24) {
      toast("Please enter a valid number of hours (0-24)", "error");
      return;
    }

    try {
      setSaving(true);
      const response = await fetch("/api/coach/hours", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: editingDate,
          hours,
          notes: editingNotes,
        }),
      });

      const data = await response.json();
      if (data.success) {
        toast("Hours saved", "success");
        setEditingDate(null);
        setEditingHours("");
        setEditingNotes("");
        fetchEntries();
      } else {
        toast(data.error || "Failed to save hours", "error");
      }
    } catch (error) {
      console.error("Error saving hours:", error);
      toast("Failed to save hours", "error");
    } finally {
      setSaving(false);
    }
  };

  // Submit all draft entries for the month
  const handleSubmitMonth = async () => {
    if (!user) return;

    const draftEntries = entries.filter((e) => e.status === "draft");
    if (draftEntries.length === 0) {
      toast("No draft entries to submit", "warning");
      return;
    }

    const confirmed = window.confirm(
      `Submit ${draftEntries.length} hour entries for verification?\n\nOnce submitted, you cannot edit these entries.`
    );
    if (!confirmed) return;

    try {
      setSubmitting(true);
      const month = getMonthString(currentMonth);
      const response = await fetch("/api/coach/hours/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ month }),
      });

      const data = await response.json();
      if (data.success) {
        toast(`${data.data.count} entries submitted for verification`, "success");
        fetchEntries();
      } else {
        toast(data.error || "Failed to submit entries", "error");
      }
    } catch (error) {
      console.error("Error submitting hours:", error);
      toast("Failed to submit entries", "error");
    } finally {
      setSubmitting(false);
    }
  };

  // Get status color
  const getStatusColor = (status?: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-700 border-green-200";
      case "submitted":
        return "bg-amber-100 text-amber-700 border-amber-200";
      case "rejected":
        return "bg-red-100 text-red-700 border-red-200";
      default:
        return "bg-blue-100 text-blue-700 border-blue-200";
    }
  };

  // Format currency
  const formatCurrency = (pence: number) => {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP",
    }).format(pence / 100);
  };

  if (loading && entries.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
      </div>
    );
  }

  const draftCount = entries.filter((e) => e.status === "draft").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">Log Hours</h1>
        <p className="mt-1 text-[13px] text-neutral-500">
          Track your working hours and submit for verification
        </p>
      </div>

      {/* Month Navigator */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="adminSecondary"
            size="icon"
            onClick={goToPreviousMonth}
            className="h-9 w-9"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <div className="flex items-center gap-2 min-w-[160px] justify-center">
            <Calendar className="h-4 w-4 text-neutral-400" />
            <span className="text-sm font-medium text-neutral-900">
              {monthDisplay}
            </span>
          </div>

          <Button
            variant="adminSecondary"
            size="icon"
            onClick={goToNextMonth}
            className="h-9 w-9"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>

          {!isCurrentMonth && (
            <Button
              variant="adminGhost"
              size="sm"
              onClick={goToCurrentMonth}
              className="ml-2 h-9 px-3"
            >
              This Month
            </Button>
          )}
        </div>

        {/* Submit Button */}
        {draftCount > 0 && (
          <Button
            variant="adminPrimary"
            onClick={handleSubmitMonth}
            disabled={submitting}
          >
            {submitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle className="mr-2 h-4 w-4" />
            )}
            Submit {draftCount} {draftCount === 1 ? "Entry" : "Entries"}
          </Button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminCard hover={false}>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100">
              <Clock className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-neutral-500">Total Hours</p>
              <p className="text-lg font-semibold text-neutral-900">
                {summary.totalHours}
              </p>
            </div>
          </div>
        </AdminCard>

        <AdminCard hover={false}>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-neutral-500">Approved</p>
              <p className="text-lg font-semibold text-neutral-900">
                {summary.approvedHours}h
              </p>
            </div>
          </div>
        </AdminCard>

        <AdminCard hover={false}>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100">
              <AlertCircle className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-neutral-500">Pending</p>
              <p className="text-lg font-semibold text-neutral-900">
                {summary.pendingHours}h
              </p>
            </div>
          </div>
        </AdminCard>

        <AdminCard hover={false}>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100">
              <PoundSterling className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-neutral-500">Est. Earnings</p>
              <p className="text-lg font-semibold text-neutral-900">
                {formatCurrency(summary.estimatedEarnings)}
              </p>
            </div>
          </div>
        </AdminCard>
      </div>

      {/* Calendar Grid */}
      <AdminCard hover={false} padding={false}>
        <div className="p-4 border-b border-neutral-100">
          <p className="text-[13px] text-neutral-500">
            Click on a day to log hours. Draft entries can be edited until
            submitted.
          </p>
        </div>

        {/* Day Headers */}
        <div className="grid grid-cols-7 border-b border-neutral-100">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div
              key={day}
              className="p-2 text-center text-xs font-medium text-neutral-500"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7">
          {days.map((day, index) => {
            const entry = day.date ? getEntryForDate(day.date) : undefined;
            const isToday = day.date === new Date().toISOString().split("T")[0];
            const isPast = day.date && new Date(day.date) < new Date();
            const isFuture = day.date && new Date(day.date) > new Date();

            return (
              <div
                key={index}
                className={cn(
                  "min-h-[80px] p-2 border-b border-r border-neutral-100",
                  index % 7 === 6 && "border-r-0",
                  !day.date && "bg-neutral-50",
                  day.isWeekend && day.date && "bg-neutral-50/50",
                  day.date && "cursor-pointer hover:bg-neutral-50 transition-colors"
                )}
                onClick={() => day.date && handleDayClick(day.date)}
              >
                {day.date && (
                  <>
                    <div
                      className={cn(
                        "text-sm font-medium",
                        isToday &&
                          "inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-white",
                        !isToday && day.isWeekend && "text-neutral-400",
                        !isToday && !day.isWeekend && "text-neutral-700"
                      )}
                    >
                      {day.dayNum}
                    </div>
                    {entry && (
                      <div
                        className={cn(
                          "mt-1 rounded px-1.5 py-0.5 text-xs font-medium border",
                          getStatusColor(entry.status)
                        )}
                      >
                        {entry.hours}h
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      </AdminCard>

      {/* Edit Modal */}
      {editingDate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <AdminCard hover={false} className="w-full max-w-md">
            <h3 className="text-lg font-semibold text-neutral-900">
              Log Hours for{" "}
              {new Date(editingDate).toLocaleDateString("en-GB", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
            </h3>

            <div className="mt-4 space-y-4">
              <Input
                label="Hours Worked"
                type="number"
                min="0"
                max="24"
                step="0.5"
                value={editingHours}
                onChange={(e) => setEditingHours(e.target.value)}
                placeholder="e.g., 4.5"
              />

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Notes (optional)
                </label>
                <textarea
                  value={editingNotes}
                  onChange={(e) => setEditingNotes(e.target.value)}
                  placeholder="Add any notes about the work done..."
                  className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 resize-none"
                  rows={3}
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <Button
                variant="adminSecondary"
                onClick={() => {
                  setEditingDate(null);
                  setEditingHours("");
                  setEditingNotes("");
                }}
              >
                Cancel
              </Button>
              <Button
                variant="adminPrimary"
                onClick={handleSave}
                disabled={saving || !editingHours}
              >
                {saving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Save
              </Button>
            </div>
          </AdminCard>
        </div>
      )}

      {/* Status Legend */}
      <div className="flex flex-wrap gap-4 text-[13px]">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded bg-blue-100 border border-blue-200" />
          <span className="text-neutral-600">Draft</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded bg-amber-100 border border-amber-200" />
          <span className="text-neutral-600">Submitted</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded bg-green-100 border border-green-200" />
          <span className="text-neutral-600">Approved</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded bg-red-100 border border-red-200" />
          <span className="text-neutral-600">Rejected</span>
        </div>
      </div>
    </div>
  );
}
