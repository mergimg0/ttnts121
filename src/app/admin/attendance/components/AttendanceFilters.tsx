"use client";

import { useEffect, useState } from "react";
import { AdminSelect } from "@/components/admin/ui/admin-select";
import { AdminCard } from "@/components/admin/ui/admin-card";
import { SessionType } from "@/types/attendance";

interface Coach {
  id: string;
  name: string;
}

export interface AttendanceFilterValues {
  sessionType: SessionType | "";
  coachId: string;
  location: string;
}

interface AttendanceFiltersProps {
  filters: AttendanceFilterValues;
  onFiltersChange: (filters: AttendanceFilterValues) => void;
}

const SESSION_TYPES = [
  { value: "", label: "All Sessions" },
  { value: "after-school", label: "After School Club" },
  { value: "group-session", label: "Group Development (GDS)" },
  { value: "one-to-one", label: "One-to-One (121)" },
  { value: "half-term", label: "Half Term Camp" },
  { value: "birthday-party", label: "Birthday Party" },
];

const LOCATIONS = [
  { value: "", label: "All Locations" },
  { value: "Marylebone", label: "Marylebone" },
  { value: "Paddington", label: "Paddington" },
  { value: "Westminster", label: "Westminster" },
  { value: "Maida Vale", label: "Maida Vale" },
  { value: "St John's Wood", label: "St John's Wood" },
];

export function AttendanceFilters({ filters, onFiltersChange }: AttendanceFiltersProps) {
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [loadingCoaches, setLoadingCoaches] = useState(true);

  useEffect(() => {
    fetchCoaches();
  }, []);

  const fetchCoaches = async () => {
    try {
      const response = await fetch("/api/admin/coaches?activeOnly=true");
      const data = await response.json();
      if (data.success) {
        setCoaches(data.data || []);
      }
    } catch (error) {
      console.error("Error fetching coaches:", error);
    } finally {
      setLoadingCoaches(false);
    }
  };

  const handleFilterChange = (key: keyof AttendanceFilterValues, value: string) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  };

  const coachOptions = [
    { value: "", label: loadingCoaches ? "Loading..." : "All Coaches" },
    ...coaches.map((coach) => ({
      value: coach.id,
      label: coach.name,
    })),
  ];

  return (
    <AdminCard>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <AdminSelect
          label="Session Type"
          value={filters.sessionType}
          onChange={(e) => handleFilterChange("sessionType", e.target.value)}
          options={SESSION_TYPES}
        />
        <AdminSelect
          label="Coach"
          value={filters.coachId}
          onChange={(e) => handleFilterChange("coachId", e.target.value)}
          options={coachOptions}
          disabled={loadingCoaches}
        />
        <AdminSelect
          label="Location"
          value={filters.location}
          onChange={(e) => handleFilterChange("location", e.target.value)}
          options={LOCATIONS}
        />
      </div>
    </AdminCard>
  );
}
