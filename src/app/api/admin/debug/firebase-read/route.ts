import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

// GET - Test Firebase read connection
export async function GET() {
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
