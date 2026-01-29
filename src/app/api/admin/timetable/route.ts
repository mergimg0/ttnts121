import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import {
  TimetableSlot,
  CreateTimetableSlotInput,
} from "@/types/timetable";

const COLLECTION_NAME = "timetable_slots";

/**
 * GET /api/admin/timetable
 * List timetable slots by week, with optional coach filter
 *
 * Query params:
 * - weekStart: ISO date string (required) - e.g., "2026-01-27"
 * - coachId: string (optional) - filter by specific coach
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const weekStart = searchParams.get("weekStart");
    const coachId = searchParams.get("coachId");

    if (!weekStart) {
      return NextResponse.json(
        {
          success: false,
          error: "weekStart query parameter is required",
        },
        { status: 400 }
      );
    }

    // Validate weekStart is a valid ISO date
    const parsedDate = new Date(weekStart);
    if (isNaN(parsedDate.getTime())) {
      return NextResponse.json(
        {
          success: false,
          error: "weekStart must be a valid ISO date string (e.g., 2026-01-27)",
        },
        { status: 400 }
      );
    }

    // Build query
    let query = adminDb
      .collection(COLLECTION_NAME)
      .where("weekStart", "==", weekStart);

    if (coachId) {
      query = query.where("coachId", "==", coachId);
    }

    // Order by day of week, then start time for consistent display
    query = query.orderBy("dayOfWeek", "asc").orderBy("startTime", "asc");

    const snapshot = await query.get();

    const slots = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as TimetableSlot[];

    return NextResponse.json({
      success: true,
      data: slots,
      meta: {
        weekStart,
        coachId: coachId || null,
        total: slots.length,
      },
    });
  } catch (error) {
    console.error("Error fetching timetable slots:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      {
        success: false,
        error: `Failed to fetch timetable slots: ${errorMessage}`,
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/timetable
 * Create a new timetable slot
 *
 * Request body: CreateTimetableSlotInput
 */
export async function POST(request: NextRequest) {
  try {
    const body: CreateTimetableSlotInput = await request.json();

    // Validate required fields
    const requiredFields = [
      "dayOfWeek",
      "startTime",
      "endTime",
      "coachId",
      "coachName",
      "slotType",
      "weekStart",
    ] as const;

    const missingFields = requiredFields.filter(
      (field) => body[field] === undefined || body[field] === null
    );

    if (missingFields.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Missing required fields: ${missingFields.join(", ")}`,
        },
        { status: 400 }
      );
    }

    // Validate dayOfWeek (0-6)
    if (body.dayOfWeek < 0 || body.dayOfWeek > 6) {
      return NextResponse.json(
        {
          success: false,
          error: "dayOfWeek must be between 0 (Sunday) and 6 (Saturday)",
        },
        { status: 400 }
      );
    }

    // Validate time format (HH:MM)
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(body.startTime)) {
      return NextResponse.json(
        {
          success: false,
          error: "startTime must be in HH:MM format (e.g., 15:00)",
        },
        { status: 400 }
      );
    }

    if (!timeRegex.test(body.endTime)) {
      return NextResponse.json(
        {
          success: false,
          error: "endTime must be in HH:MM format (e.g., 16:00)",
        },
        { status: 400 }
      );
    }

    // Validate slotType
    const validSlotTypes = ["121", "ASC", "GDS", "OBS", "AVAILABLE"];
    if (!validSlotTypes.includes(body.slotType)) {
      return NextResponse.json(
        {
          success: false,
          error: `slotType must be one of: ${validSlotTypes.join(", ")}`,
        },
        { status: 400 }
      );
    }

    // Validate weekStart is a valid ISO date
    const parsedWeekStart = new Date(body.weekStart);
    if (isNaN(parsedWeekStart.getTime())) {
      return NextResponse.json(
        {
          success: false,
          error: "weekStart must be a valid ISO date string",
        },
        { status: 400 }
      );
    }

    // Check for duplicate slot (same coach, day, time, week)
    const duplicateCheck = await adminDb
      .collection(COLLECTION_NAME)
      .where("weekStart", "==", body.weekStart)
      .where("coachId", "==", body.coachId)
      .where("dayOfWeek", "==", body.dayOfWeek)
      .where("startTime", "==", body.startTime)
      .limit(1)
      .get();

    if (!duplicateCheck.empty) {
      return NextResponse.json(
        {
          success: false,
          error:
            "A slot already exists for this coach at this day and time",
        },
        { status: 409 }
      );
    }

    // Create the slot document
    const slotData = {
      ...body,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const docRef = await adminDb.collection(COLLECTION_NAME).add(slotData);

    // Verify write succeeded
    const verifyDoc = await docRef.get();
    if (!verifyDoc.exists) {
      console.error(
        "Firebase write verification failed: document not found after create"
      );
      return NextResponse.json(
        {
          success: false,
          error:
            "Failed to verify slot creation. Please try again.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: { id: docRef.id, ...verifyDoc.data() },
        message: "Timetable slot created successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating timetable slot:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      {
        success: false,
        error: `Failed to create timetable slot: ${errorMessage}`,
      },
      { status: 500 }
    );
  }
}
