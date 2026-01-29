"use client";

import { useState, useMemo, useCallback } from "react";
import { cn } from "@/lib/utils";
import { AdminCard } from "@/components/admin/ui/admin-card";
import { AdminSelect } from "@/components/admin/ui/admin-select";
import { SlotCard, EmptySlotCard, SlotTypeLegend } from "./SlotCard";
import { WeekNavigator } from "./WeekNavigator";
import { SlotEditor } from "./SlotEditor";
import {
  TimetableSlot,
  DAYS_OF_WEEK,
  DEFAULT_TIME_SLOTS,
  TimeSlotDefinition,
  DayColumnDefinition,
  formatTimetableDate,
  CreateTimetableSlotInput,
  UpdateTimetableSlotInput,
} from "@/types/timetable";
import { Filter } from "lucide-react";

// Drag state for tracking slot being dragged
interface DragState {
  slot: TimetableSlot;
  sourceCell: { dayOfWeek: number; startTime: string };
}

interface Coach {
  id: string;
  name: string;
}

interface TimetableGridProps {
  weekStart: string;
  slots: TimetableSlot[];
  coaches: Coach[];
  timeSlots?: TimeSlotDefinition[];
  days?: DayColumnDefinition[];
  onWeekChange: (newWeekStart: string) => void;
  onSlotCreate: (data: CreateTimetableSlotInput) => Promise<void>;
  onSlotUpdate: (slotId: string, data: UpdateTimetableSlotInput) => Promise<void>;
  onSlotDelete?: (slotId: string) => Promise<void>;
  isLoading?: boolean;
  className?: string;
}

/**
 * Main timetable grid component showing days x time slots.
 * Displays coach assignments with slot type color coding.
 * Supports filtering by coach and click-to-edit functionality.
 */
export function TimetableGrid({
  weekStart,
  slots,
  coaches,
  timeSlots = DEFAULT_TIME_SLOTS,
  days = DAYS_OF_WEEK,
  onWeekChange,
  onSlotCreate,
  onSlotUpdate,
  onSlotDelete,
  isLoading = false,
  className,
}: TimetableGridProps) {
  // Filter state
  const [selectedCoachId, setSelectedCoachId] = useState<string>("all");

  // Editor modal state
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState<TimetableSlot | null>(null);
  const [newSlotDefaults, setNewSlotDefaults] = useState<{
    dayOfWeek: number;
    startTime: string;
    endTime: string;
  } | null>(null);

  // Drag-drop state
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [dropTarget, setDropTarget] = useState<{ dayOfWeek: number; startTime: string } | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Filter slots by selected coach
  const filteredSlots = useMemo(() => {
    if (selectedCoachId === "all") return slots;
    return slots.filter((slot) => slot.coachId === selectedCoachId);
  }, [slots, selectedCoachId]);

  // Build a lookup map for quick slot access: `${dayOfWeek}-${startTime}` -> slots[]
  const slotMap = useMemo(() => {
    const map = new Map<string, TimetableSlot[]>();
    filteredSlots.forEach((slot) => {
      const key = `${slot.dayOfWeek}-${slot.startTime}`;
      const existing = map.get(key) || [];
      existing.push(slot);
      map.set(key, existing);
    });
    return map;
  }, [filteredSlots]);

  // Get slots for a specific cell
  const getSlotsForCell = (dayOfWeek: number, startTime: string): TimetableSlot[] => {
    return slotMap.get(`${dayOfWeek}-${startTime}`) || [];
  };

  // Handle clicking on an existing slot
  const handleSlotClick = (slot: TimetableSlot) => {
    setEditingSlot(slot);
    setNewSlotDefaults(null);
    setEditorOpen(true);
  };

  // Handle clicking on an empty cell to create new slot
  const handleEmptyCellClick = (dayOfWeek: number, startTime: string, endTime: string) => {
    setEditingSlot(null);
    setNewSlotDefaults({ dayOfWeek, startTime, endTime });
    setEditorOpen(true);
  };

  // Handle saving a slot (create or update)
  const handleSaveSlot = async (data: CreateTimetableSlotInput | UpdateTimetableSlotInput) => {
    if (editingSlot) {
      await onSlotUpdate(editingSlot.id, data as UpdateTimetableSlotInput);
    } else {
      await onSlotCreate(data as CreateTimetableSlotInput);
    }
  };

  // Handle deleting a slot
  const handleDeleteSlot = async (slotId: string) => {
    if (onSlotDelete) {
      await onSlotDelete(slotId);
    }
  };

  // Drag-drop handlers
  const handleDragStart = useCallback((e: React.DragEvent, slot: TimetableSlot) => {
    setDragState({
      slot,
      sourceCell: { dayOfWeek: slot.dayOfWeek, startTime: slot.startTime },
    });
    setIsDragging(true);

    // Set drag data for native drag-drop
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", slot.id);

    // Add a slight delay to allow the drag image to render
    requestAnimationFrame(() => {
      const target = e.target as HTMLElement;
      target.style.opacity = "0.5";
    });
  }, []);

  const handleDragEnd = useCallback((e: React.DragEvent) => {
    const target = e.target as HTMLElement;
    target.style.opacity = "1";
    setDragState(null);
    setDropTarget(null);
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, dayOfWeek: number, startTime: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";

    // Update drop target for visual feedback
    if (!dropTarget || dropTarget.dayOfWeek !== dayOfWeek || dropTarget.startTime !== startTime) {
      setDropTarget({ dayOfWeek, startTime });
    }
  }, [dropTarget]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    // Only clear if we're actually leaving the cell (not entering a child element)
    const relatedTarget = e.relatedTarget as HTMLElement | null;
    const currentTarget = e.currentTarget as HTMLElement;

    if (!relatedTarget || !currentTarget.contains(relatedTarget)) {
      setDropTarget(null);
    }
  }, []);

  const handleDrop = useCallback(async (
    e: React.DragEvent,
    targetDayOfWeek: number,
    targetStartTime: string,
    targetEndTime: string
  ) => {
    e.preventDefault();

    if (!dragState) return;

    const { slot, sourceCell } = dragState;

    // Don't do anything if dropped on the same cell
    if (sourceCell.dayOfWeek === targetDayOfWeek && sourceCell.startTime === targetStartTime) {
      setDragState(null);
      setDropTarget(null);
      setIsDragging(false);
      return;
    }

    // Update the slot via API
    try {
      await onSlotUpdate(slot.id, {
        dayOfWeek: targetDayOfWeek,
        startTime: targetStartTime,
        endTime: targetEndTime,
      });
    } catch (error) {
      console.error("Failed to move slot:", error);
      // The parent component should handle showing an error notification
    }

    // Reset drag state
    setDragState(null);
    setDropTarget(null);
    setIsDragging(false);
  }, [dragState, onSlotUpdate]);

  // Check if a cell is a valid drop target
  const isValidDropTarget = useCallback((dayOfWeek: number, startTime: string): boolean => {
    if (!dragState) return false;

    // Can't drop on the same cell
    if (dragState.sourceCell.dayOfWeek === dayOfWeek && dragState.sourceCell.startTime === startTime) {
      return false;
    }

    return true;
  }, [dragState]);

  // Check if a cell is the current drop target
  const isDropTarget = useCallback((dayOfWeek: number, startTime: string): boolean => {
    return dropTarget?.dayOfWeek === dayOfWeek && dropTarget?.startTime === startTime;
  }, [dropTarget]);

  // Coach filter options
  const coachFilterOptions = [
    { value: "all", label: "All Coaches" },
    ...coaches.map((coach) => ({ value: coach.id, label: coach.name })),
  ];

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header Row: Navigation + Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Week Navigator */}
        <WeekNavigator weekStart={weekStart} onWeekChange={onWeekChange} />

        {/* Filters */}
        <div className="flex items-center gap-3">
          <Filter className="h-4 w-4 text-neutral-400" />
          <AdminSelect
            value={selectedCoachId}
            onChange={(e) => setSelectedCoachId(e.target.value)}
            options={coachFilterOptions}
            className="w-48"
          />
        </div>
      </div>

      {/* Slot Type Legend */}
      <SlotTypeLegend className="py-2" />

      {/* Grid */}
      <AdminCard padding={false} hover={false} className="overflow-x-auto">
        <div className="min-w-[800px]">
          {/* Loading overlay */}
          {isLoading && (
            <div className="absolute inset-0 bg-white/60 flex items-center justify-center z-10 rounded-xl">
              <div className="flex items-center gap-2 text-neutral-500">
                <div className="h-5 w-5 border-2 border-neutral-300 border-t-sky-500 rounded-full animate-spin" />
                <span className="text-sm">Loading...</span>
              </div>
            </div>
          )}

          {/* Grid Table */}
          <table className="w-full border-collapse">
            {/* Header Row: Days */}
            <thead>
              <tr>
                {/* Time column header */}
                <th className="w-24 p-3 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-500 border-b border-neutral-100">
                  Time
                </th>
                {/* Day columns */}
                {days.map((day) => (
                  <th
                    key={day.dayOfWeek}
                    className="p-3 text-center border-b border-neutral-100"
                  >
                    <div className="text-sm font-semibold text-neutral-900">
                      {day.name}
                    </div>
                    <div className="text-xs text-neutral-500 mt-0.5">
                      {formatTimetableDate(weekStart, day.dayOfWeek)}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            {/* Body: Time Slots */}
            <tbody>
              {timeSlots.map((timeSlot, rowIndex) => (
                <tr
                  key={timeSlot.startTime}
                  className={cn(
                    rowIndex % 2 === 0 ? "bg-white" : "bg-neutral-50/50"
                  )}
                >
                  {/* Time Label */}
                  <td className="p-3 text-sm font-medium text-neutral-600 border-r border-neutral-100 whitespace-nowrap">
                    {timeSlot.label}
                  </td>

                  {/* Day Cells */}
                  {days.map((day) => {
                    const cellSlots = getSlotsForCell(day.dayOfWeek, timeSlot.startTime);

                    return (
                      <td
                        key={`${day.dayOfWeek}-${timeSlot.startTime}`}
                        className="p-2 border-r border-neutral-100 last:border-r-0 align-top min-h-[80px]"
                      >
                        <div className="space-y-1.5 min-h-[60px]">
                          {cellSlots.length > 0 ? (
                            cellSlots.map((slot) => (
                              <SlotCard
                                key={slot.id}
                                slot={slot}
                                onClick={() => handleSlotClick(slot)}
                                compact={cellSlots.length > 1}
                              />
                            ))
                          ) : (
                            <EmptySlotCard
                              onClick={() =>
                                handleEmptyCellClick(
                                  day.dayOfWeek,
                                  timeSlot.startTime,
                                  timeSlot.endTime
                                )
                              }
                              dayOfWeek={day.dayOfWeek}
                              startTime={timeSlot.startTime}
                              endTime={timeSlot.endTime}
                            />
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </AdminCard>

      {/* Slot Editor Modal */}
      <SlotEditor
        isOpen={editorOpen}
        onClose={() => {
          setEditorOpen(false);
          setEditingSlot(null);
          setNewSlotDefaults(null);
        }}
        slot={editingSlot}
        coaches={coaches}
        weekStart={weekStart}
        defaultDayOfWeek={newSlotDefaults?.dayOfWeek}
        defaultStartTime={newSlotDefaults?.startTime}
        defaultEndTime={newSlotDefaults?.endTime}
        onSave={handleSaveSlot}
        onDelete={onSlotDelete ? handleDeleteSlot : undefined}
      />
    </div>
  );
}
