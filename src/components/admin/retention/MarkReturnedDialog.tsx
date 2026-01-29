"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, UserCheck, PartyPopper } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AdminInput, AdminTextarea } from "@/components/admin/ui/admin-input";
import { MarkAsReturnedInput } from "@/types/retention";

interface MarkReturnedDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: MarkAsReturnedInput) => Promise<void>;
  customerId: string;
  customerName?: string;
}

export function MarkReturnedDialog({
  isOpen,
  onClose,
  onSubmit,
  customerId,
  customerName,
}: MarkReturnedDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [bookingId, setBookingId] = useState("");
  const [notes, setNotes] = useState("");

  // Reset form when dialog opens
  useEffect(() => {
    if (isOpen) {
      setBookingId("");
      setNotes("");
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsLoading(true);
    try {
      await onSubmit({
        lostCustomerId: customerId,
        bookingId: bookingId.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      onClose();
    } catch (error) {
      console.error("Error marking as returned:", error);
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
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100">
                <UserCheck className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-neutral-900">
                  Mark as Returned
                </h2>
                <p className="text-sm text-neutral-500">
                  {customerName ? `${customerName} is coming back!` : "Record a successful return"}
                </p>
              </div>
            </div>

            {/* Success Message */}
            <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 mb-6">
              <PartyPopper className="h-6 w-6 text-emerald-600 shrink-0" />
              <p className="text-sm text-emerald-800">
                Great work! This customer will be marked as successfully returned.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Booking Reference */}
              <AdminInput
                label="New Booking ID (optional)"
                value={bookingId}
                onChange={(e) => setBookingId(e.target.value)}
                placeholder="Link to their new booking"
                hint="If they've already booked, add the reference"
              />

              {/* Notes */}
              <AdminTextarea
                label="Notes (optional)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="What made them come back? Any insights..."
                rows={3}
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
                  disabled={isLoading}
                >
                  {isLoading ? "Saving..." : "Mark Returned"}
                </Button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
