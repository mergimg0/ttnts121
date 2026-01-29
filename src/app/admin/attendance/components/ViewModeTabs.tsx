"use client";

import { cn } from "@/lib/utils";
import { AttendanceViewMode } from "@/types/attendance";

interface ViewModeTabsProps {
  activeMode: AttendanceViewMode;
  onModeChange: (mode: AttendanceViewMode) => void;
}

const VIEW_MODES: { value: AttendanceViewMode; label: string }[] = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "analytics", label: "Analytics" },
];

export function ViewModeTabs({ activeMode, onModeChange }: ViewModeTabsProps) {
  return (
    <div className="flex gap-2">
      {VIEW_MODES.map((mode) => (
        <button
          key={mode.value}
          onClick={() => onModeChange(mode.value)}
          className={cn(
            "px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
            activeMode === mode.value
              ? "bg-sky-600 text-white shadow-sm"
              : "bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-50"
          )}
        >
          {mode.label}
        </button>
      ))}
    </div>
  );
}
