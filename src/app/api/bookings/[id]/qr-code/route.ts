import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { generateBookingQRCode, generateBookingQRCodeBuffer, QRCodeData } from "@/lib/qr-code";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/bookings/[id]/qr-code - Generate and return QR code
// Query params:
// - childIndex: number (optional, for multi-child bookings, defaults to 0)
// - format: "png" | "json" (optional, defaults to "png")
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: bookingId } = await params;
    const searchParams = request.nextUrl.searchParams;
    const childIndex = parseInt(searchParams.get("childIndex") || "0", 10);
    const format = searchParams.get("format") || "png";

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

    // Get session ID (handle both single and multi-session bookings)
    const sessionIds = bookingData.sessionIds || [bookingData.sessionId];
    const primarySessionId = sessionIds[0];

    if (!primarySessionId) {
      return NextResponse.json(
        { success: false, error: "No session found for booking" },
        { status: 400 }
      );
    }

    // Get session details for valid date
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

    // Create QR code data
    const qrData: QRCodeData = {
      bookingId,
      sessionId: primarySessionId,
      childName,
      validDate,
    };

    if (format === "json") {
      // Return QR code as base64 data URL in JSON response
      const qrCodeDataUrl = await generateBookingQRCode(qrData);

      return NextResponse.json({
        success: true,
        data: {
          bookingId,
          sessionId: primarySessionId,
          childName,
          validDate,
          childIndex,
          qrCodeDataUrl,
        },
      });
    }

    // Return QR code as PNG image
    const qrCodeBuffer = await generateBookingQRCodeBuffer(qrData);

    return new NextResponse(new Uint8Array(qrCodeBuffer), {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition": `inline; filename="qr-${bookingData.bookingRef || bookingId.slice(0, 8)}.png"`,
        "Cache-Control": "public, max-age=3600", // Cache for 1 hour
      },
    });
  } catch (error) {
    console.error("Error generating QR code:", error);
    return NextResponse.json(
      { success: false, error: "Failed to generate QR code" },
      { status: 500 }
    );
  }
}
