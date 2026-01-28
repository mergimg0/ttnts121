import { NextRequest, NextResponse } from "next/server";
import { calculateDiscounts } from "@/lib/discount-calculator";
import { DiscountCartItem } from "@/types/discount-rule";

/**
 * POST /api/discounts/calculate
 * Calculates applicable automatic discounts for cart items
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.items || !Array.isArray(body.items)) {
      return NextResponse.json(
        { success: false, error: "Items array is required" },
        { status: 400 }
      );
    }

    // Transform items to DiscountCartItem format
    const cartItems: DiscountCartItem[] = body.items.map((item: {
      sessionId: string;
      childName?: string;
      price: number;
      sessionStartDate?: string;
    }) => ({
      sessionId: item.sessionId,
      childName: item.childName || "Unknown",
      price: item.price,
      sessionStartDate: item.sessionStartDate ? new Date(item.sessionStartDate) : undefined,
    }));

    const result = await calculateDiscounts(cartItems);

    return NextResponse.json({
      success: true,
      data: {
        originalTotal: result.originalTotal,
        discountAmount: result.discountAmount,
        finalTotal: result.finalTotal,
        appliedRules: result.appliedRules.map((applied) => ({
          ruleId: applied.rule.id,
          ruleName: applied.rule.name,
          ruleType: applied.rule.type,
          savings: applied.savings,
          itemsAffected: applied.itemsAffected,
          discountDescription: getDiscountDescription(applied.rule),
        })),
      },
    });
  } catch (error) {
    console.error("Error calculating discounts:", error);
    return NextResponse.json(
      { success: false, error: "Failed to calculate discounts" },
      { status: 500 }
    );
  }
}

function getDiscountDescription(rule: {
  type: string;
  discount: { type: string; value: number; appliesTo: string };
  conditions: { minChildren?: number; minQuantity?: number; daysBeforeSession?: number };
}): string {
  const discountText =
    rule.discount.type === "percentage"
      ? `${rule.discount.value}% off`
      : `${(rule.discount.value / 100).toFixed(2)} off`;

  switch (rule.type) {
    case "sibling":
      return `${discountText} for booking multiple children`;
    case "bulk":
      return `${discountText} for booking ${rule.conditions.minQuantity}+ sessions`;
    case "early_bird":
      return `${discountText} for early booking`;
    default:
      return discountText;
  }
}
