import { NextRequest, NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/lib/firebase-admin";
import { stripe } from "@/lib/stripe";
import { Booking, Session } from "@/types/booking";
import { sendEmail } from "@/lib/email";
import { transferConfirmationEmail } from "@/lib/email-templates";

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

// Helper to get day name
function getDayName(dayOfWeek: number): string {
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  return days[dayOfWeek] || "Unknown";
}

// POST process transfer
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
    const body = await request.json();
    const { newSessionId } = body;

    if (!userEmail) {
      return NextResponse.json(
        { success: false, error: "User email not found" },
        { status: 400 }
      );
    }

    if (!newSessionId) {
      return NextResponse.json(
        { success: false, error: "New session ID is required" },
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

    // Check booking is eligible for transfer
    if (booking.status !== "confirmed" || booking.paymentStatus !== "paid") {
      return NextResponse.json(
        { success: false, error: "Only confirmed and paid bookings can be transferred" },
        { status: 400 }
      );
    }

    // Get the current (old) session
    const oldSessionDoc = await adminDb
      .collection("sessions")
      .doc(booking.sessionId)
      .get();

    if (!oldSessionDoc.exists) {
      return NextResponse.json(
        { success: false, error: "Current session not found" },
        { status: 404 }
      );
    }

    const oldSession = {
      id: oldSessionDoc.id,
      ...oldSessionDoc.data(),
    } as Session;

    // Get the new session
    const newSessionDoc = await adminDb
      .collection("sessions")
      .doc(newSessionId)
      .get();

    if (!newSessionDoc.exists) {
      return NextResponse.json(
        { success: false, error: "New session not found" },
        { status: 404 }
      );
    }

    const newSession = {
      id: newSessionDoc.id,
      ...newSessionDoc.data(),
    } as Session;

    // Verify new session has availability
    const spotsLeft = newSession.capacity - newSession.enrolled;
    if (spotsLeft <= 0 || newSession.isForceClosed) {
      return NextResponse.json(
        { success: false, error: "Selected session is full" },
        { status: 400 }
      );
    }

    // Calculate price difference
    const priceDifference = newSession.price - oldSession.price;

    // Handle price difference scenarios
    if (priceDifference > 0) {
      // UPGRADE: Customer needs to pay more - create Stripe checkout
      const checkoutSession = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "gbp",
              product_data: {
                name: `Transfer Upgrade: ${oldSession.name} to ${newSession.name}`,
                description: `Session transfer price difference for ${booking.childFirstName} ${booking.childLastName}`,
              },
              unit_amount: priceDifference,
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        success_url: `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/portal/bookings/${booking.id}?transfer=success`,
        cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/portal/bookings/${booking.id}/transfer?cancelled=true`,
        customer_email: booking.parentEmail,
        metadata: {
          type: "session_transfer",
          bookingId: booking.id,
          oldSessionId: oldSession.id,
          newSessionId: newSession.id,
          priceDifference: priceDifference.toString(),
        },
      });

      return NextResponse.json({
        success: true,
        data: {
          action: "checkout_required",
          checkoutUrl: checkoutSession.url,
          priceDifference,
        },
      });
    } else if (priceDifference < 0) {
      // DOWNGRADE: Customer gets a partial refund
      const refundAmount = Math.abs(priceDifference);

      // Process refund if we have a payment intent
      if (booking.stripePaymentIntentId) {
        try {
          await stripe.refunds.create({
            payment_intent: booking.stripePaymentIntentId,
            amount: refundAmount,
            reason: "requested_by_customer",
            metadata: {
              type: "session_transfer_downgrade",
              bookingId: booking.id,
              oldSessionId: oldSession.id,
              newSessionId: newSession.id,
            },
          });
        } catch (refundError) {
          console.error("Refund error:", refundError);
          // Continue with transfer even if refund fails - admin can handle manually
        }
      }

      // Process the transfer
      await processTransfer(booking, oldSession, newSession, priceDifference);

      return NextResponse.json({
        success: true,
        data: {
          action: "transfer_complete",
          refundAmount,
          message: `Transfer complete. A refund of £${(refundAmount / 100).toFixed(2)} will be processed.`,
        },
      });
    } else {
      // SAME PRICE: Direct transfer
      await processTransfer(booking, oldSession, newSession, 0);

      return NextResponse.json({
        success: true,
        data: {
          action: "transfer_complete",
          message: "Transfer complete. No payment adjustment needed.",
        },
      });
    }
  } catch (error) {
    console.error("Error processing transfer:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process transfer" },
      { status: 500 }
    );
  }
}

// Helper function to process the actual transfer
async function processTransfer(
  booking: Booking,
  oldSession: Session,
  newSession: Session,
  priceDifference: number
) {
  const batch = adminDb.batch();

  // Update booking with new session
  const bookingRef = adminDb.collection("bookings").doc(booking.id);
  batch.update(bookingRef, {
    sessionId: newSession.id,
    transferredFrom: oldSession.id,
    transferredAt: new Date(),
    transferPriceDifference: priceDifference,
    amount: newSession.price, // Update to new session price
    updatedAt: new Date(),
  });

  // Decrement old session enrolled count
  const oldSessionRef = adminDb.collection("sessions").doc(oldSession.id);
  batch.update(oldSessionRef, {
    enrolled: Math.max(0, oldSession.enrolled - 1),
    updatedAt: new Date(),
  });

  // Increment new session enrolled count
  const newSessionRef = adminDb.collection("sessions").doc(newSession.id);
  batch.update(newSessionRef, {
    enrolled: newSession.enrolled + 1,
    updatedAt: new Date(),
  });

  await batch.commit();

  // Send transfer confirmation email
  try {
    const emailData = transferConfirmationEmail({
      parentFirstName: booking.parentFirstName,
      childFirstName: booking.childFirstName,
      bookingRef: booking.bookingRef,
      oldSession: {
        name: oldSession.name,
        dayOfWeek: getDayName(oldSession.dayOfWeek),
        startTime: oldSession.startTime,
        endTime: oldSession.endTime,
        location: oldSession.location,
        price: `£${(oldSession.price / 100).toFixed(2)}`,
      },
      newSession: {
        name: newSession.name,
        dayOfWeek: getDayName(newSession.dayOfWeek),
        startTime: newSession.startTime,
        endTime: newSession.endTime,
        location: newSession.location,
        price: `£${(newSession.price / 100).toFixed(2)}`,
      },
      priceDifference: priceDifference !== 0
        ? `£${(Math.abs(priceDifference) / 100).toFixed(2)} ${priceDifference > 0 ? "charged" : "refunded"}`
        : undefined,
    });

    await sendEmail({
      to: booking.parentEmail,
      subject: emailData.subject,
      html: emailData.html,
    });
  } catch (emailError) {
    console.error("Failed to send transfer confirmation email:", emailError);
    // Don't fail the transfer if email fails
  }
}
