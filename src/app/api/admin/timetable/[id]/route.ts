import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { verifyAdmin } from "@/lib/admin-auth";
import {
  TimetableSlot,
  UpdateTimetableSlotInput,
} from "@/types/timetable";

const COLLECTION_NAME = "timetable_slots";

/**
 * GET /api/admin/timetable/[id]
 * Get a single timetable slot by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAdmin(request);
  if (!auth.authenticated) return auth.error!;

  try {
    const { id } = await params;
    const doc = await adminDb.collection(COLLECTION_NAME).doc(id).get();

    if (!doc.exists) {
      return NextResponse.json(
        { success: false, error: "Timetable slot not found" },
        { status: 404 }
      );
    }

    const slot: TimetableSlot = {
      id: doc.id,
      ...doc.data(),
    } as TimetableSlot;

    return NextResponse.json({
      success: true,
      data: slot,
    });
  } catch (error) {
    console.error("Error fetching timetable slot:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      {
        success: false,
        error: `Failed to fetch timetable slot: ${errorMessage}`,
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/timetable/[id]
 * Update a timetable slot
 *
 * Request body: UpdateTimetableSlotInput (partial)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAdmin(request);
  if (!auth.authenticated) return auth.error!;

  try {
    const { id } = await params;
    const body: UpdateTimetableSlotInput = await request.json();

    // Check if document exists first
    const existingDoc = await adminDb.collection(COLLECTION_NAME).doc(id).get();
    if (!existingDoc.exists) {
      return NextResponse.json(
        { success: false, error: "Timetable slot not found" },
        { status: 404 }
      );
    }

    // Validate dayOfWeek if provided
    if (
      body.dayOfWeek !== undefined &&
      (body.dayOfWeek < 0 || body.dayOfWeek > 6)
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "dayOfWeek must be between 0 (Sunday) and 6 (Saturday)",
        },
        { status: 400 }
      );
    }

    // Validate time format if provided
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (body.startTime && !timeRegex.test(body.startTime)) {
      return NextResponse.json(
        {
          success: false,
          error: "startTime must be in HH:MM format (e.g., 15:00)",
        },
        { status: 400 }
      );
    }

    if (body.endTime && !timeRegex.test(body.endTime)) {
      return NextResponse.json(
        {
          success: false,
          error: "endTime must be in HH:MM format (e.g., 16:00)",
        },
        { status: 400 }
      );
    }

    // Validate slotType if provided
    const validSlotTypes = ["121", "ASC", "GDS", "OBS", "AVAILABLE"];
    if (body.slotType && !validSlotTypes.includes(body.slotType)) {
      return NextResponse.json(
        {
          success: false,
          error: `slotType must be one of: ${validSlotTypes.join(", ")}`,
        },
        { status: 400 }
      );
    }

    // Validate weekStart if provided
    if (body.weekStart) {
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
    }

    // Check for duplicate if changing time/day/coach
    const existingData = existingDoc.data();
    const newWeekStart = body.weekStart || existingData?.weekStart;
    const newCoachId = body.coachId || existingData?.coachId;
    const newDayOfWeek = body.dayOfWeek ?? existingData?.dayOfWeek;
    const newStartTime = body.startTime || existingData?.startTime;

    // Only check for duplicates if one of these fields changed
    if (
      body.weekStart ||
      body.coachId ||
      body.dayOfWeek !== undefined ||
      body.startTime
    ) {
      const duplicateCheck = await adminDb
        .collection(COLLECTION_NAME)
        .where("weekStart", "==", newWeekStart)
        .where("coachId", "==", newCoachId)
        .where("dayOfWeek", "==", newDayOfWeek)
        .where("startTime", "==", newStartTime)
        .get();

      // Check if any duplicate exists that isn't the current document
      const hasDuplicate = duplicateCheck.docs.some((doc) => doc.id !== id);
      if (hasDuplicate) {
        return NextResponse.json(
          {
            success: false,
            error:
              "A slot already exists for this coach at this day and time",
          },
          { status: 409 }
        );
      }
    }

    // Prepare update data
    const updateData = {
      ...body,
      updatedAt: new Date(),
    };

    await adminDb.collection(COLLECTION_NAME).doc(id).update(updateData);

    // Verify update succeeded
    const verifyDoc = await adminDb.collection(COLLECTION_NAME).doc(id).get();
    if (!verifyDoc.exists) {
      console.error(
        "Firebase write verification failed: document not found after update"
      );
      return NextResponse.json(
        {
          success: false,
          error: "Failed to verify slot update. Please try again.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { id, ...verifyDoc.data() },
      message: "Timetable slot updated successfully",
    });
  } catch (error) {
    console.error("Error updating timetable slot:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      {
        success: false,
        error: `Failed to update timetable slot: ${errorMessage}`,
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/timetable/[id]
 * Delete a timetable slot
 *
 * Note: This allows deleting any slot. If the slot has associated
 * bookings, the booking references will become orphaned.
 * Consider checking bookingId before deletion in production.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAdmin(request);
  if (!auth.authenticated) return auth.error!;

  try {
    const { id } = await params;

    // Check if document exists
    const doc = await adminDb.collection(COLLECTION_NAME).doc(id).get();
    if (!doc.exists) {
      return NextResponse.json(
        { success: false, error: "Timetable slot not found" },
        { status: 404 }
      );
    }

    // Check if slot has an associated booking
    const slotData = doc.data();
    if (slotData?.bookingId) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Cannot delete a slot with an active booking. Cancel the booking first.",
        },
        { status: 400 }
      );
    }

    await adminDb.collection(COLLECTION_NAME).doc(id).delete();

    return NextResponse.json({
      success: true,
      message: "Timetable slot deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting timetable slot:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      {
        success: false,
        error: `Failed to delete timetable slot: ${errorMessage}`,
      },
      { status: 500 }
    );
  }
}
