"use client";

import { useState, useEffect, useCallback } from "react";
import { AdminCard } from "@/components/admin/ui/admin-card";
import { AdminSelect } from "@/components/admin/ui/admin-select";
import { AdminBadge } from "@/components/admin/ui/admin-badge";
import { Trophy, Star, Award, History } from "lucide-react";
import {
  GDSStudent,
  GDSDay,
  GDSAgeGroup,
  PlayerOfSessionAward,
  GDS_AGE_GROUP_LABELS,
} from "@/types/gds";
import { cn } from "@/lib/utils";

interface PlayerOfSessionSelectorProps {
  checkedInStudents: GDSStudent[];
  currentAward: PlayerOfSessionAward | null | undefined;
  onAwardChange: (award: PlayerOfSessionAward | null) => void;
  ageGroup: GDSAgeGroup;
  day: GDSDay;
}

interface PreviousWinner {
  studentName: string;
  date: string;
  reason?: string;
}

export function PlayerOfSessionSelector({
  checkedInStudents,
  currentAward,
  onAwardChange,
  ageGroup,
  day,
}: PlayerOfSessionSelectorProps) {
  const [reason, setReason] = useState(currentAward?.reason || "");
  const [selectedStudent, setSelectedStudent] = useState<string>(
    currentAward?.studentName || ""
  );
  const [previousWinners, setPreviousWinners] = useState<PreviousWinner[]>([]);

  // Fetch previous winners for this age group
  const fetchPreviousWinners = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/admin/gds/attendance/winners?day=${day}&ageGroup=${ageGroup}&limit=5`
      );
      const data = await response.json();
      if (data.success) {
        setPreviousWinners(data.data || []);
      }
    } catch (error) {
      console.error("Error fetching winners:", error);
    }
  }, [day, ageGroup]);

  useEffect(() => {
    fetchPreviousWinners();
  }, [fetchPreviousWinners]);

  const handleStudentChange = (studentName: string) => {
    setSelectedStudent(studentName);

    if (!studentName) {
      onAwardChange(null);
      return;
    }

    const student = checkedInStudents.find((s) => s.studentName === studentName);
    const award: PlayerOfSessionAward = {
      studentName,
      studentId: student?.id,
      reason: reason || undefined,
      awardedAt: new Date(),
    };

    onAwardChange(award);
  };

  const handleReasonChange = (newReason: string) => {
    setReason(newReason);

    if (selectedStudent) {
      const student = checkedInStudents.find((s) => s.studentName === selectedStudent);
      const award: PlayerOfSessionAward = {
        studentName: selectedStudent,
        studentId: student?.id,
        reason: newReason || undefined,
        awardedAt: currentAward?.awardedAt || new Date(),
      };
      onAwardChange(award);
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
    });
  };

  // Check how many times each student has won
  const winCounts = new Map<string, number>();
  previousWinners.forEach((w) => {
    winCounts.set(w.studentName, (winCounts.get(w.studentName) || 0) + 1);
  });

  return (
    <AdminCard>
      <div className="flex items-center gap-3 mb-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50">
          <Trophy className="h-5 w-5 text-amber-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-neutral-900">
            Player of the Session
          </h3>
          <p className="text-sm text-neutral-500">
            Recognize outstanding performance - {GDS_AGE_GROUP_LABELS[ageGroup]}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Selection Form */}
        <div className="space-y-4">
          <AdminSelect
            label="Select Player"
            value={selectedStudent}
            onChange={(e) => handleStudentChange(e.target.value)}
            placeholder="Choose a player..."
            options={[
              { value: "", label: "No award" },
              ...checkedInStudents.map((s) => ({
                value: s.studentName,
                label: `${s.studentName}${
                  winCounts.has(s.studentName)
                    ? ` (${winCounts.get(s.studentName)} prev)`
                    : ""
                }`,
              })),
            ]}
          />

          <div className="space-y-2">
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
              Reason (Optional)
            </label>
            <textarea
              value={reason}
              onChange={(e) => handleReasonChange(e.target.value)}
              placeholder="Why did they earn this award?"
              className={cn(
                "flex min-h-[80px] w-full rounded-xl border bg-white px-4 py-3",
                "text-sm text-neutral-900 placeholder:text-neutral-400",
                "transition-all duration-200 resize-none",
                "focus:outline-none focus:ring-2",
                "border-neutral-200 focus:border-sky-500 focus:ring-sky-500/20"
              )}
            />
            <p className="text-xs text-neutral-400">
              E.g., "Great teamwork", "Best dribbling skills", "Never gave up"
            </p>
          </div>

          {/* Current Selection Display */}
          {selectedStudent && (
            <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
              <div className="flex items-center gap-3">
                <Award className="h-6 w-6 text-amber-600" />
                <div>
                  <p className="font-semibold text-amber-900">{selectedStudent}</p>
                  {reason && (
                    <p className="text-sm text-amber-700 mt-0.5">{reason}</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Previous Winners */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <History className="h-4 w-4 text-neutral-400" />
            <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
              Recent Winners
            </span>
          </div>

          {previousWinners.length === 0 ? (
            <div className="p-4 bg-neutral-50 rounded-xl text-center">
              <p className="text-sm text-neutral-500">
                No previous winners recorded
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {previousWinners.map((winner, index) => (
                <div
                  key={`${winner.studentName}-${winner.date}`}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-xl",
                    "bg-neutral-50 border border-neutral-100"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100">
                      <Star className="h-4 w-4 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-neutral-900">
                        {winner.studentName}
                      </p>
                      {winner.reason && (
                        <p className="text-xs text-neutral-500 truncate max-w-[180px]">
                          {winner.reason}
                        </p>
                      )}
                    </div>
                  </div>
                  <AdminBadge variant="neutral">
                    {formatDate(winner.date)}
                  </AdminBadge>
                </div>
              ))}
            </div>
          )}

          {/* Quick Stats */}
          {previousWinners.length > 0 && (
            <div className="mt-4 p-3 bg-neutral-50 rounded-xl">
              <p className="text-xs text-neutral-500 mb-2">Most Frequent Winners</p>
              <div className="flex flex-wrap gap-2">
                {Array.from(winCounts.entries())
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 3)
                  .map(([name, count]) => (
                    <span
                      key={name}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-white rounded-lg text-xs font-medium text-neutral-700 border border-neutral-200"
                    >
                      {name}
                      <span className="text-amber-600">{count}x</span>
                    </span>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminCard>
  );
}
