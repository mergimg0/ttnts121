import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { UpdateWaiverTemplateInput } from "@/types/waiver";

// GET single waiver template
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const doc = await adminDb.collection("waiver_templates").doc(id).get();

    if (!doc.exists) {
      return NextResponse.json(
        { success: false, error: "Waiver not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { id: doc.id, ...doc.data() },
    });
  } catch (error) {
    console.error("Error fetching waiver:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch waiver" },
      { status: 500 }
    );
  }
}

// PUT update waiver template
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body: UpdateWaiverTemplateInput = await request.json();

    const docRef = adminDb.collection("waiver_templates").doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json(
        { success: false, error: "Waiver not found" },
        { status: 404 }
      );
    }

    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    // Only include fields that are provided
    if (body.name !== undefined) {
      if (!body.name.trim()) {
        return NextResponse.json(
          { success: false, error: "Waiver name cannot be empty" },
          { status: 400 }
        );
      }
      updateData.name = body.name.trim();
    }

    if (body.content !== undefined) {
      if (!body.content.trim()) {
        return NextResponse.json(
          { success: false, error: "Waiver content cannot be empty" },
          { status: 400 }
        );
      }
      updateData.content = body.content.trim();
    }

    if (body.sessionIds !== undefined) {
      updateData.sessionIds = body.sessionIds;
    }

    if (body.isRequired !== undefined) {
      updateData.isRequired = body.isRequired;
    }

    if (body.isActive !== undefined) {
      updateData.isActive = body.isActive;
    }

    await docRef.update(updateData);

    const updatedDoc = await docRef.get();

    return NextResponse.json({
      success: true,
      data: { id: updatedDoc.id, ...updatedDoc.data() },
      message: "Waiver template updated successfully",
    });
  } catch (error) {
    console.error("Error updating waiver:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: `Failed to update waiver: ${errorMessage}` },
      { status: 500 }
    );
  }
}

// DELETE waiver template
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const docRef = adminDb.collection("waiver_templates").doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json(
        { success: false, error: "Waiver not found" },
        { status: 404 }
      );
    }

    // Check if there are any signatures for this waiver
    const signaturesSnapshot = await adminDb
      .collection("waiver_signatures")
      .where("waiverId", "==", id)
      .limit(1)
      .get();

    if (!signaturesSnapshot.empty) {
      // Soft delete - just deactivate instead of deleting
      await docRef.update({
        isActive: false,
        updatedAt: new Date(),
      });

      return NextResponse.json({
        success: true,
        message: "Waiver has existing signatures and was deactivated instead of deleted",
        deactivated: true,
      });
    }

    // Hard delete if no signatures exist
    await docRef.delete();

    return NextResponse.json({
      success: true,
      message: "Waiver template deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting waiver:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: `Failed to delete waiver: ${errorMessage}` },
      { status: 500 }
    );
  }
}
