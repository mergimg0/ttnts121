import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { verifyAdmin } from "@/lib/admin-auth";
import { SessionOption, UpdateSessionOptionInput } from "@/types/session-option";

// GET /api/admin/session-options/[id] - Get a single session option
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAdmin(request);
  if (!auth.authenticated) return auth.error!;

  try {
    const { id } = await params;

    const docRef = adminDb.collection("session_options").doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json(
        { success: false, error: "Session option not found" },
        { status: 404 }
      );
    }

    const sessionOption: SessionOption = {
      id: doc.id,
      ...doc.data(),
    } as SessionOption;

    return NextResponse.json({
      success: true,
      data: sessionOption,
    });
  } catch (error) {
    console.error("Error fetching session option:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch session option" },
      { status: 500 }
    );
  }
}

// PUT /api/admin/session-options/[id] - Update a session option
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAdmin(request);
  if (!auth.authenticated) return auth.error!;

  try {
    const { id } = await params;
    const body: UpdateSessionOptionInput = await request.json();

    const docRef = adminDb.collection("session_options").doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json(
        { success: false, error: "Session option not found" },
        { status: 404 }
      );
    }

    // Validate price if provided
    if (body.price !== undefined && body.price < 0) {
      return NextResponse.json(
        { success: false, error: "Price must be 0 or greater" },
        { status: 400 }
      );
    }

    // Validate maxQuantity if provided
    if (body.maxQuantity !== undefined && body.maxQuantity < 1) {
      return NextResponse.json(
        { success: false, error: "Max quantity must be at least 1" },
        { status: 400 }
      );
    }

    // Build update object
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (body.name !== undefined) {
      updateData.name = body.name.trim();
    }
    if (body.description !== undefined) {
      updateData.description = body.description?.trim() || null;
    }
    if (body.price !== undefined) {
      updateData.price = body.price;
    }
    if (body.sessionIds !== undefined) {
      updateData.sessionIds = body.sessionIds.length > 0 ? body.sessionIds : null;
    }
    if (body.maxQuantity !== undefined) {
      updateData.maxQuantity = body.maxQuantity;
    }
    if (body.isRequired !== undefined) {
      updateData.isRequired = body.isRequired;
    }
    if (body.isActive !== undefined) {
      updateData.isActive = body.isActive;
    }

    await docRef.update(updateData);

    // Fetch updated document
    const updatedDoc = await docRef.get();
    const sessionOption: SessionOption = {
      id: updatedDoc.id,
      ...updatedDoc.data(),
    } as SessionOption;

    return NextResponse.json({
      success: true,
      data: sessionOption,
      message: "Session option updated successfully",
    });
  } catch (error) {
    console.error("Error updating session option:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: `Failed to update session option: ${errorMessage}` },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/session-options/[id] - Delete a session option
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAdmin(request);
  if (!auth.authenticated) return auth.error!;

  try {
    const { id } = await params;

    const docRef = adminDb.collection("session_options").doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json(
        { success: false, error: "Session option not found" },
        { status: 404 }
      );
    }

    await docRef.delete();

    return NextResponse.json({
      success: true,
      message: "Session option deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting session option:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete session option" },
      { status: 500 }
    );
  }
}
