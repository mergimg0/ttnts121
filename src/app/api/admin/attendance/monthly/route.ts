import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { verifyAdmin } from "@/lib/admin-auth";
import { MonthlyAttendanceSummary, SessionType, AttendanceRecord } from "@/types/attendance";
import { Session } from "@/types/booking";

// GET monthly attendance summary
export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAdmin(request);
    if (!auth.authenticated) return auth.error!;
    const { searchParams } = new URL(request.url);
    const month = parseInt(searchParams.get("month") || String(new Date().getMonth() + 1));
    const year = parseInt(searchParams.get("year") || String(new Date().getFullYear()));

    // Filter params
    const sessionType = searchParams.get("sessionType") as SessionType | null;
    const coachId = searchParams.get("coachId");
    const location = searchParams.get("location");

    // Calculate date range for the month
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0); // Last day of month

    const startDateStr = startDate.toISOString().split("T")[0];
    const endDateStr = endDate.toISOString().split("T")[0];

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
    if (sessionType) {
      const programsSnapshot = await adminDb
        .collection("programs")
        .where("serviceType", "==", sessionType)
        .get();

      const programIds = new Set(programsSnapshot.docs.map((doc) => doc.id));
      sessions = sessions.filter((s) => programIds.has(s.programId));
    }

    if (coachId) {
      sessions = sessions.filter(
        (s) => s.coaches && s.coaches.includes(coachId)
      );
    }

    if (location) {
      sessions = sessions.filter(
        (s) => s.location && s.location.toLowerCase().includes(location.toLowerCase())
      );
    }

    // Get attendance records for the entire month
    const attendanceSnapshot = await adminDb
      .collection("attendance")
      .where("date", ">=", startDateStr)
      .where("date", "<=", endDateStr)
      .get();

    const attendanceRecords = attendanceSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as AttendanceRecord[];

    // Group attendance by date
    const attendanceByDate = new Map<string, AttendanceRecord[]>();
    for (const record of attendanceRecords) {
      const existing = attendanceByDate.get(record.date) || [];
      attendanceByDate.set(record.date, [...existing, record]);
    }

    // Calculate daily rates
    const dailyRates: { date: string; rate: number; sessionCount: number; enrolled: number; attended: number }[] = [];
    let totalEnrolledSum = 0;
    let totalAttendedSum = 0;
    let daysWithSessions = 0;

    // Iterate through each day of the month
    for (let day = 1; day <= endDate.getDate(); day++) {
      const currentDate = new Date(year, month - 1, day);
      const dateStr = currentDate.toISOString().split("T")[0];
      const dayOfWeek = currentDate.getDay();

      // Find sessions that run on this day
      let dayEnrolled = 0;
      let dayAttended = 0;
      let daySessionCount = 0;

      for (const session of sessions) {
        // Check if session runs on this day of week
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

        // Count attendance for this session on this date
        const dayAttendance = attendanceByDate.get(dateStr) || [];
        const sessionAttendance = dayAttendance.filter((r) => r.sessionId === session.id);
        const attendedCount = sessionAttendance.filter((r) => r.checkedInAt).length;

        dayEnrolled += session.enrolled;
        dayAttended += attendedCount;
        daySessionCount++;
      }

      // Only add days that have sessions
      if (daySessionCount > 0) {
        const rate = dayEnrolled > 0 ? Math.round((dayAttended / dayEnrolled) * 100) : 0;
        dailyRates.push({
          date: dateStr,
          rate,
          sessionCount: daySessionCount,
          enrolled: dayEnrolled,
          attended: dayAttended,
        });

        totalEnrolledSum += dayEnrolled;
        totalAttendedSum += dayAttended;
        daysWithSessions++;
      }
    }

    // Calculate average attendance rate for the month
    const averageAttendanceRate = totalEnrolledSum > 0
      ? Math.round((totalAttendedSum / totalEnrolledSum) * 100)
      : 0;

    const summary: MonthlyAttendanceSummary = {
      month,
      year,
      averageAttendanceRate,
      dailyRates: dailyRates.map(({ date, rate, sessionCount }) => ({
        date,
        rate,
        sessionCount,
      })),
    };

    return NextResponse.json({ success: true, data: summary });
  } catch (error) {
    console.error("Error fetching monthly attendance:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch monthly attendance summary" },
      { status: 500 }
    );
  }
}
