import { NextRequest, NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/lib/firebase-admin";
import { TimetableSlot } from "@/types/timetable";

// GET coach's timetable slots for a specific week
export async function GET(request: NextRequest) {
  try {
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

    // For development/testing, also check for userId in query params
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

    // Get weekStart from query params
    const { searchParams } = new URL(request.url);
    const weekStart = searchParams.get("weekStart");

    if (!weekStart) {
      return NextResponse.json(
        { success: false, error: "weekStart parameter required" },
        { status: 400 }
      );
    }

    let slots: TimetableSlot[] = [];

    // Admin sees all slots, coach sees only their assigned slots
    if (userData?.role === "admin") {
      const snapshot = await adminDb
        .collection("timetable_slots")
        .where("weekStart", "==", weekStart)
        .orderBy("dayOfWeek", "asc")
        .orderBy("startTime", "asc")
        .get();

      slots = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as TimetableSlot[];
    } else {
      // Get slots assigned to this coach
      const snapshot = await adminDb
        .collection("timetable_slots")
        .where("weekStart", "==", weekStart)
        .where("coachId", "==", userId)
        .orderBy("dayOfWeek", "asc")
        .orderBy("startTime", "asc")
        .get();

      slots = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as TimetableSlot[];
    }

    return NextResponse.json({ success: true, data: slots });
  } catch (error) {
    console.error("Error fetching coach timetable:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch timetable" },
      { status: 500 }
    );
  }
}
