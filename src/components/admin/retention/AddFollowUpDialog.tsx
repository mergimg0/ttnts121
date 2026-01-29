"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AdminSelect } from "@/components/admin/ui/admin-select";
import { AdminInput, AdminTextarea } from "@/components/admin/ui/admin-input";
import {
  ContactMethod,
  FollowUpOutcome,
  CONTACT_METHOD_LABELS,
  FOLLOW_UP_OUTCOME_LABELS,
  getSuggestedFollowUpDate,
  AddFollowUpInput,
} from "@/types/retention";

interface AddFollowUpDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: AddFollowUpInput) => Promise<void>;
  customerId: string;
  customerName?: string;
}

export function AddFollowUpDialog({
  isOpen,
  onClose,
  onSubmit,
  customerId,
  customerName,
}: AddFollowUpDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [method, setMethod] = useState<ContactMethod>("call");
  const [outcome, setOutcome] = useState<FollowUpOutcome>("spoke");
  const [notes, setNotes] = useState("");
  const [nextFollowUpDate, setNextFollowUpDate] = useState("");
  const [showNextFollowUp, setShowNextFollowUp] = useState(false);

  // Reset form when dialog opens
  useEffect(() => {
    if (isOpen) {
      setMethod("call");
      setOutcome("spoke");
      setNotes("");
      setNextFollowUpDate("");
      setShowNextFollowUp(false);
    }
  }, [isOpen]);

  // Auto-show next follow-up date for certain outcomes
  useEffect(() => {
    const needsFollowUp = outcome === "no_answer" || outcome === "left_message" || outcome === "needs_follow_up";
    setShowNextFollowUp(needsFollowUp);
    if (needsFollowUp && !nextFollowUpDate) {
      setNextFollowUpDate(getSuggestedFollowUpDate(7));
    }
  }, [outcome]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notes.trim()) return;

    setIsLoading(true);
    try {
      await onSubmit({
        lostCustomerId: customerId,
        method,
        outcome,
        notes: notes.trim(),
        nextFollowUpDate: showNextFollowUp && nextFollowUpDate ? nextFollowUpDate : undefined,
      });
      onClose();
    } catch (error) {
      console.error("Error adding follow-up:", error);
    } finally {
      setIsLoading(false);
    }
  };

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
            className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg max-h-[90vh] overflow-y-auto -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 shadow-xl"
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
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-100">
                <MessageSquare className="h-5 w-5 text-sky-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-neutral-900">
                  Log Follow-up
                </h2>
                <p className="text-sm text-neutral-500">
                  {customerName ? `Record contact with ${customerName}` : "Record a follow-up attempt"}
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Contact Method */}
              <AdminSelect
                label="Contact Method"
                value={method}
                onChange={(e) => setMethod(e.target.value as ContactMethod)}
              >
                {(Object.keys(CONTACT_METHOD_LABELS) as ContactMethod[]).map((m) => (
                  <option key={m} value={m}>
                    {CONTACT_METHOD_LABELS[m]}
                  </option>
                ))}
              </AdminSelect>

              {/* Outcome */}
              <AdminSelect
                label="Outcome"
                value={outcome}
                onChange={(e) => setOutcome(e.target.value as FollowUpOutcome)}
              >
                {(Object.keys(FOLLOW_UP_OUTCOME_LABELS) as FollowUpOutcome[]).map((o) => (
                  <option key={o} value={o}>
                    {FOLLOW_UP_OUTCOME_LABELS[o]}
                  </option>
                ))}
              </AdminSelect>

              {/* Notes */}
              <AdminTextarea
                label="Notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="What was discussed? Any updates on their situation?"
                required
              />

              {/* Next Follow-up Date */}
              {showNextFollowUp && (
                <AdminInput
                  label="Next Follow-up Date"
                  type="date"
                  value={nextFollowUpDate}
                  onChange={(e) => setNextFollowUpDate(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  hint="When should we follow up again?"
                />
              )}

              {/* Toggle for scheduling follow-up */}
              {!showNextFollowUp && (
                <button
                  type="button"
                  onClick={() => {
                    setShowNextFollowUp(true);
                    setNextFollowUpDate(getSuggestedFollowUpDate(7));
                  }}
                  className="text-sm text-sky-600 hover:text-sky-700 transition-colors"
                >
                  + Schedule next follow-up
                </button>
              )}

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
                  disabled={isLoading || !notes.trim()}
                >
                  {isLoading ? "Saving..." : "Log Follow-up"}
                </Button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
