"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  Plus,
  User,
  Mail,
  Phone,
  Calendar,
  CreditCard,
  Loader2,
  Package,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AdminInput, AdminTextarea } from "@/components/admin/ui/admin-input";
import { AdminSelect } from "@/components/admin/ui/admin-select";
import { BLOCK_BOOKING_PACKAGES } from "@/types/block-booking";

interface AddBlockBookingDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    studentName: string;
    parentName: string;
    parentEmail: string;
    parentPhone?: string;
    totalSessions: number;
    totalPaid: number;
    pricePerSession?: number;
    paymentMethod?: "card" | "cash" | "bank_transfer" | "payment_link";
    expiresAt?: string;
    notes?: string;
    purchasedAt?: string;
  }) => Promise<void>;
}

export function AddBlockBookingDialog({
  isOpen,
  onClose,
  onSubmit,
}: AddBlockBookingDialogProps) {
  // Form state
  const [studentName, setStudentName] = useState("");
  const [parentName, setParentName] = useState("");
  const [parentEmail, setParentEmail] = useState("");
  const [parentPhone, setParentPhone] = useState("");
  const [totalSessions, setTotalSessions] = useState<number | "">("");
  const [totalPaid, setTotalPaid] = useState<number | "">("");
  const [paymentMethod, setPaymentMethod] = useState<string>("");
  const [expiresAt, setExpiresAt] = useState("");
  const [purchasedAt, setPurchasedAt] = useState("");
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Calculate price per session
  const pricePerSession =
    totalSessions && totalPaid
      ? Math.round((Number(totalPaid) * 100) / Number(totalSessions))
      : 0;

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (isOpen) {
      setStudentName("");
      setParentName("");
      setParentEmail("");
      setParentPhone("");
      setTotalSessions("");
      setTotalPaid("");
      setPaymentMethod("");
      setExpiresAt("");
      setPurchasedAt(new Date().toISOString().split("T")[0]);
      setNotes("");
      setError(null);
    }
  }, [isOpen]);

  const handlePackageSelect = (sessions: number) => {
    setTotalSessions(sessions);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!studentName.trim()) {
      setError("Student name is required");
      return;
    }
    if (!parentName.trim()) {
      setError("Parent name is required");
      return;
    }
    if (!parentEmail.trim()) {
      setError("Parent email is required");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(parentEmail)) {
      setError("Please enter a valid email address");
      return;
    }
    if (!totalSessions || Number(totalSessions) <= 0) {
      setError("Number of sessions must be greater than 0");
      return;
    }
    if (!totalPaid || Number(totalPaid) < 0) {
      setError("Total paid must be a valid amount");
      return;
    }

    setIsLoading(true);
    try {
      await onSubmit({
        studentName: studentName.trim(),
        parentName: parentName.trim(),
        parentEmail: parentEmail.trim().toLowerCase(),
        parentPhone: parentPhone.trim() || undefined,
        totalSessions: Number(totalSessions),
        totalPaid: Math.round(Number(totalPaid) * 100), // Convert to pence
        pricePerSession,
        paymentMethod: paymentMethod as "card" | "cash" | "bank_transfer" | "payment_link" | undefined,
        expiresAt: expiresAt || undefined,
        purchasedAt: purchasedAt || undefined,
        notes: notes.trim() || undefined,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create block booking");
    } finally {
      setIsLoading(false);
    }
  };

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP",
    }).format(amount / 100);
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
            className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white shadow-xl max-h-[90vh] overflow-y-auto"
          >
            <div className="sticky top-0 bg-white p-6 pb-0 border-b border-neutral-100 z-10">
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute right-4 top-4 rounded-lg p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>

              {/* Icon */}
              <div className="mx-auto w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
                <Package className="h-6 w-6 text-emerald-600" />
              </div>

              {/* Header */}
              <div className="mt-4 text-center pb-4">
                <h3 className="text-lg font-semibold text-neutral-900">
                  Add Block Booking
                </h3>
                <p className="mt-1 text-sm text-neutral-600">
                  Create a new pre-paid session package
                </p>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Student Info Section */}
              <div className="space-y-4">
                <h4 className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                  Student Information
                </h4>
                <AdminInput
                  label="Student Name"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder="Enter student name"
                  leftIcon={<User className="h-4 w-4" />}
                  required
                />
              </div>

              {/* Parent Info Section */}
              <div className="space-y-4">
                <h4 className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                  Parent / Guardian
                </h4>
                <AdminInput
                  label="Parent Name"
                  value={parentName}
                  onChange={(e) => setParentName(e.target.value)}
                  placeholder="Enter parent name"
                  leftIcon={<User className="h-4 w-4" />}
                  required
                />
                <AdminInput
                  label="Email"
                  type="email"
                  value={parentEmail}
                  onChange={(e) => setParentEmail(e.target.value)}
                  placeholder="parent@example.com"
                  leftIcon={<Mail className="h-4 w-4" />}
                  required
                />
                <AdminInput
                  label="Phone (Optional)"
                  type="tel"
                  value={parentPhone}
                  onChange={(e) => setParentPhone(e.target.value)}
                  placeholder="07123 456789"
                  leftIcon={<Phone className="h-4 w-4" />}
                />
              </div>

              {/* Package Selection */}
              <div className="space-y-4">
                <h4 className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                  Session Package
                </h4>
                <div className="flex flex-wrap gap-2">
                  {BLOCK_BOOKING_PACKAGES.map((pkg) => (
                    <button
                      key={pkg.sessions}
                      type="button"
                      onClick={() => handlePackageSelect(pkg.sessions)}
                      className={`px-4 py-2 text-sm font-medium rounded-xl transition-all duration-200 ${
                        totalSessions === pkg.sessions
                          ? "bg-navy text-white shadow-sm"
                          : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                      }`}
                    >
                      {pkg.label}
                    </button>
                  ))}
                </div>
                <AdminInput
                  label="Number of Sessions"
                  type="number"
                  min={1}
                  value={totalSessions}
                  onChange={(e) =>
                    setTotalSessions(e.target.value ? Number(e.target.value) : "")
                  }
                  placeholder="Enter custom number"
                  required
                />
              </div>

              {/* Payment Section */}
              <div className="space-y-4">
                <h4 className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                  Payment Details
                </h4>
                <AdminInput
                  label="Total Amount (GBP)"
                  type="number"
                  min={0}
                  step="0.01"
                  value={totalPaid}
                  onChange={(e) =>
                    setTotalPaid(e.target.value ? Number(e.target.value) : "")
                  }
                  placeholder="0.00"
                  leftIcon={<CreditCard className="h-4 w-4" />}
                  required
                />

                {pricePerSession > 0 && (
                  <div className="bg-sky-50 rounded-xl px-4 py-3">
                    <p className="text-sm text-sky-700">
                      Price per session:{" "}
                      <span className="font-semibold">{formatPrice(pricePerSession)}</span>
                    </p>
                  </div>
                )}

                <AdminSelect
                  label="Payment Method"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  placeholder="Select payment method"
                  options={[
                    { value: "card", label: "Card" },
                    { value: "cash", label: "Cash" },
                    { value: "bank_transfer", label: "Bank Transfer" },
                    { value: "payment_link", label: "Payment Link" },
                  ]}
                />
              </div>

              {/* Dates Section */}
              <div className="space-y-4">
                <h4 className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                  Dates
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <AdminInput
                    label="Purchase Date"
                    type="date"
                    value={purchasedAt}
                    onChange={(e) => setPurchasedAt(e.target.value)}
                    leftIcon={<Calendar className="h-4 w-4" />}
                  />
                  <AdminInput
                    label="Expiry Date (Optional)"
                    type="date"
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                    leftIcon={<Calendar className="h-4 w-4" />}
                    hint="Leave empty for no expiry"
                  />
                </div>
              </div>

              {/* Notes */}
              <AdminTextarea
                label="Notes (Optional)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any notes about this booking..."
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
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      Create Booking
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
