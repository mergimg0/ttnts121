"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AdminPageHeader } from "@/components/admin/ui/admin-page-header";
import { AdminCard } from "@/components/admin/ui/admin-card";
import { AdminInput } from "@/components/admin/ui/admin-input";
import { AdminSelect } from "@/components/admin/ui/admin-select";
import {
  AdminTable,
  AdminTableHead,
  AdminTableHeader,
  AdminTableBody,
  AdminTableRow,
  AdminTableCell,
} from "@/components/admin/ui/admin-table";
import {
  ResponsiveTable,
  MobileCard,
  MobileCardRow,
} from "@/components/admin/mobile-table";
import { AdminBadge } from "@/components/admin/ui/admin-badge";
import { toast } from "@/components/ui/toast";
import { ConfirmDialog } from "@/components/admin/ui/confirm-dialog";
import { motion, AnimatePresence } from "motion/react";
import {
  Loader2,
  Plus,
  ArrowLeft,
  PoundSterling,
  Edit,
  Trash2,
  History,
  X,
  Check,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { CoachRate, formatCurrency } from "@/types/coach";

interface RateFormData {
  coachId: string;
  coachName: string;
  hourlyRate: string;
  effectiveFrom: string;
  notes: string;
}

const initialFormData: RateFormData = {
  coachId: "",
  coachName: "",
  hourlyRate: "",
  effectiveFrom: new Date().toISOString().split("T")[0],
  notes: "",
};

export default function CoachRatesPage() {
  const [rates, setRates] = useState<CoachRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<RateFormData>(initialFormData);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedCoach, setExpandedCoach] = useState<string | null>(null);

  // Group rates by coach
  const ratesByCoach = rates.reduce((acc, rate) => {
    if (!acc[rate.coachId]) {
      acc[rate.coachId] = [];
    }
    acc[rate.coachId].push(rate);
    return acc;
  }, {} as Record<string, CoachRate[]>);

  // Get current rate for each coach
  const currentRates = Object.entries(ratesByCoach).map(([coachId, coachRates]) => {
    // Sort by effectiveFrom descending
    const sorted = [...coachRates].sort((a, b) => {
      const dateA = a.effectiveFrom instanceof Date ? a.effectiveFrom : new Date(a.effectiveFrom as any);
      const dateB = b.effectiveFrom instanceof Date ? b.effectiveFrom : new Date(b.effectiveFrom as any);
      return dateB.getTime() - dateA.getTime();
    });

    // Find current active rate
    const now = new Date();
    const current = sorted.find((rate) => {
      const from = rate.effectiveFrom instanceof Date ? rate.effectiveFrom : new Date(rate.effectiveFrom as any);
      const until = rate.effectiveUntil
        ? rate.effectiveUntil instanceof Date
          ? rate.effectiveUntil
          : new Date(rate.effectiveUntil as any)
        : null;
      return from <= now && (!until || until >= now);
    });

    return {
      coachId,
      coachName: coachRates[0].coachName,
      currentRate: current,
      history: sorted,
    };
  });

  // Get unique coach names for new coach form
  const existingCoachIds = new Set(Object.keys(ratesByCoach));

  const fetchRates = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/coach-rates");
      const data = await response.json();
      if (data.success) {
        setRates(data.data);
      } else {
        toast(data.error || "Failed to fetch rates", "error");
      }
    } catch (error) {
      console.error("Error fetching rates:", error);
      toast("Failed to fetch rates", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRates();
  }, [fetchRates]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.coachName || !formData.hourlyRate) {
      toast("Please fill in all required fields", "error");
      return;
    }

    setSaving(true);
    try {
      const hourlyRateInPence = Math.round(parseFloat(formData.hourlyRate) * 100);

      const url = editingId
        ? `/api/admin/coach-rates/${editingId}`
        : "/api/admin/coach-rates";
      const method = editingId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          coachId: formData.coachId || `coach_${formData.coachName.toLowerCase().replace(/\s+/g, "_")}`,
          coachName: formData.coachName,
          hourlyRate: hourlyRateInPence,
          effectiveFrom: formData.effectiveFrom,
          notes: formData.notes || undefined,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast(editingId ? "Rate updated" : "Rate created", "success");
        setShowForm(false);
        setFormData(initialFormData);
        setEditingId(null);
        fetchRates();
      } else {
        toast(result.error || "Failed to save rate", "error");
      }
    } catch (error) {
      console.error("Error saving rate:", error);
      toast("Failed to save rate", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (rate: CoachRate) => {
    setFormData({
      coachId: rate.coachId,
      coachName: rate.coachName,
      hourlyRate: (rate.hourlyRate / 100).toFixed(2),
      effectiveFrom: rate.effectiveFrom instanceof Date
        ? rate.effectiveFrom.toISOString().split("T")[0]
        : new Date(rate.effectiveFrom as any).toISOString().split("T")[0],
      notes: rate.notes || "",
    });
    setEditingId(rate.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/coach-rates/${id}`, {
        method: "DELETE",
      });
      const result = await response.json();

      if (result.success) {
        toast("Rate deleted", "success");
        fetchRates();
      } else {
        toast(result.error || "Failed to delete rate", "error");
      }
    } catch (error) {
      console.error("Error deleting rate:", error);
      toast("Failed to delete rate", "error");
    }
  };

  const handleSetNewRate = (coachId: string, coachName: string) => {
    setFormData({
      ...initialFormData,
      coachId,
      coachName,
    });
    setEditingId(null);
    setShowForm(true);
  };

  const formatDate = (date: Date | { toDate: () => Date } | string) => {
    if (!date) return "N/A";
    const d = date instanceof Date ? date : typeof date === "string" ? new Date(date) : date.toDate();
    return d.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  // Desktop table content
  const tableContent = (
    <div className="overflow-x-auto">
      <table className="w-full">
        <AdminTableHead>
          <tr>
            <AdminTableHeader>Coach</AdminTableHeader>
            <AdminTableHeader>Current Rate</AdminTableHeader>
            <AdminTableHeader>Effective From</AdminTableHeader>
            <AdminTableHeader>Status</AdminTableHeader>
            <AdminTableHeader className="text-right">Actions</AdminTableHeader>
          </tr>
        </AdminTableHead>
        <AdminTableBody>
          {currentRates.map(({ coachId, coachName, currentRate, history }) => (
            <>
              <AdminTableRow key={coachId}>
                <AdminTableCell>
                  <button
                    onClick={() => setExpandedCoach(expandedCoach === coachId ? null : coachId)}
                    className="flex items-center gap-2 hover:text-sky-600 transition-colors"
                  >
                    {expandedCoach === coachId ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                    <span className="font-medium text-neutral-900">{coachName}</span>
                    {history.length > 1 && (
                      <AdminBadge variant="neutral" className="text-[10px]">
                        {history.length} rates
                      </AdminBadge>
                    )}
                  </button>
                </AdminTableCell>
                <AdminTableCell className="font-semibold tabular-nums">
                  {currentRate ? formatCurrency(currentRate.hourlyRate) : "No active rate"}
                  <span className="text-neutral-400 font-normal">/hr</span>
                </AdminTableCell>
                <AdminTableCell className="text-sm text-neutral-600">
                  {currentRate ? formatDate(currentRate.effectiveFrom) : "-"}
                </AdminTableCell>
                <AdminTableCell>
                  {currentRate ? (
                    <AdminBadge variant="success">Active</AdminBadge>
                  ) : (
                    <AdminBadge variant="warning">No Rate</AdminBadge>
                  )}
                </AdminTableCell>
                <AdminTableCell className="text-right">
                  <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="adminSecondary"
                      size="sm"
                      onClick={() => handleSetNewRate(coachId, coachName)}
                    >
                      <Plus className="h-3.5 w-3.5 mr-1" />
                      New Rate
                    </Button>
                    {currentRate && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(currentRate)}
                      >
                        <Edit className="h-4 w-4 text-neutral-400 hover:text-sky-500" />
                      </Button>
                    )}
                  </div>
                </AdminTableCell>
              </AdminTableRow>
              {/* Expanded history */}
              <AnimatePresence>
                {expandedCoach === coachId && history.length > 0 && (
                  <motion.tr
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <td colSpan={5} className="bg-neutral-50/50 px-4 py-3">
                      <div className="pl-6">
                        <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">
                          Rate History
                        </p>
                        <div className="space-y-2">
                          {history.map((rate) => (
                            <div
                              key={rate.id}
                              className="flex items-center justify-between py-2 px-3 bg-white rounded-lg border border-neutral-100"
                            >
                              <div className="flex items-center gap-4">
                                <span className="font-medium tabular-nums">
                                  {formatCurrency(rate.hourlyRate)}/hr
                                </span>
                                <span className="text-sm text-neutral-500">
                                  {formatDate(rate.effectiveFrom)}
                                  {rate.effectiveUntil && (
                                    <> - {formatDate(rate.effectiveUntil)}</>
                                  )}
                                </span>
                                {rate.notes && (
                                  <span className="text-sm text-neutral-400 italic">
                                    {rate.notes}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEdit(rate)}
                                >
                                  <Edit className="h-3.5 w-3.5" />
                                </Button>
                                <ConfirmDialog
                                  trigger={
                                    <Button variant="ghost" size="sm">
                                      <Trash2 className="h-3.5 w-3.5 text-neutral-400 hover:text-red-500" />
                                    </Button>
                                  }
                                  title="Delete Rate?"
                                  description="This will permanently delete this rate entry. This cannot be undone."
                                  confirmText="Delete"
                                  variant="danger"
                                  onConfirm={() => handleDelete(rate.id)}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </td>
                  </motion.tr>
                )}
              </AnimatePresence>
            </>
          ))}
        </AdminTableBody>
      </table>
    </div>
  );

  // Mobile cards content
  const mobileContent = currentRates.map(({ coachId, coachName, currentRate, history }) => (
    <MobileCard key={coachId}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="font-medium text-neutral-900">{coachName}</p>
          <p className="text-lg font-semibold text-sky-600 tabular-nums">
            {currentRate ? formatCurrency(currentRate.hourlyRate) : "No rate"}
            <span className="text-sm text-neutral-400 font-normal">/hr</span>
          </p>
        </div>
        {currentRate ? (
          <AdminBadge variant="success">Active</AdminBadge>
        ) : (
          <AdminBadge variant="warning">No Rate</AdminBadge>
        )}
      </div>
      <div className="pt-2 border-t border-neutral-100 space-y-1">
        <MobileCardRow label="Effective From">
          {currentRate ? formatDate(currentRate.effectiveFrom) : "-"}
        </MobileCardRow>
        <MobileCardRow label="Rate History">
          {history.length} {history.length === 1 ? "entry" : "entries"}
        </MobileCardRow>
      </div>
      <div className="pt-2 flex gap-2">
        <Button
          variant="adminSecondary"
          size="sm"
          className="flex-1"
          onClick={() => handleSetNewRate(coachId, coachName)}
        >
          <Plus className="h-3.5 w-3.5 mr-1" />
          New Rate
        </Button>
        {currentRate && (
          <Button variant="ghost" size="sm" onClick={() => handleEdit(currentRate)}>
            <Edit className="h-4 w-4" />
          </Button>
        )}
      </div>
    </MobileCard>
  ));

  return (
    <div className="space-y-8">
      {/* Header */}
      <AdminPageHeader
        title="Coach Rates"
        subtitle="Manage hourly rates for coaches"
      >
        <div className="flex items-center gap-2">
          <Button variant="adminSecondary" asChild>
            <Link href="/admin/coach-hours">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Hours
            </Link>
          </Button>
          <Button
            variant="adminPrimary"
            onClick={() => {
              setFormData(initialFormData);
              setEditingId(null);
              setShowForm(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Coach
          </Button>
        </div>
      </AdminPageHeader>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <AdminCard hover={false}>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-100">
              <PoundSterling className="h-5 w-5 text-sky-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold tabular-nums">
                {currentRates.length}
              </p>
              <p className="text-xs text-neutral-500">Active Coaches</p>
            </div>
          </div>
        </AdminCard>

        <AdminCard hover={false}>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100">
              <Check className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold tabular-nums">
                {currentRates.filter((c) => c.currentRate).length}
              </p>
              <p className="text-xs text-neutral-500">With Active Rates</p>
            </div>
          </div>
        </AdminCard>

        <AdminCard hover={false}>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100">
              <History className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold tabular-nums">{rates.length}</p>
              <p className="text-xs text-neutral-500">Total Rate Entries</p>
            </div>
          </div>
        </AdminCard>
      </div>

      {/* Form Dialog */}
      <AnimatePresence>
        {showForm && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/50"
              onClick={() => setShowForm(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 shadow-xl"
            >
              <button
                onClick={() => setShowForm(false)}
                className="absolute right-4 top-4 rounded-lg p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="flex items-center gap-3 mb-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-100">
                  <PoundSterling className="h-5 w-5 text-sky-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-neutral-900">
                    {editingId ? "Edit Rate" : formData.coachId ? "Set New Rate" : "Add Coach"}
                  </h2>
                  <p className="text-sm text-neutral-500">
                    {editingId
                      ? "Update the rate details"
                      : formData.coachId
                      ? `Set a new rate for ${formData.coachName}`
                      : "Add a new coach with their hourly rate"}
                  </p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {!formData.coachId && (
                  <AdminInput
                    label="Coach Name"
                    value={formData.coachName}
                    onChange={(e) =>
                      setFormData({ ...formData, coachName: e.target.value })
                    }
                    placeholder="Enter coach name"
                    required
                  />
                )}

                <AdminInput
                  label="Hourly Rate"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.hourlyRate}
                  onChange={(e) =>
                    setFormData({ ...formData, hourlyRate: e.target.value })
                  }
                  placeholder="15.00"
                  hint="Enter rate in pounds (e.g., 15.00 for fifteen pounds)"
                  required
                  leftIcon={<PoundSterling className="h-4 w-4" />}
                />

                <AdminInput
                  label="Effective From"
                  type="date"
                  value={formData.effectiveFrom}
                  onChange={(e) =>
                    setFormData({ ...formData, effectiveFrom: e.target.value })
                  }
                  required
                />

                <AdminInput
                  label="Notes (optional)"
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  placeholder="e.g., Rate increase, new coach"
                />

                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="adminSecondary"
                    className="flex-1"
                    onClick={() => setShowForm(false)}
                    disabled={saving}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="adminPrimary"
                    className="flex-1"
                    disabled={saving}
                  >
                    {saving ? "Saving..." : editingId ? "Update Rate" : "Save Rate"}
                  </Button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Rates List */}
      {loading ? (
        <AdminCard hover={false}>
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
          </div>
        </AdminCard>
      ) : currentRates.length === 0 ? (
        <AdminCard hover={false}>
          <div className="text-center py-12">
            <div className="mx-auto h-14 w-14 rounded-full bg-neutral-50 flex items-center justify-center">
              <PoundSterling className="h-7 w-7 text-neutral-400" />
            </div>
            <h3 className="mt-4 text-sm font-medium text-neutral-900">
              No coach rates
            </h3>
            <p className="mt-1 text-sm text-neutral-500">
              Add coaches and set their hourly rates to start tracking hours.
            </p>
            <Button
              variant="adminPrimary"
              className="mt-4"
              onClick={() => {
                setFormData(initialFormData);
                setEditingId(null);
                setShowForm(true);
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Coach
            </Button>
          </div>
        </AdminCard>
      ) : (
        <ResponsiveTable mobileView={mobileContent}>
          {tableContent}
        </ResponsiveTable>
      )}
    </div>
  );
}
