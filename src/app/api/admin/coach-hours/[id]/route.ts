import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { verifyAdmin } from "@/lib/admin-auth";
import { UpdateCoachHoursInput, calculateEarnings } from "@/types/coach";

// GET single coach hours entry
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAdmin(request);
  if (!auth.authenticated) return auth.error!;

  try {
    const { id } = await params;
    const doc = await adminDb.collection("coach_hours").doc(id).get();

    if (!doc.exists) {
      return NextResponse.json(
        { success: false, error: "Coach hours entry not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { id: doc.id, ...doc.data() },
    });
  } catch (error) {
    console.error("Error fetching coach hours:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch coach hours" },
      { status: 500 }
    );
  }
}

// PUT update coach hours entry
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAdmin(request);
  if (!auth.authenticated) return auth.error!;

  try {
    const { id } = await params;
    const body: UpdateCoachHoursInput = await request.json();

    // Check if document exists
    const existingDoc = await adminDb.collection("coach_hours").doc(id).get();
    if (!existingDoc.exists) {
      return NextResponse.json(
        { success: false, error: "Coach hours entry not found" },
        { status: 404 }
      );
    }

    const existingData = existingDoc.data()!;

    // Validate hours if provided
    if (body.hoursWorked !== undefined) {
      if (body.hoursWorked < 0 || body.hoursWorked > 24) {
        return NextResponse.json(
          { success: false, error: "Hours worked must be between 0 and 24" },
          { status: 400 }
        );
      }
    }

    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    // Only update fields that are provided
    if (body.hoursWorked !== undefined) updateData.hoursWorked = body.hoursWorked;
    if (body.breakdown !== undefined) updateData.breakdown = body.breakdown;
    if (body.hourlyRate !== undefined) updateData.hourlyRate = body.hourlyRate;
    if (body.bonusPay !== undefined) updateData.bonusPay = body.bonusPay;
    if (body.deductions !== undefined) updateData.deductions = body.deductions;
    if (body.deductionReason !== undefined)
      updateData.deductionReason = body.deductionReason;
    if (body.notes !== undefined) updateData.notes = body.notes;
    if (body.coachName !== undefined) updateData.coachName = body.coachName;

    // Recalculate earnings if hours or rate changed
    const finalHours = body.hoursWorked ?? existingData.hoursWorked;
    const finalRate = body.hourlyRate ?? existingData.hourlyRate;
    updateData.earnings = calculateEarnings(finalHours, finalRate);

    // Handle verification
    if (body.verifiedBy !== undefined) {
      updateData.verifiedBy = body.verifiedBy;
      updateData.isVerified = !!body.verifiedBy;
    }
    if (body.isVerified !== undefined) {
      updateData.isVerified = body.isVerified;
      if (!body.isVerified) {
        updateData.verifiedBy = null;
      }
    }

    await adminDb.collection("coach_hours").doc(id).update(updateData);

    // Verify update succeeded
    const verifyDoc = await adminDb.collection("coach_hours").doc(id).get();
    if (!verifyDoc.exists) {
      console.error(
        "Firebase write verification failed: document not found after update"
      );
      return NextResponse.json(
        {
          success: false,
          error: "Failed to verify hours update. Please try again.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { id, ...verifyDoc.data() },
      message: "Coach hours updated successfully",
    });
  } catch (error) {
    console.error("Error updating coach hours:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: `Failed to update coach hours: ${errorMessage}` },
      { status: 500 }
    );
  }
}

// DELETE coach hours entry
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAdmin(request);
  if (!auth.authenticated) return auth.error!;

  try {
    const { id } = await params;

    // Check if document exists
    const doc = await adminDb.collection("coach_hours").doc(id).get();
    if (!doc.exists) {
      return NextResponse.json(
        { success: false, error: "Coach hours entry not found" },
        { status: 404 }
      );
    }

    // Check if verified - warn but allow deletion
    const data = doc.data();
    if (data?.isVerified) {
      console.warn(
        `Deleting verified hours entry ${id} for coach ${data.coachName} on ${data.date}`
      );
    }

    await adminDb.collection("coach_hours").doc(id).delete();

    return NextResponse.json({
      success: true,
      message: "Coach hours deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting coach hours:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete coach hours" },
      { status: 500 }
    );
  }
}
