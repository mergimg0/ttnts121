import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { Session, CreateSessionInput } from "@/types/booking";

// GET all sessions (with optional programId filter)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const programId = searchParams.get("programId");

    let query = adminDb.collection("sessions").orderBy("startDate", "asc");

    if (programId) {
      query = adminDb
        .collection("sessions")
        .where("programId", "==", programId)
        .orderBy("startDate", "asc");
    }

    const snapshot = await query.get();

    const sessions = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Session[];

    return NextResponse.json({ success: true, data: sessions });
  } catch (error) {
    console.error("Error fetching sessions:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch sessions" },
      { status: 500 }
    );
  }
}

// POST create new session
export async function POST(request: NextRequest) {
  try {
    const body: CreateSessionInput = await request.json();

    const sessionData = {
      ...body,
      enrolled: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const docRef = await adminDb.collection("sessions").add(sessionData);

    return NextResponse.json({
      success: true,
      data: { id: docRef.id, ...sessionData },
    });
  } catch (error) {
    console.error("Error creating session:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create session" },
      { status: 500 }
    );
  }
}
