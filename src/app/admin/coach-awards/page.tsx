"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { AdminPageHeader } from "@/components/admin/ui/admin-page-header";
import { AdminEmptyState } from "@/components/admin/ui/admin-empty-state";
import { AdminSelect } from "@/components/admin/ui/admin-select";
import { CoachAwardCard, AddAwardDialog } from "@/components/admin/coach-awards";
import { Button } from "@/components/ui/button";
import { CoachAward } from "@/types/coach";
import { Plus, Trophy, Loader2 } from "lucide-react";
import { ConfirmDialog } from "@/components/admin/ui/confirm-dialog";

const YEARS = Array.from({ length: 5 }, (_, i) => {
  const year = new Date().getFullYear() - i;
  return { value: String(year), label: String(year) };
});

const AWARD_TYPES = [
  { value: "all", label: "All Awards" },
  { value: "coach_of_month", label: "Coach of the Month" },
  { value: "employee_of_month", label: "Employee of the Month" },
];

export default function CoachAwardsPage() {
  const [awards, setAwards] = useState<CoachAward[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [awardType, setAwardType] = useState("all");

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAward, setEditingAward] = useState<CoachAward | null>(null);
  const [awardToDelete, setAwardToDelete] = useState<string | null>(null);
  const deleteButtonRef = useRef<HTMLButtonElement>(null);

  // Fetch awards
  const fetchAwards = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.set("year", year);
      if (awardType !== "all") {
        params.set("awardType", awardType);
      }

      const response = await fetch(`/api/admin/coach-awards?${params}`);
      const data = await response.json();

      if (data.success) {
        setAwards(data.data || []);
      } else {
        setError(data.error || "Failed to load awards");
      }
    } catch (err) {
      console.error("Error fetching awards:", err);
      setError("Failed to load awards");
    } finally {
      setLoading(false);
    }
  }, [year, awardType]);

  useEffect(() => {
    fetchAwards();
  }, [fetchAwards]);

  // Handle save (create or update)
  const handleSave = async (data: Partial<CoachAward>) => {
    const isEdit = !!data.id;
    const url = isEdit
      ? `/api/admin/coach-awards/${data.id}`
      : "/api/admin/coach-awards";
    const method = isEdit ? "PATCH" : "POST";

    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error);
    }

    fetchAwards();
  };

  // Handle edit
  const handleEdit = (award: CoachAward) => {
    setEditingAward(award);
    setDialogOpen(true);
  };

  // Handle delete
  const handleDelete = async () => {
    if (!awardToDelete) return;

    try {
      const response = await fetch(`/api/admin/coach-awards/${awardToDelete}`, {
        method: "DELETE",
      });
      const result = await response.json();
      if (result.success) {
        fetchAwards();
      }
    } catch (err) {
      console.error("Error deleting award:", err);
    } finally {
      setAwardToDelete(null);
    }
  };

  // Open add dialog
  const handleAdd = () => {
    setEditingAward(null);
    setDialogOpen(true);
  };

  // Trigger delete confirmation
  const handleDeleteClick = (awardId: string) => {
    setAwardToDelete(awardId);
    // Programmatically click the hidden delete trigger
    setTimeout(() => deleteButtonRef.current?.click(), 0);
  };

  // Group awards by month
  const awardsByMonth = awards.reduce((acc, award) => {
    if (!acc[award.month]) {
      acc[award.month] = [];
    }
    acc[award.month].push(award);
    return acc;
  }, {} as Record<string, CoachAward[]>);

  const sortedMonths = Object.keys(awardsByMonth).sort().reverse();

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Coach Awards"
        subtitle="Recognize outstanding performance with monthly awards"
      >
        <Button onClick={handleAdd} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Award
        </Button>
      </AdminPageHeader>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="w-32">
          <AdminSelect
            value={year}
            onChange={(e) => setYear(e.target.value)}
            options={YEARS}
          />
        </div>

        <div className="w-48">
          <AdminSelect
            value={awardType}
            onChange={(e) => setAwardType(e.target.value)}
            options={AWARD_TYPES}
          />
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
        </div>
      ) : error ? (
        <div className="text-center py-12 text-red-500">{error}</div>
      ) : awards.length === 0 ? (
        <AdminEmptyState
          icon={Trophy}
          title="No awards yet"
          description={`No awards found for ${year}. Add your first award to recognize outstanding coaches.`}
          action={
            <Button onClick={handleAdd} className="gap-2">
              <Plus className="h-4 w-4" />
              Add First Award
            </Button>
          }
        />
      ) : (
        <div className="space-y-8">
          {sortedMonths.map((month) => {
            const monthDate = new Date(month + "-01");
            const monthLabel = monthDate.toLocaleDateString("en-GB", {
              month: "long",
              year: "numeric",
            });

            return (
              <div key={month}>
                <h2 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-amber-500" />
                  {monthLabel}
                </h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {awardsByMonth[month].map((award) => (
                    <CoachAwardCard
                      key={award.id}
                      award={award}
                      onEdit={handleEdit}
                      onDelete={handleDeleteClick}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <AddAwardDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        award={editingAward}
        onSave={handleSave}
      />

      {/* Delete Confirmation - Hidden trigger */}
      <ConfirmDialog
        trigger={
          <button ref={deleteButtonRef} className="hidden" aria-hidden="true" />
        }
        title="Delete Award"
        description="Are you sure you want to delete this award? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
        onConfirm={handleDelete}
      />
    </div>
  );
}
