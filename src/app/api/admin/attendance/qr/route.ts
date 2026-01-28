import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { parseQRCodeData } from "@/lib/qr-code";
import { QRValidationResponse } from "@/types/attendance";
import { Booking } from "@/types/booking";

// POST validate QR code and optionally check in
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { payload, sessionId, date, autoCheckin = false, checkedInBy } = body;

    if (!payload || !sessionId || !date) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: payload, sessionId, date" },
        { status: 400 }
      );
    }

    // Parse QR code data
    let qrData;
    try {
      qrData = parseQRCodeData(payload);
    } catch {
      const response: QRValidationResponse = {
        valid: false,
        error: "Invalid QR code format",
      };
      return NextResponse.json({ success: false, ...response }, { status: 400 });
    }

    // Validate session matches
    if (qrData.sessionId !== sessionId) {
      const response: QRValidationResponse = {
        valid: false,
        error: "QR code is for a different session",
      };
      return NextResponse.json({ success: false, ...response }, { status: 400 });
    }

    // Verify booking exists and is valid
    const bookingDoc = await adminDb.collection("bookings").doc(qrData.bookingId).get();

    if (!bookingDoc.exists) {
      const response: QRValidationResponse = {
        valid: false,
        error: "Booking not found",
      };
      return NextResponse.json({ success: false, ...response }, { status: 404 });
    }

    const booking = { id: bookingDoc.id, ...bookingDoc.data() } as Booking;

    // Verify payment status
    if (booking.paymentStatus !== "paid") {
      const response: QRValidationResponse = {
        valid: false,
        bookingId: booking.id,
        childName: qrData.childName,
        error: `Booking payment status is: ${booking.paymentStatus}`,
      };
      return NextResponse.json({ success: false, ...response }, { status: 400 });
    }

    // Check if already checked in today
    const existingAttendance = await adminDb
      .collection("attendance")
      .where("bookingId", "==", qrData.bookingId)
      .where("sessionId", "==", sessionId)
      .where("date", "==", date)
      .where("childName", "==", qrData.childName)
      .get();

    const alreadyCheckedIn = !existingAttendance.empty &&
      existingAttendance.docs[0].data().checkedInAt;

    if (alreadyCheckedIn && !autoCheckin) {
      const response: QRValidationResponse = {
        valid: true,
        bookingId: booking.id,
        childName: qrData.childName,
        alreadyCheckedIn: true,
      };
      return NextResponse.json({ success: true, ...response });
    }

    // If auto check-in is requested and not already checked in
    if (autoCheckin && !alreadyCheckedIn) {
      // Create or update attendance record
      if (existingAttendance.empty) {
        await adminDb.collection("attendance").add({
          bookingId: qrData.bookingId,
          sessionId,
          childName: qrData.childName,
          date,
          checkedInAt: new Date(),
          checkedInBy,
          method: "qr",
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      } else {
        await existingAttendance.docs[0].ref.update({
          checkedInAt: new Date(),
          checkedInBy,
          method: "qr",
          updatedAt: new Date(),
        });
      }
    }

    const response: QRValidationResponse = {
      valid: true,
      bookingId: booking.id,
      childName: qrData.childName,
      alreadyCheckedIn: alreadyCheckedIn || autoCheckin,
    };

    return NextResponse.json({
      success: true,
      ...response,
      message: autoCheckin && !alreadyCheckedIn ? "Check-in successful via QR" : "QR code validated",
    });
  } catch (error) {
    console.error("Error validating QR:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: `Failed to validate QR: ${errorMessage}` },
      { status: 500 }
    );
  }
}
