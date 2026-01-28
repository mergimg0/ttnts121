import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { SessionOption } from "@/types/session-option";

// GET /api/sessions/[id]/options - Get available options for a session
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sessionId } = await params;

    // First verify the session exists
    const sessionDoc = await adminDb.collection("sessions").doc(sessionId).get();
    if (!sessionDoc.exists) {
      return NextResponse.json(
        { success: false, error: "Session not found" },
        { status: 404 }
      );
    }

    // Fetch all active options
    const snapshot = await adminDb
      .collection("session_options")
      .where("isActive", "==", true)
      .get();

    const options: SessionOption[] = [];
    snapshot.forEach((doc) => {
      const option = {
        id: doc.id,
        ...doc.data(),
      } as SessionOption;

      // Include option if:
      // 1. sessionIds is empty/undefined (applies to all sessions)
      // 2. OR sessionId is in the sessionIds list
      if (
        !option.sessionIds ||
        option.sessionIds.length === 0 ||
        option.sessionIds.includes(sessionId)
      ) {
        options.push(option);
      }
    });

    // Sort by required first, then by name
    options.sort((a, b) => {
      if (a.isRequired && !b.isRequired) return -1;
      if (!a.isRequired && b.isRequired) return 1;
      return a.name.localeCompare(b.name);
    });

    return NextResponse.json({
      success: true,
      data: options,
    });
  } catch (error) {
    console.error("Error fetching session options:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch session options" },
      { status: 500 }
    );
  }
}
