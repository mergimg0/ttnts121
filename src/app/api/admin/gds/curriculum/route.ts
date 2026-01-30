import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { verifyAdmin } from "@/lib/admin-auth";
import type {
  GDSCurriculum,
  CreateGDSCurriculumInput,
  GDSDay,
} from "@/types/gds";

/**
 * GET /api/admin/gds/curriculum
 * List GDS curriculum records with filters
 *
 * Query params:
 * - day: monday | wednesday | saturday
 * - isActive: true | false
 * - date: YYYY-MM-DD (returns curriculums active on this date)
 * - limit: number (default 50)
 */
export async function GET(request: NextRequest) {
  const auth = await verifyAdmin(request);
  if (!auth.authenticated) return auth.error!;

  try {
    const { searchParams } = new URL(request.url);
    const day = searchParams.get("day") as GDSDay | null;
    const isActive = searchParams.get("isActive");
    const date = searchParams.get("date");
    const limit = parseInt(searchParams.get("limit") || "50", 10);

    let query = adminDb
      .collection("gds_curriculum")
      .orderBy("startDate", "desc");

    // Apply filters
    if (day) {
      query = query.where("day", "==", day);
    }

    if (isActive !== null && isActive !== undefined) {
      query = query.where("isActive", "==", isActive === "true");
    }

    const snapshot = await query.limit(limit).get();

    let curriculums = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as GDSCurriculum[];

    // Client-side filter for date range (if specific date provided)
    if (date) {
      curriculums = curriculums.filter(
        (c) => c.startDate <= date && c.endDate >= date
      );
    }

    return NextResponse.json({
      success: true,
      data: curriculums,
      count: curriculums.length,
    });
  } catch (error) {
    console.error("Error fetching GDS curriculum:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch GDS curriculum" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/gds/curriculum
 * Create a new GDS curriculum
 */
export async function POST(request: NextRequest) {
  const auth = await verifyAdmin(request);
  if (!auth.authenticated) return auth.error!;

  try {
    const body: CreateGDSCurriculumInput = await request.json();

    // Validate required fields
    if (!body.day || !body.startDate || !body.endDate || !body.focusArea) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: day, startDate, endDate, and focusArea",
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
    if (!dateRegex.test(body.startDate) || !dateRegex.test(body.endDate)) {
      return NextResponse.json(
        { success: false, error: "Invalid date format. Use YYYY-MM-DD" },
        { status: 400 }
      );
    }

    // Validate date range
    if (body.startDate > body.endDate) {
      return NextResponse.json(
        { success: false, error: "startDate must be before or equal to endDate" },
        { status: 400 }
      );
    }

    const now = new Date();
    const curriculumData = {
      ...body,
      drillSchedule: body.drillSchedule || [],
      isActive: body.isActive ?? true,
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await adminDb.collection("gds_curriculum").add(curriculumData);

    return NextResponse.json(
      {
        success: true,
        data: {
          id: docRef.id,
          ...curriculumData,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating GDS curriculum:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create GDS curriculum" },
      { status: 500 }
    );
  }
}
