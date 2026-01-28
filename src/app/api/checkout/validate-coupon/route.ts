import { NextRequest, NextResponse } from "next/server";
import { validateCoupon } from "@/lib/coupon-validator";

// POST /api/checkout/validate-coupon - Validate a coupon code
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, cartTotal, sessionIds } = body;

    // Validate required fields
    if (!code) {
      return NextResponse.json(
        { success: false, valid: false, error: "Coupon code is required" },
        { status: 400 }
      );
    }

    if (typeof cartTotal !== "number" || cartTotal < 0) {
      return NextResponse.json(
        { success: false, valid: false, error: "Invalid cart total" },
        { status: 400 }
      );
    }

    if (!Array.isArray(sessionIds)) {
      return NextResponse.json(
        { success: false, valid: false, error: "Session IDs must be an array" },
        { status: 400 }
      );
    }

    // Validate the coupon
    const result = await validateCoupon(code, cartTotal, sessionIds);

    if (result.valid) {
      return NextResponse.json({
        success: true,
        valid: true,
        discount: result.discount,
        coupon: {
          id: result.coupon!.id,
          code: result.coupon!.code,
          discountType: result.coupon!.discountType,
          discountValue: result.coupon!.discountValue,
          description: result.coupon!.description,
        },
      });
    } else {
      return NextResponse.json({
        success: true,
        valid: false,
        error: result.error,
      });
    }
  } catch (error) {
    console.error("Error validating coupon:", error);
    return NextResponse.json(
      { success: false, valid: false, error: "Failed to validate coupon" },
      { status: 500 }
    );
  }
}
