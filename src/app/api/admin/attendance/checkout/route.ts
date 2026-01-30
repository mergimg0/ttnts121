import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { verifyAdmin } from "@/lib/admin-auth";
import { AttendanceRecord } from "@/types/attendance";

// POST check out a child
export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAdmin(request);
    if (!auth.authenticated) return auth.error!;
    const body = await request.json();
    const { bookingId, sessionId, childName, date, checkedOutBy, notes } = body;

    if (!bookingId || !sessionId || !childName || !date) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: bookingId, sessionId, childName, date" },
        { status: 400 }
      );
    }

    // Find the attendance record
    const existingSnapshot = await adminDb
      .collection("attendance")
      .where("bookingId", "==", bookingId)
      .where("sessionId", "==", sessionId)
      .where("date", "==", date)
      .where("childName", "==", childName)
      .get();

    if (existingSnapshot.empty) {
      return NextResponse.json(
        { success: false, error: "No attendance record found. Child must be checked in first." },
        { status: 404 }
      );
    }

    const existingDoc = existingSnapshot.docs[0];
    const existingData = existingDoc.data() as AttendanceRecord;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id: _id, ...existingDataWithoutId } = existingData;

    // If not checked in, return error
    if (!existingData.checkedInAt) {
      return NextResponse.json(
        { success: false, error: "Child is not checked in yet" },
        { status: 400 }
      );
    }

    // If already checked out, return error
    if (existingData.checkedOutAt) {
      return NextResponse.json(
        { success: false, error: "Child is already checked out", data: { id: existingDoc.id, ...existingDataWithoutId } },
        { status: 409 }
      );
    }

    // Update record with check-out time
    await existingDoc.ref.update({
      checkedOutAt: new Date(),
      checkedOutBy,
      notes: notes || existingData.notes,
      updatedAt: new Date(),
    });

    const updatedDoc = await existingDoc.ref.get();
    return NextResponse.json({
      success: true,
      data: { id: existingDoc.id, ...updatedDoc.data() },
      message: "Check-out successful",
    });
  } catch (error) {
    console.error("Error checking out:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: `Failed to check out: ${errorMessage}` },
      { status: 500 }
    );
  }
}
