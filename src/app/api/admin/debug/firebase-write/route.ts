import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { verifySuperAdmin } from "@/lib/admin-auth";

// POST - Test Firebase write connection
// SECURITY: Only available in development AND requires super-admin auth
export async function POST(request: NextRequest) {
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
    const testDoc = {
      type: "debug_test",
      timestamp: new Date(),
      message: "This is a test document that should be deleted",
    };

    const docRef = await adminDb.collection("_debug_tests").add(testDoc);

    // Verify write by reading back
    const written = await docRef.get();
    if (!written.exists) {
      throw new Error("Document was written but could not be read back");
    }

    return NextResponse.json({
      success: true,
      message: `Write successful. Document ID: ${docRef.id}`,
      docId: docRef.id,
    });
  } catch (error) {
    console.error("Firebase write test failed:", error);
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : "Failed to write to Firebase",
    });
  }
}
