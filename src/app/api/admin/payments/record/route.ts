import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { RecordPaymentInput, Payment, PaymentMethod } from "@/types/payment";

// POST /api/admin/payments/record - Record a manual payment (cash/bank_transfer)
export async function POST(request: NextRequest) {
  try {
    const body: RecordPaymentInput = await request.json();
    const { bookingId, amount, method, notes, dateReceived } = body;

    // Validate required fields
    if (!bookingId || !amount || !method) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: bookingId, amount, method" },
        { status: 400 }
      );
    }

    // Validate method is cash or bank_transfer
    if (method !== 'cash' && method !== 'bank_transfer') {
      return NextResponse.json(
        { success: false, error: "Method must be 'cash' or 'bank_transfer'" },
        { status: 400 }
      );
    }

    // Validate amount is positive
    if (amount <= 0) {
      return NextResponse.json(
        { success: false, error: "Amount must be greater than 0" },
        { status: 400 }
      );
    }

    // Check booking exists
    const bookingRef = adminDb.collection("bookings").doc(bookingId);
    const bookingDoc = await bookingRef.get();

    if (!bookingDoc.exists) {
      return NextResponse.json(
        { success: false, error: "Booking not found" },
        { status: 404 }
      );
    }

    const bookingData = bookingDoc.data()!;
    const now = new Date();
    const paymentDate = dateReceived ? new Date(dateReceived) : now;

    // Create payment record
    const paymentData: Omit<Payment, 'id'> = {
      bookingId,
      amount,
      method: method as PaymentMethod,
      status: 'paid',
      notes: notes || undefined,
      recordedBy: 'admin', // TODO: Get actual admin user from session
      createdAt: paymentDate,
      updatedAt: now,
    };

    const paymentRef = await adminDb.collection("payments").add(paymentData);

    // Calculate total paid amount for this booking
    const paymentsSnapshot = await adminDb
      .collection("payments")
      .where("bookingId", "==", bookingId)
      .where("status", "==", "paid")
      .get();

    let totalPaid = 0;
    paymentsSnapshot.forEach((doc) => {
      totalPaid += doc.data().amount || 0;
    });

    // Determine new payment status for the booking
    const bookingAmount = bookingData.amount || 0;
    let newPaymentStatus: string;

    if (totalPaid >= bookingAmount) {
      newPaymentStatus = 'paid';
    } else if (totalPaid > 0) {
      newPaymentStatus = 'partial';
    } else {
      newPaymentStatus = 'pending';
    }

    // Update booking payment status
    await bookingRef.update({
      paymentStatus: newPaymentStatus,
      paymentMethod: method,
      updatedAt: now,
    });

    // Update session enrolled count if this is the first paid payment
    if (bookingData.paymentStatus === 'pending' && newPaymentStatus === 'paid') {
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
    }

    const payment: Payment = {
      id: paymentRef.id,
      ...paymentData,
    };

    return NextResponse.json({
      success: true,
      data: payment,
      bookingPaymentStatus: newPaymentStatus,
      totalPaid,
    });
  } catch (error) {
    console.error("Error recording payment:", error);
    return NextResponse.json(
      { success: false, error: "Failed to record payment" },
      { status: 500 }
    );
  }
}
