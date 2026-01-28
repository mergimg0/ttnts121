import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { adminDb, adminAuth } from "@/lib/firebase-admin";
import { formatPrice } from "@/lib/booking-utils";

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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: bookingId } = await params;

    // Verify authentication
    const decodedToken = await verifyUserSession(request);
    if (!decodedToken) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get the booking
    const bookingDoc = await adminDb.collection("bookings").doc(bookingId).get();

    if (!bookingDoc.exists) {
      return NextResponse.json(
        { success: false, error: "Booking not found" },
        { status: 404 }
      );
    }

    const bookingData = bookingDoc.data()!;

    // Verify the booking belongs to this user (by email)
    if (bookingData.parentEmail !== decodedToken.email) {
      return NextResponse.json(
        { success: false, error: "Access denied" },
        { status: 403 }
      );
    }

    // Check if booking has a balance due
    if (bookingData.paymentStatus !== "deposit_paid") {
      return NextResponse.json(
        { success: false, error: "No balance due on this booking" },
        { status: 400 }
      );
    }

    const balanceDue = bookingData.balanceDue;
    if (!balanceDue || balanceDue <= 0) {
      return NextResponse.json(
        { success: false, error: "No balance due" },
        { status: 400 }
      );
    }

    // Get session details for the line item description
    const sessionIds = bookingData.sessionIds || [bookingData.sessionId];
    const sessionNames: string[] = [];

    for (const sessionId of sessionIds) {
      if (!sessionId) continue;
      const sessionDoc = await adminDb.collection("sessions").doc(sessionId).get();
      if (sessionDoc.exists) {
        sessionNames.push(sessionDoc.data()?.name || "Session");
      }
    }

    const description = sessionNames.length > 0
      ? `Balance payment: ${sessionNames.join(", ")}`
      : "Balance payment";

    // Create Stripe Checkout Session for balance payment
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "gbp",
            product_data: {
              name: description,
              description: `Remaining balance for booking ${bookingData.bookingRef}`,
            },
            unit_amount: balanceDue,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/portal/bookings/${bookingId}?balance_paid=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/portal/bookings/${bookingId}/pay-balance?cancelled=true`,
      customer_email: bookingData.parentEmail,
      metadata: {
        bookingId,
        bookingRef: bookingData.bookingRef,
        paymentType: "balance",
        originalAmount: String(bookingData.amount),
        depositPaid: String(bookingData.depositPaid || 0),
      },
    });

    // Update booking with balance Stripe session ID
    await adminDb.collection("bookings").doc(bookingId).update({
      balanceStripeSessionId: session.id,
      updatedAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      checkoutUrl: session.url,
    });
  } catch (error) {
    console.error("Error creating balance payment session:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create payment session" },
      { status: 500 }
    );
  }
}

// GET endpoint to fetch balance details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: bookingId } = await params;

    // Verify authentication
    const decodedToken = await verifyUserSession(request);
    if (!decodedToken) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get the booking
    const bookingDoc = await adminDb.collection("bookings").doc(bookingId).get();

    if (!bookingDoc.exists) {
      return NextResponse.json(
        { success: false, error: "Booking not found" },
        { status: 404 }
      );
    }

    const bookingData = bookingDoc.data()!;

    // Verify the booking belongs to this user
    if (bookingData.parentEmail !== decodedToken.email) {
      return NextResponse.json(
        { success: false, error: "Access denied" },
        { status: 403 }
      );
    }

    // Get session details
    const sessionIds = bookingData.sessionIds || [bookingData.sessionId];
    const sessions: Array<{
      id: string;
      name: string;
      dayOfWeek: number;
      startTime: string;
    }> = [];

    for (const sessionId of sessionIds) {
      if (!sessionId) continue;
      const sessionDoc = await adminDb.collection("sessions").doc(sessionId).get();
      if (sessionDoc.exists) {
        const sessionData = sessionDoc.data()!;
        sessions.push({
          id: sessionId,
          name: sessionData.name,
          dayOfWeek: sessionData.dayOfWeek,
          startTime: sessionData.startTime,
        });
      }
    }

    // Convert Firestore timestamps
    let balanceDueDate = bookingData.balanceDueDate;
    if (balanceDueDate?._seconds) {
      balanceDueDate = new Date(balanceDueDate._seconds * 1000).toISOString();
    } else if (balanceDueDate instanceof Date) {
      balanceDueDate = balanceDueDate.toISOString();
    }

    return NextResponse.json({
      success: true,
      data: {
        bookingRef: bookingData.bookingRef,
        childFirstName: bookingData.childFirstName,
        childLastName: bookingData.childLastName,
        totalAmount: bookingData.amount,
        depositPaid: bookingData.depositPaid || 0,
        balanceDue: bookingData.balanceDue || 0,
        balanceDueDate,
        paymentStatus: bookingData.paymentStatus,
        sessions,
      },
    });
  } catch (error) {
    console.error("Error fetching balance details:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch balance details" },
      { status: 500 }
    );
  }
}
