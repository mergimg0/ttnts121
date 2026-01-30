import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { verifyAdmin } from "@/lib/admin-auth";
import { UpdateSessionInput } from "@/types/booking";

// GET single session
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAdmin(request);
  if (!auth.authenticated) return auth.error!;

  try {
    const { id } = await params;
    const doc = await adminDb.collection("sessions").doc(id).get();

    if (!doc.exists) {
      return NextResponse.json(
        { success: false, error: "Session not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { id: doc.id, ...doc.data() },
    });
  } catch (error) {
    console.error("Error fetching session:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch session" },
      { status: 500 }
    );
  }
}

// PUT update session
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAdmin(request);
  if (!auth.authenticated) return auth.error!;

  try {
    const { id } = await params;
    const body: UpdateSessionInput = await request.json();

    const updateData = {
      ...body,
      updatedAt: new Date(),
    };

    await adminDb.collection("sessions").doc(id).update(updateData);

    // Verify update succeeded by re-fetching the document
    const verifyDoc = await adminDb.collection("sessions").doc(id).get();
    if (!verifyDoc.exists) {
      console.error("Firebase write verification failed: document not found after update");
      return NextResponse.json(
        { success: false, error: "Failed to verify session update. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { id, ...verifyDoc.data() },
      message: "Session updated successfully",
    });
  } catch (error) {
    console.error("Error updating session:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: `Failed to update session: ${errorMessage}` },
      { status: 500 }
    );
  }
}

// DELETE session
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAdmin(request);
  if (!auth.authenticated) return auth.error!;

  try {
    const { id } = await params;

    // Check for existing bookings
    const bookingsSnapshot = await adminDb
      .collection("bookings")
      .where("sessionId", "==", id)
      .limit(1)
      .get();

    if (!bookingsSnapshot.empty) {
      return NextResponse.json(
        {
          success: false,
          error: "Cannot delete session with existing bookings",
        },
        { status: 400 }
      );
    }

    await adminDb.collection("sessions").doc(id).delete();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting session:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete session" },
      { status: 500 }
    );
  }
}
