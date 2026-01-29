import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { Coach, CreateCoachInput } from "@/types/coach";
import type { Timestamp } from "firebase-admin/firestore";

const COACHES_COLLECTION = "coaches";

// Helper to convert Firestore timestamps to dates for JSON serialization
function serializeCoach(doc: FirebaseFirestore.DocumentSnapshot): Coach {
  const data = doc.data();
  if (!data) throw new Error("Document data is undefined");

  return {
    id: doc.id,
    name: data.name,
    abbreviation: data.abbreviation || null,
    email: data.email || null,
    phone: data.phone || null,
    hourlyRate: data.hourlyRate || null,
    sessionRate: data.sessionRate || null,
    isActive: data.isActive ?? true,
    createdAt: data.createdAt instanceof Object && "toDate" in data.createdAt
      ? (data.createdAt as Timestamp).toDate()
      : data.createdAt,
    updatedAt: data.updatedAt instanceof Object && "toDate" in data.updatedAt
      ? (data.updatedAt as Timestamp).toDate()
      : data.updatedAt,
  };
}

// GET all coaches (with optional filters)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get("activeOnly") === "true";

    // Fetch all and filter in memory to avoid composite index requirement
    const query = adminDb
      .collection(COACHES_COLLECTION)
      .orderBy("name", "asc");

    const snapshot = await query.get();

    let coaches = snapshot.docs.map((doc) => serializeCoach(doc));

    // Filter for active only if requested
    if (activeOnly) {
      coaches = coaches.filter((coach) => coach.isActive);
    }

    return NextResponse.json({ success: true, data: coaches });
  } catch (error) {
    console.error("Error fetching coaches:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch coaches" },
      { status: 500 }
    );
  }
}

// POST create new coach
export async function POST(request: NextRequest) {
  try {
    const body: CreateCoachInput = await request.json();

    // Validate required fields
    if (!body.name) {
      return NextResponse.json(
        { success: false, error: "Coach name is required" },
        { status: 400 }
      );
    }

    // Check for duplicate name
    const existingCoach = await adminDb
      .collection(COACHES_COLLECTION)
      .where("name", "==", body.name)
      .limit(1)
      .get();

    if (!existingCoach.empty) {
      return NextResponse.json(
        { success: false, error: "A coach with this name already exists" },
        { status: 400 }
      );
    }

    const coachData = {
      name: body.name.trim(),
      abbreviation: body.abbreviation?.trim() || body.name.charAt(0).toUpperCase(),
      email: body.email?.trim() || null,
      phone: body.phone?.trim() || null,
      hourlyRate: body.hourlyRate ?? null,
      sessionRate: body.sessionRate ?? null,
      isActive: body.isActive ?? true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const docRef = await adminDb.collection(COACHES_COLLECTION).add(coachData);

    // Verify write succeeded
    const verifyDoc = await docRef.get();
    if (!verifyDoc.exists) {
      console.error("Firebase write verification failed: document not found after create");
      return NextResponse.json(
        { success: false, error: "Failed to verify coach creation. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: serializeCoach(verifyDoc),
      message: "Coach created successfully",
    });
  } catch (error) {
    console.error("Error creating coach:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: `Failed to create coach: ${errorMessage}` },
      { status: 500 }
    );
  }
}
