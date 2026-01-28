import { adminDb } from "@/lib/firebase-admin";
import {
  DiscountRule,
  DiscountCartItem,
  DiscountResult,
  AppliedDiscount,
} from "@/types/discount-rule";

/**
 * Fetches all active discount rules from Firestore, sorted by priority (descending)
 */
export async function getActiveDiscountRules(): Promise<DiscountRule[]> {
  const snapshot = await adminDb
    .collection("discountRules")
    .where("isActive", "==", true)
    .orderBy("priority", "desc")
    .get();

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as DiscountRule[];
}

/**
 * Calculates discounts for cart items based on active discount rules
 *
 * @param items - Cart items to calculate discounts for
 * @returns DiscountResult with original total, discount amount, final total, and applied rules
 */
export async function calculateDiscounts(
  items: DiscountCartItem[]
): Promise<DiscountResult> {
  if (items.length === 0) {
    return {
      originalTotal: 0,
      discountAmount: 0,
      finalTotal: 0,
      appliedRules: [],
    };
  }

  const originalTotal = items.reduce((sum, item) => sum + item.price, 0);
  const rules = await getActiveDiscountRules();
  const appliedRules: AppliedDiscount[] = [];

  let remainingTotal = originalTotal;
  let totalDiscount = 0;

  for (const rule of rules) {
    const result = applyRule(rule, items, remainingTotal);
    if (result.savings > 0) {
      appliedRules.push({
        rule,
        savings: result.savings,
        itemsAffected: result.itemsAffected,
      });
      totalDiscount += result.savings;
      remainingTotal -= result.savings;
    }
  }

  return {
    originalTotal,
    discountAmount: totalDiscount,
    finalTotal: Math.max(0, originalTotal - totalDiscount),
    appliedRules,
  };
}

/**
 * Calculates discounts synchronously when rules are already fetched
 * Useful for client-side preview or when rules are cached
 */
export function calculateDiscountsSync(
  items: DiscountCartItem[],
  rules: DiscountRule[]
): DiscountResult {
  if (items.length === 0) {
    return {
      originalTotal: 0,
      discountAmount: 0,
      finalTotal: 0,
      appliedRules: [],
    };
  }

  const originalTotal = items.reduce((sum, item) => sum + item.price, 0);
  const appliedRules: AppliedDiscount[] = [];

  // Sort rules by priority (highest first)
  const sortedRules = [...rules]
    .filter((r) => r.isActive)
    .sort((a, b) => b.priority - a.priority);

  let remainingTotal = originalTotal;
  let totalDiscount = 0;

  for (const rule of sortedRules) {
    const result = applyRule(rule, items, remainingTotal);
    if (result.savings > 0) {
      appliedRules.push({
        rule,
        savings: result.savings,
        itemsAffected: result.itemsAffected,
      });
      totalDiscount += result.savings;
      remainingTotal -= result.savings;
    }
  }

  return {
    originalTotal,
    discountAmount: totalDiscount,
    finalTotal: Math.max(0, originalTotal - totalDiscount),
    appliedRules,
  };
}

/**
 * Applies a single discount rule to cart items
 */
function applyRule(
  rule: DiscountRule,
  items: DiscountCartItem[],
  currentTotal: number
): { savings: number; itemsAffected: number } {
  // Check if rule conditions are met
  if (!checkConditions(rule, items)) {
    return { savings: 0, itemsAffected: 0 };
  }

  // Calculate discount based on rule type and appliesTo setting
  return calculateRuleDiscount(rule, items, currentTotal);
}

/**
 * Checks if discount rule conditions are met
 */
function checkConditions(
  rule: DiscountRule,
  items: DiscountCartItem[]
): boolean {
  const { conditions, type } = rule;

  switch (type) {
    case "sibling": {
      // Count unique children
      const uniqueChildren = new Set(
        items.map((item) => item.childName.toLowerCase().trim())
      );
      const minChildren = conditions.minChildren ?? 2;
      return uniqueChildren.size >= minChildren;
    }

    case "bulk": {
      const minQuantity = conditions.minQuantity ?? 2;
      return items.length >= minQuantity;
    }

    case "early_bird": {
      if (!conditions.daysBeforeSession) return false;

      const now = new Date();
      // Check if any item qualifies for early bird
      return items.some((item) => {
        if (!item.sessionStartDate) return false;
        const sessionDate = new Date(item.sessionStartDate);
        const daysUntil = Math.floor(
          (sessionDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );
        return daysUntil >= conditions.daysBeforeSession!;
      });
    }

    default:
      return false;
  }
}

/**
 * Calculates the actual discount amount for a rule
 */
function calculateRuleDiscount(
  rule: DiscountRule,
  items: DiscountCartItem[],
  currentTotal: number
): { savings: number; itemsAffected: number } {
  const { discount, type } = rule;

  // Determine which items the discount applies to
  let applicableItems: DiscountCartItem[];
  let itemsAffected: number;

  if (discount.appliesTo === "additional") {
    // For sibling discounts, apply to all but the first child's bookings
    // For bulk, apply to all but the first item
    if (type === "sibling") {
      // Group by child, then exclude first child's items
      const childrenItems = groupItemsByChild(items);
      const sortedChildren = Object.entries(childrenItems).sort(
        ([, a], [, b]) => {
          // Sort by total value (first child = highest value, no discount)
          const totalA = a.reduce((sum, item) => sum + item.price, 0);
          const totalB = b.reduce((sum, item) => sum + item.price, 0);
          return totalB - totalA;
        }
      );

      // Skip first child, discount the rest
      applicableItems = sortedChildren.slice(1).flatMap(([, items]) => items);
      itemsAffected = applicableItems.length;
    } else {
      // For bulk, apply to all items after the first
      const sortedItems = [...items].sort((a, b) => b.price - a.price);
      applicableItems = sortedItems.slice(1);
      itemsAffected = applicableItems.length;
    }
  } else {
    // Apply to all items
    applicableItems = items;
    itemsAffected = items.length;
  }

  if (applicableItems.length === 0) {
    return { savings: 0, itemsAffected: 0 };
  }

  // Calculate savings based on discount type
  let savings: number;

  if (discount.type === "percentage") {
    const applicableTotal = applicableItems.reduce(
      (sum, item) => sum + item.price,
      0
    );
    savings = Math.round((applicableTotal * discount.value) / 100);
  } else {
    // Fixed amount per applicable item
    savings = discount.value * applicableItems.length;
  }

  // Don't exceed current total
  savings = Math.min(savings, currentTotal);

  return { savings, itemsAffected };
}

/**
 * Groups cart items by child name
 */
function groupItemsByChild(
  items: DiscountCartItem[]
): Record<string, DiscountCartItem[]> {
  return items.reduce(
    (groups, item) => {
      const childKey = item.childName.toLowerCase().trim();
      if (!groups[childKey]) {
        groups[childKey] = [];
      }
      groups[childKey].push(item);
      return groups;
    },
    {} as Record<string, DiscountCartItem[]>
  );
}

// Client-safe utility functions are in discount-utils.ts
