"use client";

import { useState } from "react";
import { motion } from "motion/react";
import {
  User,
  Mail,
  Calendar,
  Clock,
  Minus,
  History,
  RefreshCw,
  MoreVertical,
  AlertCircle,
} from "lucide-react";
import { AdminCard } from "@/components/admin/ui/admin-card";
import { AdminBadge } from "@/components/admin/ui/admin-badge";
import { Button } from "@/components/ui/button";
import {
  BlockBookingSummary,
  BlockBookingStatus,
  BLOCK_BOOKING_STATUS_LABELS,
} from "@/types/block-booking";

interface BlockBookingCardProps {
  booking: BlockBookingSummary;
  onDeduct: (booking: BlockBookingSummary) => void;
  onViewHistory: (booking: BlockBookingSummary) => void;
  onRefund: (booking: BlockBookingSummary) => void;
}

const statusVariants: Record<BlockBookingStatus, "success" | "warning" | "error" | "neutral"> = {
  active: "success",
  exhausted: "neutral",
  expired: "error",
  refunded: "warning",
  cancelled: "error",
};

export function BlockBookingCard({
  booking,
  onDeduct,
  onViewHistory,
  onRefund,
}: BlockBookingCardProps) {
  const [showActions, setShowActions] = useState(false);

  const formatDate = (date: unknown): string => {
    if (!date) return "-";
    const d = (date as { _seconds?: number })._seconds
      ? new Date((date as { _seconds: number })._seconds * 1000)
      : new Date(date as string | number | Date);
    return d.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP",
    }).format(amount / 100);
  };

  const progressPercentage = booking.totalSessions > 0
    ? ((booking.totalSessions - booking.remainingSessions) / booking.totalSessions) * 100
    : 0;

  return (
    <AdminCard hover={false} className="relative">
      <div className="flex flex-col gap-4">
        {/* Header Row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-[15px] font-semibold text-neutral-900 truncate">
                {booking.studentName}
              </h3>
              <AdminBadge variant={statusVariants[booking.status]}>
                {BLOCK_BOOKING_STATUS_LABELS[booking.status]}
              </AdminBadge>
              {booking.isExpiringSoon && booking.status === "active" && (
                <AdminBadge variant="warning">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Expiring Soon
                </AdminBadge>
              )}
            </div>
            <div className="flex items-center gap-4 mt-1 text-[13px] text-neutral-500">
              <span className="flex items-center gap-1">
                <User className="h-3.5 w-3.5" />
                {booking.parentName}
              </span>
              <span className="flex items-center gap-1">
                <Mail className="h-3.5 w-3.5" />
                {booking.parentEmail}
              </span>
            </div>
          </div>

          {/* Actions Menu */}
          <div className="relative">
            <button
              onClick={() => setShowActions(!showActions)}
              className="p-2 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 transition-colors"
            >
              <MoreVertical className="h-4 w-4" />
            </button>

            {showActions && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowActions(false)}
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -4 }}
                  className="absolute right-0 top-full mt-1 z-20 w-48 rounded-xl bg-white shadow-lg border border-neutral-200 py-1 overflow-hidden"
                >
                  <button
                    onClick={() => {
                      onDeduct(booking);
                      setShowActions(false);
                    }}
                    disabled={booking.status !== "active" || booking.remainingSessions === 0}
                    className="w-full px-4 py-2.5 text-left text-sm text-neutral-700 hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <Minus className="h-4 w-4" />
                    Deduct Session
                  </button>
                  <button
                    onClick={() => {
                      onViewHistory(booking);
                      setShowActions(false);
                    }}
                    className="w-full px-4 py-2.5 text-left text-sm text-neutral-700 hover:bg-neutral-50 flex items-center gap-2"
                  >
                    <History className="h-4 w-4" />
                    View History
                  </button>
                  <button
                    onClick={() => {
                      onRefund(booking);
                      setShowActions(false);
                    }}
                    disabled={booking.status === "refunded" || booking.status === "cancelled" || booking.remainingSessions === 0}
                    className="w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Refund
                  </button>
                </motion.div>
              </>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[13px]">
            <span className="text-neutral-500">Sessions Used</span>
            <span className="font-semibold text-neutral-900">
              {booking.usedSessions} / {booking.totalSessions}
              <span className="ml-1 text-neutral-400 font-normal">
                ({booking.remainingSessions} remaining)
              </span>
            </span>
          </div>
          <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPercentage}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className={`h-full rounded-full ${
                booking.remainingSessions === 0
                  ? "bg-neutral-400"
                  : booking.remainingSessions <= 2
                    ? "bg-amber-500"
                    : "bg-emerald-500"
              }`}
            />
          </div>
        </div>

        {/* Info Row */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[13px] text-neutral-500">
          <span className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            Purchased: {formatDate(booking.purchasedAt)}
          </span>
          {booking.expiresAt && (
            <span className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              Expires: {formatDate(booking.expiresAt)}
            </span>
          )}
          {booking.lastUsedAt && (
            <span className="flex items-center gap-1.5">
              <History className="h-3.5 w-3.5" />
              Last Used: {formatDate(booking.lastUsedAt)}
            </span>
          )}
        </div>

        {/* Footer Row */}
        <div className="flex items-center justify-between pt-3 border-t border-neutral-100">
          <div className="text-[13px]">
            <span className="text-neutral-500">Total Paid: </span>
            <span className="font-semibold text-neutral-900">{formatPrice(booking.totalPaid)}</span>
            <span className="text-neutral-400 ml-1">
              ({formatPrice(booking.pricePerSession)}/session)
            </span>
          </div>

          {/* Quick Deduct Button */}
          {booking.status === "active" && booking.remainingSessions > 0 && (
            <Button
              variant="adminSecondary"
              size="sm"
              onClick={() => onDeduct(booking)}
              className="gap-1.5"
            >
              <Minus className="h-3.5 w-3.5" />
              Quick Deduct
            </Button>
          )}
        </div>
      </div>
    </AdminCard>
  );
}
