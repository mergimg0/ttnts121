import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { verifyAdmin } from "@/lib/admin-auth";
import type {
  GDSAttendance,
  CreateGDSAttendanceInput,
  GDSDay,
  GDSAgeGroup,
} from "@/types/gds";

/**
 * GET /api/admin/gds/attendance
 * List GDS attendance records with filters
 *
 * Query params:
 * - day: monday | wednesday | saturday
 * - sessionDate: YYYY-MM-DD format
 * - ageGroup: Y1-Y2 | Y3-Y4 | Y5-Y6 | Y6-Y7 | 6-7 | 9-10
 * - startDate: YYYY-MM-DD (for date range)
 * - endDate: YYYY-MM-DD (for date range)
 * - limit: number (default 50)
 */
export async function GET(request: NextRequest) {
  const auth = await verifyAdmin(request);
  if (!auth.authenticated) return auth.error!;

  try {
    const { searchParams } = new URL(request.url);
    const day = searchParams.get("day") as GDSDay | null;
    const sessionDate = searchParams.get("sessionDate");
    const ageGroup = searchParams.get("ageGroup") as GDSAgeGroup | null;
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const limit = parseInt(searchParams.get("limit") || "50", 10);

    let query = adminDb
      .collection("gds_attendance")
      .orderBy("sessionDate", "desc");

    // Apply filters directly in Firestore where possible
    if (day) {
      query = query.where("day", "==", day);
    }

    if (sessionDate) {
      query = query.where("sessionDate", "==", sessionDate);
    }

    if (ageGroup) {
      query = query.where("ageGroup", "==", ageGroup);
    }

    // Date range filtering
    if (startDate && !sessionDate) {
      query = query.where("sessionDate", ">=", startDate);
    }

    if (endDate && !sessionDate) {
      query = query.where("sessionDate", "<=", endDate);
    }

    const snapshot = await query.limit(limit).get();

    const attendance = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as GDSAttendance[];

    return NextResponse.json({
      success: true,
      data: attendance,
      count: attendance.length,
    });
  } catch (error) {
    console.error("Error fetching GDS attendance:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch GDS attendance" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/gds/attendance
 * Create a new GDS attendance record
 */
export async function POST(request: NextRequest) {
  const auth = await verifyAdmin(request);
  if (!auth.authenticated) return auth.error!;

  try {
    const body: CreateGDSAttendanceInput = await request.json();

    // Validate required fields
    if (!body.day || !body.ageGroup || !body.sessionDate) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: day, ageGroup, and sessionDate",
        },
        { status: 400 }
      );
    }

    // Validate day
    const validDays: GDSDay[] = ["monday", "wednesday", "saturday"];
    if (!validDays.includes(body.day)) {
      return NextResponse.json(
        { success: false, error: "Invalid day. Must be monday, wednesday, or saturday" },
        { status: 400 }
      );
    }

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(body.sessionDate)) {
      return NextResponse.json(
        { success: false, error: "Invalid sessionDate format. Use YYYY-MM-DD" },
        { status: 400 }
      );
    }

    // Check for existing attendance record for same day/date/ageGroup
    const existingQuery = await adminDb
      .collection("gds_attendance")
      .where("day", "==", body.day)
      .where("sessionDate", "==", body.sessionDate)
      .where("ageGroup", "==", body.ageGroup)
      .limit(1)
      .get();

    if (!existingQuery.empty) {
      return NextResponse.json(
        {
          success: false,
          error: "Attendance record already exists for this day, date, and age group",
          existingId: existingQuery.docs[0].id,
        },
        { status: 409 }
      );
    }

    const now = new Date();
    const attendanceData = {
      ...body,
      attendees: body.attendees || [],
      totalAttendees: body.attendees?.length || 0,
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await adminDb.collection("gds_attendance").add(attendanceData);

    return NextResponse.json(
      {
        success: true,
        data: {
          id: docRef.id,
          ...attendanceData,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating GDS attendance:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create GDS attendance" },
      { status: 500 }
    );
  }
}
