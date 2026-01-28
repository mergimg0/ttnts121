import { Timestamp } from "firebase/firestore";

/**
 * Discount Rule - Defines conditions and discount amounts for cart discounts
 * Supports sibling discounts, bulk discounts, and early bird pricing
 */
export interface DiscountRule {
  id: string;
  name: string;
  description?: string;
  type: "sibling" | "bulk" | "early_bird";
  conditions: {
    /** Minimum number of children (for sibling discounts) */
    minChildren?: number;
    /** Minimum quantity of items (for bulk discounts) */
    minQuantity?: number;
    /** Days before session start (for early bird discounts) */
    daysBeforeSession?: number;
  };
  discount: {
    /** Type of discount - percentage off or fixed amount */
    type: "percentage" | "fixed";
    /** Discount value - percentage (0-100) or fixed amount in pence */
    value: number;
    /** Whether discount applies to all items or just additional ones (2nd, 3rd, etc.) */
    appliesTo: "all" | "additional";
  };
  /** Whether this rule is currently active */
  isActive: boolean;
  /** Priority for rule application - higher numbers applied first */
  priority: number;
  createdAt: Date | Timestamp;
  updatedAt?: Date | Timestamp;
}

/**
 * Cart item for discount calculation
 */
export interface DiscountCartItem {
  sessionId: string;
  childName: string;
  price: number; // in pence
  sessionStartDate?: Date; // For early bird calculation
}

/**
 * Result of applying a single discount rule
 */
export interface AppliedDiscount {
  rule: DiscountRule;
  savings: number; // in pence
  itemsAffected: number;
}

/**
 * Complete discount calculation result
 */
export interface DiscountResult {
  originalTotal: number; // in pence
  discountAmount: number; // in pence
  finalTotal: number; // in pence
  appliedRules: AppliedDiscount[];
}

/**
 * Input for creating a new discount rule
 */
export type CreateDiscountRuleInput = Omit<
  DiscountRule,
  "id" | "createdAt" | "updatedAt"
>;

/**
 * Input for updating an existing discount rule
 */
export type UpdateDiscountRuleInput = Partial<CreateDiscountRuleInput>;
