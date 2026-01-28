"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { CreditCard, Calendar, AlertCircle, CheckCircle2 } from "lucide-react";
import { formatPrice } from "@/lib/booking-utils";

export interface DepositInfo {
  enabled: boolean;
  depositAmount: number; // in pence
  balanceDue: number; // in pence
  balanceDueDate: Date;
  totalAmount: number; // in pence
}

interface PaymentOptionSelectorProps {
  depositInfo: DepositInfo | null;
  selectedOption: "full" | "deposit";
  onOptionChange: (option: "full" | "deposit") => void;
}

export function PaymentOptionSelector({
  depositInfo,
  selectedOption,
  onOptionChange,
}: PaymentOptionSelectorProps) {
  // If deposit is not enabled, don't render
  if (!depositInfo?.enabled) {
    return null;
  }

  const { depositAmount, balanceDue, balanceDueDate, totalAmount } = depositInfo;

  // Format the due date
  const formattedDueDate = new Date(balanceDueDate).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="border border-neutral-200 bg-white p-6">
      <h2 className="font-bold uppercase tracking-wide text-black mb-4">
        Payment Options
      </h2>

      <div className="space-y-3">
        {/* Pay in Full Option */}
        <label
          className={`
            relative flex cursor-pointer rounded-lg border-2 p-4 transition-all
            ${
              selectedOption === "full"
                ? "border-black bg-neutral-50"
                : "border-neutral-200 hover:border-neutral-300"
            }
          `}
        >
          <input
            type="radio"
            name="paymentOption"
            value="full"
            checked={selectedOption === "full"}
            onChange={() => onOptionChange("full")}
            className="sr-only"
          />
          <div className="flex w-full items-start gap-4">
            <div
              className={`
                flex h-5 w-5 items-center justify-center rounded-full border-2 mt-0.5
                ${selectedOption === "full" ? "border-black" : "border-neutral-300"}
              `}
            >
              {selectedOption === "full" && (
                <div className="h-2.5 w-2.5 rounded-full bg-black" />
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-black">Pay in Full</span>
                <span className="font-bold text-black">{formatPrice(totalAmount)}</span>
              </div>
              <p className="mt-1 text-sm text-neutral-500">
                Complete payment now and you're all set
              </p>
            </div>
            {selectedOption === "full" && (
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            )}
          </div>
        </label>

        {/* Pay Deposit Option */}
        <label
          className={`
            relative flex cursor-pointer rounded-lg border-2 p-4 transition-all
            ${
              selectedOption === "deposit"
                ? "border-black bg-neutral-50"
                : "border-neutral-200 hover:border-neutral-300"
            }
          `}
        >
          <input
            type="radio"
            name="paymentOption"
            value="deposit"
            checked={selectedOption === "deposit"}
            onChange={() => onOptionChange("deposit")}
            className="sr-only"
          />
          <div className="flex w-full items-start gap-4">
            <div
              className={`
                flex h-5 w-5 items-center justify-center rounded-full border-2 mt-0.5
                ${selectedOption === "deposit" ? "border-black" : "border-neutral-300"}
              `}
            >
              {selectedOption === "deposit" && (
                <div className="h-2.5 w-2.5 rounded-full bg-black" />
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-black">Pay Deposit</span>
                <span className="font-bold text-black">{formatPrice(depositAmount)}</span>
              </div>
              <p className="mt-1 text-sm text-neutral-500">
                Secure your spot now, pay the rest later
              </p>
            </div>
            {selectedOption === "deposit" && (
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            )}
          </div>
        </label>
      </div>

      {/* Deposit Details */}
      <AnimatePresence>
        {selectedOption === "deposit" && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-4 rounded-lg bg-amber-50 border border-amber-200 p-4">
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-amber-900">Balance Due Later</p>
                  <p className="mt-1 text-sm text-amber-700">
                    Remaining balance of{" "}
                    <span className="font-semibold">{formatPrice(balanceDue)}</span>{" "}
                    is due by{" "}
                    <span className="font-semibold">{formattedDueDate}</span>
                  </p>
                  <p className="mt-2 text-xs text-amber-600">
                    We'll send you a reminder email before the due date
                  </p>
                </div>
              </div>
            </div>

            {/* Payment Breakdown */}
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between text-neutral-600">
                <span>Deposit (today)</span>
                <span className="font-medium">{formatPrice(depositAmount)}</span>
              </div>
              <div className="flex justify-between text-neutral-600">
                <span>Balance (due {formattedDueDate})</span>
                <span className="font-medium">{formatPrice(balanceDue)}</span>
              </div>
              <div className="flex justify-between border-t border-neutral-200 pt-2 font-semibold text-black">
                <span>Total</span>
                <span>{formatPrice(totalAmount)}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * Calculate deposit info for cart items based on session settings
 */
export function calculateDepositInfo(
  sessions: Array<{
    depositEnabled?: boolean;
    depositAmount?: number;
    depositPercentage?: number;
    balanceDueDays?: number;
    startDate?: Date;
    price: number;
  }>,
  totalAmount: number
): DepositInfo | null {
  // Check if any session has deposits enabled
  const sessionsWithDeposits = sessions.filter((s) => s.depositEnabled);

  if (sessionsWithDeposits.length === 0) {
    return null;
  }

  // Calculate total deposit amount
  let totalDeposit = 0;
  let earliestDueDate: Date | null = null;

  for (const session of sessions) {
    if (!session.depositEnabled) {
      // If deposit not enabled, full price for this session
      totalDeposit += session.price;
      continue;
    }

    // Calculate deposit for this session
    let sessionDeposit: number;
    if (session.depositAmount) {
      // Fixed amount
      sessionDeposit = Math.min(session.depositAmount, session.price);
    } else if (session.depositPercentage) {
      // Percentage of price
      sessionDeposit = Math.round((session.price * session.depositPercentage) / 100);
    } else {
      // Default to 25% if enabled but no amount specified
      sessionDeposit = Math.round(session.price * 0.25);
    }

    totalDeposit += sessionDeposit;

    // Calculate due date
    if (session.startDate && session.balanceDueDays) {
      const startDate = new Date(session.startDate);
      const dueDate = new Date(startDate);
      dueDate.setDate(dueDate.getDate() - session.balanceDueDays);

      if (!earliestDueDate || dueDate < earliestDueDate) {
        earliestDueDate = dueDate;
      }
    }
  }

  // Default due date: 7 days before earliest session start, or 14 days from now
  if (!earliestDueDate) {
    const firstSessionWithDate = sessions.find((s) => s.startDate);
    if (firstSessionWithDate?.startDate) {
      earliestDueDate = new Date(firstSessionWithDate.startDate);
      earliestDueDate.setDate(earliestDueDate.getDate() - 7);
    } else {
      earliestDueDate = new Date();
      earliestDueDate.setDate(earliestDueDate.getDate() + 14);
    }
  }

  // Ensure due date is at least 3 days in the future
  const minDueDate = new Date();
  minDueDate.setDate(minDueDate.getDate() + 3);
  if (earliestDueDate < minDueDate) {
    earliestDueDate = minDueDate;
  }

  return {
    enabled: true,
    depositAmount: totalDeposit,
    balanceDue: totalAmount - totalDeposit,
    balanceDueDate: earliestDueDate,
    totalAmount,
  };
}
