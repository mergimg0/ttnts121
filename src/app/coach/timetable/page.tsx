"use client";

import { useEffect, useState, useCallback } from "react";
import { useCoachAuth } from "@/components/coach/auth-provider";
import { PermissionGate } from "@/components/coach/permission-gate";
import { AdminCard } from "@/components/admin/ui/admin-card";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  Calendar,
  Clock,
  MapPin,
  Users,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  TimetableSlot,
  DAYS_OF_WEEK,
  DEFAULT_TIME_SLOTS,
  getWeekStart,
  formatTimetableDate,
  SLOT_TYPE_COLORS,
  SLOT_TYPE_LABELS,
} from "@/types/timetable";

export default function CoachTimetablePage() {
  return (
    <PermissionGate permission="canViewTimetable">
      <CoachTimetableContent />
    </PermissionGate>
  );
}

function CoachTimetableContent() {
  const { user } = useCoachAuth();
  const [weekStart, setWeekStart] = useState<string>(() =>
    getWeekStart(new Date())
  );
  const [slots, setSlots] = useState<TimetableSlot[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch timetable slots for the current week
  const fetchSlots = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      const response = await fetch(
        `/api/coach/timetable?weekStart=${weekStart}`
      );
      const data = await response.json();
      if (data.success) {
        setSlots(data.data);
      }
    } catch (error) {
      console.error("Error fetching timetable:", error);
    } finally {
      setLoading(false);
    }
  }, [user, weekStart]);

  useEffect(() => {
    fetchSlots();
  }, [fetchSlots]);

  // Week navigation
  const goToPreviousWeek = () => {
    const newDate = new Date(weekStart);
    newDate.setDate(newDate.getDate() - 7);
    setWeekStart(newDate.toISOString().split("T")[0]);
  };

  const goToNextWeek = () => {
    const newDate = new Date(weekStart);
    newDate.setDate(newDate.getDate() + 7);
    setWeekStart(newDate.toISOString().split("T")[0]);
  };

  const goToCurrentWeek = () => {
    setWeekStart(getWeekStart(new Date()));
  };

  const isCurrentWeek = getWeekStart(new Date()) === weekStart;

  // Format week display
  const weekStartDate = new Date(weekStart);
  const weekEndDate = new Date(weekStart);
  weekEndDate.setDate(weekEndDate.getDate() + 6);

  const formatDate = (date: Date) =>
    date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });

  const weekDisplay = `${formatDate(weekStartDate)} - ${formatDate(
    weekEndDate
  )}, ${weekEndDate.getFullYear()}`;

  // Build slot lookup map
  const slotMap = new Map<string, TimetableSlot[]>();
  slots.forEach((slot) => {
    const key = `${slot.dayOfWeek}-${slot.startTime}`;
    const existing = slotMap.get(key) || [];
    existing.push(slot);
    slotMap.set(key, existing);
  });

  const getSlotsForCell = (
    dayOfWeek: number,
    startTime: string
  ): TimetableSlot[] => {
    return slotMap.get(`${dayOfWeek}-${startTime}`) || [];
  };

  // Calculate total hours for the week
  const totalHours = slots.reduce((total, slot) => {
    const [startHour] = slot.startTime.split(":").map(Number);
    const [endHour] = slot.endTime.split(":").map(Number);
    return total + (endHour - startHour);
  }, 0);

  if (loading && slots.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">My Timetable</h1>
        <p className="mt-1 text-[13px] text-neutral-500">
          Your weekly schedule and assigned sessions
        </p>
      </div>

      {/* Week Navigator */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="adminSecondary"
            size="icon"
            onClick={goToPreviousWeek}
            className="h-9 w-9"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <div className="flex items-center gap-2 min-w-[180px] justify-center">
            <Calendar className="h-4 w-4 text-neutral-400" />
            <span className="text-sm font-medium text-neutral-900">
              {weekDisplay}
            </span>
          </div>

          <Button
            variant="adminSecondary"
            size="icon"
            onClick={goToNextWeek}
            className="h-9 w-9"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>

          {!isCurrentWeek && (
            <Button
              variant="adminGhost"
              size="sm"
              onClick={goToCurrentWeek}
              className="ml-2 h-9 px-3"
            >
              Today
            </Button>
          )}
        </div>

        {/* Week Summary */}
        <div className="flex items-center gap-4 text-[13px] text-neutral-600">
          <span className="flex items-center gap-1.5">
            <Clock className="h-4 w-4 text-neutral-400" />
            {totalHours} hours this week
          </span>
          <span className="flex items-center gap-1.5">
            <Users className="h-4 w-4 text-neutral-400" />
            {slots.length} sessions
          </span>
        </div>
      </div>

      {/* Slot Type Legend */}
      <div className="flex flex-wrap gap-3 py-2">
        {(Object.keys(SLOT_TYPE_LABELS) as Array<keyof typeof SLOT_TYPE_LABELS>).map(
          (type) => (
            <div key={type} className="flex items-center gap-1.5">
              <div
                className={cn(
                  "h-3 w-3 rounded border",
                  SLOT_TYPE_COLORS[type]
                )}
              />
              <span className="text-xs text-neutral-600">
                {SLOT_TYPE_LABELS[type]}
              </span>
            </div>
          )
        )}
      </div>

      {/* Desktop Grid View */}
      <div className="hidden lg:block">
        <AdminCard padding={false} hover={false} className="overflow-x-auto">
          <div className="min-w-[800px]">
            {loading && (
              <div className="absolute inset-0 bg-white/60 flex items-center justify-center z-10 rounded-xl">
                <div className="flex items-center gap-2 text-neutral-500">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span className="text-sm">Loading...</span>
                </div>
              </div>
            )}

            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="w-24 p-3 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-500 border-b border-neutral-100">
                    Time
                  </th>
                  {DAYS_OF_WEEK.map((day) => (
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
              <tbody>
                {DEFAULT_TIME_SLOTS.map((timeSlot, rowIndex) => (
                  <tr
                    key={timeSlot.startTime}
                    className={cn(
                      rowIndex % 2 === 0 ? "bg-white" : "bg-neutral-50/50"
                    )}
                  >
                    <td className="p-3 text-sm font-medium text-neutral-600 border-r border-neutral-100 whitespace-nowrap">
                      {timeSlot.label}
                    </td>
                    {DAYS_OF_WEEK.map((day) => {
                      const cellSlots = getSlotsForCell(
                        day.dayOfWeek,
                        timeSlot.startTime
                      );
                      return (
                        <td
                          key={`${day.dayOfWeek}-${timeSlot.startTime}`}
                          className="p-2 border-r border-neutral-100 last:border-r-0 align-top min-h-[80px]"
                        >
                          <div className="space-y-1.5 min-h-[60px]">
                            {cellSlots.length > 0 ? (
                              cellSlots.map((slot) => (
                                <div
                                  key={slot.id}
                                  className={cn(
                                    "rounded-lg border p-2 text-xs",
                                    SLOT_TYPE_COLORS[slot.slotType]
                                  )}
                                >
                                  <div className="font-medium">
                                    {SLOT_TYPE_LABELS[slot.slotType]}
                                  </div>
                                  {slot.studentName && (
                                    <div className="mt-1 truncate">
                                      {slot.studentName}
                                    </div>
                                  )}
                                </div>
                              ))
                            ) : (
                              <div className="h-[60px] rounded-lg border border-dashed border-neutral-200 bg-neutral-50/50" />
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
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden space-y-4">
        {slots.length === 0 ? (
          <AdminCard hover={false}>
            <div className="text-center py-8">
              <Calendar className="mx-auto h-12 w-12 text-neutral-300" />
              <h3 className="mt-4 text-[15px] font-medium text-neutral-900">
                No sessions this week
              </h3>
              <p className="mt-1 text-[13px] text-neutral-500">
                You don&apos;t have any scheduled sessions for this week.
              </p>
            </div>
          </AdminCard>
        ) : (
          DAYS_OF_WEEK.map((day) => {
            const daySlots = slots.filter(
              (slot) => slot.dayOfWeek === day.dayOfWeek
            );
            if (daySlots.length === 0) return null;

            const dateStr = formatTimetableDate(weekStart, day.dayOfWeek);
            const today = new Date();
            const dayDate = new Date(weekStart);
            dayDate.setDate(dayDate.getDate() + (day.dayOfWeek - 1));
            const isToday = dayDate.toDateString() === today.toDateString();

            return (
              <div key={day.dayOfWeek}>
                <h3 className="text-sm font-semibold text-neutral-900 mb-2 flex items-center gap-2">
                  {day.name} - {dateStr}
                  {isToday && (
                    <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                      Today
                    </span>
                  )}
                </h3>
                <div className="space-y-2">
                  {daySlots
                    .sort((a, b) => a.startTime.localeCompare(b.startTime))
                    .map((slot) => (
                      <AdminCard key={slot.id} hover={false}>
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span
                                className={cn(
                                  "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                                  SLOT_TYPE_COLORS[slot.slotType]
                                )}
                              >
                                {SLOT_TYPE_LABELS[slot.slotType]}
                              </span>
                            </div>
                            {slot.studentName && (
                              <p className="mt-2 text-[13px] font-medium text-neutral-900">
                                {slot.studentName}
                              </p>
                            )}
                            <div className="mt-2 flex items-center gap-4 text-[13px] text-neutral-500">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3.5 w-3.5" />
                                {slot.startTime} - {slot.endTime}
                              </span>
                            </div>
                          </div>
                        </div>
                      </AdminCard>
                    ))}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
