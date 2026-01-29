"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AdminPageHeader } from "@/components/admin/ui/admin-page-header";
import { AdminSelect } from "@/components/admin/ui/admin-select";
import { AdminCard } from "@/components/admin/ui/admin-card";
import { toast } from "@/components/ui/toast";
import {
  HoursGrid,
  HoursList,
  LogHoursDialog,
  CoachSummaryStats,
} from "@/components/admin/coach-hours";
import type { LogHoursData } from "@/components/admin/coach-hours";
import {
  CoachMonthlySummary,
  CoachRate,
  CoachDayEntry,
  getMonthString,
} from "@/types/coach";
import {
  Loader2,
  Plus,
  Clock,
  ChevronLeft,
  ChevronRight,
  Settings,
  Download,
  LayoutGrid,
  List,
} from "lucide-react";

interface Coach {
  id: string;
  name: string;
  abbreviation: string;
  hourlyRate: number;
}

interface SummaryResponse {
  month: string;
  summaries: CoachMonthlySummary[];
  totals: {
    totalCoaches: number;
    totalHours: number;
    totalEarnings: number;
    totalBonuses: number;
    totalDeductions: number;
    totalNetPay: number;
    fullyVerified: number;
    partiallyVerified: number;
    unverified: number;
  };
}

export default function CoachHoursPage() {
  const [month, setMonth] = useState(() => getMonthString(new Date()));
  const [coachFilter, setCoachFilter] = useState<string>("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [loading, setLoading] = useState(true);
  const [summaryData, setSummaryData] = useState<SummaryResponse | null>(null);
  const [coaches, setCoaches] = useState<Coach[]>([]);

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogInitialData, setDialogInitialData] = useState<{
    id?: string;
    coachId: string;
    date: string;
    hoursWorked: number;
    breakdown?: CoachMonthlySummary["hoursBreakdown"];
    notes?: string;
  } | undefined>();
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedCoachId, setSelectedCoachId] = useState<string>("");

  // Fetch coaches with rates
  const fetchCoaches = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/coach-rates?activeOnly=true");
      const data = await response.json();
      if (data.success) {
        // Group by coach, take most recent rate
        const coachMap = new Map<string, Coach>();
        (data.data as CoachRate[]).forEach((rate) => {
          if (!coachMap.has(rate.coachId)) {
            coachMap.set(rate.coachId, {
              id: rate.coachId,
              name: rate.coachName,
              abbreviation: rate.coachName.substring(0, 2).toUpperCase(),
              hourlyRate: rate.hourlyRate,
            });
          }
        });
        setCoaches(Array.from(coachMap.values()));
      }
    } catch (error) {
      console.error("Error fetching coaches:", error);
    }
  }, []);

  // Fetch hours summary
  const fetchSummary = useCallback(async () => {
    setLoading(true);
    try {
      const url = new URL("/api/admin/coach-hours/summary", window.location.origin);
      url.searchParams.set("month", month);
      if (coachFilter) {
        url.searchParams.set("coachId", coachFilter);
      }

      const response = await fetch(url.toString());
      const data = await response.json();

      if (data.success) {
        setSummaryData(data.data);
      } else {
        toast(data.error || "Failed to fetch hours summary", "error");
      }
    } catch (error) {
      console.error("Error fetching summary:", error);
      toast("Failed to fetch hours summary", "error");
    } finally {
      setLoading(false);
    }
  }, [month, coachFilter]);

  useEffect(() => {
    fetchCoaches();
  }, [fetchCoaches]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  // Month navigation
  const navigateMonth = (direction: "prev" | "next") => {
    const [year, monthNum] = month.split("-").map(Number);
    let newYear = year;
    let newMonth = monthNum;

    if (direction === "prev") {
      newMonth--;
      if (newMonth < 1) {
        newMonth = 12;
        newYear--;
      }
    } else {
      newMonth++;
      if (newMonth > 12) {
        newMonth = 1;
        newYear++;
      }
    }

    setMonth(`${newYear}-${newMonth.toString().padStart(2, "0")}`);
  };

  const getMonthLabel = () => {
    const [year, monthNum] = month.split("-").map(Number);
    const date = new Date(year, monthNum - 1);
    return date.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
  };

  // Handle cell click in grid
  const handleCellClick = (
    coachId: string,
    coachName: string,
    date: string,
    entry?: CoachDayEntry
  ) => {
    setSelectedCoachId(coachId);
    setSelectedDate(date);

    if (entry && entry.hours > 0) {
      // Editing existing entry - need to fetch full data
      setDialogInitialData({
        coachId,
        date,
        hoursWorked: entry.hours,
        breakdown: entry.breakdown,
        notes: entry.notes,
      });
    } else {
      // New entry
      setDialogInitialData(undefined);
    }

    setDialogOpen(true);
  };

  // Handle coach click in list view
  const handleCoachClick = (coachId: string) => {
    setCoachFilter(coachId);
  };

  // Handle log hours submission
  const handleLogHours = async (data: LogHoursData) => {
    try {
      const url = data.id
        ? `/api/admin/coach-hours/${data.id}`
        : "/api/admin/coach-hours";
      const method = data.id ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          coachId: data.coachId,
          coachName: data.coachName,
          date: data.date,
          hoursWorked: data.hoursWorked,
          hourlyRate: data.hourlyRate,
          breakdown: data.breakdown,
          notes: data.notes,
          bonusPay: data.bonusPay,
          deductions: data.deductions,
          deductionReason: data.deductionReason,
          loggedBy: "admin", // TODO: Get actual user ID
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast(data.id ? "Hours updated" : "Hours logged", "success");
        fetchSummary(); // Refresh data
      } else {
        toast(result.error || "Failed to save hours", "error");
      }
    } catch (error) {
      console.error("Error saving hours:", error);
      toast("Failed to save hours", "error");
      throw error;
    }
  };

  // Generate month options (current month and 12 months back)
  const monthOptions = [];
  const today = new Date();
  for (let i = 0; i < 13; i++) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const value = getMonthString(d);
    const label = d.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
    monthOptions.push({ value, label });
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <AdminPageHeader
        title="Coach Hours"
        subtitle="Track and manage coach working hours"
      >
        <div className="flex items-center gap-2">
          <Button variant="adminSecondary" asChild>
            <Link href="/admin/coach-hours/rates">
              <Settings className="mr-2 h-4 w-4" />
              Rates
            </Link>
          </Button>
          <Button
            variant="adminPrimary"
            onClick={() => {
              setSelectedCoachId("");
              setSelectedDate("");
              setDialogInitialData(undefined);
              setDialogOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Log Hours
          </Button>
        </div>
      </AdminPageHeader>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        {/* Month Navigation */}
        <div className="flex items-center gap-2">
          <Button
            variant="adminSecondary"
            size="icon"
            onClick={() => navigateMonth("prev")}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-[180px]">
            <AdminSelect
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              options={monthOptions}
            />
          </div>
          <Button
            variant="adminSecondary"
            size="icon"
            onClick={() => navigateMonth("next")}
            disabled={month === getMonthString(new Date())}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-3">
          {/* Coach Filter */}
          <div className="min-w-[160px]">
            <AdminSelect
              value={coachFilter}
              onChange={(e) => setCoachFilter(e.target.value)}
              placeholder="All Coaches"
            >
              <option value="">All Coaches</option>
              {coaches.map((coach) => (
                <option key={coach.id} value={coach.id}>
                  {coach.name}
                </option>
              ))}
            </AdminSelect>
          </div>

          {/* View Toggle */}
          <div className="hidden sm:flex items-center border border-neutral-200 rounded-xl overflow-hidden">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2.5 transition-colors ${
                viewMode === "grid"
                  ? "bg-sky-100 text-sky-600"
                  : "text-neutral-400 hover:text-neutral-600"
              }`}
              title="Grid view"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2.5 transition-colors ${
                viewMode === "list"
                  ? "bg-sky-100 text-sky-600"
                  : "text-neutral-400 hover:text-neutral-600"
              }`}
              title="List view"
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <CoachSummaryStats
        totalCoaches={summaryData?.totals.totalCoaches || 0}
        totalHours={summaryData?.totals.totalHours || 0}
        totalEarnings={summaryData?.totals.totalEarnings || 0}
        fullyVerified={summaryData?.totals.fullyVerified || 0}
        loading={loading}
      />

      {/* Hours Grid/List */}
      {loading ? (
        <AdminCard hover={false}>
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
          </div>
        </AdminCard>
      ) : !summaryData || summaryData.summaries.length === 0 ? (
        <AdminCard hover={false}>
          <div className="text-center py-12">
            <div className="mx-auto h-14 w-14 rounded-full bg-neutral-50 flex items-center justify-center">
              <Clock className="h-7 w-7 text-neutral-400" />
            </div>
            <h3 className="mt-4 text-sm font-medium text-neutral-900">
              No hours logged
            </h3>
            <p className="mt-1 text-sm text-neutral-500">
              No hours have been logged for {getMonthLabel()}.
            </p>
            <Button
              variant="adminPrimary"
              className="mt-4"
              onClick={() => {
                setSelectedCoachId("");
                setSelectedDate("");
                setDialogInitialData(undefined);
                setDialogOpen(true);
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Log Hours
            </Button>
          </div>
        </AdminCard>
      ) : viewMode === "grid" ? (
        <div className="hidden sm:block">
          <HoursGrid
            month={month}
            summaries={summaryData.summaries}
            onCellClick={handleCellClick}
          />
        </div>
      ) : null}

      {/* Mobile/List View */}
      {!loading && summaryData && summaryData.summaries.length > 0 && (
        <div className={viewMode === "list" ? "block" : "sm:hidden"}>
          <HoursList
            summaries={summaryData.summaries}
            onCoachClick={handleCoachClick}
          />
        </div>
      )}

      {/* Log Hours Dialog */}
      <LogHoursDialog
        isOpen={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setDialogInitialData(undefined);
          setSelectedCoachId("");
          setSelectedDate("");
        }}
        onSubmit={handleLogHours}
        coaches={coaches}
        initialData={dialogInitialData}
        selectedDate={selectedDate}
        selectedCoachId={selectedCoachId}
      />
    </div>
  );
}
