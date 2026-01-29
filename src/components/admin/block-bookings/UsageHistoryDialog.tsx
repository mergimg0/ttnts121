"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, History, Calendar, User, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AdminBadge } from "@/components/admin/ui/admin-badge";
import { BlockBookingSummary, BlockBookingDetail } from "@/types/block-booking";

interface UsageHistoryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  booking: BlockBookingSummary | null;
}

export function UsageHistoryDialog({
  isOpen,
  onClose,
  booking,
}: UsageHistoryDialogProps) {
  const [detail, setDetail] = useState<BlockBookingDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch full booking details when dialog opens
  useEffect(() => {
    if (isOpen && booking) {
      fetchDetails();
    } else {
      setDetail(null);
      setError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, booking?.id]);

  const fetchDetails = async () => {
    if (!booking) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/block-bookings/${booking.id}`);
      const data = await response.json();

      if (data.success) {
        setDetail(data.data);
      } else {
        setError(data.error || "Failed to load booking details");
      }
    } catch {
      setError("Failed to load booking details");
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (date: unknown): string => {
    if (!date) return "-";
    const d = (date as { _seconds?: number })._seconds
      ? new Date((date as { _seconds: number })._seconds * 1000)
      : new Date(date as string | number | Date);
    return d.toLocaleDateString("en-GB", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatTime = (date: unknown): string => {
    if (!date) return "";
    const d = (date as { _seconds?: number })._seconds
      ? new Date((date as { _seconds: number })._seconds * 1000)
      : new Date(date as string | number | Date);
    return d.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatSessionDate = (sessionDate: string): string => {
    const d = new Date(sessionDate);
    return d.toLocaleDateString("en-GB", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
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
            className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white shadow-xl max-h-[85vh] overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="p-6 pb-4 border-b border-neutral-100">
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute right-4 top-4 rounded-lg p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>

              {/* Icon */}
              <div className="mx-auto w-12 h-12 rounded-full bg-sky-100 flex items-center justify-center">
                <History className="h-6 w-6 text-sky-600" />
              </div>

              {/* Title */}
              <div className="mt-4 text-center">
                <h3 className="text-lg font-semibold text-neutral-900">
                  Usage History
                </h3>
                <p className="mt-1 text-sm text-neutral-600">
                  {booking.studentName} - {booking.usedSessions} of{" "}
                  {booking.totalSessions} sessions used
                </p>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
                </div>
              ) : error ? (
                <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-center">
                  <p className="text-sm text-red-600">{error}</p>
                  <Button
                    variant="adminSecondary"
                    size="sm"
                    onClick={fetchDetails}
                    className="mt-3"
                  >
                    Try Again
                  </Button>
                </div>
              ) : detail?.usageHistory && detail.usageHistory.length > 0 ? (
                <div className="space-y-3">
                  {detail.usageHistory
                    .slice()
                    .reverse()
                    .map((usage, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="rounded-xl border border-neutral-200 bg-neutral-50/50 p-4 space-y-2"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-neutral-400" />
                            <span className="font-medium text-neutral-900">
                              {formatSessionDate(usage.sessionDate)}
                            </span>
                          </div>
                          <AdminBadge variant="neutral">
                            Session #{detail.usageHistory.length - index}
                          </AdminBadge>
                        </div>

                        <div className="space-y-1 text-[13px] text-neutral-500">
                          {usage.coachName && (
                            <div className="flex items-center gap-2">
                              <User className="h-3.5 w-3.5" />
                              <span>Coach: {usage.coachName}</span>
                            </div>
                          )}
                          {usage.notes && (
                            <div className="flex items-start gap-2">
                              <FileText className="h-3.5 w-3.5 mt-0.5" />
                              <span>{usage.notes}</span>
                            </div>
                          )}
                          <div className="text-neutral-400 text-[12px]">
                            Recorded: {formatDate(usage.usedAt)} at{" "}
                            {formatTime(usage.usedAt)}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="mx-auto w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center mb-4">
                    <History className="h-6 w-6 text-neutral-400" />
                  </div>
                  <h4 className="text-[15px] font-medium text-neutral-900 mb-1">
                    No sessions used yet
                  </h4>
                  <p className="text-sm text-neutral-500">
                    Session usage will appear here once recorded
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 pt-4 border-t border-neutral-100">
              <Button
                variant="adminSecondary"
                className="w-full"
                onClick={onClose}
              >
                Close
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
