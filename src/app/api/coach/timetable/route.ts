import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { TimetableSlot } from "@/types/timetable";
import { checkCoachPermission } from "@/lib/coach-permissions";

// GET coach's timetable slots for a specific week
export async function GET(request: NextRequest) {
  try {
    // Check permission to view timetable
    const { allowed, error, userId, userData } = await checkCoachPermission(
      request,
      "canViewTimetable"
    );

    if (!allowed) {
      return error!;
    }

    // Get weekStart from query params
    const { searchParams } = new URL(request.url);
    const weekStart = searchParams.get("weekStart");

    if (!weekStart) {
      return NextResponse.json(
        { success: false, error: "weekStart parameter required" },
        { status: 400 }
      );
    }

    let slots: TimetableSlot[] = [];

    // Admin sees all slots, coach sees only their assigned slots
    if (userData?.role === "admin") {
      const snapshot = await adminDb
        .collection("timetable_slots")
        .where("weekStart", "==", weekStart)
        .orderBy("dayOfWeek", "asc")
        .orderBy("startTime", "asc")
        .get();

      slots = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as TimetableSlot[];
    } else {
      // Get slots assigned to this coach
      const snapshot = await adminDb
        .collection("timetable_slots")
        .where("weekStart", "==", weekStart)
        .where("coachId", "==", userId)
        .orderBy("dayOfWeek", "asc")
        .orderBy("startTime", "asc")
        .get();

      slots = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as TimetableSlot[];
    }

    return NextResponse.json({ success: true, data: slots });
  } catch (error) {
    console.error("Error fetching coach timetable:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch timetable" },
      { status: 500 }
    );
  }
}
