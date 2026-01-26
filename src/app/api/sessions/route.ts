import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

// Public endpoint - returns only active sessions with availability
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const programId = searchParams.get("programId");
    const location = searchParams.get("location");
    const serviceType = searchParams.get("serviceType");
    const ageMin = searchParams.get("ageMin");
    const ageMax = searchParams.get("ageMax");

    let query = adminDb
      .collection("sessions")
      .where("isActive", "==", true);

    if (programId) {
      query = query.where("programId", "==", programId);
    }

    const snapshot = await query.get();

    let sessions = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Get programs for additional filtering
    const programsSnapshot = await adminDb
      .collection("programs")
      .where("isActive", "==", true)
      .get();

    const programsMap: Record<string, any> = {};
    programsSnapshot.docs.forEach((doc) => {
      programsMap[doc.id] = { id: doc.id, ...doc.data() };
    });

    // Filter sessions by program availability
    sessions = sessions.filter((s: any) => {
      const program = programsMap[s.programId];
      return program !== undefined;
    });

    // Filter by location (via program)
    if (location) {
      sessions = sessions.filter((s: any) => {
        const program = programsMap[s.programId];
        return program?.location === location;
      });
    }

    // Filter by service type (via program)
    if (serviceType) {
      sessions = sessions.filter((s: any) => {
        const program = programsMap[s.programId];
        return program?.serviceType === serviceType;
      });
    }

    // Filter by age range
    if (ageMin) {
      const minAge = parseInt(ageMin);
      sessions = sessions.filter((s: any) => s.ageMax >= minAge);
    }

    if (ageMax) {
      const maxAge = parseInt(ageMax);
      sessions = sessions.filter((s: any) => s.ageMin <= maxAge);
    }

    // Add program details and availability status to each session
    sessions = sessions.map((s: any) => {
      const program = programsMap[s.programId];
      const spotsLeft = s.capacity - s.enrolled;
      const availabilityStatus =
        spotsLeft <= 0
          ? "full"
          : spotsLeft <= 3
            ? "limited"
            : "available";

      return {
        ...s,
        program: program
          ? {
              id: program.id,
              name: program.name,
              location: program.location,
              serviceType: program.serviceType,
              dateRange: program.dateRange,
            }
          : null,
        spotsLeft,
        availabilityStatus,
      };
    });

    // Sort by day of week, then start time
    sessions.sort((a: any, b: any) => {
      if (a.dayOfWeek !== b.dayOfWeek) {
        return a.dayOfWeek - b.dayOfWeek;
      }
      return a.startTime.localeCompare(b.startTime);
    });

    return NextResponse.json({ success: true, data: sessions });
  } catch (error) {
    console.error("Error fetching sessions:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch sessions" },
      { status: 500 }
    );
  }
}
