"use client";

import { Input } from "@/components/ui/input";

interface DateRangePickerProps {
  startDate: string;
  endDate: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  error?: string;
}

export function DateRangePicker({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  error,
}: DateRangePickerProps) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-neutral-400 mb-2">
            Start Date *
          </label>
          <Input
            type="date"
            value={startDate}
            onChange={(e) => onStartDateChange(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-neutral-400 mb-2">
            End Date *
          </label>
          <Input
            type="date"
            value={endDate}
            min={startDate}
            onChange={(e) => onEndDateChange(e.target.value)}
            required
          />
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      {startDate && endDate && new Date(endDate) >= new Date(startDate) && (
        <p className="text-xs text-neutral-500">
          Duration: {calculateDuration(startDate, endDate)}
        </p>
      )}
    </div>
  );
}

function calculateDuration(start: string, end: string): string {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  const weeks = Math.floor(diffDays / 7);
  const days = diffDays % 7;

  if (weeks === 0) {
    return `${diffDays} day${diffDays !== 1 ? "s" : ""}`;
  } else if (days === 0) {
    return `${weeks} week${weeks !== 1 ? "s" : ""}`;
  } else {
    return `${weeks} week${weeks !== 1 ? "s" : ""}, ${days} day${days !== 1 ? "s" : ""}`;
  }
}
