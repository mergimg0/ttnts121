"use client";

import { useState } from "react";
import { AdminCard } from "@/components/admin/ui/admin-card";
import { AdminInput } from "@/components/admin/ui/admin-input";
import { AdminBadge } from "@/components/admin/ui/admin-badge";
import { Button } from "@/components/ui/button";
import {
  ChallengeType,
  ChallengeResult,
  CHALLENGE_TYPE_LABELS,
} from "@/types/challenges";
import {
  Target,
  Goal,
  Flag,
  Trophy,
  Star,
  Zap,
  CircleDot,
  Hand,
  Wind,
  Sparkles,
  Crown,
  Save,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Map challenge types to icons
const CHALLENGE_ICONS: Record<ChallengeType, React.ElementType> = {
  crossbar: Goal,
  pass_through_gates: Flag,
  just_net: Target,
  corner: Flag,
  footgolf: CircleDot,
  coaches_challenge: Star,
  first_touch_box: Hand,
  first_touch_air: Wind,
  dizzy_penalty: Sparkles,
  free_kick: Zap,
  woodwork: Goal,
  goalkeeper: Hand,
  top_bins: Target,
  custom: Crown,
};

interface ChallengeCardProps {
  challengeType: ChallengeType;
  result?: ChallengeResult;
  previousWinners?: Array<{ name: string; date: string; score?: string }>;
  onSave: (result: ChallengeResult) => void;
  saving?: boolean;
}

export function ChallengeCard({
  challengeType,
  result,
  previousWinners = [],
  onSave,
  saving = false,
}: ChallengeCardProps) {
  const [winnerName, setWinnerName] = useState(result?.winnerName || "");
  const [score, setScore] = useState(result?.winnerScore?.toString() || "");
  const [notes, setNotes] = useState(result?.notes || "");
  const [showHistory, setShowHistory] = useState(false);

  const Icon = CHALLENGE_ICONS[challengeType] || Trophy;
  const label = CHALLENGE_TYPE_LABELS[challengeType];
  const hasWinner = !!result?.winnerName;
  const hasChanges =
    winnerName !== (result?.winnerName || "") ||
    score !== (result?.winnerScore?.toString() || "") ||
    notes !== (result?.notes || "");

  const handleSave = () => {
    onSave({
      challengeType,
      challengeName: label,
      winnerName: winnerName.trim() || undefined,
      winnerScore: score.trim() || undefined,
      notes: notes.trim() || undefined,
    });
  };

  return (
    <AdminCard className="relative" hover={false}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-xl",
            hasWinner
              ? "bg-emerald-50 text-emerald-600"
              : "bg-neutral-100 text-neutral-400"
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-neutral-900">{label}</h3>
          {hasWinner && (
            <AdminBadge variant="success" className="mt-1">
              Winner Recorded
            </AdminBadge>
          )}
        </div>
      </div>

      {/* Form Fields */}
      <div className="space-y-3">
        <AdminInput
          label="Winner Name"
          placeholder="Enter winner's name"
          value={winnerName}
          onChange={(e) => setWinnerName(e.target.value)}
        />
        <AdminInput
          label="Score (optional)"
          placeholder="e.g., 3/5, 15 seconds"
          value={score}
          onChange={(e) => setScore(e.target.value)}
        />
        <AdminInput
          label="Notes (optional)"
          placeholder="Any additional details"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      {/* Save Button */}
      {hasChanges && (
        <div className="mt-4">
          <Button
            variant="adminPrimary"
            size="sm"
            onClick={handleSave}
            disabled={saving}
            className="w-full"
          >
            <Save className="h-4 w-4" />
            {saving ? "Saving..." : "Save Winner"}
          </Button>
        </div>
      )}

      {/* Previous Winners Toggle */}
      {previousWinners.length > 0 && (
        <div className="mt-4 pt-4 border-t border-neutral-100">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center justify-between w-full text-left text-[13px] font-medium text-neutral-500 hover:text-neutral-700 transition-colors"
          >
            <span>Previous Winners ({previousWinners.length})</span>
            {showHistory ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>

          {showHistory && (
            <div className="mt-3 space-y-2">
              {previousWinners.slice(0, 5).map((winner, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between text-[13px]"
                >
                  <span className="text-neutral-700">{winner.name}</span>
                  <span className="text-neutral-400">
                    {winner.score && `${winner.score} - `}
                    {winner.date}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </AdminCard>
  );
}
