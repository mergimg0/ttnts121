"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";

interface DailyRate {
  date: string;
  rate: number;
  sessionCount: number;
}

interface MonthlyCalendarProps {
  year: number;
  month: number; // 1-indexed (1 = January)
  dailyRates: DailyRate[];
  onDayClick: (date: string) => void;
}

// Helper to build calendar days with Monday start
function buildCalendarDays(year: number, month: number) {
  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);
  // Get day of week with Monday = 0
  const startPadding = (firstDay.getDay() + 6) % 7;
  const days: (number | null)[] = [];

  // Padding for days before month starts
  for (let i = 0; i < startPadding; i++) {
    days.push(null);
  }

  // Days of month
  for (let d = 1; d <= lastDay.getDate(); d++) {
    days.push(d);
  }

  return days;
}

// Get color class based on attendance rate
function getAttendanceColor(rate: number | null): string {
  if (rate === null) return ""; // No sessions
  if (rate >= 80) return "bg-green-100 text-green-800 border-green-200";
  if (rate >= 50) return "bg-amber-100 text-amber-800 border-amber-200";
  return "bg-red-100 text-red-800 border-red-200";
}

// Get background for cells with sessions
function getCellBackground(rate: number | null): string {
  if (rate === null) return "bg-neutral-50";
  if (rate >= 80) return "bg-green-50";
  if (rate >= 50) return "bg-amber-50";
  return "bg-red-50";
}

export function MonthlyCalendar({
  year,
  month,
  dailyRates,
  onDayClick,
}: MonthlyCalendarProps) {
  // Build calendar grid
  const calendarDays = useMemo(() => buildCalendarDays(year, month), [year, month]);

  // Map daily rates by date for quick lookup
  const ratesByDate = useMemo(() => {
    const map = new Map<string, DailyRate>();
    for (const rate of dailyRates) {
      map.set(rate.date, rate);
    }
    return map;
  }, [dailyRates]);

  // Get today's date string
  const todayStr = new Date().toISOString().split("T")[0];

  // Day headers (Monday first)
  const dayHeaders = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <div className="bg-white rounded-2xl border border-neutral-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      {/* Calendar Grid */}
      <div className="p-4 lg:p-6">
        {/* Header row */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {dayHeaders.map((day) => (
            <div
              key={day}
              className="text-center text-[11px] font-semibold uppercase tracking-wider text-neutral-400 py-2"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar days */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((dayNum, idx) => {
            if (dayNum === null) {
              return <div key={`empty-${idx}`} className="h-20 lg:h-24" />;
            }

            // Build date string for this day
            const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
            const dayData = ratesByDate.get(dateStr);
            const hasSession = !!dayData;
            const rate = dayData?.rate ?? null;
            const isToday = dateStr === todayStr;
            const isPast = new Date(dateStr) < new Date(new Date().setHours(0, 0, 0, 0));

            return (
              <button
                key={dateStr}
                onClick={() => onDayClick(dateStr)}
                disabled={!hasSession && isPast}
                className={cn(
                  "h-20 lg:h-24 p-1.5 lg:p-2 rounded-lg border transition-all text-left flex flex-col",
                  hasSession
                    ? cn(
                        getCellBackground(rate),
                        "border-neutral-200 hover:border-neutral-300 hover:shadow-sm cursor-pointer"
                      )
                    : "border-neutral-100 bg-neutral-50/50",
                  isToday && "ring-2 ring-sky-500 ring-offset-1",
                  !hasSession && isPast && "opacity-50 cursor-default"
                )}
              >
                {/* Day number */}
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={cn(
                      "text-xs lg:text-sm font-medium",
                      isToday ? "text-sky-600" : hasSession ? "text-neutral-700" : "text-neutral-400"
                    )}
                  >
                    {dayNum}
                  </span>
                </div>

                {/* Attendance info */}
                {hasSession && rate !== null && (
                  <div className="flex-1 flex flex-col justify-center items-center">
                    <span
                      className={cn(
                        "text-lg lg:text-2xl font-bold",
                        rate >= 80 ? "text-green-600" : rate >= 50 ? "text-amber-600" : "text-red-600"
                      )}
                    >
                      {rate}%
                    </span>
                    <span className="text-[10px] lg:text-xs text-neutral-500">
                      {dayData.sessionCount} session{dayData.sessionCount !== 1 ? "s" : ""}
                    </span>
                  </div>
                )}

                {/* No sessions indicator */}
                {!hasSession && !isPast && (
                  <div className="flex-1 flex items-center justify-center">
                    <span className="text-[10px] text-neutral-400">-</span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="border-t border-neutral-100 px-4 lg:px-6 py-3">
        <div className="flex flex-wrap items-center gap-4 text-xs">
          <span className="text-neutral-500">Attendance:</span>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-green-100 border border-green-200" />
            <span className="text-neutral-600">&gt;80%</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-amber-100 border border-amber-200" />
            <span className="text-neutral-600">50-80%</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-red-100 border border-red-200" />
            <span className="text-neutral-600">&lt;50%</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-neutral-50 border border-neutral-200" />
            <span className="text-neutral-600">No sessions</span>
          </div>
        </div>
      </div>
    </div>
  );
}
