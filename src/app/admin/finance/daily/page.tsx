"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { AdminCard } from "@/components/admin/ui/admin-card";
import { AdminPageHeader } from "@/components/admin/ui/admin-page-header";
import { AdminInput } from "@/components/admin/ui/admin-input";
import { DailyEntryForm } from "@/components/admin/finance/DailyEntryForm";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import {
  DailyFinancial,
  IncomeBreakdown,
  ExpenseBreakdown,
  formatFinancialAmount,
} from "@/types/financials";

function DailyEntryPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get date from URL or use today
  const urlDate = searchParams.get("date");
  const today = new Date().toISOString().split("T")[0];
  const [selectedDate, setSelectedDate] = useState(urlDate || today);

  const [existingData, setExistingData] = useState<DailyFinancial | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Fetch data for selected date
  const fetchDailyData = useCallback(async (date: string) => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const response = await fetch(`/api/admin/finance/daily?date=${date}`);
      const data = await response.json();

      if (data.success) {
        setExistingData(data.data);
      } else if (response.status === 404) {
        // No entry for this date - that's OK
        setExistingData(null);
      } else {
        setError(data.error || "Failed to load data");
      }
    } catch (err) {
      console.error("Failed to fetch daily data:", err);
      setError("Failed to connect to server");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDailyData(selectedDate);
  }, [selectedDate, fetchDailyData]);

  // Handle date change
  const handleDateChange = (newDate: string) => {
    setSelectedDate(newDate);
    router.push(`/admin/finance/daily?date=${newDate}`);
  };

  // Navigate to previous/next day
  const navigateDay = (direction: "prev" | "next") => {
    const current = new Date(selectedDate);
    current.setDate(current.getDate() + (direction === "next" ? 1 : -1));
    const newDate = current.toISOString().split("T")[0];
    handleDateChange(newDate);
  };

  // Handle save
  const handleSave = async (data: {
    income: Omit<IncomeBreakdown, "total">;
    expenses: Omit<ExpenseBreakdown, "total">;
    notes?: string;
  }) => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const method = existingData ? "PUT" : "POST";
      const response = await fetch("/api/admin/finance/daily", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: selectedDate,
          ...data,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setSuccess(existingData ? "Entry updated successfully" : "Entry saved successfully");
        setExistingData(result.data);
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(result.error || "Failed to save entry");
      }
    } catch (err) {
      console.error("Failed to save:", err);
      setError("Failed to save entry");
    } finally {
      setSaving(false);
    }
  };

  // Handle copy from previous day
  const handleCopyFromPrevious = async (): Promise<DailyFinancial | null> => {
    try {
      const previousDate = new Date(selectedDate);
      previousDate.setDate(previousDate.getDate() - 1);
      const prevDateStr = previousDate.toISOString().split("T")[0];

      const response = await fetch(`/api/admin/finance/daily?date=${prevDateStr}`);
      const data = await response.json();

      if (data.success && data.data) {
        return data.data;
      }
      return null;
    } catch (err) {
      console.error("Failed to fetch previous day:", err);
      return null;
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <AdminPageHeader
        title="Daily Entry"
        subtitle="Log income and expenses for a specific day"
      >
        <Button variant="outline" asChild>
          <Link href="/admin/finance">Back to Finance</Link>
        </Button>
      </AdminPageHeader>

      {/* Date Navigation */}
      <AdminCard hover={false}>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateDay("prev")}
            className="w-full sm:w-auto"
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            Previous Day
          </Button>

          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-neutral-400" />
            <AdminInput
              type="date"
              value={selectedDate}
              onChange={(e) => handleDateChange(e.target.value)}
              max={today}
              className="w-auto"
            />
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateDay("next")}
            disabled={selectedDate >= today}
            className="w-full sm:w-auto"
          >
            Next Day
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      </AdminCard>

      {/* Status Messages */}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
          <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
          <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0" />
          <p className="text-sm text-emerald-700">{success}</p>
        </div>
      )}

      {/* Entry Form */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
        </div>
      ) : (
        <DailyEntryForm
          date={selectedDate}
          existingData={existingData}
          onSave={handleSave}
          onCopyFromPrevious={handleCopyFromPrevious}
          loading={saving}
        />
      )}

      {/* Quick Navigation */}
      <AdminCard hover={false}>
        <h3 className="text-[13px] font-semibold uppercase tracking-wider text-neutral-500 mb-4">
          Quick Jump
        </h3>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleDateChange(today)}
            className={selectedDate === today ? "bg-sky-50 border-sky-300" : ""}
          >
            Today
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const yesterday = new Date();
              yesterday.setDate(yesterday.getDate() - 1);
              handleDateChange(yesterday.toISOString().split("T")[0]);
            }}
          >
            Yesterday
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const lastWeek = new Date();
              lastWeek.setDate(lastWeek.getDate() - 7);
              handleDateChange(lastWeek.toISOString().split("T")[0]);
            }}
          >
            Last Week
          </Button>
        </div>
      </AdminCard>
    </div>
  );
}

export default function DailyEntryPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
      </div>
    }>
      <DailyEntryPageContent />
    </Suspense>
  );
}
