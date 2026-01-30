import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { verifyAdmin } from "@/lib/admin-auth";
import {
  AttendanceRecord,
  WeeklyAttendanceSummary,
  DailyBreakdown,
  SessionTypeBreakdown,
  SessionType
} from "@/types/attendance";
import { Session } from "@/types/booking";

// Session type labels for display
const SESSION_TYPE_LABELS: Record<string, string> = {
  "after-school": "After School",
  "group-session": "GDS",
  "one-to-one": "121",
  "half-term": "Half Term",
  "birthday-party": "Birthday",
};

// GET weekly attendance summary
export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAdmin(request);
    if (!auth.authenticated) return auth.error!;
    const { searchParams } = new URL(request.url);
    const weekStart = searchParams.get("weekStart");
    const sessionType = searchParams.get("sessionType") as SessionType | null;
    const coachId = searchParams.get("coachId");
    const location = searchParams.get("location");

    if (!weekStart) {
      return NextResponse.json(
        { success: false, error: "weekStart parameter is required" },
        { status: 400 }
      );
    }

    // Calculate week end (6 days after start for Mon-Sun)
    const startDate = new Date(weekStart);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 6);
    const weekEnd = endDate.toISOString().split("T")[0];

    // Get all active sessions
    const sessionsSnapshot = await adminDb
      .collection("sessions")
      .where("isActive", "==", true)
      .get();

    let sessions = sessionsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Session[];

    // Get programs to map session types
    const programsSnapshot = await adminDb.collection("programs").get();
    const programTypeMap = new Map<string, string>();

    programsSnapshot.docs.forEach((doc) => {
      const data = doc.data();
      programTypeMap.set(doc.id, data.serviceType || "other");
    });

    // Apply session type filter
    if (sessionType) {
      const filteredProgramIds = new Set(
        programsSnapshot.docs
          .filter((doc) => doc.data().serviceType === sessionType)
          .map((doc) => doc.id)
      );
      sessions = sessions.filter((s) => filteredProgramIds.has(s.programId));
    }

    // Apply coach filter
    if (coachId) {
      sessions = sessions.filter(
        (s) => s.coaches && s.coaches.includes(coachId)
      );
    }

    // Apply location filter
    if (location) {
      sessions = sessions.filter(
        (s) => s.location && s.location.toLowerCase().includes(location.toLowerCase())
      );
    }

    // Get attendance records for the week
    const attendanceSnapshot = await adminDb
      .collection("attendance")
      .where("date", ">=", weekStart)
      .where("date", "<=", weekEnd)
      .get();

    const attendanceRecords = attendanceSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as AttendanceRecord[];

    // Build daily breakdown
    const dailyBreakdown: DailyBreakdown[] = [];
    let totalSessions = 0;
    let totalEnrolled = 0;
    let totalAttended = 0;

    // Iterate through each day of the week
    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(currentDate.getDate() + i);
      const dateStr = currentDate.toISOString().split("T")[0];
      const dayOfWeek = currentDate.getDay();

      // Group sessions by type for this day
      const typeBreakdowns = new Map<string, SessionTypeBreakdown>();

      for (const session of sessions) {
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

        if (currentDate < sessionStart || currentDate > sessionEnd) {
          continue;
        }

        // Get session type from program
        const sessionTypeValue = programTypeMap.get(session.programId) || "other";
        const typeLabel = SESSION_TYPE_LABELS[sessionTypeValue] || sessionTypeValue;

        // Count attendance for this session on this date
        const sessionAttendance = attendanceRecords.filter(
          (r) => r.sessionId === session.id && r.date === dateStr
        );
        const attendedCount = sessionAttendance.filter((r) => r.checkedInAt).length;
        const enrolledCount = session.enrolled || 0;

        // Update type breakdown
        const existing = typeBreakdowns.get(typeLabel);
        if (existing) {
          existing.enrolled += enrolledCount;
          existing.attended += attendedCount;
        } else {
          typeBreakdowns.set(typeLabel, {
            type: typeLabel,
            enrolled: enrolledCount,
            attended: attendedCount,
            rate: 0, // Will calculate after
          });
        }

        totalSessions++;
        totalEnrolled += enrolledCount;
        totalAttended += attendedCount;
      }

      // Calculate rates for each type
      const bySessionType: SessionTypeBreakdown[] = [];
      typeBreakdowns.forEach((breakdown) => {
        breakdown.rate = breakdown.enrolled > 0
          ? Math.round((breakdown.attended / breakdown.enrolled) * 100)
          : 0;
        bySessionType.push(breakdown);
      });

      // Sort by type name for consistent ordering
      bySessionType.sort((a, b) => a.type.localeCompare(b.type));

      dailyBreakdown.push({
        date: dateStr,
        dayOfWeek,
        bySessionType,
      });
    }

    const summary: WeeklyAttendanceSummary = {
      weekStart,
      weekEnd,
      totalSessions,
      totalEnrolled,
      totalAttended,
      attendanceRate: totalEnrolled > 0
        ? Math.round((totalAttended / totalEnrolled) * 100)
        : 0,
      dailyBreakdown,
    };

    return NextResponse.json({ success: true, data: summary });
  } catch (error) {
    console.error("Error fetching weekly attendance:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch weekly attendance summary" },
      { status: 500 }
    );
  }
}
