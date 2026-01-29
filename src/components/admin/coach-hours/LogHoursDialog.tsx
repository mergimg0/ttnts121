"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Clock, Plus, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AdminInput } from "@/components/admin/ui/admin-input";
import { AdminSelect } from "@/components/admin/ui/admin-select";
import { AdminTextarea } from "@/components/admin/ui/admin-input";
import {
  HoursBreakdown,
  HoursCategory,
  HOURS_CATEGORY_LABELS,
  formatCurrency,
} from "@/types/coach";

interface Coach {
  id: string;
  name: string;
  abbreviation: string;
  hourlyRate: number;
}

interface LogHoursDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: LogHoursData) => Promise<void>;
  coaches: Coach[];
  initialData?: {
    id?: string;
    coachId: string;
    date: string;
    hoursWorked: number;
    breakdown?: HoursBreakdown;
    notes?: string;
    bonusPay?: number;
    deductions?: number;
    deductionReason?: string;
  };
  selectedDate?: string;
  selectedCoachId?: string;
}

export interface LogHoursData {
  id?: string;
  coachId: string;
  coachName: string;
  date: string;
  hoursWorked: number;
  hourlyRate: number;
  breakdown?: HoursBreakdown;
  notes?: string;
  bonusPay?: number;
  deductions?: number;
  deductionReason?: string;
}

export function LogHoursDialog({
  isOpen,
  onClose,
  onSubmit,
  coaches,
  initialData,
  selectedDate,
  selectedCoachId,
}: LogHoursDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [showModifiers, setShowModifiers] = useState(false);

  // Form state
  const [coachId, setCoachId] = useState(initialData?.coachId || selectedCoachId || "");
  const [date, setDate] = useState(initialData?.date || selectedDate || "");
  const [hoursWorked, setHoursWorked] = useState(
    initialData?.hoursWorked?.toString() || ""
  );
  const [notes, setNotes] = useState(initialData?.notes || "");
  const [bonusPay, setBonusPay] = useState(
    initialData?.bonusPay ? (initialData.bonusPay / 100).toString() : ""
  );
  const [deductions, setDeductions] = useState(
    initialData?.deductions ? (initialData.deductions / 100).toString() : ""
  );
  const [deductionReason, setDeductionReason] = useState(
    initialData?.deductionReason || ""
  );
  const [breakdown, setBreakdown] = useState<HoursBreakdown>(
    initialData?.breakdown || {}
  );

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (isOpen) {
      setCoachId(initialData?.coachId || selectedCoachId || "");
      setDate(initialData?.date || selectedDate || "");
      setHoursWorked(initialData?.hoursWorked?.toString() || "");
      setNotes(initialData?.notes || "");
      setBonusPay(
        initialData?.bonusPay ? (initialData.bonusPay / 100).toString() : ""
      );
      setDeductions(
        initialData?.deductions ? (initialData.deductions / 100).toString() : ""
      );
      setDeductionReason(initialData?.deductionReason || "");
      setBreakdown(initialData?.breakdown || {});
      setShowBreakdown(!!initialData?.breakdown);
      setShowModifiers(!!initialData?.bonusPay || !!initialData?.deductions);
    }
  }, [isOpen, initialData, selectedDate, selectedCoachId]);

  const selectedCoach = coaches.find((c) => c.id === coachId);
  const parsedHours = parseFloat(hoursWorked) || 0;
  const estimatedEarnings = selectedCoach
    ? parsedHours * selectedCoach.hourlyRate
    : 0;

  const handleBreakdownChange = (category: HoursCategory, value: string) => {
    const numValue = parseFloat(value) || 0;
    setBreakdown((prev) => ({
      ...prev,
      [category]: numValue > 0 ? numValue : undefined,
    }));
  };

  const calculateBreakdownTotal = () => {
    return Object.values(breakdown).reduce(
      (sum, val) => sum + (val || 0),
      0
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!coachId || !date || !hoursWorked) return;

    setIsLoading(true);
    try {
      const coach = coaches.find((c) => c.id === coachId);
      if (!coach) throw new Error("Coach not found");

      const data: LogHoursData = {
        id: initialData?.id,
        coachId,
        coachName: coach.name,
        date,
        hoursWorked: parsedHours,
        hourlyRate: coach.hourlyRate,
        notes: notes || undefined,
        bonusPay: bonusPay ? Math.round(parseFloat(bonusPay) * 100) : undefined,
        deductions: deductions
          ? Math.round(parseFloat(deductions) * 100)
          : undefined,
        deductionReason: deductionReason || undefined,
        breakdown: showBreakdown ? breakdown : undefined,
      };

      await onSubmit(data);
      onClose();
    } catch (error) {
      console.error("Error logging hours:", error);
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
                <Clock className="h-5 w-5 text-sky-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-neutral-900">
                  {initialData?.id ? "Edit Hours" : "Log Hours"}
                </h2>
                <p className="text-sm text-neutral-500">
                  {initialData?.id
                    ? "Update the hours for this entry"
                    : "Record hours worked for a coach"}
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Coach Selection */}
              <AdminSelect
                label="Coach"
                value={coachId}
                onChange={(e) => setCoachId(e.target.value)}
                placeholder="Select a coach"
                required
                disabled={!!initialData?.coachId}
              >
                <option value="" disabled>
                  Select a coach
                </option>
                {coaches.map((coach) => (
                  <option key={coach.id} value={coach.id}>
                    {coach.name} ({formatCurrency(coach.hourlyRate)}/hr)
                  </option>
                ))}
              </AdminSelect>

              {/* Date */}
              <AdminInput
                label="Date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                disabled={!!initialData?.date}
              />

              {/* Hours Worked */}
              <AdminInput
                label="Hours Worked"
                type="number"
                step="0.25"
                min="0"
                max="24"
                value={hoursWorked}
                onChange={(e) => setHoursWorked(e.target.value)}
                placeholder="e.g., 3.5"
                required
                hint={
                  selectedCoach && parsedHours > 0
                    ? `Estimated earnings: ${formatCurrency(estimatedEarnings)}`
                    : "Enter decimal hours (e.g., 3.5 = 3h 30m)"
                }
              />

              {/* Breakdown Toggle */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setShowBreakdown(!showBreakdown)}
                  className="flex items-center gap-2 text-sm text-sky-600 hover:text-sky-700 transition-colors"
                >
                  {showBreakdown ? (
                    <Minus className="h-4 w-4" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                  {showBreakdown ? "Hide breakdown" : "Add category breakdown"}
                </button>
              </div>

              {/* Hours Breakdown */}
              <AnimatePresence>
                {showBreakdown && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="rounded-xl border border-neutral-200 p-4 space-y-3">
                      <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                        Hours by Category
                      </p>
                      <div className="grid grid-cols-2 gap-3">
                        {(Object.keys(HOURS_CATEGORY_LABELS) as HoursCategory[]).map(
                          (category) => (
                            <div key={category}>
                              <label className="block text-xs text-neutral-600 mb-1">
                                {HOURS_CATEGORY_LABELS[category]}
                              </label>
                              <input
                                type="number"
                                step="0.25"
                                min="0"
                                value={breakdown[category] || ""}
                                onChange={(e) =>
                                  handleBreakdownChange(category, e.target.value)
                                }
                                className="w-full h-9 rounded-lg border border-neutral-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                                placeholder="0"
                              />
                            </div>
                          )
                        )}
                      </div>
                      <p className="text-xs text-neutral-500">
                        Breakdown total: {calculateBreakdownTotal().toFixed(2)}h
                        {calculateBreakdownTotal() !== parsedHours &&
                          parsedHours > 0 && (
                            <span className="text-amber-600 ml-2">
                              (Differs from total hours)
                            </span>
                          )}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Modifiers Toggle */}
              <div>
                <button
                  type="button"
                  onClick={() => setShowModifiers(!showModifiers)}
                  className="flex items-center gap-2 text-sm text-sky-600 hover:text-sky-700 transition-colors"
                >
                  {showModifiers ? (
                    <Minus className="h-4 w-4" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                  {showModifiers ? "Hide modifiers" : "Add bonus/deductions"}
                </button>
              </div>

              {/* Bonus & Deductions */}
              <AnimatePresence>
                {showModifiers && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="rounded-xl border border-neutral-200 p-4 space-y-3">
                      <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                        Pay Modifiers
                      </p>
                      <div className="grid grid-cols-2 gap-3">
                        <AdminInput
                          label="Bonus"
                          type="number"
                          step="0.01"
                          min="0"
                          value={bonusPay}
                          onChange={(e) => setBonusPay(e.target.value)}
                          placeholder="0.00"
                          hint="Additional pay"
                        />
                        <AdminInput
                          label="Deductions"
                          type="number"
                          step="0.01"
                          min="0"
                          value={deductions}
                          onChange={(e) => setDeductions(e.target.value)}
                          placeholder="0.00"
                          hint="Amount to deduct"
                        />
                      </div>
                      {parseFloat(deductions) > 0 && (
                        <AdminInput
                          label="Deduction Reason"
                          value={deductionReason}
                          onChange={(e) => setDeductionReason(e.target.value)}
                          placeholder="Reason for deduction"
                        />
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Notes */}
              <AdminTextarea
                label="Notes (optional)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any notes about this entry..."
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
                  disabled={isLoading || !coachId || !date || !hoursWorked}
                >
                  {isLoading
                    ? "Saving..."
                    : initialData?.id
                    ? "Update Hours"
                    : "Log Hours"}
                </Button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
