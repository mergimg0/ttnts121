import { NextRequest, NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/lib/firebase-admin";
import { Booking, Session } from "@/types/booking";
import { cookies } from "next/headers";

// Helper to verify user from session
async function verifyUserSession(request: NextRequest) {
  // Get the authorization header or cookie
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

// GET user's bookings
export async function GET(request: NextRequest) {
  try {
    const decodedToken = await verifyUserSession(request);

    if (!decodedToken) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userEmail = decodedToken.email;

    if (!userEmail) {
      return NextResponse.json(
        { success: false, error: "User email not found" },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const filter = searchParams.get("filter"); // upcoming, past, cancelled, or all

    // Query bookings by parent email
    const snapshot = await adminDb
      .collection("bookings")
      .where("parentEmail", "==", userEmail)
      .orderBy("createdAt", "desc")
      .get();

    let bookings = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Booking[];

    // Get session details for each booking
    const sessionIds = [...new Set(bookings.map((b) => b.sessionId))];
    const sessionsMap = new Map<string, Session>();

    if (sessionIds.length > 0) {
      // Batch get sessions (Firestore limits to 10 per query)
      for (let i = 0; i < sessionIds.length; i += 10) {
        const batch = sessionIds.slice(i, i + 10);
        const sessionSnapshot = await adminDb
          .collection("sessions")
          .where("__name__", "in", batch)
          .get();

        sessionSnapshot.docs.forEach((doc) => {
          sessionsMap.set(doc.id, { id: doc.id, ...doc.data() } as Session);
        });
      }
    }

    // Attach session info and filter
    const now = new Date();

    const enrichedBookings = bookings.map((booking) => {
      const session = sessionsMap.get(booking.sessionId);
      return { booking, session };
    });

    // Apply filter
    let filteredBookings = enrichedBookings;

    if (filter === "upcoming") {
      filteredBookings = enrichedBookings.filter(({ booking, session }) => {
        if (booking.status === "cancelled") return false;
        if (!session) return false;
        const sessionDate =
          session.startDate instanceof Object && "toDate" in session.startDate
            ? session.startDate.toDate()
            : new Date(session.startDate);
        return sessionDate >= now;
      });
    } else if (filter === "past") {
      filteredBookings = enrichedBookings.filter(({ booking, session }) => {
        if (booking.status === "cancelled") return false;
        if (!session) return true;
        const sessionDate =
          session.startDate instanceof Object && "toDate" in session.startDate
            ? session.startDate.toDate()
            : new Date(session.startDate);
        return sessionDate < now;
      });
    } else if (filter === "cancelled") {
      filteredBookings = enrichedBookings.filter(
        ({ booking }) => booking.status === "cancelled"
      );
    }

    return NextResponse.json({
      success: true,
      data: filteredBookings,
    });
  } catch (error) {
    console.error("Error fetching user bookings:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch bookings" },
      { status: 500 }
    );
  }
}
