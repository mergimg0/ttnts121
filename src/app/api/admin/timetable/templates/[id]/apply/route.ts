import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { TimetableTemplate, TemplateSlot } from "@/types/timetable";

const TEMPLATES_COLLECTION = "timetable_templates";
const SLOTS_COLLECTION = "timetable_slots";

interface ApplyTemplateRequest {
  weekStart: string; // ISO date "2026-01-27" (Monday of the week)
  overwriteExisting?: boolean; // Whether to replace existing slots
}

/**
 * POST /api/admin/timetable/templates/[id]/apply
 * Apply a template to create timetable slots for a specific week
 *
 * Request body:
 * - weekStart: ISO date string (required) - Monday of the target week
 * - overwriteExisting: boolean (optional, default false) - replace existing slots
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body: ApplyTemplateRequest = await request.json();

    // Validate weekStart
    if (!body.weekStart) {
      return NextResponse.json(
        {
          success: false,
          error: "weekStart is required",
        },
        { status: 400 }
      );
    }

    const parsedDate = new Date(body.weekStart);
    if (isNaN(parsedDate.getTime())) {
      return NextResponse.json(
        {
          success: false,
          error: "weekStart must be a valid ISO date string (e.g., 2026-01-27)",
        },
        { status: 400 }
      );
    }

    // Verify weekStart is a Monday (optional but recommended)
    const dayOfWeek = parsedDate.getUTCDay();
    if (dayOfWeek !== 1) {
      return NextResponse.json(
        {
          success: false,
          error: "weekStart should be a Monday (day 1 of the week)",
        },
        { status: 400 }
      );
    }

    // Fetch the template
    const templateDoc = await adminDb
      .collection(TEMPLATES_COLLECTION)
      .doc(id)
      .get();

    if (!templateDoc.exists) {
      return NextResponse.json(
        { success: false, error: "Timetable template not found" },
        { status: 404 }
      );
    }

    const template = {
      id: templateDoc.id,
      ...templateDoc.data(),
    } as TimetableTemplate;

    // Check if template is active
    if (!template.isActive) {
      return NextResponse.json(
        {
          success: false,
          error: "Cannot apply an inactive template. Activate it first.",
        },
        { status: 400 }
      );
    }

    // Check if template has slots
    if (!template.slots || template.slots.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Template has no slots to apply",
        },
        { status: 400 }
      );
    }

    // Handle existing slots for this week
    const existingSlotsSnapshot = await adminDb
      .collection(SLOTS_COLLECTION)
      .where("weekStart", "==", body.weekStart)
      .get();

    const existingSlots = existingSlotsSnapshot.docs;
    const overwriteExisting = body.overwriteExisting ?? false;

    if (existingSlots.length > 0 && !overwriteExisting) {
      return NextResponse.json(
        {
          success: false,
          error: `${existingSlots.length} slots already exist for week ${body.weekStart}. Set overwriteExisting: true to replace them.`,
          meta: {
            existingSlotCount: existingSlots.length,
            weekStart: body.weekStart,
          },
        },
        { status: 409 }
      );
    }

    // Use a batch write for atomicity
    const batch = adminDb.batch();

    // Delete existing slots if overwriting
    if (overwriteExisting && existingSlots.length > 0) {
      for (const doc of existingSlots) {
        batch.delete(doc.ref);
      }
    }

    // Create new slots from template
    const createdSlotIds: string[] = [];
    const now = new Date();

    for (const templateSlot of template.slots) {
      const slotRef = adminDb.collection(SLOTS_COLLECTION).doc();

      const slotData = {
        dayOfWeek: templateSlot.dayOfWeek,
        startTime: templateSlot.startTime,
        endTime: templateSlot.endTime,
        coachId: templateSlot.coachId,
        coachName: templateSlot.coachName,
        slotType: templateSlot.slotType,
        weekStart: body.weekStart,
        // Copy default student info if present
        ...(templateSlot.defaultStudentName && {
          studentName: templateSlot.defaultStudentName,
        }),
        ...(templateSlot.defaultBookingId && {
          bookingId: templateSlot.defaultBookingId,
        }),
        // Metadata
        createdAt: now,
        updatedAt: now,
        // Track which template this came from
        sourceTemplateId: id,
      };

      batch.set(slotRef, slotData);
      createdSlotIds.push(slotRef.id);
    }

    // Commit the batch
    await batch.commit();

    // Return summary
    return NextResponse.json(
      {
        success: true,
        message: `Template "${template.name}" applied successfully to week ${body.weekStart}`,
        data: {
          templateId: id,
          templateName: template.name,
          weekStart: body.weekStart,
          slotsCreated: createdSlotIds.length,
          slotsDeleted: overwriteExisting ? existingSlots.length : 0,
          slotIds: createdSlotIds,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error applying timetable template:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      {
        success: false,
        error: `Failed to apply timetable template: ${errorMessage}`,
      },
      { status: 500 }
    );
  }
}
