import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { adminDb } from "@/lib/firebase-admin";
import { sendEmail } from "@/lib/email";
import { bookingConfirmationEmail } from "@/lib/email-templates";
import { formatPrice, getDayName } from "@/lib/booking-utils";
import { LOCATIONS } from "@/lib/constants";
import Stripe from "stripe";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json(
      { error: "Webhook signature verification failed" },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }

      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentSucceeded(paymentIntent);
        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentFailed(paymentIntent);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const bookingId = session.metadata?.bookingId;

  if (!bookingId) {
    console.error("No bookingId in session metadata");
    return;
  }

  // Update booking status
  await adminDb.collection("bookings").doc(bookingId).update({
    paymentStatus: "paid",
    stripeSessionId: session.id,
    stripePaymentId: session.payment_intent as string,
    status: "confirmed",
    updatedAt: new Date(),
  });

  // Update session enrolled count
  const booking = await adminDb.collection("bookings").doc(bookingId).get();
  const bookingData = booking.data();

  if (bookingData?.sessionId) {
    const sessionRef = adminDb.collection("sessions").doc(bookingData.sessionId);
    const sessionDoc = await sessionRef.get();
    const currentEnrolled = sessionDoc.data()?.enrolled || 0;

    await sessionRef.update({
      enrolled: currentEnrolled + 1,
      updatedAt: new Date(),
    });
  }

  // Send confirmation email
  if (bookingData) {
    await sendBookingConfirmationEmail(bookingData, bookingId);
  }

  console.log(`Booking ${bookingId} payment completed`);
}

async function sendBookingConfirmationEmail(
  bookingData: FirebaseFirestore.DocumentData,
  bookingId: string
) {
  try {
    // Get session details for all booked sessions
    const sessionIds = bookingData.sessionIds || [bookingData.sessionId];
    const sessionDetails: Array<{
      name: string;
      dayOfWeek: string;
      startTime: string;
      endTime: string;
      location: string;
    }> = [];

    for (const sessionId of sessionIds) {
      if (!sessionId) continue;
      const sessionDoc = await adminDb.collection("sessions").doc(sessionId).get();
      const sessionData = sessionDoc.data();

      if (sessionData) {
        // Get program for location
        let locationName = "TBC";
        if (sessionData.programId) {
          const programDoc = await adminDb.collection("programs").doc(sessionData.programId).get();
          const programData = programDoc.data();
          if (programData?.location) {
            const loc = LOCATIONS.find((l) => l.id === programData.location);
            locationName = loc?.name || programData.location;
          }
        }

        sessionDetails.push({
          name: sessionData.name || "Football Session",
          dayOfWeek: getDayName(sessionData.dayOfWeek),
          startTime: sessionData.startTime || "TBC",
          endTime: sessionData.endTime || "TBC",
          location: locationName,
        });
      }
    }

    const emailContent = bookingConfirmationEmail({
      parentFirstName: bookingData.parentFirstName,
      childFirstName: bookingData.childFirstName,
      bookingRef: bookingData.bookingRef || bookingId.slice(0, 8).toUpperCase(),
      sessions: sessionDetails,
      totalAmount: formatPrice(bookingData.amount || 0),
    });

    const result = await sendEmail({
      to: bookingData.parentEmail,
      subject: emailContent.subject,
      html: emailContent.html,
    });

    if (!result.success) {
      console.error("Failed to send booking confirmation email:", result.error);
    }
  } catch (error) {
    console.error("Error sending booking confirmation email:", error);
  }
}

async function handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  const bookingId = paymentIntent.metadata?.bookingId;

  if (!bookingId) return;

  await adminDb.collection("bookings").doc(bookingId).update({
    paymentStatus: "paid",
    stripePaymentId: paymentIntent.id,
    updatedAt: new Date(),
  });
}

async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  const bookingId = paymentIntent.metadata?.bookingId;

  if (!bookingId) return;

  await adminDb.collection("bookings").doc(bookingId).update({
    paymentStatus: "failed",
    updatedAt: new Date(),
  });
}
