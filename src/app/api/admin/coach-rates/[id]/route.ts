import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { UpdateCoachRateInput } from "@/types/coach";

// GET single coach rate
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const doc = await adminDb.collection("coach_rates").doc(id).get();

    if (!doc.exists) {
      return NextResponse.json(
        { success: false, error: "Coach rate not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { id: doc.id, ...doc.data() },
    });
  } catch (error) {
    console.error("Error fetching coach rate:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch coach rate" },
      { status: 500 }
    );
  }
}

// PUT update coach rate
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body: UpdateCoachRateInput = await request.json();

    // Validate hourly rate if provided
    if (body.hourlyRate !== undefined && body.hourlyRate < 0) {
      return NextResponse.json(
        { success: false, error: "Hourly rate cannot be negative" },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    // Only update fields that are provided
    if (body.hourlyRate !== undefined) updateData.hourlyRate = body.hourlyRate;
    if (body.coachName !== undefined) updateData.coachName = body.coachName;
    if (body.effectiveFrom !== undefined) {
      updateData.effectiveFrom = new Date(
        body.effectiveFrom as string | number | Date
      );
    }
    if (body.effectiveUntil !== undefined) {
      updateData.effectiveUntil = body.effectiveUntil
        ? new Date(body.effectiveUntil as string | number | Date)
        : null;
    }
    if (body.notes !== undefined) updateData.notes = body.notes;

    await adminDb.collection("coach_rates").doc(id).update(updateData);

    // Verify update succeeded
    const verifyDoc = await adminDb.collection("coach_rates").doc(id).get();
    if (!verifyDoc.exists) {
      console.error(
        "Firebase write verification failed: document not found after update"
      );
      return NextResponse.json(
        {
          success: false,
          error: "Failed to verify rate update. Please try again.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { id, ...verifyDoc.data() },
      message: "Coach rate updated successfully",
    });
  } catch (error) {
    console.error("Error updating coach rate:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: `Failed to update coach rate: ${errorMessage}` },
      { status: 500 }
    );
  }
}

// DELETE coach rate
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if rate exists
    const doc = await adminDb.collection("coach_rates").doc(id).get();
    if (!doc.exists) {
      return NextResponse.json(
        { success: false, error: "Coach rate not found" },
        { status: 404 }
      );
    }

    // Check if any hours reference this rate
    const hoursSnapshot = await adminDb
      .collection("coach_hours")
      .where("coachId", "==", doc.data()?.coachId)
      .limit(1)
      .get();

    if (!hoursSnapshot.empty) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Cannot delete rate that has associated hours logged. Consider setting an effectiveUntil date instead.",
        },
        { status: 400 }
      );
    }

    await adminDb.collection("coach_rates").doc(id).delete();

    return NextResponse.json({
      success: true,
      message: "Coach rate deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting coach rate:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete coach rate" },
      { status: 500 }
    );
  }
}
