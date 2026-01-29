import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import {
  BlockBooking,
  BlockBookingUsage,
  DeductBlockSessionInput,
  DeductBlockSessionResult,
  calculateBlockBookingStatus,
} from "@/types/block-booking";

const COLLECTION = "block_bookings";

// POST /api/admin/block-bookings/[id]/deduct - Deduct a session from a block booking
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body: Omit<DeductBlockSessionInput, "blockBookingId"> =
      await request.json();

    // Validate required fields
    if (!body.sessionDate) {
      return NextResponse.json(
        { success: false, error: "Session date is required" },
        { status: 400 }
      );
    }

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(body.sessionDate)) {
      return NextResponse.json(
        {
          success: false,
          error: "Session date must be in YYYY-MM-DD format",
        },
        { status: 400 }
      );
    }

    const docRef = adminDb.collection(COLLECTION).doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json(
        { success: false, error: "Block booking not found" },
        { status: 404 }
      );
    }

    const booking = {
      id: doc.id,
      ...doc.data(),
    } as BlockBooking;

    // Check if booking is active
    if (booking.status !== "active") {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot deduct from a block booking with status '${booking.status}'`,
        },
        { status: 400 }
      );
    }

    // Check if there are remaining sessions
    if (booking.remainingSessions <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: "No remaining sessions to deduct",
        },
        { status: 400 }
      );
    }

    // Check if session has already been used for this date (prevent duplicates)
    const alreadyUsed = booking.usageHistory?.some(
      (usage) =>
        usage.sessionDate === body.sessionDate &&
        (!body.timetableSlotId ||
          usage.timetableSlotId === body.timetableSlotId)
    );

    if (alreadyUsed) {
      return NextResponse.json(
        {
          success: false,
          error: "A session has already been deducted for this date",
        },
        { status: 400 }
      );
    }

    const now = new Date();

    // Create usage record
    const usage: BlockBookingUsage = {
      usedAt: now,
      sessionDate: body.sessionDate,
      coachId: body.coachId,
      coachName: body.coachName,
      timetableSlotId: body.timetableSlotId,
      notes: body.notes?.trim(),
      deductedBy: body.deductedBy,
    };

    // Remove undefined values from usage
    const cleanUsage = Object.fromEntries(
      Object.entries(usage).filter(([_, v]) => v !== undefined)
    ) as BlockBookingUsage;

    // Calculate new remaining sessions and status
    const newRemainingSessions = booking.remainingSessions - 1;
    const newStatus = calculateBlockBookingStatus({
      remainingSessions: newRemainingSessions,
      expiresAt: booking.expiresAt,
      status: booking.status,
    });

    // Update the document atomically
    await docRef.update({
      remainingSessions: FieldValue.increment(-1),
      usageHistory: FieldValue.arrayUnion(cleanUsage),
      status: newStatus,
      updatedAt: now,
    });

    const result: DeductBlockSessionResult = {
      success: true,
      remainingSessions: newRemainingSessions,
      newStatus,
      usage: cleanUsage,
    };

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Error deducting session:", error);
    return NextResponse.json(
      { success: false, error: "Failed to deduct session" },
      { status: 500 }
    );
  }
}
