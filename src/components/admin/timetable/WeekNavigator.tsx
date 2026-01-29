"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { getWeekStart, getWeekEnd } from "@/types/timetable";

interface WeekNavigatorProps {
  weekStart: string; // ISO date string "2026-01-27"
  onWeekChange: (newWeekStart: string) => void;
  className?: string;
}

/**
 * Navigate between weeks with previous/next buttons and jump to current week.
 * Displays the week range (e.g., "Jan 27 - Feb 2, 2026").
 */
export function WeekNavigator({
  weekStart,
  onWeekChange,
  className,
}: WeekNavigatorProps) {
  const weekStartDate = new Date(weekStart);
  const weekEndDate = new Date(weekStart);
  weekEndDate.setDate(weekEndDate.getDate() + 6);

  // Format the week range for display
  const formatDate = (date: Date, includeYear = false) => {
    const options: Intl.DateTimeFormatOptions = {
      month: "short",
      day: "numeric",
      ...(includeYear && { year: "numeric" }),
    };
    return date.toLocaleDateString("en-GB", options);
  };

  const startMonth = weekStartDate.getMonth();
  const endMonth = weekEndDate.getMonth();
  const startYear = weekStartDate.getFullYear();
  const endYear = weekEndDate.getFullYear();

  // Build the display string based on whether months/years differ
  let displayString: string;
  if (startYear !== endYear) {
    displayString = `${formatDate(weekStartDate, true)} - ${formatDate(weekEndDate, true)}`;
  } else if (startMonth !== endMonth) {
    displayString = `${formatDate(weekStartDate)} - ${formatDate(weekEndDate)}, ${endYear}`;
  } else {
    displayString = `${weekStartDate.getDate()} - ${formatDate(weekEndDate)}, ${endYear}`;
  }

  // Navigate to previous week
  const goToPreviousWeek = () => {
    const newDate = new Date(weekStart);
    newDate.setDate(newDate.getDate() - 7);
    onWeekChange(newDate.toISOString().split("T")[0]);
  };

  // Navigate to next week
  const goToNextWeek = () => {
    const newDate = new Date(weekStart);
    newDate.setDate(newDate.getDate() + 7);
    onWeekChange(newDate.toISOString().split("T")[0]);
  };

  // Jump to current week
  const goToCurrentWeek = () => {
    const currentWeekStart = getWeekStart(new Date());
    onWeekChange(currentWeekStart);
  };

  // Check if currently viewing the current week
  const isCurrentWeek = getWeekStart(new Date()) === weekStart;

  return (
    <div className={cn("flex items-center gap-3", className)}>
      {/* Previous Week Button */}
      <Button
        variant="adminSecondary"
        size="icon"
        onClick={goToPreviousWeek}
        className="h-9 w-9"
        title="Previous week"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      {/* Week Display */}
      <div className="flex items-center gap-2 min-w-[180px] justify-center">
        <Calendar className="h-4 w-4 text-neutral-400" />
        <span className="text-sm font-medium text-neutral-900">
          {displayString}
        </span>
      </div>

      {/* Next Week Button */}
      <Button
        variant="adminSecondary"
        size="icon"
        onClick={goToNextWeek}
        className="h-9 w-9"
        title="Next week"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>

      {/* Jump to Today Button */}
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
  );
}
