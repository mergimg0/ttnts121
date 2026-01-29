import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import {
  CoachAward,
  CreateCoachAwardInput,
  COACH_AWARD_PRIZES,
} from "@/types/coach";

// Helper to build awards query
function buildAwardsQuery(coachId: string | null, awardType: string | null) {
  if (coachId && awardType) {
    return adminDb
      .collection("coach_awards")
      .where("coachId", "==", coachId)
      .where("awardType", "==", awardType)
      .orderBy("month", "desc");
  }
  if (coachId) {
    return adminDb
      .collection("coach_awards")
      .where("coachId", "==", coachId)
      .orderBy("month", "desc");
  }
  if (awardType) {
    return adminDb
      .collection("coach_awards")
      .where("awardType", "==", awardType)
      .orderBy("month", "desc");
  }
  return adminDb.collection("coach_awards").orderBy("month", "desc");
}

// GET all coach awards (with optional filters)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const coachId = searchParams.get("coachId");
    const awardType = searchParams.get("awardType");
    const year = searchParams.get("year"); // "2026"

    const query = buildAwardsQuery(coachId, awardType);
    const snapshot = await query.get();

    let awards = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as CoachAward[];

    // Filter by year if specified (can't do in Firestore query easily)
    if (year) {
      awards = awards.filter((award) => award.month.startsWith(year));
    }

    return NextResponse.json({ success: true, data: awards });
  } catch (error) {
    console.error("Error fetching coach awards:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch coach awards" },
      { status: 500 }
    );
  }
}

// POST create new coach award
export async function POST(request: NextRequest) {
  try {
    const body: CreateCoachAwardInput = await request.json();

    // Validate required fields
    if (!body.awardType || !body.month || !body.coachId || !body.coachName) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Missing required fields: awardType, month, coachId, coachName",
        },
        { status: 400 }
      );
    }

    // Validate month format (YYYY-MM)
    if (!/^\d{4}-\d{2}$/.test(body.month)) {
      return NextResponse.json(
        { success: false, error: "Month must be in YYYY-MM format" },
        { status: 400 }
      );
    }

    // Validate award type
    if (!["coach_of_month", "employee_of_month"].includes(body.awardType)) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Invalid award type. Must be 'coach_of_month' or 'employee_of_month'",
        },
        { status: 400 }
      );
    }

    // Check for duplicate award (same type, same month)
    const existingAward = await adminDb
      .collection("coach_awards")
      .where("awardType", "==", body.awardType)
      .where("month", "==", body.month)
      .get();

    if (!existingAward.empty) {
      const existing = existingAward.docs[0].data();
      return NextResponse.json(
        {
          success: false,
          error: `${body.awardType === "coach_of_month" ? "Coach" : "Employee"} of the Month for ${body.month} already awarded to ${existing.coachName}`,
        },
        { status: 409 }
      );
    }

    // Use default prize if not specified
    const prize = body.prize ?? COACH_AWARD_PRIZES[body.awardType];

    const awardData = {
      awardType: body.awardType,
      month: body.month,
      coachId: body.coachId,
      coachName: body.coachName,
      prize,
      reason: body.reason || null,
      nominatedBy: body.nominatedBy || null,
      notes: body.notes || null,
      awardedBy: body.awardedBy || null,
      createdAt: new Date(),
    };

    const docRef = await adminDb.collection("coach_awards").add(awardData);

    // Verify write succeeded
    const verifyDoc = await docRef.get();
    if (!verifyDoc.exists) {
      console.error(
        "Firebase write verification failed: document not found after create"
      );
      return NextResponse.json(
        {
          success: false,
          error: "Failed to verify award creation. Please try again.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { id: docRef.id, ...verifyDoc.data() },
      message: `${body.awardType === "coach_of_month" ? "Coach" : "Employee"} of the Month award created successfully`,
    });
  } catch (error) {
    console.error("Error creating coach award:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: `Failed to create coach award: ${errorMessage}` },
      { status: 500 }
    );
  }
}
