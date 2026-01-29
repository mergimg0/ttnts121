"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { TableSkeleton } from "@/components/ui/skeleton";
import { AdminPageHeader } from "@/components/admin/ui/admin-page-header";
import { AdminCard } from "@/components/admin/ui/admin-card";
import { AdminEmptyState } from "@/components/admin/ui/admin-empty-state";
import { AdminBadge } from "@/components/admin/ui/admin-badge";
import { AdminInput, AdminTextarea } from "@/components/admin/ui/admin-input";
import { AdminSelect } from "@/components/admin/ui/admin-select";
import { ResponsiveTable, MobileCard, MobileCardRow } from "@/components/admin/mobile-table";
import { motion, AnimatePresence } from "motion/react";
import {
  WaitingListEntry,
  WaitingListStatus,
  DAYS_OF_WEEK,
} from "@/types/timetable";
import {
  UserPlus,
  Plus,
  Edit2,
  Trash2,
  Phone,
  Mail,
  CheckCircle,
  MessageCircle,
  ArrowLeft,
  Save,
  X,
  AlertCircle,
  Clock,
  Calendar,
  User,
} from "lucide-react";

interface Coach {
  id: string;
  name: string;
}

// Generate time options
const TIME_OPTIONS: { value: string; label: string }[] = [];
for (let hour = 6; hour <= 22; hour++) {
  for (const minute of ["00", "30"]) {
    const time = `${String(hour).padStart(2, "0")}:${minute}`;
    TIME_OPTIONS.push({ value: time, label: time });
  }
}

// Status options
const STATUS_OPTIONS: { value: WaitingListStatus; label: string }[] = [
  { value: "waiting", label: "Waiting" },
  { value: "contacted", label: "Contacted" },
  { value: "booked", label: "Booked" },
  { value: "cancelled", label: "Cancelled" },
];

// Status badge variants
const STATUS_VARIANTS: Record<WaitingListStatus, "neutral" | "warning" | "success" | "error" | "info"> = {
  waiting: "warning",
  contacted: "info",
  booked: "success",
  cancelled: "error",
};

// Day options for multi-select
const DAY_OPTIONS = DAYS_OF_WEEK.map((day) => ({
  value: day.dayOfWeek,
  label: day.name,
  shortName: day.shortName,
}));

export default function WaitingListPage() {
  // State
  const [entries, setEntries] = useState<WaitingListEntry[]>([]);
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [coachesLoading, setCoachesLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<WaitingListStatus | "all">("all");

  // Editor state
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<WaitingListEntry | null>(null);
  const [formData, setFormData] = useState({
    studentName: "",
    parentName: "",
    parentEmail: "",
    parentPhone: "",
    preferredDays: [] as number[],
    preferredTimes: [] as string[],
    preferredCoaches: [] as string[],
    ageGroup: "",
    notes: "",
  });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Fetch waiting list
  const fetchEntries = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const url = statusFilter === "all"
        ? "/api/admin/waiting-list"
        : `/api/admin/waiting-list?status=${statusFilter}`;
      const response = await fetch(url);
      const data = await response.json();
      if (data.success) {
        setEntries(data.data);
      } else {
        setError(data.error || "Failed to fetch waiting list");
      }
    } catch (err) {
      console.error("Error fetching waiting list:", err);
      setError("Failed to fetch waiting list");
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  // Fetch coaches from API
  const fetchCoaches = useCallback(async () => {
    try {
      setCoachesLoading(true);
      const response = await fetch("/api/admin/coaches?activeOnly=true");
      const data = await response.json();
      if (data.success) {
        setCoaches(data.data.map((c: { id: string; name: string }) => ({ id: c.id, name: c.name })));
      }
    } catch (err) {
      console.error("Error fetching coaches:", err);
    } finally {
      setCoachesLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  useEffect(() => {
    fetchCoaches();
  }, [fetchCoaches]);

  // Open editor for new entry
  const handleCreateNew = () => {
    setEditingEntry(null);
    setFormData({
      studentName: "",
      parentName: "",
      parentEmail: "",
      parentPhone: "",
      preferredDays: [],
      preferredTimes: [],
      preferredCoaches: [],
      ageGroup: "",
      notes: "",
    });
    setEditorOpen(true);
  };

  // Open editor for existing entry
  const handleEdit = (entry: WaitingListEntry) => {
    setEditingEntry(entry);
    setFormData({
      studentName: entry.studentName,
      parentName: entry.parentName,
      parentEmail: entry.parentEmail,
      parentPhone: entry.parentPhone,
      preferredDays: entry.preferredDays || [],
      preferredTimes: entry.preferredTimes || [],
      preferredCoaches: entry.preferredCoaches || [],
      ageGroup: entry.ageGroup || "",
      notes: entry.notes || "",
    });
    setEditorOpen(true);
  };

  // Close editor
  const handleCloseEditor = () => {
    setEditorOpen(false);
    setEditingEntry(null);
    setFormData({
      studentName: "",
      parentName: "",
      parentEmail: "",
      parentPhone: "",
      preferredDays: [],
      preferredTimes: [],
      preferredCoaches: [],
      ageGroup: "",
      notes: "",
    });
  };

  // Save entry
  const handleSave = async () => {
    // Validation
    if (!formData.studentName.trim()) {
      alert("Student name is required");
      return;
    }
    if (!formData.parentName.trim()) {
      alert("Parent name is required");
      return;
    }
    if (!formData.parentEmail.trim()) {
      alert("Parent email is required");
      return;
    }
    if (!formData.parentPhone.trim()) {
      alert("Parent phone is required");
      return;
    }

    try {
      setSaving(true);
      const url = editingEntry
        ? `/api/admin/waiting-list/${editingEntry.id}`
        : "/api/admin/waiting-list";
      const method = editingEntry ? "PUT" : "POST";

      const payload = {
        ...formData,
        preferredDays: formData.preferredDays.length > 0 ? formData.preferredDays : null,
        preferredTimes: formData.preferredTimes.length > 0 ? formData.preferredTimes : null,
        preferredCoaches: formData.preferredCoaches.length > 0 ? formData.preferredCoaches : null,
        ageGroup: formData.ageGroup || null,
        notes: formData.notes || null,
      };

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (result.success) {
        await fetchEntries();
        handleCloseEditor();
      } else {
        alert(result.error || "Failed to save entry");
      }
    } catch (err) {
      console.error("Error saving entry:", err);
      alert("Failed to save entry");
    } finally {
      setSaving(false);
    }
  };

  // Delete entry
  const handleDelete = async (entryId: string) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this entry? This action cannot be undone."
    );
    if (!confirmed) return;

    try {
      setDeleting(true);
      const response = await fetch(`/api/admin/waiting-list/${entryId}`, {
        method: "DELETE",
      });

      const result = await response.json();
      if (result.success) {
        await fetchEntries();
        if (editingEntry?.id === entryId) {
          handleCloseEditor();
        }
      } else {
        alert(result.error || "Failed to delete entry");
      }
    } catch (err) {
      console.error("Error deleting entry:", err);
      alert("Failed to delete entry");
    } finally {
      setDeleting(false);
    }
  };

  // Update status
  const handleUpdateStatus = async (entry: WaitingListEntry, newStatus: WaitingListStatus) => {
    try {
      const response = await fetch(`/api/admin/waiting-list/${entry.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      const result = await response.json();
      if (result.success) {
        await fetchEntries();
      } else {
        alert(result.error || "Failed to update status");
      }
    } catch (err) {
      console.error("Error updating status:", err);
      alert("Failed to update status");
    }
  };

  // Toggle day preference
  const toggleDay = (dayOfWeek: number) => {
    if (formData.preferredDays.includes(dayOfWeek)) {
      setFormData({
        ...formData,
        preferredDays: formData.preferredDays.filter((d) => d !== dayOfWeek),
      });
    } else {
      setFormData({
        ...formData,
        preferredDays: [...formData.preferredDays, dayOfWeek].sort(),
      });
    }
  };

  // Toggle time preference
  const toggleTime = (time: string) => {
    if (formData.preferredTimes.includes(time)) {
      setFormData({
        ...formData,
        preferredTimes: formData.preferredTimes.filter((t) => t !== time),
      });
    } else {
      setFormData({
        ...formData,
        preferredTimes: [...formData.preferredTimes, time].sort(),
      });
    }
  };

  // Toggle coach preference
  const toggleCoach = (coachId: string) => {
    if (formData.preferredCoaches.includes(coachId)) {
      setFormData({
        ...formData,
        preferredCoaches: formData.preferredCoaches.filter((c) => c !== coachId),
      });
    } else {
      setFormData({
        ...formData,
        preferredCoaches: [...formData.preferredCoaches, coachId],
      });
    }
  };

  // Format preferred days for display
  const formatPreferredDays = (days?: number[]) => {
    if (!days || days.length === 0) return "-";
    return days.map((d) => DAY_OPTIONS.find((o) => o.value === d)?.shortName || "").join(", ");
  };

  // Format preferred times for display
  const formatPreferredTimes = (times?: string[]) => {
    if (!times || times.length === 0) return "-";
    return times.join(", ");
  };

  // Format date for display
  const formatDate = (date: Date | { toDate?: () => Date } | string | undefined) => {
    if (!date) return "-";
    try {
      let d: Date;
      if (typeof date === "object" && "toDate" in date && typeof date.toDate === "function") {
        d = date.toDate();
      } else if (date instanceof Date) {
        d = date;
      } else {
        d = new Date(date as string);
      }
      return d.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return "-";
    }
  };

  // Filter entries
  const filteredEntries = entries;

  // Stats
  const waitingCount = entries.filter((e) => e.status === "waiting").length;
  const contactedCount = entries.filter((e) => e.status === "contacted").length;

  if (loading && entries.length === 0) {
    return (
      <div className="space-y-8">
        <AdminPageHeader
          title="Waiting List"
          subtitle="Loading..."
        />
        <TableSkeleton rows={6} columns={6} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <AdminPageHeader
        title="Waiting List"
        subtitle={`${entries.length} total entries`}
      >
        <div className="flex items-center gap-3">
          <Button variant="adminSecondary" asChild>
            <Link href="/admin/timetable">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Timetable
            </Link>
          </Button>
          <Button variant="adminPrimary" onClick={handleCreateNew}>
            <Plus className="mr-2 h-4 w-4" />
            Add Student
          </Button>
        </div>
      </AdminPageHeader>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminCard hover={false} className="bg-amber-50/50 border-amber-200/60">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100">
              <Clock className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-neutral-900">{waitingCount}</p>
              <p className="text-xs text-neutral-500">Waiting</p>
            </div>
          </div>
        </AdminCard>
        <AdminCard hover={false} className="bg-blue-50/50 border-blue-200/60">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100">
              <MessageCircle className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-neutral-900">{contactedCount}</p>
              <p className="text-xs text-neutral-500">Contacted</p>
            </div>
          </div>
        </AdminCard>
        <AdminCard hover={false} className="bg-green-50/50 border-green-200/60">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-neutral-900">
                {entries.filter((e) => e.status === "booked").length}
              </p>
              <p className="text-xs text-neutral-500">Booked</p>
            </div>
          </div>
        </AdminCard>
        <AdminCard hover={false}>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100">
              <User className="h-5 w-5 text-neutral-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-neutral-900">{entries.length}</p>
              <p className="text-xs text-neutral-500">Total</p>
            </div>
          </div>
        </AdminCard>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {(["all", ...STATUS_OPTIONS.map((s) => s.value)] as const).map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-4 py-2 text-[13px] font-medium rounded-xl transition-all duration-200 ${
              statusFilter === status
                ? "bg-navy text-white shadow-sm"
                : "bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50 hover:border-neutral-300"
            }`}
          >
            {status === "all" ? "All" : STATUS_OPTIONS.find((s) => s.value === status)?.label}
          </button>
        ))}
      </div>

      {/* Error State */}
      {error && (
        <AdminCard hover={false} className="bg-red-50 border-red-200">
          <div className="flex items-center gap-3 text-red-700">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <p className="text-sm">{error}</p>
            <Button
              variant="adminSecondary"
              size="sm"
              onClick={fetchEntries}
              className="ml-auto"
            >
              Retry
            </Button>
          </div>
        </AdminCard>
      )}

      {/* Waiting List Table */}
      {filteredEntries.length === 0 && !error ? (
        <AdminEmptyState
          icon={UserPlus}
          title="No entries found"
          description={
            statusFilter === "all"
              ? "Students waiting for slots will appear here."
              : `No ${statusFilter} entries found.`
          }
          action={
            <Button variant="adminPrimary" onClick={handleCreateNew}>
              <Plus className="mr-2 h-4 w-4" />
              Add Student
            </Button>
          }
        />
      ) : (
        <ResponsiveTable
          mobileView={
            filteredEntries.map((entry) => (
              <MobileCard key={entry.id}>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-semibold text-neutral-900">
                      {entry.studentName}
                    </p>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      Priority: #{entry.priority}
                    </p>
                  </div>
                  <AdminBadge variant={STATUS_VARIANTS[entry.status]}>
                    {entry.status}
                  </AdminBadge>
                </div>
                <MobileCardRow label="Parent">
                  <span className="text-sm">{entry.parentName}</span>
                </MobileCardRow>
                <MobileCardRow label="Contact">
                  <div className="space-y-1">
                    <a
                      href={`mailto:${entry.parentEmail}`}
                      className="flex items-center gap-1.5 text-xs text-sky-600 hover:underline"
                    >
                      <Mail className="h-3 w-3" />
                      {entry.parentEmail}
                    </a>
                    <a
                      href={`tel:${entry.parentPhone}`}
                      className="flex items-center gap-1.5 text-xs text-sky-600 hover:underline"
                    >
                      <Phone className="h-3 w-3" />
                      {entry.parentPhone}
                    </a>
                  </div>
                </MobileCardRow>
                <MobileCardRow label="Preferred Days">
                  <span className="text-sm">{formatPreferredDays(entry.preferredDays)}</span>
                </MobileCardRow>
                <MobileCardRow label="Added">
                  <span className="text-xs text-neutral-500">{formatDate(entry.addedAt)}</span>
                </MobileCardRow>
                <div className="pt-3 border-t border-neutral-100 flex gap-2">
                  <Button
                    variant="adminSecondary"
                    size="sm"
                    onClick={() => handleEdit(entry)}
                    className="flex-1"
                  >
                    <Edit2 className="mr-1.5 h-3.5 w-3.5" />
                    Edit
                  </Button>
                  {entry.status === "waiting" && (
                    <Button
                      variant="adminPrimary"
                      size="sm"
                      onClick={() => handleUpdateStatus(entry, "contacted")}
                      className="flex-1"
                    >
                      <MessageCircle className="mr-1.5 h-3.5 w-3.5" />
                      Contact
                    </Button>
                  )}
                  {entry.status === "contacted" && (
                    <Button
                      variant="adminPrimary"
                      size="sm"
                      onClick={() => handleUpdateStatus(entry, "booked")}
                      className="flex-1"
                    >
                      <CheckCircle className="mr-1.5 h-3.5 w-3.5" />
                      Mark Booked
                    </Button>
                  )}
                </div>
              </MobileCard>
            ))
          }
        >
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-100">
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                  #
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                  Student
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                  Parent / Contact
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                  Preferences
                </th>
                <th className="px-4 py-3 text-center text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
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
              {filteredEntries.map((entry) => (
                <tr key={entry.id} className="group hover:bg-neutral-50/50 transition-colors">
                  <td className="px-4 py-4">
                    <span className="text-sm font-medium text-neutral-400 tabular-nums">
                      #{entry.priority}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div>
                      <p className="text-sm font-semibold text-neutral-900">
                        {entry.studentName}
                      </p>
                      {entry.ageGroup && (
                        <p className="text-xs text-neutral-500">{entry.ageGroup}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div>
                      <p className="text-sm text-neutral-900">{entry.parentName}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <a
                          href={`mailto:${entry.parentEmail}`}
                          className="flex items-center gap-1 text-xs text-sky-600 hover:underline"
                        >
                          <Mail className="h-3 w-3" />
                          Email
                        </a>
                        <a
                          href={`tel:${entry.parentPhone}`}
                          className="flex items-center gap-1 text-xs text-sky-600 hover:underline"
                        >
                          <Phone className="h-3 w-3" />
                          Call
                        </a>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-xs text-neutral-600">
                        <Calendar className="h-3 w-3 text-neutral-400" />
                        {formatPreferredDays(entry.preferredDays)}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-neutral-600">
                        <Clock className="h-3 w-3 text-neutral-400" />
                        {formatPreferredTimes(entry.preferredTimes)}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <AdminBadge variant={STATUS_VARIANTS[entry.status]}>
                      {entry.status}
                    </AdminBadge>
                  </td>
                  <td className="px-4 py-4 text-sm text-neutral-500">
                    {formatDate(entry.addedAt)}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center justify-end gap-1">
                      {entry.status === "waiting" && (
                        <button
                          onClick={() => handleUpdateStatus(entry, "contacted")}
                          className="p-2 text-neutral-400 hover:text-sky-600 transition-colors rounded-lg hover:bg-sky-50"
                          title="Mark as Contacted"
                        >
                          <MessageCircle className="h-4 w-4" />
                        </button>
                      )}
                      {entry.status === "contacted" && (
                        <button
                          onClick={() => handleUpdateStatus(entry, "booked")}
                          className="p-2 text-neutral-400 hover:text-green-600 transition-colors rounded-lg hover:bg-green-50"
                          title="Mark as Booked"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleEdit(entry)}
                        className="p-2 text-neutral-400 hover:text-neutral-900 transition-colors rounded-lg hover:bg-neutral-100"
                        title="Edit"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(entry.id)}
                        className="p-2 text-neutral-400 hover:text-red-600 transition-colors rounded-lg hover:bg-red-50"
                        title="Delete"
                        disabled={deleting}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </ResponsiveTable>
      )}

      {/* Entry Editor Modal */}
      <AnimatePresence>
        {editorOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 z-50 bg-black/50"
              onClick={handleCloseEditor}
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-4 z-50 lg:left-1/2 lg:top-1/2 lg:inset-auto lg:w-full lg:max-w-2xl lg:-translate-x-1/2 lg:-translate-y-1/2 rounded-2xl bg-white shadow-xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
                <h2 className="text-lg font-semibold text-neutral-900">
                  {editingEntry ? "Edit Entry" : "Add to Waiting List"}
                </h2>
                <button
                  onClick={handleCloseEditor}
                  className="rounded-lg p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Student Info */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-neutral-700">Student Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <AdminInput
                      label="Student Name"
                      name="studentName"
                      value={formData.studentName}
                      onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
                      placeholder="Enter student name"
                      required
                    />
                    <AdminInput
                      label="Age Group (Optional)"
                      name="ageGroup"
                      value={formData.ageGroup}
                      onChange={(e) => setFormData({ ...formData, ageGroup: e.target.value })}
                      placeholder="e.g., 8-10 years"
                    />
                  </div>
                </div>

                {/* Parent Info */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-neutral-700">Parent / Guardian</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <AdminInput
                      label="Parent Name"
                      name="parentName"
                      value={formData.parentName}
                      onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                      placeholder="Enter parent name"
                      required
                    />
                    <AdminInput
                      label="Phone Number"
                      name="parentPhone"
                      type="tel"
                      value={formData.parentPhone}
                      onChange={(e) => setFormData({ ...formData, parentPhone: e.target.value })}
                      placeholder="Enter phone number"
                      required
                    />
                    <div className="md:col-span-2">
                      <AdminInput
                        label="Email Address"
                        name="parentEmail"
                        type="email"
                        value={formData.parentEmail}
                        onChange={(e) => setFormData({ ...formData, parentEmail: e.target.value })}
                        placeholder="Enter email address"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Preferences */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-neutral-700">Preferences</h3>

                  {/* Preferred Days */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Preferred Days
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {DAY_OPTIONS.map((day) => (
                        <button
                          key={day.value}
                          type="button"
                          onClick={() => toggleDay(day.value)}
                          className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                            formData.preferredDays.includes(day.value)
                              ? "bg-sky-100 text-sky-700 border border-sky-300"
                              : "bg-white text-neutral-600 border border-neutral-200 hover:border-neutral-300"
                          }`}
                        >
                          {day.shortName}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Preferred Times */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Preferred Times
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {["15:00", "16:00", "17:00", "18:00"].map((time) => (
                        <button
                          key={time}
                          type="button"
                          onClick={() => toggleTime(time)}
                          className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                            formData.preferredTimes.includes(time)
                              ? "bg-sky-100 text-sky-700 border border-sky-300"
                              : "bg-white text-neutral-600 border border-neutral-200 hover:border-neutral-300"
                          }`}
                        >
                          {time}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Preferred Coaches */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Preferred Coaches
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {coaches.map((coach) => (
                        <button
                          key={coach.id}
                          type="button"
                          onClick={() => toggleCoach(coach.id)}
                          className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                            formData.preferredCoaches.includes(coach.id)
                              ? "bg-sky-100 text-sky-700 border border-sky-300"
                              : "bg-white text-neutral-600 border border-neutral-200 hover:border-neutral-300"
                          }`}
                        >
                          {coach.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Notes */}
                <AdminTextarea
                  label="Notes (Optional)"
                  name="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Any additional notes..."
                  rows={3}
                />
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between px-6 py-4 border-t border-neutral-100 bg-neutral-50/50">
                <div>
                  {editingEntry && (
                    <Button
                      variant="adminDanger"
                      size="sm"
                      onClick={() => handleDelete(editingEntry.id)}
                      disabled={deleting || saving}
                    >
                      <Trash2 className="mr-1.5 h-4 w-4" />
                      {deleting ? "Deleting..." : "Delete"}
                    </Button>
                  )}
                </div>
                <div className="flex gap-3">
                  <Button
                    variant="adminSecondary"
                    onClick={handleCloseEditor}
                    disabled={saving}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="adminPrimary"
                    onClick={handleSave}
                    disabled={saving}
                  >
                    <Save className="mr-1.5 h-4 w-4" />
                    {saving ? "Saving..." : editingEntry ? "Update" : "Add to List"}
                  </Button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
