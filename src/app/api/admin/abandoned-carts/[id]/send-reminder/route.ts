import { NextRequest, NextResponse } from "next/server";
import { getAbandonedCartById, markRecoveryEmailSent } from "@/lib/cart-tracking";
import { sendEmail } from "@/lib/email";
import { cartAbandonmentRecoveryEmail } from "@/lib/email-templates";
import { formatPrice, getDayName } from "@/lib/booking-utils";
import { toDate } from "@/lib/booking-utils";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Cart ID is required" },
        { status: 400 }
      );
    }

    const cart = await getAbandonedCartById(id);

    if (!cart) {
      return NextResponse.json(
        { success: false, error: "Cart not found" },
        { status: 404 }
      );
    }

    // Check if already recovered
    if (cart.recovered) {
      return NextResponse.json(
        { success: false, error: "Cart has already been recovered" },
        { status: 400 }
      );
    }

    // Build recovery link
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://ttnts.co.uk";
    const recoveryLink = `${baseUrl}/recover-cart/${cart.recoveryToken}`;

    // Format cart items for email
    const items = cart.items.map((item) => ({
      sessionName: item.sessionName,
      programName: item.programName,
      dayOfWeek: getDayName(item.dayOfWeek),
      startTime: item.startTime,
      price: formatPrice(item.price),
    }));

    // Format expiry date
    const expiresAt = toDate(cart.expiresAt);
    const expiresAtFormatted = expiresAt.toLocaleDateString("en-GB", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    // Generate email content
    const emailContent = cartAbandonmentRecoveryEmail({
      customerName: cart.customerName || cart.customerDetails?.parentFirstName,
      items,
      totalAmount: formatPrice(cart.totalAmount),
      recoveryLink,
      expiresAt: expiresAtFormatted,
    });

    // Send the email
    const result = await sendEmail({
      to: cart.email,
      subject: emailContent.subject,
      html: emailContent.html,
    });

    if (!result.success) {
      console.error("Failed to send recovery email:", result.error);
      return NextResponse.json(
        { success: false, error: "Failed to send email" },
        { status: 500 }
      );
    }

    // Mark email as sent
    await markRecoveryEmailSent(id);

    return NextResponse.json({
      success: true,
      message: "Recovery email sent successfully",
    });
  } catch (error) {
    console.error("Error sending recovery email:", error);
    return NextResponse.json(
      { success: false, error: "Failed to send recovery email" },
      { status: 500 }
    );
  }
}
