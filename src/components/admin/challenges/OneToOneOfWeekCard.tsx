"use client";

import { useState } from "react";
import { AdminCard } from "@/components/admin/ui/admin-card";
import { AdminInput, AdminTextarea } from "@/components/admin/ui/admin-input";
import { AdminBadge } from "@/components/admin/ui/admin-badge";
import { Button } from "@/components/ui/button";
import { OneToOneOfWeekAward } from "@/types/challenges";
import { Award, Save, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface OneToOneOfWeekCardProps {
  award?: OneToOneOfWeekAward;
  previousAwards?: Array<{ name: string; reason?: string; date: string }>;
  onSave: (award: OneToOneOfWeekAward) => void;
  saving?: boolean;
}

export function OneToOneOfWeekCard({
  award,
  previousAwards = [],
  onSave,
  saving = false,
}: OneToOneOfWeekCardProps) {
  const [studentName, setStudentName] = useState(award?.studentName || "");
  const [reason, setReason] = useState(award?.reason || "");

  const hasAward = !!award?.studentName;
  const hasChanges =
    studentName !== (award?.studentName || "") ||
    reason !== (award?.reason || "");

  const handleSave = () => {
    if (!studentName.trim()) return;
    onSave({
      studentName: studentName.trim(),
      reason: reason.trim() || undefined,
    });
  };

  return (
    <AdminCard
      className="bg-gradient-to-br from-amber-50/50 to-orange-50/30 border-amber-200/40"
      hover={false}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div
          className={cn(
            "flex h-12 w-12 items-center justify-center rounded-xl",
            hasAward
              ? "bg-amber-100 text-amber-600"
              : "bg-amber-50 text-amber-400"
          )}
        >
          <Award className="h-6 w-6" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-neutral-900">
              121 of the Week
            </h3>
            <Sparkles className="h-4 w-4 text-amber-500" />
          </div>
          <p className="text-[13px] text-neutral-500 mt-0.5">
            Recognize an outstanding student
          </p>
        </div>
        {hasAward && (
          <AdminBadge variant="warning" className="bg-amber-100 text-amber-700">
            Awarded
          </AdminBadge>
        )}
      </div>

      {/* Current Award Display */}
      {hasAward && !hasChanges && (
        <div className="mb-4 p-4 bg-white/60 rounded-xl border border-amber-200/30">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">🏆</span>
            <span className="text-lg font-semibold text-neutral-900">
              {award?.studentName}
            </span>
          </div>
          {award?.reason && (
            <p className="text-[13px] text-neutral-600 italic">
              &ldquo;{award.reason}&rdquo;
            </p>
          )}
        </div>
      )}

      {/* Form Fields */}
      <div className="space-y-3">
        <AdminInput
          label="Student Name"
          placeholder="Enter student's name"
          value={studentName}
          onChange={(e) => setStudentName(e.target.value)}
        />
        <AdminTextarea
          label="Reason (optional)"
          placeholder="Why did they earn this award?"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="min-h-[80px]"
        />
      </div>

      {/* Save Button */}
      {hasChanges && studentName.trim() && (
        <div className="mt-4">
          <Button
            variant="adminPrimary"
            size="sm"
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-amber-600 hover:bg-amber-700"
          >
            <Save className="h-4 w-4" />
            {saving ? "Saving..." : hasAward ? "Update Award" : "Award 121 of the Week"}
          </Button>
        </div>
      )}

      {/* Previous Awards */}
      {previousAwards.length > 0 && (
        <div className="mt-4 pt-4 border-t border-amber-200/30">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 mb-3">
            Recent Recipients
          </p>
          <div className="space-y-2">
            {previousAwards.slice(0, 3).map((prev, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between text-[13px] py-2 px-3 bg-white/40 rounded-lg"
              >
                <div>
                  <span className="font-medium text-neutral-700">
                    {prev.name}
                  </span>
                  {prev.reason && (
                    <p className="text-neutral-500 text-[12px] mt-0.5 truncate max-w-[200px]">
                      {prev.reason}
                    </p>
                  )}
                </div>
                <span className="text-neutral-400 text-[12px]">{prev.date}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </AdminCard>
  );
}
