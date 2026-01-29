"use client";

import { AdminCard } from "@/components/admin/ui/admin-card";
import { AdminBadge } from "@/components/admin/ui/admin-badge";
import { ChallengeLeaderboardEntry } from "@/types/challenges";
import { Trophy, Medal, Award, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChallengeLeaderboardProps {
  entries: ChallengeLeaderboardEntry[];
  title?: string;
  showOneToOneCount?: boolean;
  loading?: boolean;
}

export function ChallengeLeaderboard({
  entries,
  title = "Leaderboard",
  showOneToOneCount = true,
  loading = false,
}: ChallengeLeaderboardProps) {
  if (loading) {
    return (
      <AdminCard hover={false}>
        <div className="flex items-center gap-2 mb-4">
          <Trophy className="h-5 w-5 text-amber-500" />
          <h3 className="text-sm font-semibold text-neutral-900">{title}</h3>
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="animate-pulse flex items-center gap-3">
              <div className="h-8 w-8 bg-neutral-100 rounded-full" />
              <div className="flex-1 h-4 bg-neutral-100 rounded" />
              <div className="h-4 w-8 bg-neutral-100 rounded" />
            </div>
          ))}
        </div>
      </AdminCard>
    );
  }

  if (entries.length === 0) {
    return (
      <AdminCard hover={false}>
        <div className="flex items-center gap-2 mb-4">
          <Trophy className="h-5 w-5 text-amber-500" />
          <h3 className="text-sm font-semibold text-neutral-900">{title}</h3>
        </div>
        <div className="text-center py-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-neutral-50 mx-auto mb-3">
            <TrendingUp className="h-6 w-6 text-neutral-300" />
          </div>
          <p className="text-[13px] text-neutral-500">
            No challenge winners yet
          </p>
        </div>
      </AdminCard>
    );
  }

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100">
            <Trophy className="h-4 w-4 text-amber-600" />
          </div>
        );
      case 2:
        return (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-200">
            <Medal className="h-4 w-4 text-neutral-600" />
          </div>
        );
      case 3:
        return (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100">
            <Medal className="h-4 w-4 text-orange-600" />
          </div>
        );
      default:
        return (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-100">
            <span className="text-[13px] font-semibold text-neutral-500">
              {rank}
            </span>
          </div>
        );
    }
  };

  return (
    <AdminCard hover={false}>
      <div className="flex items-center gap-2 mb-4">
        <Trophy className="h-5 w-5 text-amber-500" />
        <h3 className="text-sm font-semibold text-neutral-900">{title}</h3>
      </div>

      <div className="space-y-2">
        {entries.map((entry) => (
          <div
            key={entry.studentName}
            className={cn(
              "flex items-center gap-3 p-3 rounded-xl transition-colors",
              entry.rank === 1
                ? "bg-amber-50/50"
                : entry.rank <= 3
                ? "bg-neutral-50/50"
                : "hover:bg-neutral-50"
            )}
          >
            {getRankIcon(entry.rank)}

            <div className="flex-1 min-w-0">
              <p
                className={cn(
                  "text-sm truncate",
                  entry.rank === 1
                    ? "font-semibold text-neutral-900"
                    : "font-medium text-neutral-700"
                )}
              >
                {entry.studentName}
              </p>
              {entry.lastWin && (
                <p className="text-[11px] text-neutral-400 mt-0.5">
                  Last win: {entry.lastWin}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2">
              <AdminBadge
                variant={entry.rank === 1 ? "warning" : "neutral"}
                className={entry.rank === 1 ? "bg-amber-100 text-amber-700" : ""}
              >
                {entry.totalWins} {entry.totalWins === 1 ? "win" : "wins"}
              </AdminBadge>

              {showOneToOneCount && entry.oneToOneOfWeekCount > 0 && (
                <AdminBadge variant="info" className="bg-sky-50">
                  <Award className="h-3 w-3 mr-1" />
                  {entry.oneToOneOfWeekCount}
                </AdminBadge>
              )}
            </div>
          </div>
        ))}
      </div>
    </AdminCard>
  );
}
