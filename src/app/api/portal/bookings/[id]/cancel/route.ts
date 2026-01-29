import { NextRequest, NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/lib/firebase-admin";
import Stripe from "stripe";
import { Booking, Session } from "@/types/booking";
import { calculateRefund, DEFAULT_REFUND_POLICY } from "@/lib/refund-calculator";
import { Resend } from "resend";
import { cancellationConfirmationEmail } from "@/lib/email-templates";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-12-15.clover",
});

const resend = new Resend(process.env.RESEND_API_KEY);

// Helper to verify user from session
async function verifyUserSession(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");

  if (!token) {
    return null;
  }

  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    return decodedToken;
  } catch (error) {
    console.error("Token verification failed:", error);
    return null;
  }
}

/**
 * POST /api/portal/bookings/[id]/cancel
 *
 * Customer-initiated booking cancellation with automatic refund calculation
 * based on configured refund policies.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const decodedToken = await verifyUserSession(request);

    if (!decodedToken) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userEmail = decodedToken.email;
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const { reason } = body;

    if (!userEmail) {
      return NextResponse.json(
        { success: false, error: "User email not found" },
        { status: 400 }
      );
    }

    // Get the booking
    const bookingDoc = await adminDb.collection("bookings").doc(id).get();

    if (!bookingDoc.exists) {
      return NextResponse.json(
        { success: false, error: "Booking not found" },
        { status: 404 }
      );
    }

    const booking = { id: bookingDoc.id, ...bookingDoc.data() } as Booking;

    // Verify the booking belongs to this user
    if (booking.parentEmail.toLowerCase() !== userEmail.toLowerCase()) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 }
      );
    }

    // Check if booking can be cancelled
    if (booking.status === "cancelled") {
      return NextResponse.json(
        { success: false, error: "Booking is already cancelled" },
        { status: 400 }
      );
    }

    if (booking.paymentStatus === "refunded") {
      return NextResponse.json(
        { success: false, error: "Booking has already been refunded" },
        { status: 400 }
      );
    }

    // Get session details for refund calculation
    let session: Session | null = null;
    if (booking.sessionId) {
      const sessionDoc = await adminDb
        .collection("sessions")
        .doc(booking.sessionId)
        .get();

      if (sessionDoc.exists) {
        session = { id: sessionDoc.id, ...sessionDoc.data() } as Session;
      }
    }

    if (!session) {
      return NextResponse.json(
        { success: false, error: "Session not found" },
        { status: 404 }
      );
    }

    // Check if session has already started
    const sessionDate = session.startDate instanceof Date
      ? session.startDate
      : typeof session.startDate === 'object' && 'toDate' in session.startDate
        ? session.startDate.toDate()
        : new Date(session.startDate as unknown as string);

    if (sessionDate < new Date()) {
      return NextResponse.json(
        { success: false, error: "Cannot cancel a booking for a session that has already started" },
        { status: 400 }
      );
    }

    // Calculate refund amount
    const refundResult = calculateRefund(booking, sessionDate, DEFAULT_REFUND_POLICY);

    // Process refund if applicable
    let refundId: string | null = null;
    let actualRefundAmount = 0;

    if (refundResult.refundAmount > 0 && booking.stripePaymentIntentId) {
      try {
        // Get the payment intent to check if it can be refunded
        const paymentIntent = await stripe.paymentIntents.retrieve(
          booking.stripePaymentIntentId
        );

        if (paymentIntent.status === "succeeded") {
          // Create refund
          const refund = await stripe.refunds.create({
            payment_intent: booking.stripePaymentIntentId,
            amount: refundResult.refundAmount, // in pence
            reason: "requested_by_customer",
            metadata: {
              bookingId: booking.id,
              cancellationReason: reason || "Self-cancellation via portal",
              refundPercentage: String(refundResult.refundPercentage),
              daysBeforeSession: String(refundResult.daysUntilSession),
            },
          });

          refundId = refund.id;
          actualRefundAmount = refund.amount;
        }
      } catch (stripeError) {
        console.error("Stripe refund error:", stripeError);
        // Continue with cancellation even if refund fails
        // Admin will need to handle refund manually
      }
    }

    // Update booking status
    const cancellationData = {
      status: "cancelled" as const,
      paymentStatus: actualRefundAmount > 0
        ? (actualRefundAmount === booking.amount ? "refunded" : "partially_refunded")
        : booking.paymentStatus,
      cancelledAt: new Date().toISOString(),
      cancelledBy: "customer",
      cancellationReason: reason || "Self-cancellation via portal",
      refundAmount: actualRefundAmount,
      refundPercentage: refundResult.refundPercentage,
      refundId: refundId,
      refundExplanation: refundResult.reason,
      updatedAt: new Date().toISOString(),
    };

    await adminDb.collection("bookings").doc(id).update(cancellationData);

    // Increment session available spots
    if (session) {
      const spotsToRestore = 1; // Each booking is for one child
      await adminDb.collection("sessions").doc(session.id).update({
        enrolled: Math.max(0, (session.enrolled || 0) - spotsToRestore),
        updatedAt: new Date().toISOString(),
      });
    }

    // Send cancellation confirmation email
    try {
      const emailHtml = cancellationConfirmationEmail({
        parentName: `${booking.parentFirstName} ${booking.parentLastName}`,
        childNames: [`${booking.childFirstName} ${booking.childLastName}`],
        sessionName: session.name,
        sessionDate: sessionDate,
        refundAmount: actualRefundAmount,
        refundPercentage: refundResult.refundPercentage,
        refundExplanation: refundResult.reason,
      });

      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || "TTNTS <noreply@tabletennisluton.co.uk>",
        to: booking.parentEmail,
        subject: `Booking Cancellation Confirmed - ${session.name}`,
        html: emailHtml,
      });
    } catch (emailError) {
      console.error("Failed to send cancellation email:", emailError);
      // Continue - email failure shouldn't block cancellation
    }

    return NextResponse.json({
      success: true,
      data: {
        bookingId: booking.id,
        status: "cancelled",
        refundAmount: actualRefundAmount,
        refundPercentage: refundResult.refundPercentage,
        refundId: refundId,
        explanation: refundResult.reason,
      },
    });
  } catch (error) {
    console.error("Error cancelling booking:", error);
    return NextResponse.json(
      { success: false, error: "Failed to cancel booking" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/portal/bookings/[id]/cancel
 *
 * Preview cancellation - shows what refund would be applied without actually cancelling
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const decodedToken = await verifyUserSession(request);

    if (!decodedToken) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userEmail = decodedToken.email;
    const { id } = await params;

    if (!userEmail) {
      return NextResponse.json(
        { success: false, error: "User email not found" },
        { status: 400 }
      );
    }

    // Get the booking
    const bookingDoc = await adminDb.collection("bookings").doc(id).get();

    if (!bookingDoc.exists) {
      return NextResponse.json(
        { success: false, error: "Booking not found" },
        { status: 404 }
      );
    }

    const booking = { id: bookingDoc.id, ...bookingDoc.data() } as Booking;

    // Verify the booking belongs to this user
    if (booking.parentEmail.toLowerCase() !== userEmail.toLowerCase()) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 }
      );
    }

    // Check if booking can be cancelled
    if (booking.status === "cancelled") {
      return NextResponse.json({
        success: false,
        error: "Booking is already cancelled",
        canCancel: false,
      });
    }

    // Get session details
    let session: Session | null = null;
    if (booking.sessionId) {
      const sessionDoc = await adminDb
        .collection("sessions")
        .doc(booking.sessionId)
        .get();

      if (sessionDoc.exists) {
        session = { id: sessionDoc.id, ...sessionDoc.data() } as Session;
      }
    }

    if (!session) {
      return NextResponse.json(
        { success: false, error: "Session not found" },
        { status: 404 }
      );
    }

    // Check if session has already started
    const sessionDate = session.startDate instanceof Date
      ? session.startDate
      : typeof session.startDate === 'object' && 'toDate' in session.startDate
        ? session.startDate.toDate()
        : new Date(session.startDate as unknown as string);

    if (sessionDate < new Date()) {
      return NextResponse.json({
        success: false,
        error: "Cannot cancel a booking for a session that has already started",
        canCancel: false,
      });
    }

    // Calculate what the refund would be
    const refundResult = calculateRefund(booking, sessionDate, DEFAULT_REFUND_POLICY);

    return NextResponse.json({
      success: true,
      canCancel: true,
      data: {
        bookingId: booking.id,
        sessionName: session.name,
        sessionDate: sessionDate.toISOString(),
        originalAmount: booking.amount,
        refundAmount: refundResult.refundAmount,
        refundPercentage: refundResult.refundPercentage,
        daysUntilSession: refundResult.daysUntilSession,
        explanation: refundResult.reason,
        policy: {
          name: DEFAULT_REFUND_POLICY.name,
          rules: DEFAULT_REFUND_POLICY.rules,
        },
      },
    });
  } catch (error) {
    console.error("Error previewing cancellation:", error);
    return NextResponse.json(
      { success: false, error: "Failed to preview cancellation" },
      { status: 500 }
    );
  }
}
