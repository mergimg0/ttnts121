"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Minus, Calendar, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AdminInput, AdminTextarea } from "@/components/admin/ui/admin-input";
import { AdminSelect } from "@/components/admin/ui/admin-select";
import { BlockBookingSummary } from "@/types/block-booking";

interface Coach {
  id: string;
  name: string;
}

interface DeductSessionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  booking: BlockBookingSummary | null;
  onSubmit: (data: {
    sessionDate: string;
    coachId?: string;
    coachName?: string;
    notes?: string;
  }) => Promise<void>;
  coaches?: Coach[];
}

export function DeductSessionDialog({
  isOpen,
  onClose,
  booking,
  onSubmit,
  coaches = [],
}: DeductSessionDialogProps) {
  const [sessionDate, setSessionDate] = useState("");
  const [coachId, setCoachId] = useState("");
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (isOpen) {
      // Default to today's date
      const today = new Date().toISOString().split("T")[0];
      setSessionDate(today);
      setCoachId("");
      setNotes("");
      setError(null);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!sessionDate) {
      setError("Please select a session date");
      return;
    }

    if (!booking) {
      setError("No booking selected");
      return;
    }

    setIsLoading(true);
    try {
      const selectedCoach = coaches.find((c) => c.id === coachId);
      await onSubmit({
        sessionDate,
        coachId: coachId || undefined,
        coachName: selectedCoach?.name,
        notes: notes.trim() || undefined,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to deduct session");
    } finally {
      setIsLoading(false);
    }
  };

  if (!booking) return null;

  return (
    <AnimatePresence>
      {isOpen && (
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
            className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 shadow-xl"
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute right-4 top-4 rounded-lg p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Icon */}
            <div className="mx-auto w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
              <Minus className="h-6 w-6 text-amber-600" />
            </div>

            {/* Header */}
            <div className="mt-4 text-center">
              <h3 className="text-lg font-semibold text-neutral-900">
                Deduct Session
              </h3>
              <p className="mt-1 text-sm text-neutral-600">
                Record a session used for{" "}
                <span className="font-medium">{booking.studentName}</span>
              </p>
              <p className="mt-1 text-[13px] text-neutral-500">
                {booking.remainingSessions} sessions remaining
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              {/* Session Date */}
              <AdminInput
                label="Session Date"
                type="date"
                value={sessionDate}
                onChange={(e) => setSessionDate(e.target.value)}
                leftIcon={<Calendar className="h-4 w-4" />}
                required
              />

              {/* Coach Selection */}
              {coaches.length > 0 && (
                <AdminSelect
                  label="Coach (Optional)"
                  value={coachId}
                  onChange={(e) => setCoachId(e.target.value)}
                  placeholder="Select a coach"
                  options={coaches.map((c) => ({ value: c.id, label: c.name }))}
                />
              )}

              {/* Notes */}
              <AdminTextarea
                label="Notes (Optional)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any notes about this session..."
                rows={3}
              />

              {/* Error Message */}
              {error && (
                <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="adminSecondary"
                  className="flex-1"
                  onClick={onClose}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-amber-600 hover:bg-amber-700 text-white"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Minus className="mr-2 h-4 w-4" />
                      Deduct Session
                    </>
                  )}
                </Button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
