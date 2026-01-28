import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { AttendanceRecord } from "@/types/attendance";

// POST check in a child
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { bookingId, sessionId, childName, date, method = "manual", checkedInBy, notes } = body;

    if (!bookingId || !sessionId || !childName || !date) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: bookingId, sessionId, childName, date" },
        { status: 400 }
      );
    }

    // Check if attendance record already exists for this booking/date
    const existingSnapshot = await adminDb
      .collection("attendance")
      .where("bookingId", "==", bookingId)
      .where("sessionId", "==", sessionId)
      .where("date", "==", date)
      .where("childName", "==", childName)
      .get();

    if (!existingSnapshot.empty) {
      const existingDoc = existingSnapshot.docs[0];
      const existingData = existingDoc.data() as AttendanceRecord;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id: _id, ...existingDataWithoutId } = existingData;

      // If already checked in, return error
      if (existingData.checkedInAt) {
        return NextResponse.json(
          { success: false, error: "Child is already checked in", data: { id: existingDoc.id, ...existingDataWithoutId } },
          { status: 409 }
        );
      }

      // Update existing record with check-in time
      await existingDoc.ref.update({
        checkedInAt: new Date(),
        checkedInBy,
        method,
        notes: notes || existingData.notes,
        updatedAt: new Date(),
      });

      const updatedDoc = await existingDoc.ref.get();
      return NextResponse.json({
        success: true,
        data: { id: existingDoc.id, ...updatedDoc.data() },
        message: "Check-in successful",
      });
    }

    // Create new attendance record
    const attendanceData: Omit<AttendanceRecord, "id"> = {
      bookingId,
      sessionId,
      childName,
      date,
      checkedInAt: new Date(),
      checkedInBy,
      method,
      notes,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const docRef = await adminDb.collection("attendance").add(attendanceData);

    return NextResponse.json({
      success: true,
      data: { id: docRef.id, ...attendanceData },
      message: "Check-in successful",
    });
  } catch (error) {
    console.error("Error checking in:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: `Failed to check in: ${errorMessage}` },
      { status: 500 }
    );
  }
}
