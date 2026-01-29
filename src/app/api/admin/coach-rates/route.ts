import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { CoachRate, CreateCoachRateInput } from "@/types/coach";
import type { Timestamp } from "firebase-admin/firestore";

// GET all coach rates (with optional filters)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const coachId = searchParams.get("coachId");
    const activeOnly = searchParams.get("activeOnly") === "true";

    const query = coachId
      ? adminDb
          .collection("coach_rates")
          .where("coachId", "==", coachId)
          .orderBy("effectiveFrom", "desc")
      : adminDb.collection("coach_rates").orderBy("effectiveFrom", "desc");

    const snapshot = await query.get();

    let rates = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as CoachRate[];

    // Filter for active rates (no effectiveUntil or effectiveUntil > now)
    if (activeOnly) {
      const now = new Date();
      rates = rates.filter((rate) => {
        if (!rate.effectiveUntil) return true;
        const untilDate =
          rate.effectiveUntil instanceof Date
            ? rate.effectiveUntil
            : (rate.effectiveUntil as Timestamp).toDate();
        return untilDate > now;
      });
    }

    return NextResponse.json({ success: true, data: rates });
  } catch (error) {
    console.error("Error fetching coach rates:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch coach rates" },
      { status: 500 }
    );
  }
}

// POST create new coach rate
export async function POST(request: NextRequest) {
  try {
    const body: CreateCoachRateInput = await request.json();

    // Validate required fields
    if (!body.coachId || !body.coachName || body.hourlyRate === undefined) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: coachId, coachName, hourlyRate",
        },
        { status: 400 }
      );
    }

    if (body.hourlyRate < 0) {
      return NextResponse.json(
        { success: false, error: "Hourly rate cannot be negative" },
        { status: 400 }
      );
    }

    // If setting a new rate, close out any existing active rate
    const existingRates = await adminDb
      .collection("coach_rates")
      .where("coachId", "==", body.coachId)
      .where("effectiveUntil", "==", null)
      .get();

    const batch = adminDb.batch();
    const effectiveFrom = body.effectiveFrom
      ? new Date(body.effectiveFrom as string | number | Date)
      : new Date();

    // Close out existing rates
    existingRates.docs.forEach((doc) => {
      batch.update(doc.ref, {
        effectiveUntil: effectiveFrom,
        updatedAt: new Date(),
      });
    });

    const rateData = {
      coachId: body.coachId,
      coachName: body.coachName,
      hourlyRate: body.hourlyRate,
      effectiveFrom,
      effectiveUntil: body.effectiveUntil
        ? new Date(body.effectiveUntil as string | number | Date)
        : null,
      notes: body.notes || null,
      createdBy: body.createdBy || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const docRef = adminDb.collection("coach_rates").doc();
    batch.set(docRef, rateData);

    await batch.commit();

    // Verify write succeeded
    const verifyDoc = await docRef.get();
    if (!verifyDoc.exists) {
      console.error(
        "Firebase write verification failed: document not found after create"
      );
      return NextResponse.json(
        {
          success: false,
          error: "Failed to verify rate creation. Please try again.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { id: docRef.id, ...verifyDoc.data() },
      message: "Coach rate created successfully",
    });
  } catch (error) {
    console.error("Error creating coach rate:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: `Failed to create coach rate: ${errorMessage}` },
      { status: 500 }
    );
  }
}
