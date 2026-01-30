import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { verifyAdmin } from "@/lib/admin-auth";
import type { GDSAttendance, UpdateGDSAttendanceInput } from "@/types/gds";

/**
 * GET /api/admin/gds/attendance/[id]
 * Get a single GDS attendance record
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAdmin(request);
  if (!auth.authenticated) return auth.error!;

  try {
    const { id } = await params;
    const doc = await adminDb.collection("gds_attendance").doc(id).get();

    if (!doc.exists) {
      return NextResponse.json(
        { success: false, error: "Attendance record not found" },
        { status: 404 }
      );
    }

    const data = doc.data() as Omit<GDSAttendance, "id">;

    return NextResponse.json({
      success: true,
      data: { id: doc.id, ...data },
    });
  } catch (error) {
    console.error("Error fetching GDS attendance:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch GDS attendance" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/gds/attendance/[id]
 * Update a GDS attendance record
 *
 * Can update:
 * - attendees (add/remove/update check-in status)
 * - coachId/coachName
 * - drillFocus
 * - sessionNotes
 * - isCancelled/cancellationReason
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAdmin(request);
  if (!auth.authenticated) return auth.error!;

  try {
    const { id } = await params;
    const body: UpdateGDSAttendanceInput = await request.json();

    // Check if document exists
    const docRef = adminDb.collection("gds_attendance").doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json(
        { success: false, error: "Attendance record not found" },
        { status: 404 }
      );
    }

    // Calculate totalAttendees if attendees array is updated
    const updateData: Record<string, unknown> = {
      ...body,
      updatedAt: new Date(),
    };

    if (body.attendees) {
      updateData.totalAttendees = body.attendees.length;
    }

    await docRef.update(updateData);

    // Fetch and return updated document
    const updatedDoc = await docRef.get();
    const updatedData = updatedDoc.data() as Omit<GDSAttendance, "id">;

    return NextResponse.json({
      success: true,
      data: { id: updatedDoc.id, ...updatedData },
    });
  } catch (error) {
    console.error("Error updating GDS attendance:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update GDS attendance" },
      { status: 500 }
    );
  }
}
