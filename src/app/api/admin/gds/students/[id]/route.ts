import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import type { GDSStudent, UpdateGDSStudentInput } from "@/types/gds";

/**
 * GET /api/admin/gds/students/[id]
 * Get a single GDS student
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const doc = await adminDb.collection("gds_students").doc(id).get();

    if (!doc.exists) {
      return NextResponse.json(
        { success: false, error: "Student not found" },
        { status: 404 }
      );
    }

    const data = doc.data() as Omit<GDSStudent, "id">;

    return NextResponse.json({
      success: true,
      data: { id: doc.id, ...data },
    });
  } catch (error) {
    console.error("Error fetching GDS student:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch GDS student" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/gds/students/[id]
 * Update a GDS student
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body: UpdateGDSStudentInput = await request.json();

    // Check if document exists
    const docRef = adminDb.collection("gds_students").doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json(
        { success: false, error: "Student not found" },
        { status: 404 }
      );
    }

    const updateData = {
      ...body,
      updatedAt: new Date(),
    };

    await docRef.update(updateData);

    // Fetch and return updated document
    const updatedDoc = await docRef.get();
    const updatedData = updatedDoc.data() as Omit<GDSStudent, "id">;

    return NextResponse.json({
      success: true,
      data: { id: updatedDoc.id, ...updatedData },
    });
  } catch (error) {
    console.error("Error updating GDS student:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update GDS student" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/gds/students/[id]
 * Delete a GDS student
 *
 * Note: This is a soft delete - sets status to 'inactive'
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

    const docRef = adminDb.collection("gds_students").doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json(
        { success: false, error: "Student not found" },
        { status: 404 }
      );
    }

    if (hardDelete) {
      // Hard delete - remove document entirely
      await docRef.delete();
      return NextResponse.json({
        success: true,
        message: "Student permanently deleted",
      });
    } else {
      // Soft delete - set status to inactive
      await docRef.update({
        status: "inactive",
        updatedAt: new Date(),
      });
      return NextResponse.json({
        success: true,
        message: "Student marked as inactive",
      });
    }
  } catch (error) {
    console.error("Error deleting GDS student:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete GDS student" },
      { status: 500 }
    );
  }
}
