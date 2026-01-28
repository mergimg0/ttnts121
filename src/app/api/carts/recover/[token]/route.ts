import { NextRequest, NextResponse } from "next/server";
import { getCartByRecoveryToken, markCartRecovered } from "@/lib/cart-tracking";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Recovery token is required" },
        { status: 400 }
      );
    }

    const cartData = await getCartByRecoveryToken(token);

    if (!cartData) {
      return NextResponse.json(
        { success: false, error: "Invalid or expired recovery link" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: cartData,
    });
  } catch (error) {
    console.error("Error recovering cart:", error);
    return NextResponse.json(
      { success: false, error: "Failed to recover cart" },
      { status: 500 }
    );
  }
}

// Mark cart as recovered when user proceeds to checkout
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Recovery token is required" },
        { status: 400 }
      );
    }

    const cartData = await getCartByRecoveryToken(token);

    if (!cartData) {
      return NextResponse.json(
        { success: false, error: "Invalid or expired recovery link" },
        { status: 404 }
      );
    }

    // Mark the cart as recovered
    await markCartRecovered(cartData.cartId);

    return NextResponse.json({
      success: true,
      message: "Cart marked as recovered",
    });
  } catch (error) {
    console.error("Error marking cart recovered:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update cart status" },
      { status: 500 }
    );
  }
}
