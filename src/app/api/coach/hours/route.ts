import { NextRequest, NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

interface HoursEntry {
  id?: string;
  coachId: string;
  date: string;
  hours: number;
  notes?: string;
  status: "draft" | "submitted" | "approved" | "rejected";
  submittedAt?: string;
  approvedAt?: string;
  approvedBy?: string;
  createdAt: string;
  updatedAt: string;
}

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
async function verifyCoachRole(userId: string): Promise<{ valid: boolean; userData?: Record<string, unknown> }> {
  const userDoc = await adminDb.collection("users").doc(userId).get();

  if (!userDoc.exists) {
    return { valid: false };
  }

  const userData = userDoc.data();
  if (userData?.role !== "coach" && userData?.role !== "admin") {
    return { valid: false };
  }

  return { valid: true, userData };
}

// GET hours entries for a month
export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId(request);

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { valid, userData } = await verifyCoachRole(userId);
    if (!valid) {
      return NextResponse.json(
        { success: false, error: "Not authorized as coach" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month"); // Format: "2026-01"

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

    // Fetch hours entries for this coach and month
    const snapshot = await adminDb
      .collection("coach_hours")
      .where("coachId", "==", userId)
      .where("date", ">=", startDate)
      .where("date", "<=", endDate)
      .orderBy("date", "asc")
      .get();

    const entries = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as HoursEntry[];

    // Calculate summary
    const totalHours = entries.reduce((sum, e) => sum + e.hours, 0);
    const approvedHours = entries
      .filter((e) => e.status === "approved")
      .reduce((sum, e) => sum + e.hours, 0);
    const pendingHours = entries
      .filter((e) => e.status === "submitted")
      .reduce((sum, e) => sum + e.hours, 0);

    // Get hourly rate from user profile or default
    const hourlyRate = (userData?.hourlyRate as number) || 1500; // Default: 15 GBP/hour in pence
    const estimatedEarnings = approvedHours * hourlyRate;

    return NextResponse.json({
      success: true,
      data: {
        entries,
        summary: {
          totalHours,
          approvedHours,
          pendingHours,
          estimatedEarnings,
          hourlyRate,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching hours:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch hours" },
      { status: 500 }
    );
  }
}

// POST create or update hours entry
export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId(request);

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { valid } = await verifyCoachRole(userId);
    if (!valid) {
      return NextResponse.json(
        { success: false, error: "Not authorized as coach" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { date, hours, notes } = body;

    if (!date || hours === undefined) {
      return NextResponse.json(
        { success: false, error: "date and hours are required" },
        { status: 400 }
      );
    }

    if (hours < 0 || hours > 24) {
      return NextResponse.json(
        { success: false, error: "Hours must be between 0 and 24" },
        { status: 400 }
      );
    }

    // Check if entry already exists for this date
    const existingSnapshot = await adminDb
      .collection("coach_hours")
      .where("coachId", "==", userId)
      .where("date", "==", date)
      .limit(1)
      .get();

    const now = new Date().toISOString();

    if (!existingSnapshot.empty) {
      // Update existing entry
      const existingDoc = existingSnapshot.docs[0];
      const existingData = existingDoc.data();

      // Don't allow editing approved entries
      if (existingData.status === "approved") {
        return NextResponse.json(
          { success: false, error: "Cannot edit approved entries" },
          { status: 400 }
        );
      }

      await adminDb.collection("coach_hours").doc(existingDoc.id).update({
        hours,
        notes: notes || "",
        status: "draft", // Reset to draft if editing
        updatedAt: now,
      });

      return NextResponse.json({
        success: true,
        data: { id: existingDoc.id, updated: true },
      });
    } else {
      // Create new entry
      const entryData: Omit<HoursEntry, "id"> = {
        coachId: userId,
        date,
        hours,
        notes: notes || "",
        status: "draft",
        createdAt: now,
        updatedAt: now,
      };

      const docRef = await adminDb.collection("coach_hours").add(entryData);

      return NextResponse.json({
        success: true,
        data: { id: docRef.id, created: true },
      });
    }
  } catch (error) {
    console.error("Error saving hours:", error);
    return NextResponse.json(
      { success: false, error: "Failed to save hours" },
      { status: 500 }
    );
  }
}
