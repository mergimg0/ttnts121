import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import {
  AttendanceAnalytics,
  AtRiskStudent,
  SessionType,
  AttendanceRecord,
} from "@/types/attendance";
import { Session } from "@/types/booking";
import { Booking } from "@/types/booking";

// GET attendance analytics
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Default to last 30 days
    const now = new Date();
    const defaultFrom = new Date(now);
    defaultFrom.setDate(defaultFrom.getDate() - 30);

    const dateFrom =
      searchParams.get("dateFrom") || defaultFrom.toISOString().split("T")[0];
    const dateTo =
      searchParams.get("dateTo") || now.toISOString().split("T")[0];

    // Filter params
    const sessionType = searchParams.get("sessionType") as SessionType | null;
    const coachId = searchParams.get("coachId");

    // Get all active sessions
    const sessionsSnapshot = await adminDb
      .collection("sessions")
      .where("isActive", "==", true)
      .get();

    let sessions = sessionsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Session[];

    // Apply session type filter
    let programTypeMap = new Map<string, string>();
    if (sessionType) {
      const programsSnapshot = await adminDb
        .collection("programs")
        .where("serviceType", "==", sessionType)
        .get();

      const programIds = new Set(programsSnapshot.docs.map((doc) => doc.id));
      sessions = sessions.filter((s) => programIds.has(s.programId));
    } else {
      // Get all programs to map session types
      const allProgramsSnapshot = await adminDb.collection("programs").get();
      for (const doc of allProgramsSnapshot.docs) {
        programTypeMap.set(doc.id, doc.data().serviceType || "other");
      }
    }

    // Apply coach filter
    if (coachId) {
      sessions = sessions.filter(
        (s) => s.coaches && s.coaches.includes(coachId)
      );
    }

    const sessionIds = new Set(sessions.map((s) => s.id));

    // Get attendance records for the date range
    const attendanceSnapshot = await adminDb
      .collection("attendance")
      .where("date", ">=", dateFrom)
      .where("date", "<=", dateTo)
      .get();

    const allAttendanceRecords = attendanceSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as AttendanceRecord[];

    // Filter to only include attendance for filtered sessions
    const attendanceRecords = allAttendanceRecords.filter((r) =>
      sessionIds.has(r.sessionId)
    );

    // Get bookings for enrolled counts and student data
    const bookingsSnapshot = await adminDb.collection("bookings").get();
    const bookings = bookingsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Booking[];

    // Filter bookings to only include those for filtered sessions
    const relevantBookings = bookings.filter((b) =>
      sessionIds.has(b.sessionId)
    );

    // Calculate overall statistics
    const { overallRate, trendData, bySessionType, byDayOfWeek } =
      calculateAnalytics(
        sessions,
        attendanceRecords,
        dateFrom,
        dateTo,
        programTypeMap
      );

    // Calculate at-risk students
    const atRiskStudents = calculateAtRiskStudents(
      relevantBookings,
      attendanceRecords,
      sessions,
      dateFrom,
      dateTo
    );

    const analytics: AttendanceAnalytics = {
      period: { start: dateFrom, end: dateTo },
      overallRate,
      trendData,
      bySessionType,
      byDayOfWeek,
      atRiskStudents,
    };

    return NextResponse.json({ success: true, data: analytics });
  } catch (error) {
    console.error("Error fetching attendance analytics:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch attendance analytics" },
      { status: 500 }
    );
  }
}

interface AnalyticsResult {
  overallRate: number;
  trendData: { date: string; rate: number }[];
  bySessionType: { type: string; rate: number; count: number }[];
  byDayOfWeek: { day: string; avgRate: number }[];
}

function calculateAnalytics(
  sessions: Session[],
  attendanceRecords: AttendanceRecord[],
  dateFrom: string,
  dateTo: string,
  programTypeMap: Map<string, string>
): AnalyticsResult {
  // Group attendance by date
  const attendanceByDate = new Map<string, AttendanceRecord[]>();
  for (const record of attendanceRecords) {
    const existing = attendanceByDate.get(record.date) || [];
    attendanceByDate.set(record.date, [...existing, record]);
  }

  // Create session map for quick lookup
  const sessionMap = new Map(sessions.map((s) => [s.id, s]));

  // Calculate trend data (daily rates)
  const trendData: { date: string; rate: number }[] = [];
  let totalEnrolled = 0;
  let totalAttended = 0;

  // Iterate through each day in the range
  const startDate = new Date(dateFrom);
  const endDate = new Date(dateTo);
  const currentDate = new Date(startDate);

  // Session type accumulator
  const sessionTypeStats = new Map<
    string,
    { enrolled: number; attended: number }
  >();

  // Day of week accumulator
  const dayOfWeekStats = new Map<
    number,
    { enrolled: number; attended: number; days: number }
  >();

  while (currentDate <= endDate) {
    const dateStr = currentDate.toISOString().split("T")[0];
    const dayOfWeek = currentDate.getDay();

    let dayEnrolled = 0;
    let dayAttended = 0;

    for (const session of sessions) {
      // Check if session runs on this day of week
      const sessionDays = session.daysOfWeek || [session.dayOfWeek];
      if (!sessionDays.includes(dayOfWeek)) {
        continue;
      }

      // Check if date is within session date range
      const sessionStart =
        session.startDate instanceof Date
          ? session.startDate
          : new Date((session.startDate as { seconds: number }).seconds * 1000);
      const sessionEnd =
        session.endDate instanceof Date
          ? session.endDate
          : new Date((session.endDate as { seconds: number }).seconds * 1000);

      if (currentDate < sessionStart || currentDate > sessionEnd) {
        continue;
      }

      const enrolled = session.enrolled || 0;
      const dayAttendance = attendanceByDate.get(dateStr) || [];
      const sessionAttendance = dayAttendance.filter(
        (r) => r.sessionId === session.id
      );
      const attendedCount = sessionAttendance.filter(
        (r) => r.checkedInAt
      ).length;

      dayEnrolled += enrolled;
      dayAttended += attendedCount;

      // Track by session type
      const sessionType = programTypeMap.get(session.programId) || "other";
      const typeStats = sessionTypeStats.get(sessionType) || {
        enrolled: 0,
        attended: 0,
      };
      typeStats.enrolled += enrolled;
      typeStats.attended += attendedCount;
      sessionTypeStats.set(sessionType, typeStats);
    }

    // Only add days with sessions to trend data
    if (dayEnrolled > 0) {
      const rate = Math.round((dayAttended / dayEnrolled) * 100);
      trendData.push({ date: dateStr, rate });
      totalEnrolled += dayEnrolled;
      totalAttended += dayAttended;

      // Track day of week stats
      const dowStats = dayOfWeekStats.get(dayOfWeek) || {
        enrolled: 0,
        attended: 0,
        days: 0,
      };
      dowStats.enrolled += dayEnrolled;
      dowStats.attended += dayAttended;
      dowStats.days += 1;
      dayOfWeekStats.set(dayOfWeek, dowStats);
    }

    currentDate.setDate(currentDate.getDate() + 1);
  }

  // Calculate overall rate
  const overallRate =
    totalEnrolled > 0 ? Math.round((totalAttended / totalEnrolled) * 100) : 0;

  // Convert session type stats to array
  const sessionTypeLabels: Record<string, string> = {
    "after-school": "After School",
    "group-session": "Group Development",
    "one-to-one": "One-to-One",
    "half-term": "Half Term Camp",
    "birthday-party": "Birthday Party",
    other: "Other",
  };

  const bySessionType = Array.from(sessionTypeStats.entries()).map(
    ([type, stats]) => ({
      type: sessionTypeLabels[type] || type,
      rate:
        stats.enrolled > 0
          ? Math.round((stats.attended / stats.enrolled) * 100)
          : 0,
      count: stats.enrolled,
    })
  );

  // Convert day of week stats to array
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const byDayOfWeek = Array.from(dayOfWeekStats.entries())
    .sort(([a], [b]) => a - b)
    .map(([dow, stats]) => ({
      day: dayNames[dow],
      avgRate:
        stats.enrolled > 0
          ? Math.round((stats.attended / stats.enrolled) * 100)
          : 0,
    }));

  return { overallRate, trendData, bySessionType, byDayOfWeek };
}

function calculateAtRiskStudents(
  bookings: Booking[],
  attendanceRecords: AttendanceRecord[],
  sessions: Session[],
  dateFrom: string,
  dateTo: string
): AtRiskStudent[] {
  // Create map of booking -> attendance records
  const attendanceByBooking = new Map<string, AttendanceRecord[]>();
  for (const record of attendanceRecords) {
    const existing = attendanceByBooking.get(record.bookingId) || [];
    attendanceByBooking.set(record.bookingId, [...existing, record]);
  }

  // Create session map for date validation
  const sessionMap = new Map(sessions.map((s) => [s.id, s]));

  const atRiskStudents: AtRiskStudent[] = [];

  for (const booking of bookings) {
    const session = sessionMap.get(booking.sessionId);
    if (!session) continue;

    // Calculate expected sessions in date range
    const expectedSessions = countExpectedSessions(
      session,
      dateFrom,
      dateTo
    );

    if (expectedSessions === 0) continue;

    // Get attendance records for this booking
    const bookingAttendance = attendanceByBooking.get(booking.id) || [];
    const attendedRecords = bookingAttendance.filter((r) => r.checkedInAt);
    const attendedCount = attendedRecords.length;

    // Calculate rate
    const rate = Math.round((attendedCount / expectedSessions) * 100);

    // Calculate consecutive missed sessions
    const consecutiveMissed = calculateConsecutiveMissed(
      session,
      bookingAttendance,
      dateTo
    );

    // Check if at-risk: rate < 70% OR 3+ consecutive missed
    if (rate < 70 || consecutiveMissed >= 3) {
      // Find last attended date
      const lastAttendedRecord = attendedRecords
        .filter((r) => r.checkedInAt)
        .sort((a, b) => (b.date > a.date ? 1 : -1))[0];

      // Construct child name from booking fields
      const childName = `${booking.childFirstName} ${booking.childLastName}`;

      atRiskStudents.push({
        childName,
        bookingId: booking.id,
        enrolled: expectedSessions,
        attended: attendedCount,
        rate,
        lastAttended: lastAttendedRecord?.date,
        consecutiveMissed,
      });
    }
  }

  // Sort by rate ascending (worst first)
  atRiskStudents.sort((a, b) => a.rate - b.rate);

  return atRiskStudents;
}

function countExpectedSessions(
  session: Session,
  dateFrom: string,
  dateTo: string
): number {
  const sessionDays = session.daysOfWeek || [session.dayOfWeek];

  const sessionStart =
    session.startDate instanceof Date
      ? session.startDate
      : new Date((session.startDate as { seconds: number }).seconds * 1000);
  const sessionEnd =
    session.endDate instanceof Date
      ? session.endDate
      : new Date((session.endDate as { seconds: number }).seconds * 1000);

  // Use the later of dateFrom or session start
  const rangeStart = new Date(
    Math.max(new Date(dateFrom).getTime(), sessionStart.getTime())
  );
  // Use the earlier of dateTo or session end
  const rangeEnd = new Date(
    Math.min(new Date(dateTo).getTime(), sessionEnd.getTime())
  );

  if (rangeStart > rangeEnd) return 0;

  let count = 0;
  const currentDate = new Date(rangeStart);

  while (currentDate <= rangeEnd) {
    if (sessionDays.includes(currentDate.getDay())) {
      count++;
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return count;
}

function calculateConsecutiveMissed(
  session: Session,
  attendanceRecords: AttendanceRecord[],
  endDate: string
): number {
  const sessionDays = session.daysOfWeek || [session.dayOfWeek];

  const sessionStart =
    session.startDate instanceof Date
      ? session.startDate
      : new Date((session.startDate as { seconds: number }).seconds * 1000);
  const sessionEnd =
    session.endDate instanceof Date
      ? session.endDate
      : new Date((session.endDate as { seconds: number }).seconds * 1000);

  // Create set of attended dates
  const attendedDates = new Set(
    attendanceRecords.filter((r) => r.checkedInAt).map((r) => r.date)
  );

  // Work backwards from endDate
  const currentDate = new Date(
    Math.min(new Date(endDate).getTime(), sessionEnd.getTime())
  );
  let consecutiveMissed = 0;

  while (currentDate >= sessionStart) {
    if (sessionDays.includes(currentDate.getDay())) {
      const dateStr = currentDate.toISOString().split("T")[0];
      if (attendedDates.has(dateStr)) {
        // Found attended session, stop counting
        break;
      }
      consecutiveMissed++;
    }
    currentDate.setDate(currentDate.getDate() - 1);
  }

  return consecutiveMissed;
}
