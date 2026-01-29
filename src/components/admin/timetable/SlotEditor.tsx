"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AdminInput, AdminTextarea } from "@/components/admin/ui/admin-input";
import { AdminSelect } from "@/components/admin/ui/admin-select";
import {
  TimetableSlot,
  SlotType,
  SLOT_TYPE_LABELS,
  DAYS_OF_WEEK,
  DEFAULT_TIME_SLOTS,
  CreateTimetableSlotInput,
  UpdateTimetableSlotInput,
} from "@/types/timetable";

interface Coach {
  id: string;
  name: string;
}

interface SlotEditorProps {
  isOpen: boolean;
  onClose: () => void;
  slot?: TimetableSlot | null; // Existing slot for edit mode, null for create mode
  coaches: Coach[];
  weekStart: string;
  defaultDayOfWeek?: number;
  defaultStartTime?: string;
  defaultEndTime?: string;
  onSave: (data: CreateTimetableSlotInput | UpdateTimetableSlotInput) => Promise<void>;
  onDelete?: (slotId: string) => Promise<void>;
}

/**
 * Modal editor for creating and editing timetable slots.
 * Supports create and edit modes with proper form validation.
 */
export function SlotEditor({
  isOpen,
  onClose,
  slot,
  coaches,
  weekStart,
  defaultDayOfWeek = 1,
  defaultStartTime = "15:00",
  defaultEndTime = "16:00",
  onSave,
  onDelete,
}: SlotEditorProps) {
  const isEditMode = !!slot;

  // Form state
  const [formData, setFormData] = useState({
    slotType: "AVAILABLE" as SlotType,
    studentName: "",
    coachId: "",
    dayOfWeek: defaultDayOfWeek,
    startTime: defaultStartTime,
    endTime: defaultEndTime,
    notes: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset form when slot changes or modal opens
  useEffect(() => {
    if (isOpen) {
      if (slot) {
        setFormData({
          slotType: slot.slotType,
          studentName: slot.studentName || "",
          coachId: slot.coachId,
          dayOfWeek: slot.dayOfWeek,
          startTime: slot.startTime,
          endTime: slot.endTime,
          notes: slot.notes || "",
        });
      } else {
        setFormData({
          slotType: "AVAILABLE",
          studentName: "",
          coachId: coaches[0]?.id || "",
          dayOfWeek: defaultDayOfWeek,
          startTime: defaultStartTime,
          endTime: defaultEndTime,
          notes: "",
        });
      }
      setErrors({});
    }
  }, [isOpen, slot, coaches, defaultDayOfWeek, defaultStartTime, defaultEndTime]);

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.coachId) {
      newErrors.coachId = "Please select a coach";
    }

    if (!formData.startTime) {
      newErrors.startTime = "Start time is required";
    }

    if (!formData.endTime) {
      newErrors.endTime = "End time is required";
    }

    if (formData.startTime && formData.endTime && formData.startTime >= formData.endTime) {
      newErrors.endTime = "End time must be after start time";
    }

    if (formData.slotType !== "AVAILABLE" && !formData.studentName.trim()) {
      newErrors.studentName = "Student name is required for booked slots";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle save
  const handleSave = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const selectedCoach = coaches.find((c) => c.id === formData.coachId);

      if (isEditMode && slot) {
        // Update existing slot
        const updateData: UpdateTimetableSlotInput = {
          slotType: formData.slotType,
          studentName: formData.slotType !== "AVAILABLE" ? formData.studentName : undefined,
          coachId: formData.coachId,
          coachName: selectedCoach?.name || "",
          dayOfWeek: formData.dayOfWeek,
          startTime: formData.startTime,
          endTime: formData.endTime,
          notes: formData.notes || undefined,
          updatedAt: new Date(),
        };
        await onSave(updateData);
      } else {
        // Create new slot
        const createData: CreateTimetableSlotInput = {
          slotType: formData.slotType,
          studentName: formData.slotType !== "AVAILABLE" ? formData.studentName : undefined,
          coachId: formData.coachId,
          coachName: selectedCoach?.name || "",
          dayOfWeek: formData.dayOfWeek,
          startTime: formData.startTime,
          endTime: formData.endTime,
          notes: formData.notes || undefined,
          weekStart,
        };
        await onSave(createData);
      }

      onClose();
    } catch (error) {
      console.error("Failed to save slot:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!slot || !onDelete) return;

    setIsDeleting(true);
    try {
      await onDelete(slot.id);
      onClose();
    } catch (error) {
      console.error("Failed to delete slot:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  // Slot type options
  const slotTypeOptions = Object.entries(SLOT_TYPE_LABELS).map(([value, label]) => ({
    value,
    label,
  }));

  // Day options
  const dayOptions = DAYS_OF_WEEK.map((day) => ({
    value: String(day.dayOfWeek),
    label: day.name,
  }));

  // Time options (generate from 06:00 to 22:00 in 30-min increments)
  const timeOptions: { value: string; label: string }[] = [];
  for (let hour = 6; hour <= 22; hour++) {
    for (const minute of ["00", "30"]) {
      const time = `${String(hour).padStart(2, "0")}:${minute}`;
      timeOptions.push({ value: time, label: time });
    }
  }

  // Coach options
  const coachOptions = coaches.map((coach) => ({
    value: coach.id,
    label: coach.name,
  }));

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 bg-black/50"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.15 }}
            className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-neutral-900">
                {isEditMode ? "Edit Slot" : "Add New Slot"}
              </h2>
              <button
                onClick={onClose}
                className="rounded-lg p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form */}
            <div className="space-y-4">
              {/* Slot Type */}
              <AdminSelect
                label="Slot Type"
                name="slotType"
                value={formData.slotType}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    slotType: e.target.value as SlotType,
                  }))
                }
                options={slotTypeOptions}
                error={errors.slotType}
              />

              {/* Student Name (hidden for AVAILABLE slots) */}
              {formData.slotType !== "AVAILABLE" && (
                <AdminInput
                  label="Student Name"
                  name="studentName"
                  value={formData.studentName}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      studentName: e.target.value,
                    }))
                  }
                  placeholder="Enter student name"
                  error={errors.studentName}
                />
              )}

              {/* Coach */}
              <AdminSelect
                label="Coach"
                name="coachId"
                value={formData.coachId}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    coachId: e.target.value,
                  }))
                }
                options={coachOptions}
                placeholder="Select a coach"
                error={errors.coachId}
              />

              {/* Day of Week */}
              <AdminSelect
                label="Day"
                name="dayOfWeek"
                value={String(formData.dayOfWeek)}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    dayOfWeek: parseInt(e.target.value, 10),
                  }))
                }
                options={dayOptions}
                error={errors.dayOfWeek}
              />

              {/* Time Row */}
              <div className="grid grid-cols-2 gap-4">
                <AdminSelect
                  label="Start Time"
                  name="startTime"
                  value={formData.startTime}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      startTime: e.target.value,
                    }))
                  }
                  options={timeOptions}
                  error={errors.startTime}
                />

                <AdminSelect
                  label="End Time"
                  name="endTime"
                  value={formData.endTime}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      endTime: e.target.value,
                    }))
                  }
                  options={timeOptions}
                  error={errors.endTime}
                />
              </div>

              {/* Notes */}
              <AdminTextarea
                label="Notes (Optional)"
                name="notes"
                value={formData.notes}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    notes: e.target.value,
                  }))
                }
                placeholder="Add any additional notes..."
                rows={3}
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-neutral-100">
              {/* Delete button (edit mode only) */}
              <div>
                {isEditMode && onDelete && (
                  <Button
                    variant="adminDanger"
                    size="sm"
                    onClick={handleDelete}
                    disabled={isDeleting || isLoading}
                    className="h-10"
                  >
                    <Trash2 className="h-4 w-4 mr-1.5" />
                    {isDeleting ? "Deleting..." : "Delete"}
                  </Button>
                )}
              </div>

              {/* Save / Cancel */}
              <div className="flex gap-3">
                <Button
                  variant="adminSecondary"
                  onClick={onClose}
                  disabled={isLoading || isDeleting}
                  className="h-10"
                >
                  Cancel
                </Button>
                <Button
                  variant="adminPrimary"
                  onClick={handleSave}
                  disabled={isLoading || isDeleting}
                  className="h-10"
                >
                  <Save className="h-4 w-4 mr-1.5" />
                  {isLoading ? "Saving..." : isEditMode ? "Update Slot" : "Create Slot"}
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
