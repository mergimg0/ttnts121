import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { verifySuperAdmin } from "@/lib/admin-auth";

// DELETE - Clean up test documents
// SECURITY: Only available in development AND requires super-admin auth
export async function DELETE(request: NextRequest) {
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
    // Get all test documents
    const snapshot = await adminDb
      .collection("_debug_tests")
      .where("type", "==", "debug_test")
      .get();

    if (snapshot.empty) {
      return NextResponse.json({
        success: true,
        message: "No test documents to delete",
      });
    }

    // Delete all test documents
    const batch = adminDb.batch();
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });
    await batch.commit();

    return NextResponse.json({
      success: true,
      message: `Deleted ${snapshot.size} test document(s)`,
    });
  } catch (error) {
    console.error("Firebase delete test failed:", error);
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : "Failed to delete from Firebase",
    });
  }
}
