"use client";

import { cn } from "@/lib/utils";
import {
  TimetableSlot,
  SlotType,
  SLOT_TYPE_COLORS,
  SLOT_TYPE_LABELS,
} from "@/types/timetable";
import { User, Clock } from "lucide-react";

interface SlotCardProps {
  slot: TimetableSlot;
  onClick?: () => void;
  compact?: boolean;
  className?: string;
}

/**
 * Individual slot display card for the timetable grid.
 * Color coded by slot type with student name or "Available" status.
 */
export function SlotCard({
  slot,
  onClick,
  compact = false,
  className,
}: SlotCardProps) {
  const colorClasses = SLOT_TYPE_COLORS[slot.slotType];
  const isAvailable = slot.slotType === "AVAILABLE";
  const isClickable = !!onClick;

  return (
    <div
      onClick={onClick}
      className={cn(
        "rounded-lg border p-2 transition-all duration-200",
        colorClasses,
        isClickable && "cursor-pointer hover:shadow-md hover:scale-[1.02]",
        compact ? "text-xs" : "text-sm",
        className
      )}
    >
      {/* Slot Type Badge */}
      <div className="flex items-center justify-between mb-1">
        <span
          className={cn(
            "font-semibold uppercase tracking-wide",
            compact ? "text-[10px]" : "text-[11px]"
          )}
        >
          {slot.slotType}
        </span>
        {!compact && (
          <span className="text-[10px] opacity-70">
            {slot.startTime}-{slot.endTime}
          </span>
        )}
      </div>

      {/* Student Name or Available */}
      <div className={cn("flex items-center gap-1", compact ? "mt-0.5" : "mt-1")}>
        <User className={cn("flex-shrink-0", compact ? "h-3 w-3" : "h-3.5 w-3.5")} />
        <span className={cn("truncate font-medium", compact ? "text-[10px]" : "text-xs")}>
          {isAvailable ? "Available" : slot.studentName || "Unassigned"}
        </span>
      </div>

      {/* Coach Name (non-compact only) */}
      {!compact && slot.coachName && (
        <div className="flex items-center gap-1 mt-1 text-[10px] opacity-70">
          <Clock className="h-3 w-3 flex-shrink-0" />
          <span className="truncate">{slot.coachName}</span>
        </div>
      )}
    </div>
  );
}

/**
 * Empty slot placeholder for the grid.
 * Shows an "Add Slot" action when clicked.
 */
interface EmptySlotCardProps {
  onClick?: () => void;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  className?: string;
}

export function EmptySlotCard({
  onClick,
  dayOfWeek,
  startTime,
  endTime,
  className,
}: EmptySlotCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "rounded-lg border border-dashed border-neutral-200 p-2",
        "text-xs text-neutral-400",
        "transition-all duration-200",
        "hover:border-sky-300 hover:bg-sky-50/50 hover:text-sky-600",
        "cursor-pointer min-h-[60px] flex items-center justify-center",
        className
      )}
    >
      <span className="text-[11px] font-medium">+ Add Slot</span>
    </div>
  );
}

/**
 * Slot type legend component for display above the grid.
 */
export function SlotTypeLegend({ className }: { className?: string }) {
  const slotTypes: SlotType[] = ["121", "ASC", "GDS", "OBS", "AVAILABLE"];

  return (
    <div className={cn("flex flex-wrap gap-3", className)}>
      {slotTypes.map((type) => (
        <div key={type} className="flex items-center gap-1.5">
          <div
            className={cn(
              "w-3 h-3 rounded border",
              SLOT_TYPE_COLORS[type]
            )}
          />
          <span className="text-xs text-neutral-600">
            {SLOT_TYPE_LABELS[type]}
          </span>
        </div>
      ))}
    </div>
  );
}
