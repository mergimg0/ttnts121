"use client";

import { useState } from "react";
import { AdminPageHeader } from "@/components/admin/ui/admin-page-header";
import { ViewModeTabs } from "./components/ViewModeTabs";
import { DailyView } from "./components/DailyView";
import { WeeklyView } from "./components/WeeklyView";
import { MonthlyView } from "./components/MonthlyView";
import { AnalyticsView } from "./components/AnalyticsView";
import { AttendanceViewMode } from "@/types/attendance";

export default function AttendancePage() {
  const [viewMode, setViewMode] = useState<AttendanceViewMode>("daily");
  const [selectedDate, setSelectedDate] = useState(() => {
    return new Date().toISOString().split("T")[0];
  });

  const renderView = () => {
    switch (viewMode) {
      case "daily":
        return (
          <DailyView
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
          />
        );
      case "weekly":
        return (
          <WeeklyView
            selectedDate={selectedDate}
            onDateChange={(date) => {
              setSelectedDate(date);
            }}
          />
        );
      case "monthly":
        return (
          <MonthlyView
            onNavigateToDay={(date) => {
              setSelectedDate(date);
              setViewMode("daily");
            }}
          />
        );
      case "analytics":
        return <AnalyticsView />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <AdminPageHeader
        title="Attendance"
        subtitle="Track daily session attendance"
      />

      {/* View Mode Tabs */}
      <ViewModeTabs activeMode={viewMode} onModeChange={setViewMode} />

      {/* View Content */}
      {renderView()}
    </div>
  );
}
