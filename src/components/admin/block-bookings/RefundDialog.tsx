"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, RefreshCw, AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AdminInput, AdminTextarea } from "@/components/admin/ui/admin-input";
import { BlockBookingSummary } from "@/types/block-booking";

interface RefundDialogProps {
  isOpen: boolean;
  onClose: () => void;
  booking: BlockBookingSummary | null;
  onSubmit: (data: {
    sessionsToRefund?: number;
    refundAmount?: number;
    reason?: string;
  }) => Promise<void>;
}

export function RefundDialog({
  isOpen,
  onClose,
  booking,
  onSubmit,
}: RefundDialogProps) {
  const [sessionsToRefund, setSessionsToRefund] = useState<number | "">("");
  const [customAmount, setCustomAmount] = useState<number | "">("");
  const [useCustomAmount, setUseCustomAmount] = useState(false);
  const [reason, setReason] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (isOpen && booking) {
      setSessionsToRefund(booking.remainingSessions);
      setCustomAmount("");
      setUseCustomAmount(false);
      setReason("");
      setError(null);
    }
  }, [isOpen, booking]);

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP",
    }).format(amount / 100);
  };

  const calculatedRefundAmount =
    sessionsToRefund && booking
      ? Number(sessionsToRefund) * booking.pricePerSession
      : 0;

  const finalRefundAmount = useCustomAmount && customAmount
    ? Math.round(Number(customAmount) * 100)
    : calculatedRefundAmount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!booking) {
      setError("No booking selected");
      return;
    }

    if (!sessionsToRefund || Number(sessionsToRefund) <= 0) {
      setError("Please enter the number of sessions to refund");
      return;
    }

    if (Number(sessionsToRefund) > booking.remainingSessions) {
      setError(`Cannot refund more than ${booking.remainingSessions} sessions`);
      return;
    }

    if (useCustomAmount && (!customAmount || Number(customAmount) < 0)) {
      setError("Please enter a valid refund amount");
      return;
    }

    setIsLoading(true);
    try {
      await onSubmit({
        sessionsToRefund: Number(sessionsToRefund),
        refundAmount: useCustomAmount ? finalRefundAmount : undefined,
        reason: reason.trim() || undefined,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to process refund");
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
            <div className="mx-auto w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
              <RefreshCw className="h-6 w-6 text-red-600" />
            </div>

            {/* Header */}
            <div className="mt-4 text-center">
              <h3 className="text-lg font-semibold text-neutral-900">
                Refund Sessions
              </h3>
              <p className="mt-1 text-sm text-neutral-600">
                Refund unused sessions for{" "}
                <span className="font-medium">{booking.studentName}</span>
              </p>
              <p className="mt-1 text-[13px] text-neutral-500">
                {booking.remainingSessions} sessions remaining at{" "}
                {formatPrice(booking.pricePerSession)}/session
              </p>
            </div>

            {/* Warning */}
            <div className="mt-4 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800">
                This action cannot be undone. If the payment was made via Stripe,
                you may need to process the refund manually in the Stripe dashboard.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              {/* Sessions to Refund */}
              <AdminInput
                label="Sessions to Refund"
                type="number"
                min={1}
                max={booking.remainingSessions}
                value={sessionsToRefund}
                onChange={(e) =>
                  setSessionsToRefund(e.target.value ? Number(e.target.value) : "")
                }
                hint={`Max: ${booking.remainingSessions} sessions`}
                required
              />

              {/* Calculated Amount */}
              <div className="bg-neutral-50 rounded-xl px-4 py-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-600">
                    Calculated Refund Amount
                  </span>
                  <span className="font-semibold text-neutral-900">
                    {formatPrice(calculatedRefundAmount)}
                  </span>
                </div>
              </div>

              {/* Custom Amount Toggle */}
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useCustomAmount}
                  onChange={(e) => setUseCustomAmount(e.target.checked)}
                  className="w-4 h-4 rounded border-neutral-300 text-sky-600 focus:ring-sky-500"
                />
                <span className="text-sm text-neutral-700">
                  Use custom refund amount
                </span>
              </label>

              {/* Custom Amount Input */}
              {useCustomAmount && (
                <AdminInput
                  label="Custom Amount (GBP)"
                  type="number"
                  min={0}
                  step="0.01"
                  value={customAmount}
                  onChange={(e) =>
                    setCustomAmount(e.target.value ? Number(e.target.value) : "")
                  }
                  placeholder="0.00"
                />
              )}

              {/* Reason */}
              <AdminTextarea
                label="Reason (Optional)"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Reason for refund..."
                rows={2}
              />

              {/* Final Amount Summary */}
              {sessionsToRefund && Number(sessionsToRefund) > 0 && (
                <div className="bg-red-50 rounded-xl px-4 py-3 border border-red-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-red-700">
                      Final Refund Amount
                    </span>
                    <span className="font-semibold text-red-900">
                      {formatPrice(finalRefundAmount)}
                    </span>
                  </div>
                  <p className="text-[13px] text-red-600 mt-1">
                    {sessionsToRefund} session{Number(sessionsToRefund) !== 1 ? "s" : ""} will be
                    deducted from the booking
                  </p>
                </div>
              )}

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
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Process Refund
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
