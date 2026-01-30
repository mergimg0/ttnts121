import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { Session } from "@/types/booking";
import { checkCoachPermission } from "@/lib/coach-permissions";

// GET coach's assigned sessions
export async function GET(request: NextRequest) {
  try {
    // Check permission to view sessions
    const { allowed, error, userId, userData } = await checkCoachPermission(
      request,
      "canViewSessions"
    );

    if (!allowed) {
      return error!;
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
      const assignedSessionIds = (userData?.assignedSessions as string[]) || [];

      if (assignedSessionIds.length === 0) {
        return NextResponse.json({ success: true, data: [] });
      }

      // Firestore "in" queries are limited to 10 items
      const chunks: string[][] = [];
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
