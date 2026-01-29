"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AdminSelect } from "@/components/admin/ui/admin-select";
import { CoachAward, CoachAwardType, COACH_AWARD_PRIZES } from "@/types/coach";
import { Loader2, X } from "lucide-react";

interface Coach {
  id: string;
  name: string;
}

interface AddAwardDialogProps {
  open: boolean;
  onClose: () => void;
  award?: CoachAward | null;
  onSave: (data: Partial<CoachAward>) => Promise<void>;
}

const AWARD_TYPES = [
  { value: "coach_of_month", label: "Coach of the Month" },
  { value: "employee_of_month", label: "Employee of the Month" },
];

export function AddAwardDialog({
  open,
  onClose,
  award,
  onSave,
}: AddAwardDialogProps) {
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [coachId, setCoachId] = useState("");
  const [coachName, setCoachName] = useState("");
  const [awardType, setAwardType] = useState<CoachAwardType>("coach_of_month");
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [prize, setPrize] = useState("");
  const [reason, setReason] = useState("");
  const [nominatedBy, setNominatedBy] = useState("");

  // Fetch coaches on open
  useEffect(() => {
    if (open && coaches.length === 0) {
      fetchCoaches();
    }
  }, [open, coaches.length]);

  // Populate form when editing
  useEffect(() => {
    if (award) {
      setCoachId(award.coachId);
      setCoachName(award.coachName);
      setAwardType(award.awardType);
      setMonth(award.month);
      setPrize(award.prize ? String(award.prize / 100) : "");
      setReason(award.reason || "");
      setNominatedBy(award.nominatedBy || "");
    } else {
      resetForm();
    }
  }, [award]);

  const fetchCoaches = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/coaches");
      const data = await response.json();
      if (data.success) {
        setCoaches(data.data || []);
      }
    } catch (error) {
      console.error("Error fetching coaches:", error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setCoachId("");
    setCoachName("");
    setAwardType("coach_of_month");
    const now = new Date();
    setMonth(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`);
    setPrize("");
    setReason("");
    setNominatedBy("");
  };

  const handleCoachChange = (id: string) => {
    setCoachId(id);
    const coach = coaches.find((c) => c.id === id);
    if (coach) {
      setCoachName(coach.name);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!coachId || !coachName || !awardType || !month) return;

    setSaving(true);
    try {
      const prizeInPence = prize
        ? Math.round(parseFloat(prize) * 100)
        : COACH_AWARD_PRIZES[awardType];

      await onSave({
        ...(award?.id && { id: award.id }),
        coachId,
        coachName,
        awardType,
        month,
        prize: prizeInPence,
        reason: reason || undefined,
        nominatedBy: nominatedBy || undefined,
      });

      onClose();
      resetForm();
    } catch (error) {
      console.error("Error saving award:", error);
    } finally {
      setSaving(false);
    }
  };

  const isEditing = !!award;

  const coachOptions = coaches.map((c) => ({ value: c.id, label: c.name }));

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 bg-black/50"
            onClick={onClose}
          />

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.15 }}
            className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-neutral-900">
                {isEditing ? "Edit Award" : "Add New Award"}
              </h2>
              <button
                onClick={onClose}
                className="rounded-lg p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Coach selection */}
              <div>
                {loading ? (
                  <div className="flex items-center gap-2 text-sm text-neutral-500">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading coaches...
                  </div>
                ) : (
                  <AdminSelect
                    label="Coach"
                    value={coachId}
                    onChange={(e) => handleCoachChange(e.target.value)}
                    options={coachOptions}
                    placeholder="Select coach"
                  />
                )}
              </div>

              {/* Award type */}
              <AdminSelect
                label="Award Type"
                value={awardType}
                onChange={(e) => setAwardType(e.target.value as CoachAwardType)}
                options={AWARD_TYPES}
              />

              {/* Month */}
              <div className="space-y-2">
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                  Month
                </label>
                <Input
                  type="month"
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                  required
                  className="h-11 rounded-xl"
                />
              </div>

              {/* Prize */}
              <div className="space-y-2">
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                  Prize Amount (£)
                  <span className="text-neutral-400 font-normal ml-2 normal-case">
                    Default: £{(COACH_AWARD_PRIZES[awardType] / 100).toFixed(2)}
                  </span>
                </label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder={String(COACH_AWARD_PRIZES[awardType] / 100)}
                  value={prize}
                  onChange={(e) => setPrize(e.target.value)}
                  className="h-11 rounded-xl"
                />
              </div>

              {/* Reason */}
              <div className="space-y-2">
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                  Reason for Award
                </label>
                <Textarea
                  placeholder="Outstanding performance, dedication, etc."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                  className="rounded-xl"
                />
              </div>

              {/* Nominated by */}
              <div className="space-y-2">
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                  Nominated By
                </label>
                <Input
                  placeholder="Staff member name"
                  value={nominatedBy}
                  onChange={(e) => setNominatedBy(e.target.value)}
                  className="h-11 rounded-xl"
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={saving || !coachId}>
                  {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  {isEditing ? "Save Changes" : "Create Award"}
                </Button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
