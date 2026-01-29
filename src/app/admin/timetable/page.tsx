"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { TableSkeleton } from "@/components/ui/skeleton";
import { AdminPageHeader } from "@/components/admin/ui/admin-page-header";
import { AdminCard } from "@/components/admin/ui/admin-card";
import { AdminEmptyState } from "@/components/admin/ui/admin-empty-state";
import { StatsCard } from "@/components/admin/stats-card";
import { TimetableGrid } from "@/components/admin/timetable/TimetableGrid";
import {
  TimetableSlot,
  TimetableTemplate,
  CreateTimetableSlotInput,
  UpdateTimetableSlotInput,
  getWeekStart,
} from "@/types/timetable";
import {
  Calendar,
  Users,
  Clock,
  CheckCircle,
  LayoutTemplate,
  UserPlus,
  AlertCircle,
  PlayCircle,
} from "lucide-react";

interface Coach {
  id: string;
  name: string;
}

// Mock coaches for now - in production, fetch from API
const MOCK_COACHES: Coach[] = [
  { id: "coach-val", name: "Val" },
  { id: "coach-ciaran", name: "Ciaran" },
  { id: "coach-tom", name: "Tom" },
  { id: "coach-mike", name: "Mike" },
];

export default function TimetablePage() {
  // State
  const [weekStart, setWeekStart] = useState<string>(() => getWeekStart(new Date()));
  const [slots, setSlots] = useState<TimetableSlot[]>([]);
  const [templates, setTemplates] = useState<TimetableTemplate[]>([]);
  const [coaches] = useState<Coach[]>(MOCK_COACHES);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [applyingTemplate, setApplyingTemplate] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");

  // Fetch slots for the current week
  const fetchSlots = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/admin/timetable?weekStart=${weekStart}`);
      const data = await response.json();
      if (data.success) {
        setSlots(data.data);
      } else {
        setError(data.error || "Failed to fetch timetable slots");
      }
    } catch (err) {
      console.error("Error fetching timetable slots:", err);
      setError("Failed to fetch timetable slots");
    } finally {
      setLoading(false);
    }
  }, [weekStart]);

  // Fetch templates
  const fetchTemplates = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/timetable/templates?activeOnly=true");
      const data = await response.json();
      if (data.success) {
        setTemplates(data.data);
        if (data.data.length > 0 && !selectedTemplateId) {
          setSelectedTemplateId(data.data[0].id);
        }
      }
    } catch (err) {
      console.error("Error fetching templates:", err);
    }
  }, [selectedTemplateId]);

  useEffect(() => {
    fetchSlots();
  }, [fetchSlots]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  // Handle week change
  const handleWeekChange = (newWeekStart: string) => {
    setWeekStart(newWeekStart);
  };

  // Handle slot creation
  const handleSlotCreate = async (data: CreateTimetableSlotInput) => {
    try {
      const response = await fetch("/api/admin/timetable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (result.success) {
        await fetchSlots();
      } else {
        throw new Error(result.error || "Failed to create slot");
      }
    } catch (err) {
      console.error("Error creating slot:", err);
      throw err;
    }
  };

  // Handle slot update
  const handleSlotUpdate = async (slotId: string, data: UpdateTimetableSlotInput) => {
    try {
      const response = await fetch(`/api/admin/timetable/${slotId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (result.success) {
        await fetchSlots();
      } else {
        throw new Error(result.error || "Failed to update slot");
      }
    } catch (err) {
      console.error("Error updating slot:", err);
      throw err;
    }
  };

  // Handle slot deletion
  const handleSlotDelete = async (slotId: string) => {
    try {
      const response = await fetch(`/api/admin/timetable/${slotId}`, {
        method: "DELETE",
      });
      const result = await response.json();
      if (result.success) {
        await fetchSlots();
      } else {
        throw new Error(result.error || "Failed to delete slot");
      }
    } catch (err) {
      console.error("Error deleting slot:", err);
      throw err;
    }
  };

  // Handle template application
  const handleApplyTemplate = async () => {
    if (!selectedTemplateId) return;

    const confirmed = window.confirm(
      `Apply template to week starting ${weekStart}?\n\nThis will create new slots from the template.`
    );
    if (!confirmed) return;

    try {
      setApplyingTemplate(true);
      const response = await fetch(`/api/admin/timetable/templates/${selectedTemplateId}/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          weekStart,
          overwriteExisting: false,
        }),
      });
      const result = await response.json();
      if (result.success) {
        await fetchSlots();
      } else {
        alert(result.error || "Failed to apply template");
      }
    } catch (err) {
      console.error("Error applying template:", err);
      alert("Failed to apply template");
    } finally {
      setApplyingTemplate(false);
    }
  };

  // Calculate stats
  const totalSlots = slots.length;
  const bookedSlots = slots.filter((s) => s.slotType !== "AVAILABLE").length;
  const availableSlots = slots.filter((s) => s.slotType === "AVAILABLE").length;
  const gdsSlots = slots.filter((s) => s.slotType === "GDS").length;

  if (loading && slots.length === 0) {
    return (
      <div className="space-y-8">
        <AdminPageHeader
          title="Timetable"
          subtitle="Loading..."
        />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 bg-white rounded-xl border border-neutral-200/60 animate-pulse" />
          ))}
        </div>
        <TableSkeleton rows={6} columns={7} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <AdminPageHeader
        title="Timetable"
        subtitle={`Week of ${new Date(weekStart).toLocaleDateString("en-GB", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })}`}
      >
        <div className="flex items-center gap-3">
          <Button variant="adminSecondary" asChild>
            <Link href="/admin/timetable/waiting-list">
              <UserPlus className="mr-2 h-4 w-4" />
              Waiting List
            </Link>
          </Button>
          <Button variant="adminSecondary" asChild>
            <Link href="/admin/timetable/templates">
              <LayoutTemplate className="mr-2 h-4 w-4" />
              Templates
            </Link>
          </Button>
        </div>
      </AdminPageHeader>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Slots"
          value={totalSlots}
          description="this week"
          icon={Calendar}
        />
        <StatsCard
          title="Booked"
          value={bookedSlots}
          description={`${totalSlots > 0 ? Math.round((bookedSlots / totalSlots) * 100) : 0}% filled`}
          icon={CheckCircle}
        />
        <StatsCard
          title="Available"
          value={availableSlots}
          description="open slots"
          icon={Clock}
        />
        <StatsCard
          title="GDS Sessions"
          value={gdsSlots}
          description="group sessions"
          icon={Users}
        />
      </div>

      {/* Template Quick Apply */}
      {templates.length > 0 && (
        <AdminCard hover={false} className="bg-gradient-to-r from-sky-50/50 to-transparent">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-100">
                <LayoutTemplate className="h-5 w-5 text-sky-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-neutral-900">
                  Apply Template
                </h3>
                <p className="text-xs text-neutral-500">
                  Quickly populate this week from a saved template
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={selectedTemplateId}
                onChange={(e) => setSelectedTemplateId(e.target.value)}
                className="h-10 rounded-xl border border-neutral-200 bg-white px-3 text-sm focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none"
              >
                {templates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </select>
              <Button
                variant="adminPrimary"
                onClick={handleApplyTemplate}
                disabled={applyingTemplate || !selectedTemplateId}
              >
                <PlayCircle className="mr-2 h-4 w-4" />
                {applyingTemplate ? "Applying..." : "Apply"}
              </Button>
            </div>
          </div>
        </AdminCard>
      )}

      {/* Error State */}
      {error && (
        <AdminCard hover={false} className="bg-red-50 border-red-200">
          <div className="flex items-center gap-3 text-red-700">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <p className="text-sm">{error}</p>
            <Button
              variant="adminSecondary"
              size="sm"
              onClick={fetchSlots}
              className="ml-auto"
            >
              Retry
            </Button>
          </div>
        </AdminCard>
      )}

      {/* Timetable Grid */}
      <TimetableGrid
        weekStart={weekStart}
        slots={slots}
        coaches={coaches}
        onWeekChange={handleWeekChange}
        onSlotCreate={handleSlotCreate}
        onSlotUpdate={handleSlotUpdate}
        onSlotDelete={handleSlotDelete}
        isLoading={loading}
      />

      {/* Empty State for no slots */}
      {!loading && slots.length === 0 && !error && (
        <AdminEmptyState
          icon={Calendar}
          title="No slots for this week"
          description="Create individual slots or apply a template to populate this week's timetable."
          action={
            templates.length > 0 && (
              <Button variant="adminPrimary" onClick={handleApplyTemplate}>
                <PlayCircle className="mr-2 h-4 w-4" />
                Apply Template
              </Button>
            )
          }
        />
      )}
    </div>
  );
}
