import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { AttendanceRecord, AttendanceSummary, SessionOccurrence, SessionType } from "@/types/attendance";
import { Session } from "@/types/booking";

// GET attendance records with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId");
    const date = searchParams.get("date");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const summary = searchParams.get("summary") === "true";

    // New filter params
    const sessionType = searchParams.get("sessionType") as SessionType | null;
    const coachId = searchParams.get("coachId");
    const location = searchParams.get("location");

    // If summary requested, return aggregated data
    if (summary) {
      return await getAttendanceSummary(
        date || new Date().toISOString().split("T")[0],
        { sessionType, coachId, location }
      );
    }

    // Build query for attendance records
    let query: FirebaseFirestore.Query = adminDb.collection("attendance");

    if (sessionId) {
      query = query.where("sessionId", "==", sessionId);
    }

    if (date) {
      query = query.where("date", "==", date);
    } else if (dateFrom && dateTo) {
      query = query.where("date", ">=", dateFrom).where("date", "<=", dateTo);
    }

    query = query.orderBy("date", "desc");

    const snapshot = await query.get();

    const records = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as AttendanceRecord[];

    return NextResponse.json({ success: true, data: records });
  } catch (error) {
    console.error("Error fetching attendance:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch attendance records" },
      { status: 500 }
    );
  }
}

// Filter configuration
interface AttendanceFilterConfig {
  sessionType: SessionType | null;
  coachId: string | null;
  location: string | null;
}

// Helper to get attendance summary for a date with filters
async function getAttendanceSummary(
  date: string,
  filters: AttendanceFilterConfig
): Promise<NextResponse> {
  try {
    // Get all active sessions
    const sessionsSnapshot = await adminDb
      .collection("sessions")
      .where("isActive", "==", true)
      .get();

    let sessions = sessionsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Session[];

    // Apply filters
    if (filters.sessionType) {
      // Get programs with matching service type
      const programsSnapshot = await adminDb
        .collection("programs")
        .where("serviceType", "==", filters.sessionType)
        .get();

      const programIds = new Set(programsSnapshot.docs.map((doc) => doc.id));
      sessions = sessions.filter((s) => programIds.has(s.programId));
    }

    if (filters.coachId) {
      sessions = sessions.filter(
        (s) => s.coaches && s.coaches.includes(filters.coachId!)
      );
    }

    if (filters.location) {
      sessions = sessions.filter(
        (s) => s.location && s.location.toLowerCase().includes(filters.location!.toLowerCase())
      );
    }

    // Get attendance records for this date
    const attendanceSnapshot = await adminDb
      .collection("attendance")
      .where("date", "==", date)
      .get();

    const attendanceRecords = attendanceSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as AttendanceRecord[];

    // Build session occurrences
    const occurrences: SessionOccurrence[] = [];
    let totalEnrolled = 0;
    let totalAttended = 0;

    for (const session of sessions) {
      // Check if this session runs on this date's day of week
      const dateObj = new Date(date);
      const dayOfWeek = dateObj.getDay();

      // Check if session runs on this day
      const sessionDays = session.daysOfWeek || [session.dayOfWeek];
      if (!sessionDays.includes(dayOfWeek)) {
        continue;
      }

      // Check if date is within session date range
      const sessionStart = session.startDate instanceof Date
        ? session.startDate
        : new Date((session.startDate as { seconds: number }).seconds * 1000);
      const sessionEnd = session.endDate instanceof Date
        ? session.endDate
        : new Date((session.endDate as { seconds: number }).seconds * 1000);

      if (dateObj < sessionStart || dateObj > sessionEnd) {
        continue;
      }

      const sessionAttendance = attendanceRecords.filter(
        (r) => r.sessionId === session.id
      );
      const attendedCount = sessionAttendance.filter((r) => r.checkedInAt).length;
      const checkedOutCount = sessionAttendance.filter((r) => r.checkedOutAt).length;

      occurrences.push({
        sessionId: session.id,
        sessionName: session.name,
        date,
        enrolledCount: session.enrolled,
        attendedCount,
        checkedOutCount,
      });

      totalEnrolled += session.enrolled;
      totalAttended += attendedCount;
    }

    const summary: AttendanceSummary = {
      date,
      totalSessions: occurrences.length,
      totalEnrolled,
      totalAttended,
      attendanceRate: totalEnrolled > 0 ? Math.round((totalAttended / totalEnrolled) * 100) : 0,
      sessions: occurrences,
    };

    return NextResponse.json({ success: true, data: summary });
  } catch (error) {
    console.error("Error fetching attendance summary:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch attendance summary" },
      { status: 500 }
    );
  }
}
