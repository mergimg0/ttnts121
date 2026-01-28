import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { deactivatePaymentLink, getPaymentLink } from "@/lib/stripe";
import { PaymentLink } from "@/types/payment";

// GET /api/admin/payment-links/[id] - Get a single payment link
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const docRef = adminDb.collection("payment_links").doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json(
        { success: false, error: "Payment link not found" },
        { status: 404 }
      );
    }

    const paymentLink: PaymentLink = {
      id: doc.id,
      ...doc.data(),
    } as PaymentLink;

    // Optionally fetch latest status from Stripe
    try {
      const stripePaymentLink = await getPaymentLink(paymentLink.stripePaymentLinkId);

      // Update local status if Stripe says it's inactive
      if (!stripePaymentLink.active && paymentLink.status === 'active') {
        await docRef.update({
          status: 'cancelled',
          updatedAt: new Date(),
        });
        paymentLink.status = 'cancelled';
      }
    } catch (stripeError) {
      console.error("Failed to fetch Stripe payment link status:", stripeError);
      // Continue with local data
    }

    return NextResponse.json({
      success: true,
      data: paymentLink,
    });
  } catch (error) {
    console.error("Error fetching payment link:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch payment link" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/payment-links/[id] - Deactivate/revoke a payment link
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const docRef = adminDb.collection("payment_links").doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json(
        { success: false, error: "Payment link not found" },
        { status: 404 }
      );
    }

    const paymentLink = doc.data() as PaymentLink;

    // Only allow deactivation of active links
    if (paymentLink.status !== 'active') {
      return NextResponse.json(
        { success: false, error: `Cannot deactivate a ${paymentLink.status} payment link` },
        { status: 400 }
      );
    }

    // Deactivate in Stripe
    try {
      await deactivatePaymentLink(paymentLink.stripePaymentLinkId);
    } catch (stripeError) {
      console.error("Failed to deactivate Stripe payment link:", stripeError);
      // Continue - we'll still update our local status
    }

    // Update status in Firestore
    await docRef.update({
      status: 'cancelled',
      updatedAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      message: "Payment link deactivated successfully",
    });
  } catch (error) {
    console.error("Error deactivating payment link:", error);
    return NextResponse.json(
      { success: false, error: "Failed to deactivate payment link" },
      { status: 500 }
    );
  }
}
