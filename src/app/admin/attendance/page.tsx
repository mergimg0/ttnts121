"use client";

import { useState } from "react";
import { AdminPageHeader } from "@/components/admin/ui/admin-page-header";
import { AdminCard } from "@/components/admin/ui/admin-card";
import { ViewModeTabs } from "./components/ViewModeTabs";
import { DailyView } from "./components/DailyView";
import { AttendanceViewMode } from "@/types/attendance";
import { Construction } from "lucide-react";

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
          <ComingSoonPlaceholder
            title="Weekly View"
            description="View attendance data aggregated by week with session type breakdown."
          />
        );
      case "monthly":
        return (
          <ComingSoonPlaceholder
            title="Monthly View"
            description="Calendar heatmap showing daily attendance rates for the month."
          />
        );
      case "analytics":
        return (
          <ComingSoonPlaceholder
            title="Analytics View"
            description="Attendance trends, patterns, and at-risk student identification."
          />
        );
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

// Placeholder component for coming soon views
function ComingSoonPlaceholder({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <AdminCard>
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-50 mb-4">
          <Construction className="h-8 w-8 text-amber-600" />
        </div>
        <h3 className="text-lg font-semibold text-neutral-900 mb-2">{title}</h3>
        <p className="text-sm text-neutral-500 max-w-md">{description}</p>
        <p className="text-xs text-neutral-400 mt-4">Coming soon</p>
      </div>
    </AdminCard>
  );
}
