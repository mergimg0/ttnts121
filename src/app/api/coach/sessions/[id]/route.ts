import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { Session, Booking } from "@/types/booking";
import { checkCoachPermission } from "@/lib/coach-permissions";

// GET single session with bookings for coach view
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check permission to view sessions
    const { allowed, error, userId, userData } = await checkCoachPermission(
      request,
      "canViewSessions"
    );

    if (!allowed) {
      return error!;
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
      const assignedSessions = (userData?.assignedSessions as string[]) || [];
      const isAssigned =
        assignedSessions.includes(id) ||
        (session.coaches && session.coaches.includes(userId!));

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
