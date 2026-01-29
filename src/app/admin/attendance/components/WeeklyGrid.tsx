"use client";

import { WeeklyAttendanceSummary, DailyBreakdown } from "@/types/attendance";

interface WeeklyGridProps {
  data: WeeklyAttendanceSummary;
  onDayClick: (date: string) => void;
}

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// Get color class based on attendance rate
function getAttendanceColor(rate: number, hasData: boolean): string {
  if (!hasData) return "bg-neutral-50 text-neutral-300";
  if (rate >= 80) return "bg-green-50 text-green-700 hover:bg-green-100";
  if (rate >= 50) return "bg-amber-50 text-amber-700 hover:bg-amber-100";
  return "bg-red-50 text-red-700 hover:bg-red-100";
}

// Get border color based on attendance rate
function getBorderColor(rate: number, hasData: boolean): string {
  if (!hasData) return "border-neutral-100";
  if (rate >= 80) return "border-green-200";
  if (rate >= 50) return "border-amber-200";
  return "border-red-200";
}

export function WeeklyGrid({ data, onDayClick }: WeeklyGridProps) {
  // Get all unique session types across all days
  const allSessionTypes = new Set<string>();
  data.dailyBreakdown.forEach((day) => {
    day.bySessionType.forEach((s) => allSessionTypes.add(s.type));
  });
  const sessionTypes = Array.from(allSessionTypes).sort();

  // Calculate daily totals
  const dailyTotals = data.dailyBreakdown.map((day) => {
    const enrolled = day.bySessionType.reduce((sum, s) => sum + s.enrolled, 0);
    const attended = day.bySessionType.reduce((sum, s) => sum + s.attended, 0);
    const rate = enrolled > 0 ? Math.round((attended / enrolled) * 100) : 0;
    return { enrolled, attended, rate };
  });

  // Get session type data for a specific day
  const getSessionTypeData = (day: DailyBreakdown, type: string) => {
    return day.bySessionType.find((s) => s.type === type);
  };

  // Format date for display (e.g., "27")
  const formatDayNumber = (dateStr: string) => {
    return new Date(dateStr).getDate();
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] border-collapse">
        <thead>
          <tr>
            <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-400 bg-neutral-50/50 border-b border-neutral-100">
              Session Type
            </th>
            {data.dailyBreakdown.map((day) => (
              <th
                key={day.date}
                className="px-2 py-3 text-center text-[11px] font-semibold uppercase tracking-wider text-neutral-400 bg-neutral-50/50 border-b border-neutral-100 min-w-[80px]"
              >
                <div className="flex flex-col items-center gap-0.5">
                  <span>{DAY_LABELS[day.dayOfWeek]}</span>
                  <span className="text-neutral-500 font-medium">{formatDayNumber(day.date)}</span>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sessionTypes.length === 0 ? (
            <tr>
              <td
                colSpan={8}
                className="px-4 py-8 text-center text-sm text-neutral-500"
              >
                No sessions found for this week
              </td>
            </tr>
          ) : (
            <>
              {sessionTypes.map((type) => (
                <tr key={type} className="border-b border-neutral-50">
                  <td className="px-4 py-3 text-sm font-medium text-neutral-900">
                    {type}
                  </td>
                  {data.dailyBreakdown.map((day) => {
                    const typeData = getSessionTypeData(day, type);
                    const hasData = !!typeData && typeData.enrolled > 0;
                    const rate = typeData?.rate || 0;

                    return (
                      <td
                        key={`${type}-${day.date}`}
                        className="p-1"
                      >
                        <button
                          onClick={() => hasData && onDayClick(day.date)}
                          disabled={!hasData}
                          className={`
                            w-full px-2 py-2 rounded-lg text-center transition-colors
                            border ${getBorderColor(rate, hasData)}
                            ${getAttendanceColor(rate, hasData)}
                            ${hasData ? "cursor-pointer" : "cursor-default"}
                          `}
                        >
                          {hasData ? (
                            <div className="flex flex-col items-center">
                              <span className="text-sm font-semibold">
                                {typeData!.attended}/{typeData!.enrolled}
                              </span>
                              <span className="text-[10px] opacity-75">
                                {rate}%
                              </span>
                            </div>
                          ) : (
                            <span className="text-sm">-</span>
                          )}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}

              {/* Daily Totals Row */}
              <tr className="border-t-2 border-neutral-200 bg-neutral-50/50">
                <td className="px-4 py-3 text-sm font-semibold text-neutral-700">
                  Daily Total
                </td>
                {data.dailyBreakdown.map((day, index) => {
                  const total = dailyTotals[index];
                  const hasData = total.enrolled > 0;

                  return (
                    <td
                      key={`total-${day.date}`}
                      className="p-1"
                    >
                      <button
                        onClick={() => hasData && onDayClick(day.date)}
                        disabled={!hasData}
                        className={`
                          w-full px-2 py-2 rounded-lg text-center transition-colors
                          border ${getBorderColor(total.rate, hasData)}
                          ${getAttendanceColor(total.rate, hasData)}
                          ${hasData ? "cursor-pointer font-semibold" : "cursor-default"}
                        `}
                      >
                        {hasData ? (
                          <div className="flex flex-col items-center">
                            <span className="text-sm font-bold">
                              {total.attended}/{total.enrolled}
                            </span>
                            <span className="text-[10px] font-semibold opacity-75">
                              {total.rate}%
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm">-</span>
                        )}
                      </button>
                    </td>
                  );
                })}
              </tr>
            </>
          )}
        </tbody>
      </table>
    </div>
  );
}
