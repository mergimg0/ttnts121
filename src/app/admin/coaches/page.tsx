"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { AdminPageHeader } from "@/components/admin/ui/admin-page-header";
import { AdminCard } from "@/components/admin/ui/admin-card";
import { AdminBadge } from "@/components/admin/ui/admin-badge";
import { AdminInput } from "@/components/admin/ui/admin-input";
import { AdminEmptyState } from "@/components/admin/ui/admin-empty-state";
import { TableSkeleton } from "@/components/ui/skeleton";
import { ResponsiveTable, MobileCard, MobileCardRow } from "@/components/admin/mobile-table";
import { motion, AnimatePresence } from "motion/react";
import { Coach, CreateCoachInput, UpdateCoachInput } from "@/types/coach";
import {
  Users,
  Plus,
  Edit2,
  X,
  Save,
  UserX,
  Mail,
  Loader2,
  AlertCircle,
  RotateCcw,
} from "lucide-react";

export default function CoachesPage() {
  // State
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showInactive, setShowInactive] = useState(false);

  // Editor state
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingCoach, setEditingCoach] = useState<Coach | null>(null);
  const [formData, setFormData] = useState<CreateCoachInput>({
    name: "",
    abbreviation: "",
    email: "",
    phone: "",
    hourlyRate: undefined,
    sessionRate: undefined,
    isActive: true,
  });
  const [saving, setSaving] = useState(false);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  // Fetch coaches
  const fetchCoaches = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (!showInactive) {
        params.set("activeOnly", "true");
      }
      const response = await fetch(`/api/admin/coaches?${params}`);
      const data = await response.json();
      if (data.success) {
        setCoaches(data.data);
      } else {
        setError(data.error || "Failed to fetch coaches");
      }
    } catch (err) {
      console.error("Error fetching coaches:", err);
      setError("Failed to fetch coaches");
    } finally {
      setLoading(false);
    }
  }, [showInactive]);

  useEffect(() => {
    fetchCoaches();
  }, [fetchCoaches]);

  // Reset form
  const resetForm = () => {
    setFormData({
      name: "",
      abbreviation: "",
      email: "",
      phone: "",
      hourlyRate: undefined,
      sessionRate: undefined,
      isActive: true,
    });
    setEditingCoach(null);
  };

  // Open editor for new coach
  const handleAddCoach = () => {
    resetForm();
    setEditorOpen(true);
  };

  // Open editor for existing coach
  const handleEditCoach = (coach: Coach) => {
    setEditingCoach(coach);
    setFormData({
      name: coach.name,
      abbreviation: coach.abbreviation || "",
      email: coach.email || "",
      phone: coach.phone || "",
      hourlyRate: coach.hourlyRate ?? undefined,
      sessionRate: coach.sessionRate ?? undefined,
      isActive: coach.isActive,
    });
    setEditorOpen(true);
  };

  // Close editor
  const handleCloseEditor = () => {
    setEditorOpen(false);
    resetForm();
  };

  // Save coach
  const handleSave = async () => {
    if (!formData.name.trim()) {
      alert("Coach name is required");
      return;
    }

    setSaving(true);
    try {
      const url = editingCoach
        ? `/api/admin/coaches/${editingCoach.id}`
        : "/api/admin/coaches";
      const method = editingCoach ? "PATCH" : "POST";

      const payload: CreateCoachInput | UpdateCoachInput = {
        name: formData.name,
        abbreviation: formData.abbreviation || undefined,
        email: formData.email || undefined,
        phone: formData.phone || undefined,
        hourlyRate: formData.hourlyRate,
        sessionRate: formData.sessionRate,
        isActive: formData.isActive,
      };

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (result.success) {
        await fetchCoaches();
        handleCloseEditor();
      } else {
        alert(result.error || "Failed to save coach");
      }
    } catch (err) {
      console.error("Error saving coach:", err);
      alert("Failed to save coach");
    } finally {
      setSaving(false);
    }
  };

  // Deactivate coach
  const handleDeactivate = async (coach: Coach) => {
    if (!confirm(`Are you sure you want to deactivate ${coach.name}?`)) {
      return;
    }

    setActionInProgress(coach.id);
    try {
      const response = await fetch(`/api/admin/coaches/${coach.id}`, {
        method: "DELETE",
      });
      const result = await response.json();

      if (result.success) {
        await fetchCoaches();
      } else {
        alert(result.error || "Failed to deactivate coach");
      }
    } catch (err) {
      console.error("Error deactivating coach:", err);
      alert("Failed to deactivate coach");
    } finally {
      setActionInProgress(null);
    }
  };

  // Reactivate coach
  const handleReactivate = async (coach: Coach) => {
    setActionInProgress(coach.id);
    try {
      const response = await fetch(`/api/admin/coaches/${coach.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: true }),
      });
      const result = await response.json();

      if (result.success) {
        await fetchCoaches();
      } else {
        alert(result.error || "Failed to reactivate coach");
      }
    } catch (err) {
      console.error("Error reactivating coach:", err);
      alert("Failed to reactivate coach");
    } finally {
      setActionInProgress(null);
    }
  };

  // Format currency (pence to pounds)
  const formatRate = (pence?: number) => {
    if (pence === undefined || pence === null) return "-";
    return `£${(pence / 100).toFixed(2)}`;
  };

  // Desktop table columns
  const tableColumns = [
    { key: "name", label: "Coach" },
    { key: "abbreviation", label: "Abbrev" },
    { key: "email", label: "Email" },
    { key: "hourlyRate", label: "Hourly Rate" },
    { key: "sessionRate", label: "Session Rate" },
    { key: "status", label: "Status" },
    { key: "actions", label: "" },
  ];

  // Loading state
  if (loading && coaches.length === 0) {
    return (
      <div className="space-y-8">
        <AdminPageHeader
          title="Coaches"
          subtitle="Loading..."
        />
        <TableSkeleton rows={5} columns={6} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <AdminPageHeader
        title="Coaches"
        subtitle={`${coaches.length} coach${coaches.length !== 1 ? "es" : ""}`}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowInactive(!showInactive)}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              showInactive
                ? "bg-black text-white"
                : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
            }`}
          >
            {showInactive ? "Showing All" : "Active Only"}
          </button>
          <Button variant="adminPrimary" onClick={handleAddCoach}>
            <Plus className="mr-2 h-4 w-4" />
            Add Coach
          </Button>
        </div>
      </AdminPageHeader>

      {/* Error State */}
      {error && (
        <AdminCard hover={false} className="bg-red-50 border-red-200">
          <div className="flex items-center gap-3 text-red-700">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <p className="text-sm">{error}</p>
            <Button
              variant="adminSecondary"
              size="sm"
              onClick={fetchCoaches}
              className="ml-auto"
            >
              Retry
            </Button>
          </div>
        </AdminCard>
      )}

      {/* Editor Panel */}
      <AnimatePresence>
        {editorOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <AdminCard hover={false} className="border-sky-200 bg-sky-50/30">
              <div className="space-y-6">
                {/* Editor Header */}
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold text-neutral-900">
                    {editingCoach ? "Edit Coach" : "Add New Coach"}
                  </h3>
                  <button
                    onClick={handleCloseEditor}
                    className="p-1 rounded-lg hover:bg-neutral-100"
                  >
                    <X className="h-5 w-5 text-neutral-500" />
                  </button>
                </div>

                {/* Form Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <AdminInput
                    label="Name *"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Enter coach name"
                  />
                  <AdminInput
                    label="Abbreviation"
                    value={formData.abbreviation || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, abbreviation: e.target.value })
                    }
                    placeholder="e.g., V for Val"
                  />
                  <AdminInput
                    label="Email"
                    type="email"
                    value={formData.email || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    placeholder="coach@example.com"
                  />
                  <AdminInput
                    label="Phone"
                    type="tel"
                    value={formData.phone || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    placeholder="+44 7xxx xxx xxx"
                  />
                  <AdminInput
                    label="Hourly Rate (pence)"
                    type="number"
                    value={formData.hourlyRate?.toString() || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        hourlyRate: e.target.value ? parseInt(e.target.value, 10) : undefined,
                      })
                    }
                    placeholder="e.g., 1500 for £15.00"
                  />
                  <AdminInput
                    label="Session Rate (pence)"
                    type="number"
                    value={formData.sessionRate?.toString() || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        sessionRate: e.target.value ? parseInt(e.target.value, 10) : undefined,
                      })
                    }
                    placeholder="e.g., 2000 for £20.00"
                  />
                </div>

                {/* Active Toggle */}
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) =>
                      setFormData({ ...formData, isActive: e.target.checked })
                    }
                    className="h-4 w-4 rounded border-neutral-300 text-sky-600 focus:ring-sky-500"
                  />
                  <label htmlFor="isActive" className="text-sm text-neutral-700">
                    Active (can be assigned to sessions)
                  </label>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3">
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
                    {saving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        {editingCoach ? "Update Coach" : "Add Coach"}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </AdminCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Coaches Table */}
      {coaches.length === 0 && !loading ? (
        <AdminEmptyState
          icon={Users}
          title="No coaches found"
          description={
            showInactive
              ? "No coaches have been added yet."
              : "No active coaches. Try showing inactive coaches or add a new one."
          }
          action={
            <Button variant="adminPrimary" onClick={handleAddCoach}>
              <Plus className="mr-2 h-4 w-4" />
              Add Coach
            </Button>
          }
        />
      ) : (
        <ResponsiveTable
          mobileView={
            <>
              {coaches.map((coach) => (
                <MobileCard key={coach.id}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-100 text-sky-700 font-medium">
                        {coach.abbreviation || coach.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-neutral-900">{coach.name}</p>
                        <p className="text-xs text-neutral-500">
                          {coach.abbreviation || "No abbreviation"}
                        </p>
                      </div>
                    </div>
                    <AdminBadge variant={coach.isActive ? "success" : "error"}>
                      {coach.isActive ? "Active" : "Inactive"}
                    </AdminBadge>
                  </div>

                  <div className="space-y-2 text-sm">
                    {coach.email && (
                      <MobileCardRow label="Email">{coach.email}</MobileCardRow>
                    )}
                    {coach.phone && (
                      <MobileCardRow label="Phone">{coach.phone}</MobileCardRow>
                    )}
                    <MobileCardRow label="Hourly Rate">
                      {formatRate(coach.hourlyRate)}
                    </MobileCardRow>
                    <MobileCardRow label="Session Rate">
                      {formatRate(coach.sessionRate)}
                    </MobileCardRow>
                  </div>

                  <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-neutral-100">
                    <Button
                      variant="adminSecondary"
                      size="sm"
                      onClick={() => handleEditCoach(coach)}
                    >
                      <Edit2 className="h-3.5 w-3.5 mr-1.5" />
                      Edit
                    </Button>
                    {coach.isActive ? (
                      <Button
                        variant="adminSecondary"
                        size="sm"
                        onClick={() => handleDeactivate(coach)}
                        disabled={actionInProgress === coach.id}
                        className="text-red-600 hover:text-red-700"
                      >
                        {actionInProgress === coach.id ? (
                          <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                        ) : (
                          <UserX className="h-3.5 w-3.5 mr-1.5" />
                        )}
                        Deactivate
                      </Button>
                    ) : (
                      <Button
                        variant="adminSecondary"
                        size="sm"
                        onClick={() => handleReactivate(coach)}
                        disabled={actionInProgress === coach.id}
                        className="text-green-600 hover:text-green-700"
                      >
                        {actionInProgress === coach.id ? (
                          <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                        ) : (
                          <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                        )}
                        Reactivate
                      </Button>
                    )}
                  </div>
                </MobileCard>
              ))}
            </>
          }
        >
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-100">
                {tableColumns.map((col) => (
                  <th
                    key={col.key}
                    className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-500"
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {coaches.map((coach) => (
                <tr
                  key={coach.id}
                  className="border-t border-neutral-100 hover:bg-neutral-50/50 transition-colors"
                >
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sky-100 text-sky-700 font-medium text-sm">
                        {coach.abbreviation || coach.name.charAt(0)}
                      </div>
                      <span className="font-medium text-neutral-900">
                        {coach.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-neutral-600">
                    {coach.abbreviation || "-"}
                  </td>
                  <td className="px-4 py-3.5 text-neutral-600">
                    {coach.email ? (
                      <a
                        href={`mailto:${coach.email}`}
                        className="text-sky-600 hover:underline flex items-center gap-1.5"
                      >
                        <Mail className="h-3.5 w-3.5" />
                        {coach.email}
                      </a>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-neutral-900">
                    {formatRate(coach.hourlyRate)}
                  </td>
                  <td className="px-4 py-3.5 text-neutral-900">
                    {formatRate(coach.sessionRate)}
                  </td>
                  <td className="px-4 py-3.5">
                    <AdminBadge variant={coach.isActive ? "success" : "error"}>
                      {coach.isActive ? "Active" : "Inactive"}
                    </AdminBadge>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleEditCoach(coach)}
                        className="p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-500 hover:text-neutral-700"
                        title="Edit"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      {coach.isActive ? (
                        <button
                          onClick={() => handleDeactivate(coach)}
                          disabled={actionInProgress === coach.id}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-neutral-500 hover:text-red-600 disabled:opacity-50"
                          title="Deactivate"
                        >
                          {actionInProgress === coach.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <UserX className="h-4 w-4" />
                          )}
                        </button>
                      ) : (
                        <button
                          onClick={() => handleReactivate(coach)}
                          disabled={actionInProgress === coach.id}
                          className="p-1.5 rounded-lg hover:bg-green-50 text-neutral-500 hover:text-green-600 disabled:opacity-50"
                          title="Reactivate"
                        >
                          {actionInProgress === coach.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <RotateCcw className="h-4 w-4" />
                          )}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </ResponsiveTable>
      )}
    </div>
  );
}
