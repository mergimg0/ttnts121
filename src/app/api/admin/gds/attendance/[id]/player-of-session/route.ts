import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { verifyAdmin } from "@/lib/admin-auth";
import type { PlayerOfSessionAward, GDSAttendance } from "@/types/gds";

interface AwardPlayerOfSessionBody {
  studentName: string;
  studentId?: string;
  reason?: string;
  awardedBy?: string;
}

/**
 * POST /api/admin/gds/attendance/[id]/player-of-session
 * Award player of the session to a student
 *
 * This will:
 * 1. Update the attendance record with the award
 * 2. Increment the playerOfSessionCount on the student record (if studentId provided)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAdmin(request);
  if (!auth.authenticated) return auth.error!;

  try {
    const { id } = await params;
    const body: AwardPlayerOfSessionBody = await request.json();

    // Validate required fields
    if (!body.studentName) {
      return NextResponse.json(
        { success: false, error: "studentName is required" },
        { status: 400 }
      );
    }

    // Check if attendance record exists
    const attendanceRef = adminDb.collection("gds_attendance").doc(id);
    const attendanceDoc = await attendanceRef.get();

    if (!attendanceDoc.exists) {
      return NextResponse.json(
        { success: false, error: "Attendance record not found" },
        { status: 404 }
      );
    }

    const now = new Date();
    const award: PlayerOfSessionAward = {
      studentName: body.studentName,
      studentId: body.studentId,
      reason: body.reason,
      awardedBy: body.awardedBy,
      awardedAt: now,
    };

    // Use a batch write to update both attendance and student records
    const batch = adminDb.batch();

    // Update attendance record
    batch.update(attendanceRef, {
      playerOfSession: award,
      updatedAt: now,
    });

    // If studentId is provided, increment their playerOfSessionCount
    if (body.studentId) {
      const studentRef = adminDb.collection("gds_students").doc(body.studentId);
      const studentDoc = await studentRef.get();

      if (studentDoc.exists) {
        batch.update(studentRef, {
          playerOfSessionCount: FieldValue.increment(1),
          updatedAt: now,
        });
      }
    }

    await batch.commit();

    // Fetch updated attendance record
    const updatedDoc = await attendanceRef.get();
    const updatedData = updatedDoc.data() as Omit<GDSAttendance, "id">;

    return NextResponse.json({
      success: true,
      message: `Player of the session awarded to ${body.studentName}`,
      data: {
        id: updatedDoc.id,
        ...updatedData,
      },
    });
  } catch (error) {
    console.error("Error awarding player of session:", error);
    return NextResponse.json(
      { success: false, error: "Failed to award player of session" },
      { status: 500 }
    );
  }
}
