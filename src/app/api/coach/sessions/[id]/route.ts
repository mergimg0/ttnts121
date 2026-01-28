import { NextRequest, NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/lib/firebase-admin";
import { Session, Booking } from "@/types/booking";

// GET single session with bookings for coach view
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Get the authorization token from headers
    const authHeader = request.headers.get("authorization");
    let userId: string | null = null;

    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      try {
        const decodedToken = await adminAuth.verifyIdToken(token);
        userId = decodedToken.uid;
      } catch {
        // Token verification failed
      }
    }

    // If no token, try to get user from cookie
    if (!userId) {
      const sessionCookie = request.cookies.get("session")?.value;
      if (sessionCookie) {
        try {
          const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie);
          userId = decodedClaims.uid;
        } catch {
          // Session cookie invalid
        }
      }
    }

    // For development/testing
    if (!userId) {
      const { searchParams } = new URL(request.url);
      userId = searchParams.get("userId");
    }

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get user profile to verify role
    const userDoc = await adminDb.collection("users").doc(userId).get();

    if (!userDoc.exists) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    const userData = userDoc.data();

    // Allow admin or coach role
    if (userData?.role !== "coach" && userData?.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Not authorized as coach" },
        { status: 403 }
      );
    }

    // Get the session
    const sessionDoc = await adminDb.collection("sessions").doc(id).get();

    if (!sessionDoc.exists) {
      return NextResponse.json(
        { success: false, error: "Session not found" },
        { status: 404 }
      );
    }

    const session = { id: sessionDoc.id, ...sessionDoc.data() } as Session;

    // For coaches (not admins), verify they're assigned to this session
    if (userData?.role === "coach") {
      const assignedSessions = userData?.assignedSessions || [];
      const isAssigned =
        assignedSessions.includes(id) ||
        (session.coaches && session.coaches.includes(userId));

      if (!isAssigned) {
        return NextResponse.json(
          { success: false, error: "Not assigned to this session" },
          { status: 403 }
        );
      }
    }

    // Get program name
    let programName = "Unknown Program";
    if (session.programId) {
      const programDoc = await adminDb
        .collection("programs")
        .doc(session.programId)
        .get();
      if (programDoc.exists) {
        programName = programDoc.data()?.name || "Unknown Program";
      }
    }

    // Get bookings for this session
    const bookingsSnapshot = await adminDb
      .collection("bookings")
      .where("sessionId", "==", id)
      .where("paymentStatus", "==", "paid")
      .get();

    const bookings = bookingsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Booking[];

    // Sort bookings by child's last name
    bookings.sort((a, b) =>
      a.childLastName.localeCompare(b.childLastName)
    );

    return NextResponse.json({
      success: true,
      data: {
        ...session,
        programName,
        bookings,
      },
    });
  } catch (error) {
    console.error("Error fetching session:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch session" },
      { status: 500 }
    );
  }
}
