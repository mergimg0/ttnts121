import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

// GET single coach award
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const doc = await adminDb.collection("coach_awards").doc(id).get();

    if (!doc.exists) {
      return NextResponse.json(
        { success: false, error: "Coach award not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { id: doc.id, ...doc.data() },
    });
  } catch (error) {
    console.error("Error fetching coach award:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch coach award" },
      { status: 500 }
    );
  }
}

// DELETE coach award
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if document exists
    const doc = await adminDb.collection("coach_awards").doc(id).get();
    if (!doc.exists) {
      return NextResponse.json(
        { success: false, error: "Coach award not found" },
        { status: 404 }
      );
    }

    const data = doc.data();
    console.log(
      `Deleting ${data?.awardType} award for ${data?.coachName} (${data?.month})`
    );

    await adminDb.collection("coach_awards").doc(id).delete();

    return NextResponse.json({
      success: true,
      message: "Coach award deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting coach award:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete coach award" },
      { status: 500 }
    );
  }
}
