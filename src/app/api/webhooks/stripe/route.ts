import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { adminDb } from "@/lib/firebase-admin";
import { sendEmail } from "@/lib/email";
import {
  bookingConfirmationEmail,
  bookingConfirmationWithQREmail,
  paymentFailureEmail,
  refundConfirmationEmail,
  checkoutAbandonedEmail,
} from "@/lib/email-templates";
import { formatPrice, getDayName } from "@/lib/booking-utils";
import { LOCATIONS } from "@/lib/constants";
import { generateBookingQRCode, QRCodeData } from "@/lib/qr-code";
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

  // Timestamp validation to prevent replay attacks (defense in depth)
  const WEBHOOK_TOLERANCE_SECONDS = 300; // 5 minutes
  const timestampMatch = signature.match(/t=(\d+)/);

  if (timestampMatch) {
    const webhookTimestamp = parseInt(timestampMatch[1], 10);
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const timeDifference = Math.abs(currentTimestamp - webhookTimestamp);

    if (timeDifference > WEBHOOK_TOLERANCE_SECONDS) {
      console.warn(`Webhook timestamp too old: ${timeDifference}s difference`);
      return NextResponse.json(
        { error: "Webhook timestamp outside tolerance window" },
        { status: 400 }
      );
    }
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        // Check if this came from a payment link
        if (session.payment_link) {
          await handlePaymentLinkCompleted(session);
        } else {
          await handleCheckoutCompleted(session);
        }
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

      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        await handleRefund(charge);
        break;
      }

      case "checkout.session.expired": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutExpired(session);
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
  const paymentType = session.metadata?.paymentType;

  if (!bookingId) {
    console.error("No bookingId in session metadata");
    return;
  }

  // Check if this is a balance payment
  if (paymentType === "balance") {
    await handleBalancePaymentCompleted(session, bookingId);
    return;
  }

  // Check if this is a deposit payment
  if (paymentType === "deposit") {
    await handleDepositPaymentCompleted(session, bookingId);
    return;
  }

  // Full payment - Update booking status
  await adminDb.collection("bookings").doc(bookingId).update({
    paymentStatus: "paid",
    paymentType: "full",
    stripeSessionId: session.id,
    stripePaymentId: session.payment_intent as string,
    status: "confirmed",
    updatedAt: new Date(),
  });

  // Update session enrolled count
  const booking = await adminDb.collection("bookings").doc(bookingId).get();
  const bookingData = booking.data();

  // Handle both sessionId (singular) and sessionIds (array) formats
  const sessionIds = bookingData?.sessionIds || (bookingData?.sessionId ? [bookingData.sessionId] : []);

  for (const sessionId of sessionIds) {
    if (!sessionId) continue;
    const sessionRef = adminDb.collection("sessions").doc(sessionId);
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

// Handle deposit payment completion
async function handleDepositPaymentCompleted(
  session: Stripe.Checkout.Session,
  bookingId: string
) {
  const depositAmount = parseInt(session.metadata?.depositAmount || "0", 10);
  const balanceDue = parseInt(session.metadata?.balanceDue || "0", 10);
  const balanceDueDate = session.metadata?.balanceDueDate
    ? new Date(session.metadata.balanceDueDate)
    : null;

  // Update booking with deposit payment status
  await adminDb.collection("bookings").doc(bookingId).update({
    paymentStatus: "deposit_paid",
    paymentType: "deposit",
    depositPaid: depositAmount,
    balanceDue: balanceDue,
    balanceDueDate: balanceDueDate,
    stripeSessionId: session.id,
    stripePaymentId: session.payment_intent as string,
    status: "confirmed",
    updatedAt: new Date(),
  });

  // Update session enrolled count
  const booking = await adminDb.collection("bookings").doc(bookingId).get();
  const bookingData = booking.data();

  // Handle both sessionId (singular) and sessionIds (array) formats
  const sessionIds = bookingData?.sessionIds || (bookingData?.sessionId ? [bookingData.sessionId] : []);

  for (const sessionId of sessionIds) {
    if (!sessionId) continue;
    const sessionRef = adminDb.collection("sessions").doc(sessionId);
    const sessionDoc = await sessionRef.get();
    const currentEnrolled = sessionDoc.data()?.enrolled || 0;

    await sessionRef.update({
      enrolled: currentEnrolled + 1,
      updatedAt: new Date(),
    });
  }

  // Send confirmation email with deposit info
  if (bookingData) {
    await sendDepositConfirmationEmail(bookingData, bookingId, depositAmount, balanceDue, balanceDueDate);
  }

  console.log(`Booking ${bookingId} deposit payment completed`);
}

// Handle balance payment completion
async function handleBalancePaymentCompleted(
  session: Stripe.Checkout.Session,
  bookingId: string
) {
  // Update booking to fully paid
  await adminDb.collection("bookings").doc(bookingId).update({
    paymentStatus: "paid",
    balancePaidAt: new Date(),
    balanceStripeSessionId: session.id,
    updatedAt: new Date(),
  });

  // Get booking data for email
  const booking = await adminDb.collection("bookings").doc(bookingId).get();
  const bookingData = booking.data();

  // Send balance paid confirmation email
  if (bookingData) {
    await sendBalancePaidConfirmationEmail(bookingData, bookingId);
  }

  console.log(`Booking ${bookingId} balance payment completed`);
}

// Send deposit confirmation email
async function sendDepositConfirmationEmail(
  bookingData: FirebaseFirestore.DocumentData,
  bookingId: string,
  depositAmount: number,
  balanceDue: number,
  balanceDueDate: Date | null
) {
  try {
    // Get session details
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

    const formattedDueDate = balanceDueDate
      ? balanceDueDate.toLocaleDateString("en-GB", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        })
      : "TBC";

    // Import and use deposit confirmation email template
    const { depositConfirmationEmail } = await import("@/lib/email-templates");

    const emailContent = depositConfirmationEmail({
      parentFirstName: bookingData.parentFirstName,
      childFirstName: bookingData.childFirstName,
      bookingRef: bookingData.bookingRef || bookingId.slice(0, 8).toUpperCase(),
      sessions: sessionDetails,
      depositAmount: formatPrice(depositAmount),
      balanceDue: formatPrice(balanceDue),
      balanceDueDate: formattedDueDate,
      payBalanceUrl: `${process.env.NEXT_PUBLIC_BASE_URL || "https://ttnts.co.uk"}/portal/bookings/${bookingId}/pay-balance`,
    });

    const result = await sendEmail({
      to: bookingData.parentEmail,
      subject: emailContent.subject,
      html: emailContent.html,
    });

    if (!result.success) {
      console.error("Failed to send deposit confirmation email:", result.error);
    }
  } catch (error) {
    console.error("Error sending deposit confirmation email:", error);
  }
}

// Send balance paid confirmation email
async function sendBalancePaidConfirmationEmail(
  bookingData: FirebaseFirestore.DocumentData,
  bookingId: string
) {
  try {
    // Get session details
    const sessionIds = bookingData.sessionIds || [bookingData.sessionId];
    const sessionDetails: Array<{
      name: string;
      dayOfWeek: string;
      startTime: string;
      endTime: string;
      location: string;
    }> = [];

    let primarySessionId = "";
    let validDate = new Date().toISOString().split("T")[0];

    for (const sessionId of sessionIds) {
      if (!sessionId) continue;
      if (!primarySessionId) primarySessionId = sessionId;

      const sessionDoc = await adminDb.collection("sessions").doc(sessionId).get();
      const sessionData = sessionDoc.data();

      if (sessionData) {
        if (sessionData.startDate && !validDate) {
          const startDate = sessionData.startDate._seconds
            ? new Date(sessionData.startDate._seconds * 1000)
            : new Date(sessionData.startDate);
          validDate = startDate.toISOString().split("T")[0];
        }

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

    // Generate QR code for check-in
    const childName = `${bookingData.childFirstName} ${bookingData.childLastName}`;
    const qrData: QRCodeData = {
      bookingId,
      sessionId: primarySessionId,
      childName,
      validDate,
    };

    let qrCodeDataUrl = "";
    try {
      qrCodeDataUrl = await generateBookingQRCode(qrData);
    } catch (qrError) {
      console.error("Error generating QR code:", qrError);
    }

    // Import and use balance paid confirmation email template
    const { balancePaidConfirmationEmail } = await import("@/lib/email-templates");

    const emailContent = balancePaidConfirmationEmail({
      parentFirstName: bookingData.parentFirstName,
      childFirstName: bookingData.childFirstName,
      bookingRef: bookingData.bookingRef || bookingId.slice(0, 8).toUpperCase(),
      sessions: sessionDetails,
      totalAmount: formatPrice(bookingData.amount || 0),
      qrCodeDataUrl,
    });

    const result = await sendEmail({
      to: bookingData.parentEmail,
      subject: emailContent.subject,
      html: emailContent.html,
    });

    if (!result.success) {
      console.error("Failed to send balance paid confirmation email:", result.error);
    }
  } catch (error) {
    console.error("Error sending balance paid confirmation email:", error);
  }
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

    let primarySessionId = "";
    let validDate = new Date().toISOString().split("T")[0];

    for (const sessionId of sessionIds) {
      if (!sessionId) continue;
      if (!primarySessionId) primarySessionId = sessionId;

      const sessionDoc = await adminDb.collection("sessions").doc(sessionId).get();
      const sessionData = sessionDoc.data();

      if (sessionData) {
        // Get valid date from session start date
        if (sessionData.startDate && !validDate) {
          const startDate = sessionData.startDate._seconds
            ? new Date(sessionData.startDate._seconds * 1000)
            : new Date(sessionData.startDate);
          validDate = startDate.toISOString().split("T")[0];
        }

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

    // Generate QR code for check-in
    const childName = `${bookingData.childFirstName} ${bookingData.childLastName}`;
    const qrData: QRCodeData = {
      bookingId,
      sessionId: primarySessionId,
      childName,
      validDate,
    };

    let qrCodeDataUrl = "";
    try {
      qrCodeDataUrl = await generateBookingQRCode(qrData);
    } catch (qrError) {
      console.error("Error generating QR code:", qrError);
    }

    // Format guardian declaration for email
    const guardianDeclarationForEmail = bookingData.guardianDeclaration?.accepted
      ? {
          signature: bookingData.guardianDeclaration.signature,
          acceptedAt: bookingData.guardianDeclaration.acceptedAt?._seconds
            ? new Date(bookingData.guardianDeclaration.acceptedAt._seconds * 1000).toLocaleString("en-GB", {
                dateStyle: "long",
                timeStyle: "short",
              })
            : new Date(bookingData.guardianDeclaration.acceptedAt).toLocaleString("en-GB", {
                dateStyle: "long",
                timeStyle: "short",
              }),
        }
      : undefined;

    // Use QR-enhanced email if QR code was generated successfully
    const emailContent = qrCodeDataUrl
      ? bookingConfirmationWithQREmail({
          parentFirstName: bookingData.parentFirstName,
          childFirstName: bookingData.childFirstName,
          bookingRef: bookingData.bookingRef || bookingId.slice(0, 8).toUpperCase(),
          sessions: sessionDetails,
          totalAmount: formatPrice(bookingData.amount || 0),
          qrCodeDataUrl,
          guardianDeclaration: guardianDeclarationForEmail,
        })
      : bookingConfirmationEmail({
          parentFirstName: bookingData.parentFirstName,
          childFirstName: bookingData.childFirstName,
          bookingRef: bookingData.bookingRef || bookingId.slice(0, 8).toUpperCase(),
          sessions: sessionDetails,
          totalAmount: formatPrice(bookingData.amount || 0),
          guardianDeclaration: guardianDeclarationForEmail,
        });

    // Check if secondary parent should receive email copy
    const secondaryParentEmail = bookingData.secondaryParent?.receiveEmails && bookingData.secondaryParent?.email
      ? bookingData.secondaryParent.email
      : undefined;

    const result = await sendEmail({
      to: bookingData.parentEmail,
      cc: secondaryParentEmail,
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

  const failureReason =
    paymentIntent.last_payment_error?.message || "Payment declined";

  // Update booking status
  await adminDb.collection("bookings").doc(bookingId).update({
    paymentStatus: "failed",
    failureReason,
    updatedAt: new Date(),
  });

  // Get booking data for email
  const bookingDoc = await adminDb.collection("bookings").doc(bookingId).get();
  const bookingData = bookingDoc.data();

  if (!bookingData) return;

  // Send payment failure email
  await sendPaymentFailureEmailHelper(bookingData, bookingId, failureReason);

  console.log(`Payment failed for booking ${bookingId}: ${failureReason}`);
}

async function sendPaymentFailureEmailHelper(
  bookingData: FirebaseFirestore.DocumentData,
  bookingId: string,
  failureReason: string
) {
  try {
    // Get session details
    const sessionIds = bookingData.sessionIds || [bookingData.sessionId];
    const sessionDetails: Array<{
      name: string;
      dayOfWeek: string;
      startTime: string;
    }> = [];

    for (const sessionId of sessionIds) {
      if (!sessionId) continue;
      const sessionDoc = await adminDb.collection("sessions").doc(sessionId).get();
      const sessionData = sessionDoc.data();

      if (sessionData) {
        sessionDetails.push({
          name: sessionData.name || "Football Session",
          dayOfWeek: getDayName(sessionData.dayOfWeek),
          startTime: sessionData.startTime || "TBC",
        });
      }
    }

    // Create a new checkout URL for retry
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://ttnts.co.uk";
    const retryUrl = `${baseUrl}/sessions`; // Direct to sessions page to rebook

    const emailContent = paymentFailureEmail({
      parentFirstName: bookingData.parentFirstName,
      childFirstName: bookingData.childFirstName,
      bookingRef: bookingData.bookingRef || bookingId.slice(0, 8).toUpperCase(),
      sessions: sessionDetails,
      totalAmount: formatPrice(bookingData.amount || 0),
      retryUrl,
      failureReason,
    });

    const result = await sendEmail({
      to: bookingData.parentEmail,
      subject: emailContent.subject,
      html: emailContent.html,
    });

    if (!result.success) {
      console.error("Failed to send payment failure email:", result.error);
    }
  } catch (error) {
    console.error("Error sending payment failure email:", error);
  }
}

async function handleRefund(charge: Stripe.Charge) {
  const paymentIntentId = charge.payment_intent as string;

  if (!paymentIntentId) {
    console.log("No payment_intent on refund charge");
    return;
  }

  // Find booking by payment intent
  const bookingsSnapshot = await adminDb
    .collection("bookings")
    .where("stripePaymentId", "==", paymentIntentId)
    .limit(1)
    .get();

  if (bookingsSnapshot.empty) {
    console.log("No booking found for refund:", paymentIntentId);
    return;
  }

  const bookingDoc = bookingsSnapshot.docs[0];
  const bookingData = bookingDoc.data();

  // Calculate refund details
  const refundAmount = charge.amount_refunded;
  const originalAmount = charge.amount;
  const isPartialRefund = refundAmount < originalAmount;

  // Update booking status
  await bookingDoc.ref.update({
    paymentStatus: isPartialRefund ? "partially_refunded" : "refunded",
    refundedAmount: refundAmount,
    refundedAt: new Date(),
    updatedAt: new Date(),
  });

  // Send refund confirmation email
  await sendRefundConfirmationEmailHelper(
    bookingData,
    bookingDoc.id,
    refundAmount,
    originalAmount,
    isPartialRefund
  );

  console.log(
    `Refund processed for booking ${bookingDoc.id}: ${formatPrice(refundAmount)} (${
      isPartialRefund ? "partial" : "full"
    })`
  );
}

async function sendRefundConfirmationEmailHelper(
  bookingData: FirebaseFirestore.DocumentData,
  bookingId: string,
  refundAmount: number,
  originalAmount: number,
  isPartialRefund: boolean
) {
  try {
    const emailContent = refundConfirmationEmail({
      parentFirstName: bookingData.parentFirstName,
      childFirstName: bookingData.childFirstName,
      bookingRef: bookingData.bookingRef || bookingId.slice(0, 8).toUpperCase(),
      refundAmount: formatPrice(refundAmount),
      originalAmount: formatPrice(originalAmount),
      isPartialRefund,
    });

    const result = await sendEmail({
      to: bookingData.parentEmail,
      subject: emailContent.subject,
      html: emailContent.html,
    });

    if (!result.success) {
      console.error("Failed to send refund confirmation email:", result.error);
    }
  } catch (error) {
    console.error("Error sending refund confirmation email:", error);
  }
}

async function handleCheckoutExpired(session: Stripe.Checkout.Session) {
  const bookingId = session.metadata?.bookingId;

  if (!bookingId) {
    console.log("No bookingId in expired session metadata");
    return;
  }

  // Get booking data
  const bookingDoc = await adminDb.collection("bookings").doc(bookingId).get();
  const bookingData = bookingDoc.data();

  if (!bookingData) return;

  // Only send abandoned email if booking is still pending
  if (bookingData.paymentStatus !== "pending") {
    return;
  }

  // Update booking status
  await adminDb.collection("bookings").doc(bookingId).update({
    paymentStatus: "expired",
    updatedAt: new Date(),
  });

  // Send abandoned cart email
  await sendCheckoutAbandonedEmailHelper(bookingData, bookingId);

  console.log(`Checkout expired for booking ${bookingId}`);
}

async function sendCheckoutAbandonedEmailHelper(
  bookingData: FirebaseFirestore.DocumentData,
  bookingId: string
) {
  try {
    // Get session details
    const sessionIds = bookingData.sessionIds || [bookingData.sessionId];
    const sessionDetails: Array<{
      name: string;
      dayOfWeek: string;
    }> = [];

    for (const sessionId of sessionIds) {
      if (!sessionId) continue;
      const sessionDoc = await adminDb.collection("sessions").doc(sessionId).get();
      const sessionData = sessionDoc.data();

      if (sessionData) {
        sessionDetails.push({
          name: sessionData.name || "Football Session",
          dayOfWeek: getDayName(sessionData.dayOfWeek),
        });
      }
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://ttnts.co.uk";
    const checkoutUrl = `${baseUrl}/sessions`; // Direct back to sessions to rebook

    const emailContent = checkoutAbandonedEmail({
      parentFirstName: bookingData.parentFirstName,
      childFirstName: bookingData.childFirstName,
      sessions: sessionDetails,
      totalAmount: formatPrice(bookingData.amount || 0),
      checkoutUrl,
    });

    const result = await sendEmail({
      to: bookingData.parentEmail,
      subject: emailContent.subject,
      html: emailContent.html,
    });

    if (!result.success) {
      console.error("Failed to send checkout abandoned email:", result.error);
    }
  } catch (error) {
    console.error("Error sending checkout abandoned email:", error);
  }
}

// Handle payment link completion (custom payment links created by admin)
async function handlePaymentLinkCompleted(session: Stripe.Checkout.Session) {
  const paymentLinkId = session.payment_link as string;

  if (!paymentLinkId) {
    console.log("No payment_link in session");
    return;
  }

  // Find the payment link in our database
  const paymentLinksSnapshot = await adminDb
    .collection("payment_links")
    .where("stripePaymentLinkId", "==", paymentLinkId)
    .limit(1)
    .get();

  if (paymentLinksSnapshot.empty) {
    console.log("No payment link found in database for:", paymentLinkId);
    return;
  }

  const paymentLinkDoc = paymentLinksSnapshot.docs[0];
  const paymentLinkData = paymentLinkDoc.data();

  const now = new Date();

  // Update payment link status
  await paymentLinkDoc.ref.update({
    status: "completed",
    paidAt: now,
    updatedAt: now,
  });

  // If linked to a booking, update the booking
  if (paymentLinkData.bookingId) {
    const bookingRef = adminDb.collection("bookings").doc(paymentLinkData.bookingId);
    const bookingDoc = await bookingRef.get();

    if (bookingDoc.exists) {
      const bookingData = bookingDoc.data()!;

      // Create a payment record
      await adminDb.collection("payments").add({
        bookingId: paymentLinkData.bookingId,
        amount: paymentLinkData.amount,
        method: "payment_link",
        status: "paid",
        stripePaymentIntentId: session.payment_intent as string,
        stripePaymentLinkId: paymentLinkId,
        paymentLinkUrl: paymentLinkData.stripePaymentLinkUrl,
        createdAt: now,
        updatedAt: now,
      });

      // Calculate total paid amount
      const paymentsSnapshot = await adminDb
        .collection("payments")
        .where("bookingId", "==", paymentLinkData.bookingId)
        .where("status", "==", "paid")
        .get();

      let totalPaid = 0;
      paymentsSnapshot.forEach((doc) => {
        totalPaid += doc.data().amount || 0;
      });

      // Determine new payment status
      const bookingAmount = bookingData.amount || 0;
      const newPaymentStatus = totalPaid >= bookingAmount ? "paid" : "partial";

      // Update booking
      await bookingRef.update({
        paymentStatus: newPaymentStatus,
        paymentMethod: "payment_link",
        stripePaymentId: session.payment_intent as string,
        updatedAt: now,
      });

      // Update session enrolled count if this is the first full payment
      if (bookingData.paymentStatus === "pending" && newPaymentStatus === "paid") {
        const sessionIds = bookingData.sessionIds || (bookingData.sessionId ? [bookingData.sessionId] : []);

        for (const sessionId of sessionIds) {
          if (!sessionId) continue;
          const sessionRef = adminDb.collection("sessions").doc(sessionId);
          const sessionDoc = await sessionRef.get();
          const currentEnrolled = sessionDoc.data()?.enrolled || 0;

          await sessionRef.update({
            enrolled: currentEnrolled + 1,
            updatedAt: now,
          });
        }

        // Send booking confirmation email
        await sendBookingConfirmationEmail(bookingData, paymentLinkData.bookingId);
      }

      console.log(`Payment link ${paymentLinkId} completed for booking ${paymentLinkData.bookingId}`);
    }
  } else {
    // Standalone payment link (not linked to a booking)
    console.log(`Standalone payment link ${paymentLinkId} completed`);
  }
}
