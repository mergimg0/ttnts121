import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import {
  CoachHours,
  CreateCoachHoursInput,
  calculateEarnings,
} from "@/types/coach";

// Helper to build query based on filters
function buildHoursQuery(
  coachId: string | null,
  month: string | null,
  startDate: string | null,
  endDate: string | null
) {
  // Most common case: specific coach, specific month
  if (coachId && month) {
    const monthStart = `${month}-01`;
    const [year, monthNum] = month.split("-").map(Number);
    const daysInMonth = new Date(year, monthNum, 0).getDate();
    const monthEnd = `${month}-${daysInMonth.toString().padStart(2, "0")}`;

    return adminDb
      .collection("coach_hours")
      .where("coachId", "==", coachId)
      .where("date", ">=", monthStart)
      .where("date", "<=", monthEnd)
      .orderBy("date", "desc");
  }

  if (coachId) {
    return adminDb
      .collection("coach_hours")
      .where("coachId", "==", coachId)
      .orderBy("date", "desc");
  }

  if (month) {
    const monthStart = `${month}-01`;
    const [year, monthNum] = month.split("-").map(Number);
    const daysInMonth = new Date(year, monthNum, 0).getDate();
    const monthEnd = `${month}-${daysInMonth.toString().padStart(2, "0")}`;

    return adminDb
      .collection("coach_hours")
      .where("date", ">=", monthStart)
      .where("date", "<=", monthEnd)
      .orderBy("date", "desc");
  }

  if (startDate && endDate) {
    return adminDb
      .collection("coach_hours")
      .where("date", ">=", startDate)
      .where("date", "<=", endDate)
      .orderBy("date", "desc");
  }

  return adminDb.collection("coach_hours").orderBy("date", "desc");
}

// GET coach hours (with filters for coachId and month)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const coachId = searchParams.get("coachId");
    const month = searchParams.get("month"); // Format: "2026-01"
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const isVerified = searchParams.get("isVerified");

    const query = buildHoursQuery(coachId, month, startDate, endDate);
    const snapshot = await query.get();

    let hours = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as CoachHours[];

    // Filter by verification status if specified
    if (isVerified !== null && isVerified !== undefined) {
      const verifiedBool = isVerified === "true";
      hours = hours.filter((h) => h.isVerified === verifiedBool);
    }

    return NextResponse.json({ success: true, data: hours });
  } catch (error) {
    console.error("Error fetching coach hours:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch coach hours" },
      { status: 500 }
    );
  }
}

// POST create new coach hours entry
export async function POST(request: NextRequest) {
  try {
    const body: CreateCoachHoursInput = await request.json();

    // Validate required fields
    if (
      !body.coachId ||
      !body.coachName ||
      !body.date ||
      body.hoursWorked === undefined ||
      body.hourlyRate === undefined
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Missing required fields: coachId, coachName, date, hoursWorked, hourlyRate",
        },
        { status: 400 }
      );
    }

    // Validate date format (YYYY-MM-DD)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(body.date)) {
      return NextResponse.json(
        { success: false, error: "Date must be in YYYY-MM-DD format" },
        { status: 400 }
      );
    }

    // Validate hours
    if (body.hoursWorked < 0 || body.hoursWorked > 24) {
      return NextResponse.json(
        { success: false, error: "Hours worked must be between 0 and 24" },
        { status: 400 }
      );
    }

    // Check for duplicate entry (same coach, same date)
    const existingEntry = await adminDb
      .collection("coach_hours")
      .where("coachId", "==", body.coachId)
      .where("date", "==", body.date)
      .get();

    if (!existingEntry.empty) {
      return NextResponse.json(
        {
          success: false,
          error: `Hours already logged for ${body.coachName} on ${body.date}. Use PUT to update.`,
        },
        { status: 409 }
      );
    }

    // Auto-calculate earnings
    const earnings = calculateEarnings(body.hoursWorked, body.hourlyRate);

    const hoursData = {
      coachId: body.coachId,
      coachName: body.coachName,
      date: body.date,
      hoursWorked: body.hoursWorked,
      breakdown: body.breakdown || null,
      hourlyRate: body.hourlyRate,
      earnings,
      bonusPay: body.bonusPay || 0,
      deductions: body.deductions || 0,
      deductionReason: body.deductionReason || null,
      notes: body.notes || null,
      loggedBy: body.loggedBy,
      verifiedBy: null,
      isVerified: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const docRef = await adminDb.collection("coach_hours").add(hoursData);

    // Verify write succeeded
    const verifyDoc = await docRef.get();
    if (!verifyDoc.exists) {
      console.error(
        "Firebase write verification failed: document not found after create"
      );
      return NextResponse.json(
        {
          success: false,
          error: "Failed to verify hours creation. Please try again.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { id: docRef.id, ...verifyDoc.data() },
      message: "Coach hours logged successfully",
    });
  } catch (error) {
    console.error("Error creating coach hours:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: `Failed to log coach hours: ${errorMessage}` },
      { status: 500 }
    );
  }
}
