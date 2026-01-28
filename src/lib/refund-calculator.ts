/**
 * Refund Calculator
 *
 * Calculates refund amounts based on refund policies and time until session.
 */

import { Booking } from "@/types/booking";
import { RefundPolicy, RefundRule, RefundCalculationResult } from "@/types/refund-policy";
import { Timestamp } from "firebase/firestore";

/**
 * Default refund policy used when no policy is configured
 *
 * - 7+ days before: 100% refund
 * - 3-6 days before: 50% refund
 * - 0-2 days before: 0% refund (no refund)
 */
export const DEFAULT_REFUND_POLICY: RefundPolicy = {
  id: "default",
  name: "Standard Refund Policy",
  description: "Default refund policy for session cancellations",
  rules: [
    { daysBeforeSession: 7, refundPercentage: 100 },
    { daysBeforeSession: 3, refundPercentage: 50 },
    { daysBeforeSession: 0, refundPercentage: 0 },
  ],
  isDefault: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

/**
 * Convert a Date or Firestore Timestamp to a Date object
 */
function toDate(date: Date | Timestamp): Date {
  if (date instanceof Timestamp) {
    return date.toDate();
  }
  if (date instanceof Date) {
    return date;
  }
  // Handle serialized dates (from JSON)
  return new Date(date);
}

/**
 * Calculate the number of full days between two dates
 * Returns the number of complete days, rounding down
 */
export function calculateDaysUntilSession(sessionDate: Date, now: Date = new Date()): number {
  const sessionTime = sessionDate.getTime();
  const nowTime = now.getTime();

  // If session is in the past, return negative days
  const diffMs = sessionTime - nowTime;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  return diffDays;
}

/**
 * Find the applicable refund rule based on days until session
 *
 * Rules are checked in order from highest daysBeforeSession to lowest.
 * The first rule where daysUntilSession >= daysBeforeSession is applied.
 */
export function findApplicableRule(
  daysUntilSession: number,
  rules: RefundRule[]
): RefundRule | undefined {
  // Sort rules by daysBeforeSession descending (highest first)
  const sortedRules = [...rules].sort((a, b) => b.daysBeforeSession - a.daysBeforeSession);

  // Find the first rule that applies
  for (const rule of sortedRules) {
    if (daysUntilSession >= rule.daysBeforeSession) {
      return rule;
    }
  }

  // If no rule matches (shouldn't happen with proper policy), return undefined
  return undefined;
}

/**
 * Calculate the refund amount for a booking cancellation
 *
 * @param booking - The booking being cancelled
 * @param sessionDate - The date of the session
 * @param policy - The refund policy to apply (defaults to standard policy)
 * @param now - Current time (for testing)
 * @returns RefundCalculationResult with amount, percentage, and explanation
 */
export function calculateRefund(
  booking: Booking,
  sessionDate: Date | Timestamp,
  policy: RefundPolicy = DEFAULT_REFUND_POLICY,
  now: Date = new Date()
): RefundCalculationResult {
  const sessionDateObj = toDate(sessionDate);
  const daysUntilSession = calculateDaysUntilSession(sessionDateObj, now);

  // If session is in the past, no refund
  if (daysUntilSession < 0) {
    return {
      refundAmount: 0,
      refundPercentage: 0,
      reason: "Session has already occurred. No refund available.",
      daysUntilSession,
    };
  }

  // Find the applicable rule
  const applicableRule = findApplicableRule(daysUntilSession, policy.rules);

  if (!applicableRule) {
    return {
      refundAmount: 0,
      refundPercentage: 0,
      reason: "No applicable refund rule found.",
      daysUntilSession,
    };
  }

  // Calculate the amount paid (could be deposit or full amount)
  const amountPaid = getAmountPaid(booking);

  // Calculate refund amount
  const refundPercentage = applicableRule.refundPercentage;
  const refundAmount = Math.round((amountPaid * refundPercentage) / 100);

  // Generate human-readable reason
  const reason = generateRefundReason(
    daysUntilSession,
    refundPercentage,
    refundAmount,
    amountPaid
  );

  return {
    refundAmount,
    refundPercentage,
    reason,
    appliedRule: applicableRule,
    daysUntilSession,
  };
}

/**
 * Get the total amount paid for a booking
 * Takes into account deposits, partial payments, etc.
 */
function getAmountPaid(booking: Booking): number {
  // If deposit was paid and balance is still due
  if (booking.paymentType === "deposit" && booking.depositPaid && !booking.balancePaidAt) {
    return booking.depositPaid;
  }

  // If full payment or balance was paid
  if (booking.paymentStatus === "paid" || booking.balancePaidAt) {
    return booking.amount;
  }

  // For deposit_paid status, use deposit amount
  if (booking.paymentStatus === "deposit_paid" && booking.depositPaid) {
    return booking.depositPaid;
  }

  // Default to the booking amount
  return booking.amount;
}

/**
 * Generate a human-readable explanation of the refund
 */
function generateRefundReason(
  daysUntilSession: number,
  refundPercentage: number,
  refundAmount: number,
  amountPaid: number
): string {
  const formattedRefund = `£${(refundAmount / 100).toFixed(2)}`;
  const formattedPaid = `£${(amountPaid / 100).toFixed(2)}`;

  if (refundPercentage === 100) {
    return `Full refund of ${formattedRefund}. Cancelled ${daysUntilSession} days before the session.`;
  }

  if (refundPercentage === 0) {
    return `No refund available. Cancelled only ${daysUntilSession} days before the session.`;
  }

  return `${refundPercentage}% refund (${formattedRefund} of ${formattedPaid}). Cancelled ${daysUntilSession} days before the session.`;
}

/**
 * Preview what refund would be available at different times
 * Useful for showing customers the refund schedule
 */
export function getRefundSchedulePreview(
  booking: Booking,
  sessionDate: Date | Timestamp,
  policy: RefundPolicy = DEFAULT_REFUND_POLICY
): Array<{ daysBeforeSession: number; refundPercentage: number; refundAmount: number }> {
  const amountPaid = getAmountPaid(booking);

  return policy.rules
    .sort((a, b) => b.daysBeforeSession - a.daysBeforeSession)
    .map((rule) => ({
      daysBeforeSession: rule.daysBeforeSession,
      refundPercentage: rule.refundPercentage,
      refundAmount: Math.round((amountPaid * rule.refundPercentage) / 100),
    }));
}

/**
 * Validate a refund policy's rules
 * Returns an array of validation errors, empty if valid
 */
export function validateRefundPolicy(policy: Partial<RefundPolicy>): string[] {
  const errors: string[] = [];

  if (!policy.name || policy.name.trim() === "") {
    errors.push("Policy name is required");
  }

  if (!policy.rules || policy.rules.length === 0) {
    errors.push("At least one refund rule is required");
  } else {
    // Check each rule
    policy.rules.forEach((rule, index) => {
      if (rule.daysBeforeSession < 0) {
        errors.push(`Rule ${index + 1}: Days before session cannot be negative`);
      }
      if (rule.refundPercentage < 0 || rule.refundPercentage > 100) {
        errors.push(`Rule ${index + 1}: Refund percentage must be between 0 and 100`);
      }
    });

    // Check for a 0-day rule (required for handling last-minute cancellations)
    const hasZeroDayRule = policy.rules.some((r) => r.daysBeforeSession === 0);
    if (!hasZeroDayRule) {
      errors.push("A rule for 0 days before session is required");
    }

    // Check for duplicate days
    const days = policy.rules.map((r) => r.daysBeforeSession);
    const uniqueDays = new Set(days);
    if (days.length !== uniqueDays.size) {
      errors.push("Duplicate days before session values are not allowed");
    }
  }

  return errors;
}
