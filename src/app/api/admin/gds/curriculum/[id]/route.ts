import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import type { GDSCurriculum, UpdateGDSCurriculumInput } from "@/types/gds";

/**
 * GET /api/admin/gds/curriculum/[id]
 * Get a single GDS curriculum
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const doc = await adminDb.collection("gds_curriculum").doc(id).get();

    if (!doc.exists) {
      return NextResponse.json(
        { success: false, error: "Curriculum not found" },
        { status: 404 }
      );
    }

    const data = doc.data() as Omit<GDSCurriculum, "id">;

    return NextResponse.json({
      success: true,
      data: { id: doc.id, ...data },
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
 * PUT /api/admin/gds/curriculum/[id]
 * Update a GDS curriculum
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body: UpdateGDSCurriculumInput = await request.json();

    // Check if document exists
    const docRef = adminDb.collection("gds_curriculum").doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json(
        { success: false, error: "Curriculum not found" },
        { status: 404 }
      );
    }

    // Validate date format if provided
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (body.startDate && !dateRegex.test(body.startDate)) {
      return NextResponse.json(
        { success: false, error: "Invalid startDate format. Use YYYY-MM-DD" },
        { status: 400 }
      );
    }
    if (body.endDate && !dateRegex.test(body.endDate)) {
      return NextResponse.json(
        { success: false, error: "Invalid endDate format. Use YYYY-MM-DD" },
        { status: 400 }
      );
    }

    // If both dates provided, validate range
    const currentData = doc.data() as GDSCurriculum;
    const newStartDate = body.startDate || currentData.startDate;
    const newEndDate = body.endDate || currentData.endDate;

    if (newStartDate > newEndDate) {
      return NextResponse.json(
        { success: false, error: "startDate must be before or equal to endDate" },
        { status: 400 }
      );
    }

    const updateData = {
      ...body,
      updatedAt: new Date(),
    };

    await docRef.update(updateData);

    // Fetch and return updated document
    const updatedDoc = await docRef.get();
    const updatedData = updatedDoc.data() as Omit<GDSCurriculum, "id">;

    return NextResponse.json({
      success: true,
      data: { id: updatedDoc.id, ...updatedData },
    });
  } catch (error) {
    console.error("Error updating GDS curriculum:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update GDS curriculum" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/gds/curriculum/[id]
 * Delete a GDS curriculum
 *
 * Note: This is a soft delete - sets isActive to false
 * For hard delete, use ?hard=true query param
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const hardDelete = searchParams.get("hard") === "true";

    const docRef = adminDb.collection("gds_curriculum").doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json(
        { success: false, error: "Curriculum not found" },
        { status: 404 }
      );
    }

    if (hardDelete) {
      // Hard delete - remove document entirely
      await docRef.delete();
      return NextResponse.json({
        success: true,
        message: "Curriculum permanently deleted",
      });
    } else {
      // Soft delete - set isActive to false
      await docRef.update({
        isActive: false,
        updatedAt: new Date(),
      });
      return NextResponse.json({
        success: true,
        message: "Curriculum marked as inactive",
      });
    }
  } catch (error) {
    console.error("Error deleting GDS curriculum:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete GDS curriculum" },
      { status: 500 }
    );
  }
}
