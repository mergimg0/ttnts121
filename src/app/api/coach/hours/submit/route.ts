import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { checkCoachPermission } from "@/lib/coach-permissions";

// POST submit all draft entries for a month
export async function POST(request: NextRequest) {
  try {
    // Check permission to log hours (submitting is part of logging workflow)
    const { allowed, error, userId } = await checkCoachPermission(
      request,
      "canLogHours"
    );

    if (!allowed) {
      return error!;
    }

    const body = await request.json();
    const { month } = body; // Format: "2026-01"

    if (!month) {
      return NextResponse.json(
        { success: false, error: "month parameter required" },
        { status: 400 }
      );
    }

    // Calculate date range for the month
    const [year, monthNum] = month.split("-").map(Number);
    const startDate = `${year}-${String(monthNum).padStart(2, "0")}-01`;
    const endDate = new Date(year, monthNum, 0).toISOString().split("T")[0];

    // Fetch all draft entries for this coach and month
    const snapshot = await adminDb
      .collection("coach_hours")
      .where("coachId", "==", userId)
      .where("date", ">=", startDate)
      .where("date", "<=", endDate)
      .where("status", "==", "draft")
      .get();

    if (snapshot.empty) {
      return NextResponse.json(
        { success: false, error: "No draft entries to submit" },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    const batch = adminDb.batch();

    snapshot.docs.forEach((doc) => {
      batch.update(doc.ref, {
        status: "submitted",
        submittedAt: now,
        updatedAt: now,
      });
    });

    await batch.commit();

    return NextResponse.json({
      success: true,
      data: { count: snapshot.docs.length },
    });
  } catch (error) {
    console.error("Error submitting hours:", error);
    return NextResponse.json(
      { success: false, error: "Failed to submit hours" },
      { status: 500 }
    );
  }
}
