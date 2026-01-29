import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import {
  BlockBooking,
  RefundBlockBookingInput,
  RefundBlockBookingResult,
} from "@/types/block-booking";

const COLLECTION = "block_bookings";

// POST /api/admin/block-bookings/[id]/refund - Refund unused sessions
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body: Omit<RefundBlockBookingInput, "blockBookingId"> =
      await request.json();

    const docRef = adminDb.collection(COLLECTION).doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json(
        { success: false, error: "Block booking not found" },
        { status: 404 }
      );
    }

    const booking = {
      id: doc.id,
      ...doc.data(),
    } as BlockBooking;

    // Check if booking can be refunded
    if (booking.status === "refunded") {
      return NextResponse.json(
        { success: false, error: "Block booking has already been refunded" },
        { status: 400 }
      );
    }

    if (booking.status === "cancelled") {
      return NextResponse.json(
        {
          success: false,
          error: "Cannot refund a cancelled block booking",
        },
        { status: 400 }
      );
    }

    // Calculate sessions to refund
    const sessionsToRefund = body.sessionsToRefund ?? booking.remainingSessions;

    if (sessionsToRefund <= 0) {
      return NextResponse.json(
        { success: false, error: "No sessions available to refund" },
        { status: 400 }
      );
    }

    if (sessionsToRefund > booking.remainingSessions) {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot refund ${sessionsToRefund} sessions. Only ${booking.remainingSessions} remaining.`,
        },
        { status: 400 }
      );
    }

    // Calculate refund amount
    const amountRefunded =
      body.refundAmount ?? sessionsToRefund * booking.pricePerSession;

    // Validate refund amount
    if (amountRefunded < 0) {
      return NextResponse.json(
        { success: false, error: "Refund amount cannot be negative" },
        { status: 400 }
      );
    }

    const maxRefundable = booking.remainingSessions * booking.pricePerSession;
    if (amountRefunded > maxRefundable) {
      return NextResponse.json(
        {
          success: false,
          error: `Refund amount exceeds maximum refundable amount of ${maxRefundable} pence`,
        },
        { status: 400 }
      );
    }

    const now = new Date();
    const newRemainingSessions = booking.remainingSessions - sessionsToRefund;

    // Determine new status
    // If all remaining sessions refunded, status becomes "refunded"
    // If partial refund and sessions remain, keep status as-is (or active)
    const newStatus =
      newRemainingSessions === 0 ? "refunded" : booking.status;

    // Prepare update data
    const updateData: Record<string, any> = {
      remainingSessions: newRemainingSessions,
      status: newStatus,
      updatedAt: now,
    };

    // Add refund metadata
    const refundRecord = {
      refundedAt: now,
      sessionsRefunded: sessionsToRefund,
      amountRefunded,
      reason: body.reason?.trim(),
    };

    // Store refund info in notes or a separate field
    const existingNotes = booking.notes || "";
    const refundNote = `[REFUND ${now.toISOString()}] ${sessionsToRefund} sessions, ${(amountRefunded / 100).toFixed(2)} GBP${body.reason ? ` - Reason: ${body.reason}` : ""}`;
    updateData.notes = existingNotes
      ? `${existingNotes}\n${refundNote}`
      : refundNote;

    // If Stripe payment, we would process the refund here
    // For now, we just record it - actual Stripe refund should be done separately
    let stripeRefundId: string | undefined;

    if (booking.stripePaymentIntentId) {
      // Note: Actual Stripe refund would be processed here
      // This is a placeholder - in production, you would:
      // 1. Call stripe.refunds.create({ payment_intent: booking.stripePaymentIntentId, amount: amountRefunded })
      // 2. Store the refund ID
      // For now, we just note that a Stripe refund may be needed
      updateData.notes += "\n[ACTION REQUIRED] Process Stripe refund manually";
    }

    await docRef.update(updateData);

    const result: RefundBlockBookingResult = {
      success: true,
      sessionsRefunded: sessionsToRefund,
      amountRefunded,
      newStatus,
      stripeRefundId,
    };

    return NextResponse.json({
      success: true,
      data: result,
      message:
        newStatus === "refunded"
          ? "Block booking fully refunded"
          : `${sessionsToRefund} sessions refunded, ${newRemainingSessions} remaining`,
    });
  } catch (error) {
    console.error("Error processing refund:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process refund" },
      { status: 500 }
    );
  }
}
