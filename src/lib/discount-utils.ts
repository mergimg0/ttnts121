import { DiscountRule } from "@/types/discount-rule";

/**
 * Format discount for display
 */
export function formatDiscountDescription(rule: DiscountRule): string {
  const { discount, type, conditions } = rule;

  const discountText =
    discount.type === "percentage"
      ? `${discount.value}% off`
      : `${(discount.value / 100).toFixed(2)} off`;

  const appliesText =
    discount.appliesTo === "additional"
      ? "additional bookings"
      : "all bookings";

  switch (type) {
    case "sibling":
      return `${discountText} ${appliesText} when booking for ${conditions.minChildren || 2}+ children`;
    case "bulk":
      return `${discountText} ${appliesText} when booking ${conditions.minQuantity || 2}+ sessions`;
    case "early_bird":
      return `${discountText} when booking ${conditions.daysBeforeSession}+ days in advance`;
    default:
      return `${discountText} ${appliesText}`;
  }
}

/**
 * Format discount value for display
 */
export function formatDiscountValue(rule: DiscountRule): string {
  if (rule.discount.type === "percentage") {
    return `${rule.discount.value}%`;
  }
  return `${(rule.discount.value / 100).toFixed(2)}`;
}
