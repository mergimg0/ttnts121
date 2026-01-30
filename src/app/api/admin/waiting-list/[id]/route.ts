import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { verifyAdmin } from "@/lib/admin-auth";
import {
  WaitingListEntry,
  UpdateWaitingListInput,
  WaitingListStatus,
} from "@/types/timetable";

const COLLECTION_NAME = "waiting_list";

/**
 * GET /api/admin/waiting-list/[id]
 * Get a single waiting list entry by ID
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
        { success: false, error: "Waiting list entry not found" },
        { status: 404 }
      );
    }

    const entry: WaitingListEntry = {
      id: doc.id,
      ...doc.data(),
    } as WaitingListEntry;

    return NextResponse.json({
      success: true,
      data: entry,
    });
  } catch (error) {
    console.error("Error fetching waiting list entry:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      {
        success: false,
        error: `Failed to fetch waiting list entry: ${errorMessage}`,
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/waiting-list/[id]
 * Update a waiting list entry
 *
 * Request body: UpdateWaitingListInput (partial)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAdmin(request);
  if (!auth.authenticated) return auth.error!;

  try {
    const { id } = await params;
    const body: UpdateWaitingListInput = await request.json();

    // Check if document exists first
    const existingDoc = await adminDb.collection(COLLECTION_NAME).doc(id).get();
    if (!existingDoc.exists) {
      return NextResponse.json(
        { success: false, error: "Waiting list entry not found" },
        { status: 404 }
      );
    }

    // Validate studentName if provided
    if (body.studentName !== undefined && body.studentName.trim() === "") {
      return NextResponse.json(
        {
          success: false,
          error: "studentName cannot be empty",
        },
        { status: 400 }
      );
    }

    // Validate parentName if provided
    if (body.parentName !== undefined && body.parentName.trim() === "") {
      return NextResponse.json(
        {
          success: false,
          error: "parentName cannot be empty",
        },
        { status: 400 }
      );
    }

    // Validate parentEmail if provided
    if (body.parentEmail !== undefined) {
      if (body.parentEmail.trim() === "") {
        return NextResponse.json(
          {
            success: false,
            error: "parentEmail cannot be empty",
          },
          { status: 400 }
        );
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(body.parentEmail)) {
        return NextResponse.json(
          {
            success: false,
            error: "parentEmail must be a valid email address",
          },
          { status: 400 }
        );
      }
    }

    // Validate parentPhone if provided
    if (body.parentPhone !== undefined && body.parentPhone.trim() === "") {
      return NextResponse.json(
        {
          success: false,
          error: "parentPhone cannot be empty",
        },
        { status: 400 }
      );
    }

    // Validate status if provided
    const validStatuses: WaitingListStatus[] = [
      "waiting",
      "contacted",
      "booked",
      "cancelled",
    ];
    if (body.status && !validStatuses.includes(body.status)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
        },
        { status: 400 }
      );
    }

    // Validate priority if provided
    if (body.priority !== undefined && (typeof body.priority !== "number" || body.priority < 1)) {
      return NextResponse.json(
        {
          success: false,
          error: "priority must be a positive number",
        },
        { status: 400 }
      );
    }

    // Validate preferredDays if provided
    if (body.preferredDays !== undefined && body.preferredDays !== null) {
      if (!Array.isArray(body.preferredDays)) {
        return NextResponse.json(
          {
            success: false,
            error: "preferredDays must be an array of numbers (0-6)",
          },
          { status: 400 }
        );
      }
      for (const day of body.preferredDays) {
        if (typeof day !== "number" || day < 0 || day > 6) {
          return NextResponse.json(
            {
              success: false,
              error: "preferredDays values must be numbers between 0 (Sunday) and 6 (Saturday)",
            },
            { status: 400 }
          );
        }
      }
    }

    // Validate preferredTimes if provided
    if (body.preferredTimes !== undefined && body.preferredTimes !== null) {
      if (!Array.isArray(body.preferredTimes)) {
        return NextResponse.json(
          {
            success: false,
            error: "preferredTimes must be an array of time strings",
          },
          { status: 400 }
        );
      }
      const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
      for (const time of body.preferredTimes) {
        if (!timeRegex.test(time)) {
          return NextResponse.json(
            {
              success: false,
              error: "preferredTimes values must be in HH:MM format",
            },
            { status: 400 }
          );
        }
      }
    }

    // Validate preferredCoaches if provided
    if (body.preferredCoaches !== undefined && body.preferredCoaches !== null) {
      if (!Array.isArray(body.preferredCoaches)) {
        return NextResponse.json(
          {
            success: false,
            error: "preferredCoaches must be an array of coach IDs",
          },
          { status: 400 }
        );
      }
    }

    // Prepare update data
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    // Only include fields that were explicitly provided
    if (body.studentName !== undefined) {
      updateData.studentName = body.studentName.trim();
    }
    if (body.parentName !== undefined) {
      updateData.parentName = body.parentName.trim();
    }
    if (body.parentEmail !== undefined) {
      updateData.parentEmail = body.parentEmail.trim().toLowerCase();
    }
    if (body.parentPhone !== undefined) {
      updateData.parentPhone = body.parentPhone.trim();
    }
    if (body.preferredDays !== undefined) {
      updateData.preferredDays = body.preferredDays;
    }
    if (body.preferredTimes !== undefined) {
      updateData.preferredTimes = body.preferredTimes;
    }
    if (body.preferredCoaches !== undefined) {
      updateData.preferredCoaches = body.preferredCoaches;
    }
    if (body.ageGroup !== undefined) {
      updateData.ageGroup = body.ageGroup;
    }
    if (body.status !== undefined) {
      updateData.status = body.status;
      // Set contactedAt timestamp when status changes to "contacted"
      if (body.status === "contacted") {
        updateData.contactedAt = new Date();
      }
      // Set bookedAt timestamp when status changes to "booked"
      if (body.status === "booked") {
        updateData.bookedAt = new Date();
      }
    }
    if (body.priority !== undefined) {
      updateData.priority = body.priority;
    }
    if (body.notes !== undefined) {
      updateData.notes = body.notes;
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
          error: "Failed to verify entry update. Please try again.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { id, ...verifyDoc.data() },
      message: "Waiting list entry updated successfully",
    });
  } catch (error) {
    console.error("Error updating waiting list entry:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      {
        success: false,
        error: `Failed to update waiting list entry: ${errorMessage}`,
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/waiting-list/[id]
 * Delete a waiting list entry
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
        { success: false, error: "Waiting list entry not found" },
        { status: 404 }
      );
    }

    await adminDb.collection(COLLECTION_NAME).doc(id).delete();

    return NextResponse.json({
      success: true,
      message: "Waiting list entry deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting waiting list entry:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      {
        success: false,
        error: `Failed to delete waiting list entry: ${errorMessage}`,
      },
      { status: 500 }
    );
  }
}
