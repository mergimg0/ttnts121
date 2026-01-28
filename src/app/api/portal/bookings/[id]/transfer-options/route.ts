import { NextRequest, NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/lib/firebase-admin";
import { Booking, Session, Program } from "@/types/booking";

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

// GET available sessions for transfer
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

    // Check booking is eligible for transfer (must be confirmed and paid)
    if (booking.status !== "confirmed" || booking.paymentStatus !== "paid") {
      return NextResponse.json(
        { success: false, error: "Only confirmed and paid bookings can be transferred" },
        { status: 400 }
      );
    }

    // Get the current session
    const currentSessionDoc = await adminDb
      .collection("sessions")
      .doc(booking.sessionId)
      .get();

    if (!currentSessionDoc.exists) {
      return NextResponse.json(
        { success: false, error: "Current session not found" },
        { status: 404 }
      );
    }

    const currentSession = {
      id: currentSessionDoc.id,
      ...currentSessionDoc.data(),
    } as Session;

    // Get the program for the current session
    const programDoc = await adminDb
      .collection("programs")
      .doc(currentSession.programId)
      .get();

    if (!programDoc.exists) {
      return NextResponse.json(
        { success: false, error: "Program not found" },
        { status: 404 }
      );
    }

    const program = { id: programDoc.id, ...programDoc.data() } as Program;

    // Get all active sessions for the same program type
    const sessionsSnapshot = await adminDb
      .collection("sessions")
      .where("isActive", "==", true)
      .get();

    // Get all active programs
    const programsSnapshot = await adminDb
      .collection("programs")
      .where("isActive", "==", true)
      .get();

    const programsMap: Record<string, Program> = {};
    programsSnapshot.docs.forEach((doc) => {
      programsMap[doc.id] = { id: doc.id, ...doc.data() } as Program;
    });

    // Filter sessions:
    // 1. Same service type
    // 2. Future dates (start date > now)
    // 3. Has availability (enrolled < capacity and not force closed)
    // 4. Not the current session
    const now = new Date();
    const availableSessions = sessionsSnapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() } as Session))
      .filter((session) => {
        // Not the current session
        if (session.id === currentSession.id) return false;

        // Get the program for this session
        const sessionProgram = programsMap[session.programId];
        if (!sessionProgram) return false;

        // Same service type
        if (sessionProgram.serviceType !== program.serviceType) return false;

        // Future date
        const startDate =
          session.startDate instanceof Date
            ? session.startDate
            : (session.startDate as any).toDate?.() || new Date(session.startDate as any);
        if (startDate <= now) return false;

        // Has availability
        const spotsLeft = session.capacity - session.enrolled;
        if (spotsLeft <= 0) return false;
        if (session.isForceClosed) return false;

        return true;
      })
      .map((session) => {
        const sessionProgram = programsMap[session.programId];
        const spotsLeft = session.capacity - session.enrolled;
        const priceDifference = session.price - currentSession.price;

        return {
          id: session.id,
          name: session.name,
          description: session.description,
          programId: session.programId,
          programName: sessionProgram?.name || "Unknown Program",
          dayOfWeek: session.dayOfWeek,
          startTime: session.startTime,
          endTime: session.endTime,
          startDate: session.startDate,
          location: session.location,
          ageMin: session.ageMin,
          ageMax: session.ageMax,
          price: session.price,
          spotsLeft,
          priceDifference,
        };
      })
      .sort((a, b) => {
        // Sort by day of week, then start time
        if (a.dayOfWeek !== b.dayOfWeek) {
          return a.dayOfWeek - b.dayOfWeek;
        }
        return a.startTime.localeCompare(b.startTime);
      });

    return NextResponse.json({
      success: true,
      data: {
        currentSession: {
          id: currentSession.id,
          name: currentSession.name,
          price: currentSession.price,
          dayOfWeek: currentSession.dayOfWeek,
          startTime: currentSession.startTime,
          endTime: currentSession.endTime,
          location: currentSession.location,
        },
        availableSessions,
        booking: {
          id: booking.id,
          bookingRef: booking.bookingRef,
          childFirstName: booking.childFirstName,
          childLastName: booking.childLastName,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching transfer options:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch transfer options" },
      { status: 500 }
    );
  }
}
