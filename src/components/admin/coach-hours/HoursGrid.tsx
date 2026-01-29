"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { AdminCard, AdminCardStatic } from "@/components/admin/ui/admin-card";
import { AdminBadge } from "@/components/admin/ui/admin-badge";
import { formatCurrency, formatHours, CoachMonthlySummary, CoachDayEntry } from "@/types/coach";
import { CheckCircle, Edit2, Plus } from "lucide-react";

interface HoursGridProps {
  month: string; // "2026-01" format
  summaries: CoachMonthlySummary[];
  onCellClick: (coachId: string, coachName: string, date: string, entry?: CoachDayEntry) => void;
  loading?: boolean;
}

function getDaysInMonth(month: string): { date: string; dayName: string; dayNum: number; isWeekend: boolean }[] {
  const [year, monthNum] = month.split("-").map(Number);
  const daysCount = new Date(year, monthNum, 0).getDate();
  const days: { date: string; dayName: string; dayNum: number; isWeekend: boolean }[] = [];

  for (let d = 1; d <= daysCount; d++) {
    const dateObj = new Date(year, monthNum - 1, d);
    const dayOfWeek = dateObj.getDay();
    days.push({
      date: `${month}-${d.toString().padStart(2, "0")}`,
      dayName: dateObj.toLocaleDateString("en-GB", { weekday: "short" }),
      dayNum: d,
      isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
    });
  }

  return days;
}

export function HoursGrid({ month, summaries, onCellClick, loading = false }: HoursGridProps) {
  const days = useMemo(() => getDaysInMonth(month), [month]);

  // Create a lookup map for quick access
  const hoursMap = useMemo(() => {
    const map = new Map<string, CoachDayEntry>();
    summaries.forEach((summary) => {
      summary.dayBreakdown.forEach((day) => {
        map.set(`${summary.coachId}-${day.date}`, day);
      });
    });
    return map;
  }, [summaries]);

  if (loading) {
    return (
      <AdminCardStatic className="overflow-hidden">
        <div className="animate-pulse">
          <div className="h-12 bg-neutral-100 rounded-lg mb-4" />
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 bg-neutral-50 rounded-lg" />
            ))}
          </div>
        </div>
      </AdminCardStatic>
    );
  }

  if (summaries.length === 0) {
    return (
      <AdminCardStatic>
        <div className="text-center py-12">
          <p className="text-neutral-500">No hours logged for this month</p>
        </div>
      </AdminCardStatic>
    );
  }

  return (
    <AdminCardStatic className="overflow-hidden" padding={false}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[800px]">
          {/* Header */}
          <thead className="border-b border-neutral-100">
            <tr>
              <th className="sticky left-0 z-10 bg-white py-3 px-4 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-400 min-w-[140px]">
                Coach
              </th>
              {days.map((day) => (
                <th
                  key={day.date}
                  className={cn(
                    "py-3 px-1 text-center text-[10px] font-medium min-w-[40px]",
                    day.isWeekend ? "text-neutral-300 bg-neutral-50/50" : "text-neutral-400"
                  )}
                >
                  <div>{day.dayName}</div>
                  <div className="font-semibold">{day.dayNum}</div>
                </th>
              ))}
              <th className="py-3 px-4 text-right text-[11px] font-semibold uppercase tracking-wider text-neutral-400 min-w-[100px]">
                Total
              </th>
            </tr>
          </thead>

          {/* Body */}
          <tbody className="divide-y divide-neutral-50">
            {summaries.map((summary) => (
              <tr key={summary.coachId} className="group hover:bg-neutral-50/30 transition-colors">
                {/* Coach Name */}
                <td className="sticky left-0 z-10 bg-white group-hover:bg-neutral-50/30 transition-colors py-3 px-4">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-neutral-900 text-sm">
                      {summary.coachName}
                    </span>
                    {summary.allVerified && (
                      <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                    )}
                  </div>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    {formatCurrency(summary.totalEarnings)}
                  </p>
                </td>

                {/* Day Cells */}
                {days.map((day) => {
                  const entry = hoursMap.get(`${summary.coachId}-${day.date}`);
                  const hasHours = entry && entry.hours > 0;

                  return (
                    <td
                      key={day.date}
                      className={cn(
                        "py-2 px-1 text-center",
                        day.isWeekend && "bg-neutral-50/50"
                      )}
                    >
                      <button
                        onClick={() => onCellClick(summary.coachId, summary.coachName, day.date, entry)}
                        className={cn(
                          "w-full h-10 rounded-lg text-xs font-medium transition-all",
                          "flex items-center justify-center",
                          hasHours
                            ? entry?.isVerified
                              ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                              : "bg-sky-100 text-sky-700 hover:bg-sky-200"
                            : "bg-transparent text-neutral-300 hover:bg-neutral-100 hover:text-neutral-500",
                          "group/cell"
                        )}
                        title={
                          hasHours
                            ? `${formatHours(entry!.hours)} - ${entry?.isVerified ? "Verified" : "Unverified"}`
                            : "Click to log hours"
                        }
                      >
                        {hasHours ? (
                          <span className="tabular-nums">{entry!.hours}</span>
                        ) : (
                          <Plus className="h-3 w-3 opacity-0 group-hover/cell:opacity-100 transition-opacity" />
                        )}
                      </button>
                    </td>
                  );
                })}

                {/* Total */}
                <td className="py-3 px-4 text-right">
                  <span className="font-semibold text-neutral-900 tabular-nums">
                    {formatHours(summary.totalHours)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>

          {/* Footer */}
          <tfoot className="border-t border-neutral-200 bg-neutral-50/50">
            <tr>
              <td className="sticky left-0 z-10 bg-neutral-50/50 py-3 px-4 font-semibold text-neutral-700 text-sm">
                Daily Total
              </td>
              {days.map((day) => {
                const dayTotal = summaries.reduce((sum, s) => {
                  const entry = hoursMap.get(`${s.coachId}-${day.date}`);
                  return sum + (entry?.hours || 0);
                }, 0);

                return (
                  <td
                    key={day.date}
                    className={cn(
                      "py-3 px-1 text-center text-xs font-medium tabular-nums",
                      day.isWeekend ? "bg-neutral-100/50 text-neutral-400" : "text-neutral-600",
                      dayTotal > 0 && "text-sky-700"
                    )}
                  >
                    {dayTotal > 0 ? dayTotal : "-"}
                  </td>
                );
              })}
              <td className="py-3 px-4 text-right font-bold text-neutral-900 tabular-nums">
                {formatHours(summaries.reduce((sum, s) => sum + s.totalHours, 0))}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </AdminCardStatic>
  );
}

// Compact list view for mobile
interface HoursListProps {
  summaries: CoachMonthlySummary[];
  onCoachClick: (coachId: string) => void;
  loading?: boolean;
}

export function HoursList({ summaries, onCoachClick, loading = false }: HoursListProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <AdminCard key={i} hover={false}>
            <div className="animate-pulse">
              <div className="h-5 w-32 bg-neutral-200 rounded mb-2" />
              <div className="h-4 w-24 bg-neutral-100 rounded" />
            </div>
          </AdminCard>
        ))}
      </div>
    );
  }

  if (summaries.length === 0) {
    return (
      <AdminCard hover={false}>
        <div className="text-center py-8">
          <p className="text-neutral-500">No hours logged for this month</p>
        </div>
      </AdminCard>
    );
  }

  return (
    <div className="space-y-3">
      {summaries.map((summary) => (
        <button
          key={summary.coachId}
          onClick={() => onCoachClick(summary.coachId)}
          className="w-full text-left"
        >
        <AdminCard
          className="cursor-pointer"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-medium text-neutral-900 truncate">
                  {summary.coachName}
                </h3>
                {summary.allVerified && (
                  <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                )}
              </div>
              <p className="text-sm text-neutral-500 mt-0.5">
                {summary.verifiedDays}/{summary.verifiedDays + summary.unverifiedDays} days verified
              </p>
            </div>
            <div className="text-right">
              <p className="font-semibold text-neutral-900 tabular-nums">
                {formatHours(summary.totalHours)}
              </p>
              <p className="text-sm text-emerald-600 font-medium tabular-nums">
                {formatCurrency(summary.totalEarnings)}
              </p>
            </div>
          </div>

          {/* Progress bar */}
          {summary.previousMonthHours !== undefined && (
            <div className="mt-3 pt-3 border-t border-neutral-100">
              <div className="flex items-center justify-between text-xs text-neutral-500 mb-1">
                <span>vs last month</span>
                <span
                  className={cn(
                    summary.percentageChange && summary.percentageChange > 0
                      ? "text-emerald-600"
                      : summary.percentageChange && summary.percentageChange < 0
                      ? "text-red-600"
                      : ""
                  )}
                >
                  {summary.percentageChange !== undefined
                    ? `${summary.percentageChange > 0 ? "+" : ""}${summary.percentageChange.toFixed(1)}%`
                    : "N/A"}
                </span>
              </div>
              <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    summary.percentageChange && summary.percentageChange > 0
                      ? "bg-emerald-500"
                      : summary.percentageChange && summary.percentageChange < 0
                      ? "bg-red-400"
                      : "bg-sky-500"
                  )}
                  style={{
                    width: `${Math.min(
                      100,
                      summary.previousMonthHours
                        ? (summary.totalHours / summary.previousMonthHours) * 100
                        : 100
                    )}%`,
                  }}
                />
              </div>
            </div>
          )}
        </AdminCard>
        </button>
      ))}
    </div>
  );
}
