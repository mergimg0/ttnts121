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
  TimetableTemplate,
  TemplateSlot,
  SLOT_TYPE_LABELS,
  DAYS_OF_WEEK,
  SlotType,
} from "@/types/timetable";
import {
  LayoutTemplate,
  Plus,
  Edit2,
  Trash2,
  Eye,
  CheckCircle,
  XCircle,
  ArrowLeft,
  Save,
  X,
  Clock,
  AlertCircle,
} from "lucide-react";

interface Coach {
  id: string;
  name: string;
}

// Mock coaches - in production, fetch from API
const MOCK_COACHES: Coach[] = [
  { id: "coach-val", name: "Val" },
  { id: "coach-ciaran", name: "Ciaran" },
  { id: "coach-tom", name: "Tom" },
  { id: "coach-mike", name: "Mike" },
];

// Generate time options
const TIME_OPTIONS: { value: string; label: string }[] = [];
for (let hour = 6; hour <= 22; hour++) {
  for (const minute of ["00", "30"]) {
    const time = `${String(hour).padStart(2, "0")}:${minute}`;
    TIME_OPTIONS.push({ value: time, label: time });
  }
}

// Slot type options
const SLOT_TYPE_OPTIONS = Object.entries(SLOT_TYPE_LABELS).map(([value, label]) => ({
  value,
  label,
}));

// Day options
const DAY_OPTIONS = DAYS_OF_WEEK.map((day) => ({
  value: String(day.dayOfWeek),
  label: day.name,
}));

export default function TemplatesPage() {
  // State
  const [templates, setTemplates] = useState<TimetableTemplate[]>([]);
  const [coaches] = useState<Coach[]>(MOCK_COACHES);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Editor state
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<TimetableTemplate | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    isActive: true,
    slots: [] as TemplateSlot[],
  });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Slot editor state
  const [slotEditorOpen, setSlotEditorOpen] = useState(false);
  const [editingSlotIndex, setEditingSlotIndex] = useState<number | null>(null);
  const [slotFormData, setSlotFormData] = useState<TemplateSlot>({
    dayOfWeek: 1,
    startTime: "15:00",
    endTime: "16:00",
    coachId: "",
    coachName: "",
    slotType: "AVAILABLE",
  });

  // Fetch templates
  const fetchTemplates = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/admin/timetable/templates");
      const data = await response.json();
      if (data.success) {
        setTemplates(data.data);
      } else {
        setError(data.error || "Failed to fetch templates");
      }
    } catch (err) {
      console.error("Error fetching templates:", err);
      setError("Failed to fetch templates");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  // Open editor for new template
  const handleCreateNew = () => {
    setEditingTemplate(null);
    setFormData({
      name: "",
      description: "",
      isActive: true,
      slots: [],
    });
    setEditorOpen(true);
  };

  // Open editor for existing template
  const handleEdit = (template: TimetableTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      description: template.description || "",
      isActive: template.isActive,
      slots: [...template.slots],
    });
    setEditorOpen(true);
  };

  // Close editor
  const handleCloseEditor = () => {
    setEditorOpen(false);
    setEditingTemplate(null);
    setFormData({ name: "", description: "", isActive: true, slots: [] });
  };

  // Save template
  const handleSave = async () => {
    if (!formData.name.trim()) {
      alert("Template name is required");
      return;
    }

    try {
      setSaving(true);
      const url = editingTemplate
        ? `/api/admin/timetable/templates/${editingTemplate.id}`
        : "/api/admin/timetable/templates";
      const method = editingTemplate ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const result = await response.json();
      if (result.success) {
        await fetchTemplates();
        handleCloseEditor();
      } else {
        alert(result.error || "Failed to save template");
      }
    } catch (err) {
      console.error("Error saving template:", err);
      alert("Failed to save template");
    } finally {
      setSaving(false);
    }
  };

  // Delete template
  const handleDelete = async (templateId: string) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this template? This action cannot be undone."
    );
    if (!confirmed) return;

    try {
      setDeleting(true);
      const response = await fetch(`/api/admin/timetable/templates/${templateId}`, {
        method: "DELETE",
      });

      const result = await response.json();
      if (result.success) {
        await fetchTemplates();
        if (editingTemplate?.id === templateId) {
          handleCloseEditor();
        }
      } else {
        alert(result.error || "Failed to delete template");
      }
    } catch (err) {
      console.error("Error deleting template:", err);
      alert("Failed to delete template");
    } finally {
      setDeleting(false);
    }
  };

  // Toggle template active status
  const handleToggleActive = async (template: TimetableTemplate) => {
    try {
      const response = await fetch(`/api/admin/timetable/templates/${template.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !template.isActive }),
      });

      const result = await response.json();
      if (result.success) {
        await fetchTemplates();
      } else {
        alert(result.error || "Failed to update template");
      }
    } catch (err) {
      console.error("Error updating template:", err);
      alert("Failed to update template");
    }
  };

  // Open slot editor for new slot
  const handleAddSlot = () => {
    setEditingSlotIndex(null);
    setSlotFormData({
      dayOfWeek: 1,
      startTime: "15:00",
      endTime: "16:00",
      coachId: coaches[0]?.id || "",
      coachName: coaches[0]?.name || "",
      slotType: "AVAILABLE",
    });
    setSlotEditorOpen(true);
  };

  // Open slot editor for existing slot
  const handleEditSlot = (index: number) => {
    setEditingSlotIndex(index);
    setSlotFormData({ ...formData.slots[index] });
    setSlotEditorOpen(true);
  };

  // Save slot
  const handleSaveSlot = () => {
    if (!slotFormData.coachId) {
      alert("Please select a coach");
      return;
    }

    const selectedCoach = coaches.find((c) => c.id === slotFormData.coachId);
    const slotWithCoachName = {
      ...slotFormData,
      coachName: selectedCoach?.name || "",
    };

    if (editingSlotIndex !== null) {
      // Update existing slot
      const newSlots = [...formData.slots];
      newSlots[editingSlotIndex] = slotWithCoachName;
      setFormData({ ...formData, slots: newSlots });
    } else {
      // Add new slot
      setFormData({ ...formData, slots: [...formData.slots, slotWithCoachName] });
    }

    setSlotEditorOpen(false);
  };

  // Delete slot
  const handleDeleteSlot = (index: number) => {
    const newSlots = formData.slots.filter((_, i) => i !== index);
    setFormData({ ...formData, slots: newSlots });
  };

  // Get day name
  const getDayName = (dayOfWeek: number) => {
    return DAYS_OF_WEEK.find((d) => d.dayOfWeek === dayOfWeek)?.name || "";
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <AdminPageHeader
          title="Timetable Templates"
          subtitle="Loading..."
        />
        <TableSkeleton rows={4} columns={5} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <AdminPageHeader
        title="Timetable Templates"
        subtitle={`${templates.length} templates`}
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
            New Template
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
              onClick={fetchTemplates}
              className="ml-auto"
            >
              Retry
            </Button>
          </div>
        </AdminCard>
      )}

      {/* Templates List */}
      {templates.length === 0 && !error ? (
        <AdminEmptyState
          icon={LayoutTemplate}
          title="No templates yet"
          description="Create your first timetable template to quickly populate weekly schedules."
          action={
            <Button variant="adminPrimary" onClick={handleCreateNew}>
              <Plus className="mr-2 h-4 w-4" />
              Create Template
            </Button>
          }
        />
      ) : (
        <ResponsiveTable
          mobileView={
            templates.map((template) => (
              <MobileCard key={template.id}>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-semibold text-neutral-900">
                      {template.name}
                    </p>
                    {template.description && (
                      <p className="text-xs text-neutral-500 mt-0.5 line-clamp-1">
                        {template.description}
                      </p>
                    )}
                  </div>
                  <AdminBadge variant={template.isActive ? "success" : "neutral"}>
                    {template.isActive ? "Active" : "Inactive"}
                  </AdminBadge>
                </div>
                <MobileCardRow label="Slots">
                  <span className="text-sm tabular-nums">{template.slots.length}</span>
                </MobileCardRow>
                <div className="pt-3 border-t border-neutral-100 flex gap-2">
                  <Button
                    variant="adminSecondary"
                    size="sm"
                    onClick={() => handleEdit(template)}
                    className="flex-1"
                  >
                    <Edit2 className="mr-1.5 h-3.5 w-3.5" />
                    Edit
                  </Button>
                  <Button
                    variant="adminGhost"
                    size="sm"
                    onClick={() => handleToggleActive(template)}
                    className="flex-1"
                  >
                    {template.isActive ? (
                      <>
                        <XCircle className="mr-1.5 h-3.5 w-3.5" />
                        Deactivate
                      </>
                    ) : (
                      <>
                        <CheckCircle className="mr-1.5 h-3.5 w-3.5" />
                        Activate
                      </>
                    )}
                  </Button>
                </div>
              </MobileCard>
            ))
          }
        >
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-100">
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                  Template Name
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                  Description
                </th>
                <th className="px-4 py-3 text-center text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                  Slots
                </th>
                <th className="px-4 py-3 text-center text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                  Status
                </th>
                <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-50">
              {templates.map((template) => (
                <tr key={template.id} className="group hover:bg-neutral-50/50 transition-colors">
                  <td className="px-4 py-4">
                    <span className="text-sm font-semibold text-neutral-900">
                      {template.name}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-sm text-neutral-500 line-clamp-1 max-w-xs">
                      {template.description || "-"}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span className="text-sm font-medium tabular-nums text-neutral-900">
                      {template.slots.length}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <AdminBadge variant={template.isActive ? "success" : "neutral"}>
                      {template.isActive ? "Active" : "Inactive"}
                    </AdminBadge>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleEdit(template)}
                        className="p-2 text-neutral-400 hover:text-neutral-900 transition-colors rounded-lg hover:bg-neutral-100"
                        title="Edit"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleToggleActive(template)}
                        className="p-2 text-neutral-400 hover:text-neutral-900 transition-colors rounded-lg hover:bg-neutral-100"
                        title={template.isActive ? "Deactivate" : "Activate"}
                      >
                        {template.isActive ? (
                          <XCircle className="h-4 w-4" />
                        ) : (
                          <CheckCircle className="h-4 w-4" />
                        )}
                      </button>
                      <button
                        onClick={() => handleDelete(template.id)}
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

      {/* Template Editor Modal */}
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
              className="fixed inset-4 z-50 lg:left-1/2 lg:top-1/2 lg:inset-auto lg:w-full lg:max-w-3xl lg:-translate-x-1/2 lg:-translate-y-1/2 rounded-2xl bg-white shadow-xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
                <h2 className="text-lg font-semibold text-neutral-900">
                  {editingTemplate ? "Edit Template" : "Create Template"}
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
                {/* Basic Info */}
                <div className="space-y-4">
                  <AdminInput
                    label="Template Name"
                    name="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Default Weekly Schedule"
                    required
                  />
                  <AdminTextarea
                    label="Description (Optional)"
                    name="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Brief description of this template..."
                    rows={2}
                  />
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="h-4 w-4 rounded border-neutral-300 text-sky-600 focus:ring-sky-500"
                    />
                    <span className="text-sm text-neutral-700">
                      Active (can be applied to weeks)
                    </span>
                  </label>
                </div>

                {/* Slots Section */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-neutral-900">
                      Template Slots ({formData.slots.length})
                    </h3>
                    <Button variant="adminSecondary" size="sm" onClick={handleAddSlot}>
                      <Plus className="mr-1.5 h-3.5 w-3.5" />
                      Add Slot
                    </Button>
                  </div>

                  {formData.slots.length === 0 ? (
                    <div className="text-center py-8 border border-dashed border-neutral-200 rounded-xl">
                      <Clock className="h-8 w-8 text-neutral-300 mx-auto mb-2" />
                      <p className="text-sm text-neutral-500">
                        No slots added yet. Click &quot;Add Slot&quot; to create one.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {formData.slots.map((slot, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 bg-neutral-50 rounded-xl border border-neutral-100"
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white border border-neutral-200">
                              <span className="text-xs font-medium text-neutral-600">
                                {getDayName(slot.dayOfWeek).slice(0, 2)}
                              </span>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-neutral-900">
                                {getDayName(slot.dayOfWeek)} {slot.startTime}-{slot.endTime}
                              </p>
                              <p className="text-xs text-neutral-500">
                                {slot.coachName} - {SLOT_TYPE_LABELS[slot.slotType]}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleEditSlot(index)}
                              className="p-1.5 text-neutral-400 hover:text-neutral-900 transition-colors rounded-lg hover:bg-neutral-100"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteSlot(index)}
                              className="p-1.5 text-neutral-400 hover:text-red-600 transition-colors rounded-lg hover:bg-red-50"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between px-6 py-4 border-t border-neutral-100 bg-neutral-50/50">
                <div>
                  {editingTemplate && (
                    <Button
                      variant="adminDanger"
                      size="sm"
                      onClick={() => handleDelete(editingTemplate.id)}
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
                    disabled={saving || !formData.name.trim()}
                  >
                    <Save className="mr-1.5 h-4 w-4" />
                    {saving ? "Saving..." : editingTemplate ? "Update" : "Create"}
                  </Button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Slot Editor Modal */}
      <AnimatePresence>
        {slotEditorOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 z-[60] bg-black/50"
              onClick={() => setSlotEditorOpen(false)}
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.15 }}
              className="fixed left-1/2 top-1/2 z-[60] w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 shadow-xl"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-neutral-900">
                  {editingSlotIndex !== null ? "Edit Slot" : "Add Slot"}
                </h3>
                <button
                  onClick={() => setSlotEditorOpen(false)}
                  className="rounded-lg p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Form */}
              <div className="space-y-4">
                <AdminSelect
                  label="Day"
                  name="dayOfWeek"
                  value={String(slotFormData.dayOfWeek)}
                  onChange={(e) =>
                    setSlotFormData({ ...slotFormData, dayOfWeek: parseInt(e.target.value, 10) })
                  }
                  options={DAY_OPTIONS}
                />

                <div className="grid grid-cols-2 gap-4">
                  <AdminSelect
                    label="Start Time"
                    name="startTime"
                    value={slotFormData.startTime}
                    onChange={(e) => setSlotFormData({ ...slotFormData, startTime: e.target.value })}
                    options={TIME_OPTIONS}
                  />
                  <AdminSelect
                    label="End Time"
                    name="endTime"
                    value={slotFormData.endTime}
                    onChange={(e) => setSlotFormData({ ...slotFormData, endTime: e.target.value })}
                    options={TIME_OPTIONS}
                  />
                </div>

                <AdminSelect
                  label="Coach"
                  name="coachId"
                  value={slotFormData.coachId}
                  onChange={(e) => setSlotFormData({ ...slotFormData, coachId: e.target.value })}
                  options={coaches.map((c) => ({ value: c.id, label: c.name }))}
                  placeholder="Select a coach"
                />

                <AdminSelect
                  label="Slot Type"
                  name="slotType"
                  value={slotFormData.slotType}
                  onChange={(e) =>
                    setSlotFormData({ ...slotFormData, slotType: e.target.value as SlotType })
                  }
                  options={SLOT_TYPE_OPTIONS}
                />

                {slotFormData.slotType !== "AVAILABLE" && (
                  <AdminInput
                    label="Default Student Name (Optional)"
                    name="defaultStudentName"
                    value={slotFormData.defaultStudentName || ""}
                    onChange={(e) =>
                      setSlotFormData({ ...slotFormData, defaultStudentName: e.target.value })
                    }
                    placeholder="For recurring bookings"
                  />
                )}
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 mt-6">
                <Button variant="adminSecondary" onClick={() => setSlotEditorOpen(false)}>
                  Cancel
                </Button>
                <Button variant="adminPrimary" onClick={handleSaveSlot}>
                  <Save className="mr-1.5 h-4 w-4" />
                  {editingSlotIndex !== null ? "Update" : "Add"} Slot
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
