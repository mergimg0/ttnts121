import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { verifyAdmin } from "@/lib/admin-auth";

// PATCH toggle isForceClosed status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAdmin(request);
  if (!auth.authenticated) return auth.error!;

  try {
    const { id } = await params;

    // Get current session state
    const doc = await adminDb.collection("sessions").doc(id).get();

    if (!doc.exists) {
      return NextResponse.json(
        { success: false, error: "Session not found" },
        { status: 404 }
      );
    }

    const currentData = doc.data();
    const newForceClosed = !currentData?.isForceClosed;

    // Toggle the isForceClosed flag
    await adminDb.collection("sessions").doc(id).update({
      isForceClosed: newForceClosed,
      updatedAt: new Date(),
    });

    // Verify update
    const verifyDoc = await adminDb.collection("sessions").doc(id).get();
    if (!verifyDoc.exists || verifyDoc.data()?.isForceClosed !== newForceClosed) {
      return NextResponse.json(
        { success: false, error: "Failed to verify enrollment status change" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id,
        isForceClosed: newForceClosed,
      },
      message: newForceClosed
        ? "Enrollment closed - session now shows as Sold Out"
        : "Enrollment reopened - session now accepting bookings",
    });
  } catch (error) {
    console.error("Error toggling session closed status:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: `Failed to update session: ${errorMessage}` },
      { status: 500 }
    );
  }
}
