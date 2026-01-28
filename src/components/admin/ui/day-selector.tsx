"use client";

import { cn } from "@/lib/utils";

const DAYS = [
  { value: 0, label: "Sun", fullLabel: "Sunday" },
  { value: 1, label: "Mon", fullLabel: "Monday" },
  { value: 2, label: "Tue", fullLabel: "Tuesday" },
  { value: 3, label: "Wed", fullLabel: "Wednesday" },
  { value: 4, label: "Thu", fullLabel: "Thursday" },
  { value: 5, label: "Fri", fullLabel: "Friday" },
  { value: 6, label: "Sat", fullLabel: "Saturday" },
];

interface DaySelectorProps {
  selectedDays: number[];
  onChange: (days: number[]) => void;
  multiple?: boolean;
}

export function DaySelector({
  selectedDays,
  onChange,
  multiple = true,
}: DaySelectorProps) {
  const toggleDay = (day: number) => {
    if (multiple) {
      if (selectedDays.includes(day)) {
        onChange(selectedDays.filter((d) => d !== day));
      } else {
        onChange([...selectedDays, day].sort((a, b) => a - b));
      }
    } else {
      onChange([day]);
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
        {multiple ? "Days of Week *" : "Day of Week *"}
      </label>
      <div className="grid grid-cols-7 gap-1.5">
        {DAYS.map((day) => {
          const isSelected = selectedDays.includes(day.value);
          return (
            <button
              key={day.value}
              type="button"
              onClick={() => toggleDay(day.value)}
              className={cn(
                "flex flex-col items-center justify-center rounded-lg py-2 px-1 text-sm font-medium transition-all",
                isSelected
                  ? "bg-sky-600 text-white shadow-sm"
                  : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
              )}
              title={day.fullLabel}
            >
              <span className="text-xs">{day.label}</span>
            </button>
          );
        })}
      </div>
      {selectedDays.length > 0 && (
        <p className="text-xs text-neutral-500">
          Selected: {selectedDays.map((d) => DAYS[d].fullLabel).join(", ")}
        </p>
      )}
      {multiple && selectedDays.length === 0 && (
        <p className="text-xs text-red-500">Please select at least one day</p>
      )}
    </div>
  );
}

// Helper to calculate session occurrences
export function calculateOccurrences(
  startDate: string,
  endDate: string,
  daysOfWeek: number[]
): number {
  if (!startDate || !endDate || daysOfWeek.length === 0) return 0;

  const start = new Date(startDate);
  const end = new Date(endDate);
  let count = 0;

  const current = new Date(start);
  while (current <= end) {
    if (daysOfWeek.includes(current.getDay())) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }

  return count;
}
