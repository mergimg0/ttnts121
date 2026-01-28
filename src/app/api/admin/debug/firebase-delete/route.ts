import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

// DELETE - Clean up test documents
export async function DELETE() {
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
