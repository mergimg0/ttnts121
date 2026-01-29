"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AdminInput, AdminTextarea } from "@/components/admin/ui/admin-input";
import { getSuggestedFollowUpDate, ScheduleFollowUpInput } from "@/types/retention";

interface ScheduleCallDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ScheduleFollowUpInput) => Promise<void>;
  customerId: string;
  customerName?: string;
  currentScheduledDate?: string;
}

export function ScheduleCallDialog({
  isOpen,
  onClose,
  onSubmit,
  customerId,
  customerName,
  currentScheduledDate,
}: ScheduleCallDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [followUpDate, setFollowUpDate] = useState("");
  const [notes, setNotes] = useState("");

  // Reset form when dialog opens
  useEffect(() => {
    if (isOpen) {
      setFollowUpDate(currentScheduledDate || getSuggestedFollowUpDate(3));
      setNotes("");
    }
  }, [isOpen, currentScheduledDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!followUpDate) return;

    setIsLoading(true);
    try {
      await onSubmit({
        lostCustomerId: customerId,
        followUpDate,
        notes: notes.trim() || undefined,
      });
      onClose();
    } catch (error) {
      console.error("Error scheduling call:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Quick date options
  const quickDates = [
    { label: "Tomorrow", days: 1 },
    { label: "In 3 Days", days: 3 },
    { label: "In 1 Week", days: 7 },
    { label: "In 2 Weeks", days: 14 },
  ];

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
            className="fixed left-1/2 top-1/2 z-50 w-full max-w-md max-h-[90vh] overflow-y-auto -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 shadow-xl"
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute right-4 top-4 rounded-lg p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100">
                <Phone className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-neutral-900">
                  Schedule Follow-up
                </h2>
                <p className="text-sm text-neutral-500">
                  {customerName ? `Set a reminder to contact ${customerName}` : "Schedule a follow-up call"}
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Quick Date Options */}
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-neutral-500 mb-2">
                  Quick Select
                </label>
                <div className="flex flex-wrap gap-2">
                  {quickDates.map(({ label, days }) => (
                    <button
                      key={days}
                      type="button"
                      onClick={() => setFollowUpDate(getSuggestedFollowUpDate(days))}
                      className={`px-3 py-1.5 text-sm rounded-lg border transition-all ${
                        followUpDate === getSuggestedFollowUpDate(days)
                          ? "bg-sky-50 border-sky-300 text-sky-700"
                          : "bg-white border-neutral-200 text-neutral-600 hover:border-neutral-300"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Date Picker */}
              <AdminInput
                label="Follow-up Date"
                type="date"
                value={followUpDate}
                onChange={(e) => setFollowUpDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                required
              />

              {/* Notes */}
              <AdminTextarea
                label="Notes (optional)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Reminder notes for this follow-up..."
                rows={2}
              />

              {/* Actions */}
              <div className="flex gap-3 pt-4">
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
                  variant="adminPrimary"
                  className="flex-1"
                  disabled={isLoading || !followUpDate}
                >
                  {isLoading ? "Scheduling..." : "Schedule"}
                </Button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
