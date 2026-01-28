import { NextRequest, NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/lib/firebase-admin";
import { Booking, Session } from "@/types/booking";

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

// GET single booking detail
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

    // Get the session details
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

    return NextResponse.json({
      success: true,
      data: { booking, session },
    });
  } catch (error) {
    console.error("Error fetching booking:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch booking" },
      { status: 500 }
    );
  }
}
