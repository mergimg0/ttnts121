import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import {
  WaitingListEntry,
  CreateWaitingListInput,
  WaitingListStatus,
} from "@/types/timetable";

const COLLECTION_NAME = "waiting_list";

/**
 * GET /api/admin/waiting-list
 * List all waiting list entries
 *
 * Query params:
 * - status: WaitingListStatus (optional) - filter by status
 * - sortBy: "priority" | "addedAt" (optional, default "priority") - sort order
 * - sortDir: "asc" | "desc" (optional, default "asc" for priority, "desc" for addedAt)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") as WaitingListStatus | null;
    const sortBy = searchParams.get("sortBy") || "priority";
    const sortDir = searchParams.get("sortDir");

    // Validate status if provided
    const validStatuses: WaitingListStatus[] = [
      "waiting",
      "contacted",
      "booked",
      "cancelled",
    ];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
        },
        { status: 400 }
      );
    }

    // Validate sortBy
    const validSortFields = ["priority", "addedAt"];
    if (!validSortFields.includes(sortBy)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid sortBy. Must be one of: ${validSortFields.join(", ")}`,
        },
        { status: 400 }
      );
    }

    // Determine sort direction
    // Default: ascending for priority (lower = higher priority)
    // Default: descending for addedAt (newest first)
    const defaultDir = sortBy === "priority" ? "asc" : "desc";
    const direction = (sortDir === "asc" || sortDir === "desc") ? sortDir : defaultDir;

    // Build query
    let query;
    if (status) {
      query = adminDb
        .collection(COLLECTION_NAME)
        .where("status", "==", status)
        .orderBy(sortBy, direction);
    } else {
      query = adminDb
        .collection(COLLECTION_NAME)
        .orderBy(sortBy, direction);
    }

    const snapshot = await query.get();

    const entries = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as WaitingListEntry[];

    return NextResponse.json({
      success: true,
      data: entries,
      meta: {
        total: entries.length,
        status: status || "all",
        sortBy,
        sortDir: direction,
      },
    });
  } catch (error) {
    console.error("Error fetching waiting list:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      {
        success: false,
        error: `Failed to fetch waiting list: ${errorMessage}`,
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/waiting-list
 * Create a new waiting list entry
 *
 * Request body: CreateWaitingListInput
 */
export async function POST(request: NextRequest) {
  try {
    const body: CreateWaitingListInput = await request.json();

    // Validate required fields
    if (!body.studentName || body.studentName.trim() === "") {
      return NextResponse.json(
        {
          success: false,
          error: "studentName is required",
        },
        { status: 400 }
      );
    }

    if (!body.parentName || body.parentName.trim() === "") {
      return NextResponse.json(
        {
          success: false,
          error: "parentName is required",
        },
        { status: 400 }
      );
    }

    if (!body.parentEmail || body.parentEmail.trim() === "") {
      return NextResponse.json(
        {
          success: false,
          error: "parentEmail is required",
        },
        { status: 400 }
      );
    }

    // Validate email format
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

    if (!body.parentPhone || body.parentPhone.trim() === "") {
      return NextResponse.json(
        {
          success: false,
          error: "parentPhone is required",
        },
        { status: 400 }
      );
    }

    // Validate preferredDays if provided
    if (body.preferredDays) {
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
    if (body.preferredTimes) {
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
    if (body.preferredCoaches) {
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

    // Calculate next priority number
    const highestPrioritySnapshot = await adminDb
      .collection(COLLECTION_NAME)
      .orderBy("priority", "desc")
      .limit(1)
      .get();

    let nextPriority = 1;
    if (!highestPrioritySnapshot.empty) {
      const highestPriority = highestPrioritySnapshot.docs[0].data().priority;
      nextPriority = (highestPriority || 0) + 1;
    }

    // Create the waiting list entry
    const entryData = {
      studentName: body.studentName.trim(),
      parentName: body.parentName.trim(),
      parentEmail: body.parentEmail.trim().toLowerCase(),
      parentPhone: body.parentPhone.trim(),
      preferredDays: body.preferredDays || null,
      preferredTimes: body.preferredTimes || null,
      preferredCoaches: body.preferredCoaches || null,
      ageGroup: body.ageGroup || null,
      notes: body.notes || null,
      status: "waiting" as WaitingListStatus,
      priority: nextPriority,
      addedAt: new Date(),
      updatedAt: new Date(),
    };

    const docRef = await adminDb.collection(COLLECTION_NAME).add(entryData);

    // Verify write succeeded
    const verifyDoc = await docRef.get();
    if (!verifyDoc.exists) {
      console.error(
        "Firebase write verification failed: document not found after create"
      );
      return NextResponse.json(
        {
          success: false,
          error: "Failed to verify entry creation. Please try again.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: { id: docRef.id, ...verifyDoc.data() },
        message: "Waiting list entry created successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating waiting list entry:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      {
        success: false,
        error: `Failed to create waiting list entry: ${errorMessage}`,
      },
      { status: 500 }
    );
  }
}
