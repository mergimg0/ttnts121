import { NextRequest, NextResponse } from "next/server";
import { trackCartUpdate } from "@/lib/cart-tracking";
import { TrackCartInput } from "@/types/abandoned-cart";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, items, customerName, customerDetails } = body as TrackCartInput;

    // Validate required fields
    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { success: false, error: "Valid email is required" },
        { status: 400 }
      );
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: "Cart items are required" },
        { status: 400 }
      );
    }

    const cartId = await trackCartUpdate({
      email,
      items,
      customerName,
      customerDetails,
    });

    return NextResponse.json({
      success: true,
      data: { cartId },
    });
  } catch (error) {
    console.error("Error tracking cart:", error);
    return NextResponse.json(
      { success: false, error: "Failed to track cart" },
      { status: 500 }
    );
  }
}
