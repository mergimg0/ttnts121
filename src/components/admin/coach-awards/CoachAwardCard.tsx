"use client";

import { CoachAward, CoachAwardType, COACH_AWARD_PRIZES } from "@/types/coach";
import { AdminCard } from "@/components/admin/ui/admin-card";
import { AdminBadge } from "@/components/admin/ui/admin-badge";
import { Button } from "@/components/ui/button";
import { Trophy, Award, Pencil, Trash2 } from "lucide-react";

interface CoachAwardCardProps {
  award: CoachAward;
  onEdit: (award: CoachAward) => void;
  onDelete: (awardId: string) => void;
}

const AWARD_TYPE_LABELS: Record<CoachAwardType, string> = {
  coach_of_month: "Coach of the Month",
  employee_of_month: "Employee of the Month",
};

const AWARD_TYPE_COLORS: Record<CoachAwardType, "gold" | "purple"> = {
  coach_of_month: "gold",
  employee_of_month: "purple",
};

function formatMonth(month: string): string {
  const [year, monthNum] = month.split("-");
  const date = new Date(parseInt(year), parseInt(monthNum) - 1);
  return date.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
}

function formatCurrency(pence: number): string {
  return `£${(pence / 100).toFixed(2)}`;
}

export function CoachAwardCard({ award, onEdit, onDelete }: CoachAwardCardProps) {
  const prizeAmount = award.prize ?? COACH_AWARD_PRIZES[award.awardType];
  const badgeColor = AWARD_TYPE_COLORS[award.awardType];

  return (
    <AdminCard className="relative overflow-hidden">
      {/* Award icon background */}
      <div className="absolute top-0 right-0 opacity-5">
        <Trophy className="w-32 h-32 -mt-4 -mr-4" />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-50">
              {award.awardType === "coach_of_month" ? (
                <Trophy className="w-5 h-5 text-amber-600" />
              ) : (
                <Award className="w-5 h-5 text-purple-600" />
              )}
            </div>
            <div>
              <p className="text-xs text-neutral-500 uppercase tracking-wide">
                {formatMonth(award.month)}
              </p>
              <AdminBadge
                variant={badgeColor === "gold" ? "warning" : "info"}
                className="mt-1"
              >
                {AWARD_TYPE_LABELS[award.awardType]}
              </AdminBadge>
            </div>
          </div>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(award)}
              className="h-8 w-8 p-0"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(award.id)}
              className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Coach name */}
        <h3 className="text-xl font-bold text-neutral-900 mb-2">
          {award.coachName}
        </h3>

        {/* Prize */}
        <div className="flex items-baseline gap-2 mb-3">
          <span className="text-2xl font-black text-emerald-600">
            {formatCurrency(prizeAmount)}
          </span>
          <span className="text-sm text-neutral-500">prize</span>
        </div>

        {/* Reason */}
        {award.reason && (
          <p className="text-sm text-neutral-600 bg-neutral-50 rounded-lg p-3 mb-3">
            "{award.reason}"
          </p>
        )}

        {/* Nominated by */}
        {award.nominatedBy && (
          <p className="text-xs text-neutral-500">
            Nominated by: {award.nominatedBy}
          </p>
        )}
      </div>
    </AdminCard>
  );
}
