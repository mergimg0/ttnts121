import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { sendEmail } from "@/lib/email";
import { qrCodeResendEmail } from "@/lib/email-templates";
import { generateBookingQRCode, QRCodeData } from "@/lib/qr-code";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST /api/admin/bookings/[id]/resend-qr - Resend QR code via email
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: bookingId } = await params;

    // Fetch booking
    const bookingDoc = await adminDb.collection("bookings").doc(bookingId).get();

    if (!bookingDoc.exists) {
      return NextResponse.json(
        { success: false, error: "Booking not found" },
        { status: 404 }
      );
    }

    const bookingData = bookingDoc.data();
    if (!bookingData) {
      return NextResponse.json(
        { success: false, error: "Booking data is empty" },
        { status: 404 }
      );
    }

    // Only allow resending for paid/confirmed bookings
    if (bookingData.paymentStatus !== "paid") {
      return NextResponse.json(
        { success: false, error: "QR codes can only be resent for paid bookings" },
        { status: 400 }
      );
    }

    // Get session details
    const sessionIds = bookingData.sessionIds || [bookingData.sessionId];
    const primarySessionId = sessionIds[0];

    if (!primarySessionId) {
      return NextResponse.json(
        { success: false, error: "No session found for booking" },
        { status: 400 }
      );
    }

    const sessionDoc = await adminDb.collection("sessions").doc(primarySessionId).get();
    const sessionData = sessionDoc.data();

    // Determine valid date from session
    let validDate: string;
    if (sessionData?.startDate) {
      const startDate = sessionData.startDate._seconds
        ? new Date(sessionData.startDate._seconds * 1000)
        : new Date(sessionData.startDate);
      validDate = startDate.toISOString().split("T")[0];
    } else {
      validDate = new Date().toISOString().split("T")[0];
    }

    // Build child name
    const childName = `${bookingData.childFirstName} ${bookingData.childLastName}`;

    // Generate QR code
    const qrData: QRCodeData = {
      bookingId,
      sessionId: primarySessionId,
      childName,
      validDate,
    };

    const qrCodeDataUrl = await generateBookingQRCode(qrData);

    // Send email with QR code
    const emailContent = qrCodeResendEmail({
      parentFirstName: bookingData.parentFirstName,
      childFirstName: bookingData.childFirstName,
      bookingRef: bookingData.bookingRef || bookingId.slice(0, 8).toUpperCase(),
      sessionName: sessionData?.name || "Football Session",
      qrCodeDataUrl,
    });

    const result = await sendEmail({
      to: bookingData.parentEmail,
      subject: emailContent.subject,
      html: emailContent.html,
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: "Failed to send email" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `QR code sent to ${bookingData.parentEmail}`,
    });
  } catch (error) {
    console.error("Error resending QR code:", error);
    return NextResponse.json(
      { success: false, error: "Failed to resend QR code" },
      { status: 500 }
    );
  }
}
