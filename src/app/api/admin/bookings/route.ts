import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { Booking } from "@/types/booking";

// GET all bookings (with optional filters)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId");
    const status = searchParams.get("status");
    const paymentStatus = searchParams.get("paymentStatus");

    const query = adminDb.collection("bookings").orderBy("createdAt", "desc");

    // Note: Firestore doesn't support multiple inequality filters
    // For production, you might want to use composite indexes

    const snapshot = await query.limit(100).get();

    let bookings = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Booking[];

    // Filter in memory for now (not ideal for large datasets)
    if (sessionId) {
      bookings = bookings.filter((b) => b.sessionId === sessionId);
    }
    if (status) {
      bookings = bookings.filter((b) => b.status === status);
    }
    if (paymentStatus) {
      bookings = bookings.filter((b) => b.paymentStatus === paymentStatus);
    }

    return NextResponse.json({ success: true, data: bookings });
  } catch (error) {
    console.error("Error fetching bookings:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch bookings" },
      { status: 500 }
    );
  }
}
