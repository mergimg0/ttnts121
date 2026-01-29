import { NextRequest, NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/lib/firebase-admin";

// Helper to get userId from request
async function getUserId(request: NextRequest): Promise<string | null> {
  const authHeader = request.headers.get("authorization");
  let userId: string | null = null;

  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.substring(7);
    try {
      const decodedToken = await adminAuth.verifyIdToken(token);
      userId = decodedToken.uid;
    } catch {
      // Token verification failed
    }
  }

  if (!userId) {
    const sessionCookie = request.cookies.get("session")?.value;
    if (sessionCookie) {
      try {
        const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie);
        userId = decodedClaims.uid;
      } catch {
        // Session cookie invalid
      }
    }
  }

  // For development/testing
  if (!userId) {
    const { searchParams } = new URL(request.url);
    userId = searchParams.get("userId");
  }

  return userId;
}

// Helper to verify coach role
async function verifyCoachRole(userId: string): Promise<boolean> {
  const userDoc = await adminDb.collection("users").doc(userId).get();

  if (!userDoc.exists) {
    return false;
  }

  const userData = userDoc.data();
  return userData?.role === "coach" || userData?.role === "admin";
}

// POST submit all draft entries for a month
export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId(request);

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const valid = await verifyCoachRole(userId);
    if (!valid) {
      return NextResponse.json(
        { success: false, error: "Not authorized as coach" },
        { status: 403 }
      );
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
