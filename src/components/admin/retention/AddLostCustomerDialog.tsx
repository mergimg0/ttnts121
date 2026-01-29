"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, UserMinus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AdminSelect } from "@/components/admin/ui/admin-select";
import { AdminInput, AdminTextarea } from "@/components/admin/ui/admin-input";
import {
  LostReason,
  LOST_REASON_LABELS,
  PRIORITY_LABELS,
  CreateLostCustomerInput,
} from "@/types/retention";

interface AddLostCustomerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateLostCustomerInput) => Promise<void>;
}

export function AddLostCustomerDialog({
  isOpen,
  onClose,
  onSubmit,
}: AddLostCustomerDialogProps) {
  const [isLoading, setIsLoading] = useState(false);

  // Form state
  const [studentName, setStudentName] = useState("");
  const [parentName, setParentName] = useState("");
  const [parentEmail, setParentEmail] = useState("");
  const [parentPhone, setParentPhone] = useState("");
  const [lastSessionDate, setLastSessionDate] = useState("");
  const [lastSessionType, setLastSessionType] = useState<"121" | "ASC" | "GDS" | "">("");
  const [previousCoach, setPreviousCoach] = useState("");
  const [lostReason, setLostReason] = useState<LostReason | "">("");
  const [lostReasonDetails, setLostReasonDetails] = useState("");
  const [lostAt, setLostAt] = useState("");
  const [priority, setPriority] = useState<number>(2);
  const [nextStepNotes, setNextStepNotes] = useState("");

  // Reset form when dialog opens
  useEffect(() => {
    if (isOpen) {
      setStudentName("");
      setParentName("");
      setParentEmail("");
      setParentPhone("");
      setLastSessionDate("");
      setLastSessionType("");
      setPreviousCoach("");
      setLostReason("");
      setLostReasonDetails("");
      setLostAt(new Date().toISOString().split("T")[0]);
      setPriority(2);
      setNextStepNotes("");
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName || !parentName || !parentEmail) return;

    setIsLoading(true);
    try {
      const data: CreateLostCustomerInput = {
        studentName: studentName.trim(),
        parentName: parentName.trim(),
        parentEmail: parentEmail.trim().toLowerCase(),
        parentPhone: parentPhone.trim() || undefined,
        lastSessionDate: lastSessionDate || undefined,
        lastSessionType: lastSessionType || undefined,
        previousCoach: previousCoach.trim() || undefined,
        lostReason: lostReason || undefined,
        lostReasonDetails: lostReasonDetails.trim() || undefined,
        lostAt: new Date(lostAt),
        priority,
        nextStepNotes: nextStepNotes.trim() || undefined,
      };

      await onSubmit(data);
      onClose();
    } catch (error) {
      console.error("Error adding lost customer:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = studentName.trim() && parentName.trim() && parentEmail.trim();

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
            className="fixed left-1/2 top-1/2 z-50 w-full max-w-xl max-h-[90vh] overflow-y-auto -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 shadow-xl"
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
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100">
                <UserMinus className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-neutral-900">
                  Add Lost Customer
                </h2>
                <p className="text-sm text-neutral-500">
                  Track a customer who stopped attending
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Student & Parent Info Section */}
              <div className="space-y-4">
                <h3 className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                  Contact Information
                </h3>

                <AdminInput
                  label="Student Name"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder="Child's name"
                  required
                />

                <div className="grid grid-cols-2 gap-4">
                  <AdminInput
                    label="Parent Name"
                    value={parentName}
                    onChange={(e) => setParentName(e.target.value)}
                    placeholder="Parent/Guardian name"
                    required
                  />
                  <AdminInput
                    label="Parent Email"
                    type="email"
                    value={parentEmail}
                    onChange={(e) => setParentEmail(e.target.value)}
                    placeholder="email@example.com"
                    required
                  />
                </div>

                <AdminInput
                  label="Phone (optional)"
                  type="tel"
                  value={parentPhone}
                  onChange={(e) => setParentPhone(e.target.value)}
                  placeholder="07xxx xxxxxx"
                />
              </div>

              {/* Last Session Info */}
              <div className="space-y-4 pt-4 border-t border-neutral-100">
                <h3 className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                  Last Session Info
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <AdminInput
                    label="Last Session Date"
                    type="date"
                    value={lastSessionDate}
                    onChange={(e) => setLastSessionDate(e.target.value)}
                  />
                  <AdminSelect
                    label="Session Type"
                    value={lastSessionType}
                    onChange={(e) => setLastSessionType(e.target.value as "121" | "ASC" | "GDS" | "")}
                  >
                    <option value="">Select type</option>
                    <option value="121">1-2-1</option>
                    <option value="ASC">After School Club</option>
                    <option value="GDS">Game Day Squad</option>
                  </AdminSelect>
                </div>

                <AdminInput
                  label="Previous Coach"
                  value={previousCoach}
                  onChange={(e) => setPreviousCoach(e.target.value)}
                  placeholder="Coach who worked with them"
                />
              </div>

              {/* Loss Details */}
              <div className="space-y-4 pt-4 border-t border-neutral-100">
                <h3 className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                  Loss Details
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <AdminSelect
                    label="Reason Lost"
                    value={lostReason}
                    onChange={(e) => setLostReason(e.target.value as LostReason)}
                  >
                    <option value="">Select reason</option>
                    {(Object.keys(LOST_REASON_LABELS) as LostReason[]).map((reason) => (
                      <option key={reason} value={reason}>
                        {LOST_REASON_LABELS[reason]}
                      </option>
                    ))}
                  </AdminSelect>
                  <AdminInput
                    label="Date Lost"
                    type="date"
                    value={lostAt}
                    onChange={(e) => setLostAt(e.target.value)}
                    required
                  />
                </div>

                {lostReason === "other" && (
                  <AdminInput
                    label="Reason Details"
                    value={lostReasonDetails}
                    onChange={(e) => setLostReasonDetails(e.target.value)}
                    placeholder="Describe the reason..."
                  />
                )}

                <AdminSelect
                  label="Priority"
                  value={priority.toString()}
                  onChange={(e) => setPriority(parseInt(e.target.value))}
                  hint="Higher priority customers will be shown first"
                >
                  {[1, 2, 3].map((p) => (
                    <option key={p} value={p}>
                      {PRIORITY_LABELS[p]}
                    </option>
                  ))}
                </AdminSelect>
              </div>

              {/* Notes */}
              <div className="pt-4 border-t border-neutral-100">
                <AdminTextarea
                  label="Notes (optional)"
                  value={nextStepNotes}
                  onChange={(e) => setNextStepNotes(e.target.value)}
                  placeholder="Any relevant notes or context..."
                  rows={2}
                />
              </div>

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
                  disabled={isLoading || !isFormValid}
                >
                  {isLoading ? "Adding..." : "Add Customer"}
                </Button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
