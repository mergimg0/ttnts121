import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { verifySuperAdmin } from "@/lib/admin-auth";

// GET - Test Firebase read connection
// SECURITY: Only available in development AND requires super-admin auth
export async function GET(request: NextRequest) {
  // Block in production
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { success: false, error: "Debug endpoints disabled in production" },
      { status: 403 }
    );
  }

  // Require super-admin authentication
  const auth = await verifySuperAdmin(request);
  if (!auth.authenticated) return auth.error!;

  try {
    const snapshot = await adminDb.collection("sessions").limit(1).get();
    const count = snapshot.size;

    return NextResponse.json({
      success: true,
      message: `Connected. Found ${count} document(s) in sessions collection.`,
    });
  } catch (error) {
    console.error("Firebase read test failed:", error);
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : "Failed to connect to Firebase",
    });
  }
}
