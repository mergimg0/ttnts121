import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { verifyAdmin } from "@/lib/admin-auth";
import {
  TimetableTemplate,
  CreateTimetableTemplateInput,
} from "@/types/timetable";

const COLLECTION_NAME = "timetable_templates";

/**
 * GET /api/admin/timetable/templates
 * List all timetable templates
 *
 * Query params:
 * - activeOnly: boolean (optional) - filter to only active templates
 */
export async function GET(request: NextRequest) {
  const auth = await verifyAdmin(request);
  if (!auth.authenticated) return auth.error!;

  try {
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get("activeOnly") === "true";

    let query = adminDb
      .collection(COLLECTION_NAME)
      .orderBy("createdAt", "desc");

    if (activeOnly) {
      query = adminDb
        .collection(COLLECTION_NAME)
        .where("isActive", "==", true)
        .orderBy("createdAt", "desc");
    }

    const snapshot = await query.get();

    const templates = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as TimetableTemplate[];

    return NextResponse.json({
      success: true,
      data: templates,
      meta: {
        total: templates.length,
        activeOnly,
      },
    });
  } catch (error) {
    console.error("Error fetching timetable templates:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      {
        success: false,
        error: `Failed to fetch timetable templates: ${errorMessage}`,
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/timetable/templates
 * Create a new timetable template
 *
 * Request body: CreateTimetableTemplateInput
 */
export async function POST(request: NextRequest) {
  const auth = await verifyAdmin(request);
  if (!auth.authenticated) return auth.error!;

  try {
    const body: CreateTimetableTemplateInput = await request.json();

    // Validate required fields
    if (!body.name || body.name.trim() === "") {
      return NextResponse.json(
        {
          success: false,
          error: "Template name is required",
        },
        { status: 400 }
      );
    }

    if (!body.slots || !Array.isArray(body.slots)) {
      return NextResponse.json(
        {
          success: false,
          error: "slots must be an array",
        },
        { status: 400 }
      );
    }

    // Validate each slot in the template
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

    // Check for duplicate template name
    const duplicateCheck = await adminDb
      .collection(COLLECTION_NAME)
      .where("name", "==", body.name.trim())
      .limit(1)
      .get();

    if (!duplicateCheck.empty) {
      return NextResponse.json(
        {
          success: false,
          error: "A template with this name already exists",
        },
        { status: 409 }
      );
    }

    // Create the template document
    const templateData = {
      name: body.name.trim(),
      description: body.description || null,
      isActive: body.isActive ?? true,
      slots: body.slots,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const docRef = await adminDb.collection(COLLECTION_NAME).add(templateData);

    // Verify write succeeded
    const verifyDoc = await docRef.get();
    if (!verifyDoc.exists) {
      console.error(
        "Firebase write verification failed: document not found after create"
      );
      return NextResponse.json(
        {
          success: false,
          error: "Failed to verify template creation. Please try again.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: { id: docRef.id, ...verifyDoc.data() },
        message: "Timetable template created successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating timetable template:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      {
        success: false,
        error: `Failed to create timetable template: ${errorMessage}`,
      },
      { status: 500 }
    );
  }
}
