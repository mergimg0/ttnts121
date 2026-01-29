import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

// Public endpoint - returns only active programs
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const location = searchParams.get("location");
    const serviceType = searchParams.get("serviceType");

    const query = adminDb
      .collection("programs")
      .where("isActive", "==", true);

    const snapshot = await query.get();

    let programs = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Filter by location if provided
    if (location) {
      programs = programs.filter((p: any) => p.location === location);
    }

    // Filter by service type if provided
    if (serviceType) {
      programs = programs.filter((p: any) => p.serviceType === serviceType);
    }

    // Sort by date range start
    programs.sort((a: any, b: any) => {
      const aStart = a.dateRange?.start?._seconds || 0;
      const bStart = b.dateRange?.start?._seconds || 0;
      return aStart - bStart;
    });

    return NextResponse.json({ success: true, data: programs });
  } catch (error) {
    console.error("Error fetching programs:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch programs" },
      { status: 500 }
    );
  }
}
