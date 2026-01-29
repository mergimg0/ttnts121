"use client";

import { useEffect, useState, useCallback } from "react";
import { AdminPageHeader } from "@/components/admin/ui/admin-page-header";
import { AdminBadge } from "@/components/admin/ui/admin-badge";
import { AdminEmptyState } from "@/components/admin/ui/admin-empty-state";
import { ChallengeCard } from "@/components/admin/challenges/ChallengeCard";
import { OneToOneOfWeekCard } from "@/components/admin/challenges/OneToOneOfWeekCard";
import { ChallengeLeaderboard } from "@/components/admin/challenges/ChallengeLeaderboard";
import { Button } from "@/components/ui/button";
import {
  WeeklyChallenge,
  ChallengeType,
  ChallengeResult,
  OneToOneOfWeekAward,
  ChallengeLeaderboardEntry,
} from "@/types/challenges";
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Pause,
  Play,
  RotateCcw,
  AlertCircle,
} from "lucide-react";

// Challenge types to display by default
const DEFAULT_CHALLENGES: ChallengeType[] = [
  "crossbar",
  "pass_through_gates",
  "just_net",
  "corner",
  "footgolf",
  "coaches_challenge",
  "first_touch_box",
  "first_touch_air",
  "dizzy_penalty",
  "free_kick",
  "woodwork",
  "goalkeeper",
  "top_bins",
];

// Get week dates helper
function getWeekDates(date: Date): { start: Date; end: Date; weekNumber: number } {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
  const start = new Date(d.setDate(diff));
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);

  // Calculate week number
  const firstDayOfYear = new Date(start.getFullYear(), 0, 1);
  const pastDaysOfYear = (start.getTime() - firstDayOfYear.getTime()) / 86400000;
  const weekNumber = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);

  return { start, end, weekNumber };
}

function formatDateRange(start: Date, end: Date): string {
  const options: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" };
  const startStr = start.toLocaleDateString("en-GB", options);
  const endStr = end.toLocaleDateString("en-GB", { ...options, year: "numeric" });
  return `${startStr} - ${endStr}`;
}

function formatWeekLabel(weekNumber: number, year: number): string {
  return `Week ${weekNumber}, ${year}`;
}

export default function ChallengesPage() {
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [weeklyChallenge, setWeeklyChallenge] = useState<WeeklyChallenge | null>(null);
  const [leaderboard, setLeaderboard] = useState<ChallengeLeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { start: weekStart, end: weekEnd, weekNumber } = getWeekDates(currentDate);
  const year = weekStart.getFullYear();

  // Fetch weekly challenge data
  const fetchWeeklyChallenge = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const startISO = weekStart.toISOString().split("T")[0];
      const response = await fetch(`/api/admin/challenges?weekStart=${startISO}`);
      const data = await response.json();

      if (data.success) {
        setWeeklyChallenge(data.data.weeklyChallenge || null);
        setLeaderboard(data.data.leaderboard || []);
      } else {
        setError(data.error || "Failed to load challenge data");
      }
    } catch (err) {
      console.error("Error fetching weekly challenge:", err);
      setError("Failed to load challenge data");
    } finally {
      setLoading(false);
    }
  }, [weekStart]);

  useEffect(() => {
    fetchWeeklyChallenge();
  }, [fetchWeeklyChallenge]);

  // Navigate weeks
  const navigateWeek = (direction: number) => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + direction * 7);
    setCurrentDate(newDate);
  };

  const goToCurrentWeek = () => {
    setCurrentDate(new Date());
  };

  // Check if we're viewing current week
  const isCurrentWeek = (() => {
    const today = new Date();
    const { start } = getWeekDates(today);
    return weekStart.getTime() === start.getTime();
  })();

  // Save challenge result
  const handleSaveChallenge = async (result: ChallengeResult) => {
    setSaving(result.challengeType);
    setError(null);

    try {
      const response = await fetch("/api/admin/challenges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "saveChallengeResult",
          weekStart: weekStart.toISOString().split("T")[0],
          result,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setWeeklyChallenge(data.data.weeklyChallenge);
      } else {
        setError(data.error || "Failed to save challenge");
      }
    } catch (err) {
      console.error("Error saving challenge:", err);
      setError("Failed to save challenge");
    } finally {
      setSaving(null);
    }
  };

  // Save 121 of the Week
  const handleSaveOneToOne = async (award: OneToOneOfWeekAward) => {
    setSaving("oneToOne");
    setError(null);

    try {
      const response = await fetch("/api/admin/challenges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "saveOneToOneOfWeek",
          weekStart: weekStart.toISOString().split("T")[0],
          award,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setWeeklyChallenge(data.data.weeklyChallenge);
      } else {
        setError(data.error || "Failed to save award");
      }
    } catch (err) {
      console.error("Error saving 121 of the week:", err);
      setError("Failed to save award");
    } finally {
      setSaving(null);
    }
  };

  // Toggle half-term
  const handleToggleHalfTerm = async () => {
    setSaving("halfTerm");
    setError(null);

    try {
      const response = await fetch("/api/admin/challenges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "toggleHalfTerm",
          weekStart: weekStart.toISOString().split("T")[0],
          isHalfTerm: !weeklyChallenge?.isHalfTerm,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setWeeklyChallenge(data.data.weeklyChallenge);
      } else {
        setError(data.error || "Failed to update half-term status");
      }
    } catch (err) {
      console.error("Error toggling half-term:", err);
      setError("Failed to update half-term status");
    } finally {
      setSaving(null);
    }
  };

  // Get result for a challenge type
  const getResultForType = (type: ChallengeType): ChallengeResult | undefined => {
    return weeklyChallenge?.challenges.find((c) => c.challengeType === type);
  };

  // Count recorded winners
  const winnersRecorded = weeklyChallenge?.challenges.filter(
    (c) => c.winnerName
  ).length || 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <AdminPageHeader
        title="Weekly Challenges"
        subtitle="Track challenge winners and 121 of the Week awards"
      >
        {!isCurrentWeek && (
          <Button
            variant="adminSecondary"
            size="sm"
            onClick={goToCurrentWeek}
            className="gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Current Week
          </Button>
        )}
      </AdminPageHeader>

      {/* Error Banner */}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <p className="text-sm">{error}</p>
          <button
            onClick={() => setError(null)}
            className="ml-auto text-red-500 hover:text-red-700"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Week Navigation */}
      <div className="flex items-center justify-between bg-white rounded-2xl border border-neutral-200/60 p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <button
          onClick={() => navigateWeek(-1)}
          className="p-2 text-neutral-400 hover:text-neutral-900 rounded-lg hover:bg-neutral-100 transition-colors"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-4">
          <Calendar className="h-5 w-5 text-neutral-400" />
          <div className="text-center">
            <p className="text-lg font-semibold text-neutral-900">
              {formatWeekLabel(weekNumber, year)}
            </p>
            <p className="text-[13px] text-neutral-500">
              {formatDateRange(weekStart, weekEnd)}
            </p>
          </div>
          {isCurrentWeek && (
            <AdminBadge variant="info">Current Week</AdminBadge>
          )}
          {weeklyChallenge?.isHalfTerm && (
            <AdminBadge variant="warning">Half Term</AdminBadge>
          )}
        </div>

        <button
          onClick={() => navigateWeek(1)}
          className="p-2 text-neutral-400 hover:text-neutral-900 rounded-lg hover:bg-neutral-100 transition-colors"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-neutral-200/60 p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <p className="text-[13px] text-neutral-500 mb-1">Challenges</p>
          <p className="text-2xl font-bold text-neutral-900">
            {DEFAULT_CHALLENGES.length}
          </p>
        </div>
        <div className="bg-white rounded-2xl border border-neutral-200/60 p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <p className="text-[13px] text-neutral-500 mb-1">Winners Recorded</p>
          <p className="text-2xl font-bold text-emerald-600">
            {winnersRecorded}
          </p>
        </div>
        <div className="bg-white rounded-2xl border border-neutral-200/60 p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <p className="text-[13px] text-neutral-500 mb-1">121 of the Week</p>
          <p className="text-2xl font-bold text-amber-600">
            {weeklyChallenge?.oneToOneOfWeek ? "Yes" : "No"}
          </p>
        </div>
        <div className="bg-white rounded-2xl border border-neutral-200/60 p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[13px] text-neutral-500 mb-1">Half Term</p>
              <p className="text-2xl font-bold text-neutral-900">
                {weeklyChallenge?.isHalfTerm ? "Yes" : "No"}
              </p>
            </div>
            <Button
              variant="adminGhost"
              size="icon"
              onClick={handleToggleHalfTerm}
              disabled={saving === "halfTerm"}
              className="h-10 w-10"
              title={weeklyChallenge?.isHalfTerm ? "Mark as active week" : "Mark as half term"}
            >
              {weeklyChallenge?.isHalfTerm ? (
                <Play className="h-5 w-5 text-emerald-600" />
              ) : (
                <Pause className="h-5 w-5 text-amber-600" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Half Term Notice */}
      {weeklyChallenge?.isHalfTerm && (
        <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <Pause className="h-5 w-5 text-amber-600" />
          <div>
            <p className="font-medium text-amber-800">Half Term Week</p>
            <p className="text-[13px] text-amber-600">
              Challenges are paused for this week. Toggle above to resume.
            </p>
          </div>
        </div>
      )}

      {/* Main Content Grid */}
      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Skeleton loading */}
          <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-64 bg-neutral-100 rounded-2xl animate-pulse"
                />
              ))}
            </div>
          </div>
          <div className="space-y-6">
            <div className="h-64 bg-neutral-100 rounded-2xl animate-pulse" />
            <div className="h-80 bg-neutral-100 rounded-2xl animate-pulse" />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Challenge Cards */}
          <div className="lg:col-span-2 space-y-6">
            {!weeklyChallenge?.isHalfTerm && (
              <>
                <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-500">
                  Weekly Challenges
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {DEFAULT_CHALLENGES.map((type) => (
                    <ChallengeCard
                      key={type}
                      challengeType={type}
                      result={getResultForType(type)}
                      onSave={handleSaveChallenge}
                      saving={saving === type}
                    />
                  ))}
                </div>
              </>
            )}

            {weeklyChallenge?.isHalfTerm && (
              <AdminEmptyState
                icon={Pause}
                title="Half Term Week"
                description="No challenges are recorded during half term. Toggle the half term status above to record challenges."
              />
            )}
          </div>

          {/* Sidebar: 121 of the Week & Leaderboard */}
          <div className="space-y-6">
            {/* 121 of the Week */}
            <OneToOneOfWeekCard
              award={weeklyChallenge?.oneToOneOfWeek}
              onSave={handleSaveOneToOne}
              saving={saving === "oneToOne"}
            />

            {/* Leaderboard */}
            <ChallengeLeaderboard
              entries={leaderboard}
              title="Top Challengers"
              loading={loading}
            />
          </div>
        </div>
      )}
    </div>
  );
}
