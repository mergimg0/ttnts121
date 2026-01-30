import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { verifyAdmin } from "@/lib/admin-auth";
import type {
  GDSStudent,
  CreateGDSStudentInput,
  GDSDay,
  GDSAgeGroup,
  GDSStudentStatus,
} from "@/types/gds";

/**
 * GET /api/admin/gds/students
 * List GDS students with filters
 *
 * Query params:
 * - day: monday | wednesday | saturday
 * - ageGroup: Y1-Y2 | Y3-Y4 | Y5-Y6 | Y6-Y7 | 6-7 | 9-10
 * - status: active | inactive | trial
 * - search: string (searches studentName and parentName)
 * - limit: number (default 100)
 */
export async function GET(request: NextRequest) {
  const auth = await verifyAdmin(request);
  if (!auth.authenticated) return auth.error!;

  try {
    const { searchParams } = new URL(request.url);
    const day = searchParams.get("day") as GDSDay | null;
    const ageGroup = searchParams.get("ageGroup") as GDSAgeGroup | null;
    const status = searchParams.get("status") as GDSStudentStatus | null;
    const search = searchParams.get("search")?.toLowerCase();
    const limit = parseInt(searchParams.get("limit") || "100", 10);

    // Fetch all and filter in memory to avoid composite index requirement
    const snapshot = await adminDb.collection("gds_students").get();

    let students = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as GDSStudent[];

    // Apply filters in memory
    if (day) {
      students = students.filter((s) => s.day === day);
    }

    if (ageGroup) {
      // Handle age group format variations (e.g., "Y1 - Y2" vs "Y1-Y2")
      students = students.filter((s) => {
        const normalizedFilter = ageGroup.replace(/\s+/g, "");
        const normalizedValue = s.ageGroup?.replace(/\s+/g, "") || "";
        return normalizedValue === normalizedFilter;
      });
    }

    if (status) {
      students = students.filter((s) => s.status === status);
    }

    // Client-side search filtering
    if (search) {
      students = students.filter(
        (student) =>
          student.studentName.toLowerCase().includes(search) ||
          student.parentName?.toLowerCase().includes(search) ||
          student.parentEmail?.toLowerCase().includes(search)
      );
    }

    // Sort by studentName
    students.sort((a, b) => a.studentName.localeCompare(b.studentName));

    // Apply limit
    if (limit > 0) {
      students = students.slice(0, limit);
    }

    return NextResponse.json({
      success: true,
      data: students,
      count: students.length,
    });
  } catch (error) {
    console.error("Error fetching GDS students:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch GDS students" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/gds/students
 * Create a new GDS student
 */
export async function POST(request: NextRequest) {
  const auth = await verifyAdmin(request);
  if (!auth.authenticated) return auth.error!;

  try {
    const body: CreateGDSStudentInput = await request.json();

    // Validate required fields
    if (!body.studentName || !body.day || !body.ageGroup || !body.status) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: studentName, day, ageGroup, and status",
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

    // Validate status
    const validStatuses: GDSStudentStatus[] = ["active", "inactive", "trial"];
    if (!validStatuses.includes(body.status)) {
      return NextResponse.json(
        { success: false, error: "Invalid status. Must be active, inactive, or trial" },
        { status: 400 }
      );
    }

    const now = new Date();
    const studentData = {
      ...body,
      totalAttendances: 0,
      playerOfSessionCount: 0,
      enrolledAt: now,
      updatedAt: now,
    };

    const docRef = await adminDb.collection("gds_students").add(studentData);

    return NextResponse.json(
      {
        success: true,
        data: {
          id: docRef.id,
          ...studentData,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating GDS student:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create GDS student" },
      { status: 500 }
    );
  }
}
