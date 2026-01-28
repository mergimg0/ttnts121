// Refund Policy Types for Self-Cancellation

/**
 * A single refund rule that defines what percentage refund applies
 * when cancellation occurs within a certain timeframe before the session.
 */
export interface RefundRule {
  /** Days before session start when this rule applies */
  daysBeforeSession: number;
  /** Refund percentage (0-100) */
  refundPercentage: number;
}

/**
 * A refund policy containing a set of rules.
 * Rules should be ordered from longest to shortest daysBeforeSession.
 *
 * Example:
 * [{daysBeforeSession: 7, refundPercentage: 100},
 *  {daysBeforeSession: 3, refundPercentage: 50},
 *  {daysBeforeSession: 0, refundPercentage: 0}]
 *
 * This means:
 * - 7+ days before: 100% refund
 * - 3-6 days before: 50% refund
 * - 0-2 days before: 0% refund
 */
export interface RefundPolicy {
  id: string;
  name: string;
  description?: string;
  rules: RefundRule[];
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Result of a refund calculation
 */
export interface RefundCalculationResult {
  /** Amount to refund in pence */
  refundAmount: number;
  /** Refund percentage applied */
  refundPercentage: number;
  /** Human-readable explanation */
  reason: string;
  /** The rule that was applied */
  appliedRule?: RefundRule;
  /** Days until session at time of calculation */
  daysUntilSession: number;
}

/**
 * Cancellation request from customer
 */
export interface CancellationRequest {
  bookingId: string;
  reason?: string;
  requestedAt: Date;
}

/**
 * Result of a cancellation operation
 */
export interface CancellationResult {
  success: boolean;
  bookingId: string;
  refundAmount: number;
  refundPercentage: number;
  refundStatus: 'pending' | 'processed' | 'failed' | 'none';
  stripeRefundId?: string;
  error?: string;
}

// Form input types
export type CreateRefundPolicyInput = Omit<RefundPolicy, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateRefundPolicyInput = Partial<Omit<RefundPolicy, 'id' | 'createdAt' | 'updatedAt'>>;
