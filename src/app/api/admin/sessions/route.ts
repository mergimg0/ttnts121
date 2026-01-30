import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { verifyAdmin } from "@/lib/admin-auth";
import { Session, CreateSessionInput } from "@/types/booking";

// GET all sessions (with optional programId filter)
export async function GET(request: NextRequest) {
  const auth = await verifyAdmin(request);
  if (!auth.authenticated) return auth.error!;

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
  const auth = await verifyAdmin(request);
  if (!auth.authenticated) return auth.error!;

  try {
    const body: CreateSessionInput = await request.json();

    const sessionData = {
      ...body,
      enrolled: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const docRef = await adminDb.collection("sessions").add(sessionData);

    // Verify write succeeded by re-fetching the document
    const verifyDoc = await docRef.get();
    if (!verifyDoc.exists) {
      console.error("Firebase write verification failed: document not found after create");
      return NextResponse.json(
        { success: false, error: "Failed to verify session creation. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { id: docRef.id, ...verifyDoc.data() },
      message: "Session created successfully",
    });
  } catch (error) {
    console.error("Error creating session:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: `Failed to create session: ${errorMessage}` },
      { status: 500 }
    );
  }
}
