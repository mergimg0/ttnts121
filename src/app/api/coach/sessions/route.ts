import { NextRequest, NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/lib/firebase-admin";
import { Session } from "@/types/booking";

// GET coach's assigned sessions
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
        // Token verification failed, try cookie-based auth
      }
    }

    // If no token, try to get user from cookie (for client-side requests)
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

    // Get user profile to verify role and get assigned sessions
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

    let sessions: Session[] = [];

    // Admin sees all sessions, coach sees only assigned
    if (userData?.role === "admin") {
      const snapshot = await adminDb
        .collection("sessions")
        .where("isActive", "==", true)
        .orderBy("dayOfWeek", "asc")
        .get();

      sessions = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Session[];
    } else {
      // Get sessions assigned to this coach
      const assignedSessionIds = userData?.assignedSessions || [];

      if (assignedSessionIds.length === 0) {
        return NextResponse.json({ success: true, data: [] });
      }

      // Firestore "in" queries are limited to 10 items
      const chunks = [];
      for (let i = 0; i < assignedSessionIds.length; i += 10) {
        chunks.push(assignedSessionIds.slice(i, i + 10));
      }

      for (const chunk of chunks) {
        const snapshot = await adminDb
          .collection("sessions")
          .where("__name__", "in", chunk)
          .get();

        const chunkSessions = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Session[];

        sessions.push(...chunkSessions);
      }

      // Also get sessions where this coach is in the coaches array
      const coachSnapshot = await adminDb
        .collection("sessions")
        .where("coaches", "array-contains", userId)
        .get();

      const coachSessions = coachSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Session[];

      // Merge and deduplicate
      const sessionIds = new Set(sessions.map((s) => s.id));
      for (const session of coachSessions) {
        if (!sessionIds.has(session.id)) {
          sessions.push(session);
        }
      }
    }

    // Sort by day of week
    sessions.sort((a, b) => a.dayOfWeek - b.dayOfWeek);

    // Fetch program names for each session
    const programIds = [...new Set(sessions.map((s) => s.programId))];
    const programNames: Record<string, string> = {};

    for (const programId of programIds) {
      const programDoc = await adminDb.collection("programs").doc(programId).get();
      if (programDoc.exists) {
        programNames[programId] = programDoc.data()?.name || "Unknown Program";
      }
    }

    // Add program names to sessions
    const sessionsWithPrograms = sessions.map((session) => ({
      ...session,
      programName: programNames[session.programId] || "Unknown Program",
    }));

    return NextResponse.json({ success: true, data: sessionsWithPrograms });
  } catch (error) {
    console.error("Error fetching coach sessions:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch sessions" },
      { status: 500 }
    );
  }
}
