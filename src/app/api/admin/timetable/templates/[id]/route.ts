import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import {
  TimetableTemplate,
  UpdateTimetableTemplateInput,
} from "@/types/timetable";

const COLLECTION_NAME = "timetable_templates";

/**
 * GET /api/admin/timetable/templates/[id]
 * Get a single timetable template by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const doc = await adminDb.collection(COLLECTION_NAME).doc(id).get();

    if (!doc.exists) {
      return NextResponse.json(
        { success: false, error: "Timetable template not found" },
        { status: 404 }
      );
    }

    const template: TimetableTemplate = {
      id: doc.id,
      ...doc.data(),
    } as TimetableTemplate;

    return NextResponse.json({
      success: true,
      data: template,
    });
  } catch (error) {
    console.error("Error fetching timetable template:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      {
        success: false,
        error: `Failed to fetch timetable template: ${errorMessage}`,
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/timetable/templates/[id]
 * Update a timetable template
 *
 * Request body: UpdateTimetableTemplateInput (partial)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body: UpdateTimetableTemplateInput = await request.json();

    // Check if document exists first
    const existingDoc = await adminDb.collection(COLLECTION_NAME).doc(id).get();
    if (!existingDoc.exists) {
      return NextResponse.json(
        { success: false, error: "Timetable template not found" },
        { status: 404 }
      );
    }

    // Validate name if provided
    if (body.name !== undefined) {
      if (!body.name || body.name.trim() === "") {
        return NextResponse.json(
          {
            success: false,
            error: "Template name cannot be empty",
          },
          { status: 400 }
        );
      }

      // Check for duplicate name (excluding current template)
      const duplicateCheck = await adminDb
        .collection(COLLECTION_NAME)
        .where("name", "==", body.name.trim())
        .get();

      const hasDuplicate = duplicateCheck.docs.some((doc) => doc.id !== id);
      if (hasDuplicate) {
        return NextResponse.json(
          {
            success: false,
            error: "A template with this name already exists",
          },
          { status: 409 }
        );
      }
    }

    // Validate slots if provided
    if (body.slots !== undefined) {
      if (!Array.isArray(body.slots)) {
        return NextResponse.json(
          {
            success: false,
            error: "slots must be an array",
          },
          { status: 400 }
        );
      }

      const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
      const validSlotTypes = ["121", "ASC", "GDS", "OBS", "AVAILABLE"];

      for (let i = 0; i < body.slots.length; i++) {
        const slot = body.slots[i];

        // Validate dayOfWeek
        if (slot.dayOfWeek < 0 || slot.dayOfWeek > 6) {
          return NextResponse.json(
            {
              success: false,
              error: `Slot ${i + 1}: dayOfWeek must be between 0 (Sunday) and 6 (Saturday)`,
            },
            { status: 400 }
          );
        }

        // Validate startTime
        if (!timeRegex.test(slot.startTime)) {
          return NextResponse.json(
            {
              success: false,
              error: `Slot ${i + 1}: startTime must be in HH:MM format`,
            },
            { status: 400 }
          );
        }

        // Validate endTime
        if (!timeRegex.test(slot.endTime)) {
          return NextResponse.json(
            {
              success: false,
              error: `Slot ${i + 1}: endTime must be in HH:MM format`,
            },
            { status: 400 }
          );
        }

        // Validate slotType
        if (!validSlotTypes.includes(slot.slotType)) {
          return NextResponse.json(
            {
              success: false,
              error: `Slot ${i + 1}: slotType must be one of: ${validSlotTypes.join(", ")}`,
            },
            { status: 400 }
          );
        }

        // Validate required slot fields
        if (!slot.coachId || !slot.coachName) {
          return NextResponse.json(
            {
              success: false,
              error: `Slot ${i + 1}: coachId and coachName are required`,
            },
            { status: 400 }
          );
        }
      }
    }

    // Prepare update data
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (body.name !== undefined) {
      updateData.name = body.name.trim();
    }
    if (body.description !== undefined) {
      updateData.description = body.description;
    }
    if (body.isActive !== undefined) {
      updateData.isActive = body.isActive;
    }
    if (body.slots !== undefined) {
      updateData.slots = body.slots;
    }

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
          error: "Failed to verify template update. Please try again.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { id, ...verifyDoc.data() },
      message: "Timetable template updated successfully",
    });
  } catch (error) {
    console.error("Error updating timetable template:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      {
        success: false,
        error: `Failed to update timetable template: ${errorMessage}`,
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/timetable/templates/[id]
 * Delete a timetable template
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if document exists
    const doc = await adminDb.collection(COLLECTION_NAME).doc(id).get();
    if (!doc.exists) {
      return NextResponse.json(
        { success: false, error: "Timetable template not found" },
        { status: 404 }
      );
    }

    await adminDb.collection(COLLECTION_NAME).doc(id).delete();

    return NextResponse.json({
      success: true,
      message: "Timetable template deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting timetable template:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      {
        success: false,
        error: `Failed to delete timetable template: ${errorMessage}`,
      },
      { status: 500 }
    );
  }
}
