import { Timestamp } from "firebase/firestore";

/**
 * Coupon - A discount code that can be applied at checkout
 */
export interface Coupon {
  id: string;
  code: string; // Unique uppercase code (e.g., "SUMMER10")
  description?: string; // Admin-facing description
  discountType: "percentage" | "fixed";
  discountValue: number; // Percentage (0-100) or fixed amount in pence
  minPurchase?: number; // Minimum cart total in pence
  maxUses?: number; // Maximum total uses (undefined = unlimited)
  usedCount: number; // Current number of uses
  validFrom?: Date | Timestamp;
  validUntil?: Date | Timestamp;
  applicableSessions?: string[]; // Session IDs this coupon applies to (empty = all)
  isActive: boolean;
  createdAt: Date | Timestamp;
  updatedAt?: Date | Timestamp;
}

/**
 * CouponUse - Record of a coupon being used in a booking
 */
export interface CouponUse {
  id: string;
  couponId: string;
  couponCode: string;
  bookingId: string;
  discountApplied: number; // Amount discounted in pence
  usedAt: Date | Timestamp;
}

/**
 * Validation result from coupon validator
 */
export interface CouponValidationResult {
  valid: boolean;
  error?: string;
  discount?: number; // Discount amount in pence
  coupon?: Coupon;
}

/**
 * Input for creating a new coupon
 */
export type CreateCouponInput = Omit<Coupon, "id" | "usedCount" | "createdAt" | "updatedAt">;

/**
 * Input for updating an existing coupon
 */
export type UpdateCouponInput = Partial<Omit<Coupon, "id" | "createdAt">>;

/**
 * Applied coupon state for checkout
 */
export interface AppliedCoupon {
  code: string;
  couponId: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  discountAmount: number; // Calculated discount in pence
}
