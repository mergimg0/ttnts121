import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

// Public endpoint - returns session details with program info
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const doc = await adminDb.collection("sessions").doc(id).get();

    if (!doc.exists) {
      return NextResponse.json(
        { success: false, error: "Session not found" },
        { status: 404 }
      );
    }

    const session = { id: doc.id, ...doc.data() };

    // Check if session is active
    if (!(session as any).isActive) {
      return NextResponse.json(
        { success: false, error: "Session is not available" },
        { status: 404 }
      );
    }

    // Get program details
    const programDoc = await adminDb
      .collection("programs")
      .doc((session as any).programId)
      .get();

    let program = null;
    if (programDoc.exists) {
      const programData = programDoc.data();
      if (programData?.isActive) {
        program = {
          id: programDoc.id,
          name: programData.name,
          description: programData.description,
          location: programData.location,
          serviceType: programData.serviceType,
          dateRange: programData.dateRange,
        };
      }
    }

    // Calculate availability
    const spotsLeft = (session as any).capacity - (session as any).enrolled;
    const availabilityStatus =
      spotsLeft <= 0
        ? "full"
        : spotsLeft <= 3
          ? "limited"
          : "available";

    return NextResponse.json({
      success: true,
      data: {
        ...session,
        program,
        spotsLeft,
        availabilityStatus,
      },
    });
  } catch (error) {
    console.error("Error fetching session:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch session" },
      { status: 500 }
    );
  }
}
