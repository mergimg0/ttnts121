import { adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { Coupon, CouponValidationResult } from "@/types/coupon";

/**
 * Validate a coupon code against the cart
 *
 * @param code - The coupon code to validate
 * @param cartTotal - The cart total in pence before discount
 * @param sessionIds - Array of session IDs in the cart
 * @returns Validation result with discount amount if valid
 */
export async function validateCoupon(
  code: string,
  cartTotal: number,
  sessionIds: string[]
): Promise<CouponValidationResult> {
  // Normalize code to uppercase
  const normalizedCode = code.trim().toUpperCase();

  if (!normalizedCode) {
    return { valid: false, error: "Please enter a coupon code" };
  }

  try {
    // Find coupon by code
    const snapshot = await adminDb
      .collection("coupons")
      .where("code", "==", normalizedCode)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return { valid: false, error: "Invalid coupon code" };
    }

    const doc = snapshot.docs[0];
    const coupon = { id: doc.id, ...doc.data() } as Coupon;

    // Check if coupon is active
    if (!coupon.isActive) {
      return { valid: false, error: "This coupon is no longer active" };
    }

    // Check validity dates
    const now = new Date();

    if (coupon.validFrom) {
      const validFrom = toDate(coupon.validFrom);
      if (now < validFrom) {
        return { valid: false, error: "This coupon is not yet valid" };
      }
    }

    if (coupon.validUntil) {
      const validUntil = toDate(coupon.validUntil);
      if (now > validUntil) {
        return { valid: false, error: "This coupon has expired" };
      }
    }

    // Check max uses
    if (coupon.maxUses !== undefined && coupon.usedCount >= coupon.maxUses) {
      return { valid: false, error: "This coupon has reached its usage limit" };
    }

    // Check minimum purchase
    if (coupon.minPurchase && cartTotal < coupon.minPurchase) {
      const minPurchaseFormatted = formatPence(coupon.minPurchase);
      return {
        valid: false,
        error: `Minimum purchase of ${minPurchaseFormatted} required for this coupon`,
      };
    }

    // Check applicable sessions
    if (coupon.applicableSessions && coupon.applicableSessions.length > 0) {
      const applicableInCart = sessionIds.some((id) =>
        coupon.applicableSessions!.includes(id)
      );
      if (!applicableInCart) {
        return {
          valid: false,
          error: "This coupon is not valid for the items in your cart",
        };
      }
    }

    // Calculate discount
    const discount = calculateDiscount(coupon, cartTotal, sessionIds);

    return {
      valid: true,
      discount,
      coupon,
    };
  } catch (error) {
    console.error("Error validating coupon:", error);
    return { valid: false, error: "Failed to validate coupon. Please try again." };
  }
}

/**
 * Calculate the discount amount for a coupon
 */
export function calculateDiscount(
  coupon: Coupon,
  cartTotal: number,
  sessionIds: string[]
): number {
  // Determine the applicable amount (for session-specific coupons)
  let applicableAmount = cartTotal;

  // For session-specific coupons, we would need session prices
  // For now, apply to total cart (session-specific logic would require price lookup)

  let discount: number;

  if (coupon.discountType === "percentage") {
    // Percentage discount (discountValue is 0-100)
    discount = Math.round((applicableAmount * coupon.discountValue) / 100);
  } else {
    // Fixed discount (discountValue is in pence)
    discount = coupon.discountValue;
  }

  // Ensure discount doesn't exceed cart total
  return Math.min(discount, cartTotal);
}

/**
 * Record a coupon use after successful payment
 */
export async function recordCouponUse(
  couponId: string,
  couponCode: string,
  bookingId: string,
  discountApplied: number
): Promise<void> {
  const batch = adminDb.batch();

  // Create coupon use record
  const couponUseRef = adminDb.collection("coupon_uses").doc();
  batch.set(couponUseRef, {
    couponId,
    couponCode,
    bookingId,
    discountApplied,
    usedAt: new Date(),
  });

  // Increment used count on coupon
  const couponRef = adminDb.collection("coupons").doc(couponId);
  batch.update(couponRef, {
    usedCount: FieldValue.increment(1),
    updatedAt: new Date(),
  });

  await batch.commit();
}

/**
 * Convert Firestore Timestamp or Date to Date
 */
function toDate(value: any): Date {
  if (!value) return new Date(0);
  if (value._seconds !== undefined) {
    return new Date(value._seconds * 1000);
  }
  if (value.toDate && typeof value.toDate === "function") {
    return value.toDate();
  }
  return new Date(value);
}

/**
 * Format pence as currency string
 */
function formatPence(pence: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(pence / 100);
}
