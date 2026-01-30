import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { verifyAdmin } from "@/lib/admin-auth";
import {
  BlockBooking,
  BlockBookingDetail,
  UpdateBlockBookingInput,
  calculateBlockBookingStatus,
  isBlockBookingExpiringSoon,
} from "@/types/block-booking";

const COLLECTION = "block_bookings";

/**
 * Convert a BlockBooking to a BlockBookingDetail with computed fields
 */
function toDetail(booking: BlockBooking): BlockBookingDetail {
  const usedSessions = booking.totalSessions - booking.remainingSessions;
  const percentageUsed = booking.totalSessions > 0
    ? Math.round((usedSessions / booking.totalSessions) * 100)
    : 0;
  const valueRemaining = booking.remainingSessions * booking.pricePerSession;

  let daysUntilExpiry: number | undefined;
  if (booking.expiresAt) {
    const expiryDate = booking.expiresAt instanceof Date
      ? booking.expiresAt
      : new Date((booking.expiresAt as any)._seconds * 1000);
    const now = new Date();
    const diffTime = expiryDate.getTime() - now.getTime();
    daysUntilExpiry = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  return {
    ...booking,
    usedSessions,
    percentageUsed,
    valueRemaining,
    isExpiringSoon: isBlockBookingExpiringSoon(booking.expiresAt),
    daysUntilExpiry,
  };
}

// GET /api/admin/block-bookings/[id] - Get a single block booking
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyAdmin(request);
    if (!auth.authenticated) return auth.error!;

    const { id } = await params;

    const doc = await adminDb.collection(COLLECTION).doc(id).get();

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

    // Recalculate and update status if needed
    const calculatedStatus = calculateBlockBookingStatus(booking);
    if (calculatedStatus !== booking.status) {
      booking.status = calculatedStatus;
      await adminDb.collection(COLLECTION).doc(id).update({
        status: calculatedStatus,
        updatedAt: new Date(),
      });
    }

    const detail = toDetail(booking);

    return NextResponse.json({
      success: true,
      data: detail,
    });
  } catch (error) {
    console.error("Error fetching block booking:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch block booking" },
      { status: 500 }
    );
  }
}

// PUT /api/admin/block-bookings/[id] - Update a block booking
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyAdmin(request);
    if (!auth.authenticated) return auth.error!;

    const { id } = await params;
    const body: UpdateBlockBookingInput = await request.json();

    const docRef = adminDb.collection(COLLECTION).doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json(
        { success: false, error: "Block booking not found" },
        { status: 404 }
      );
    }

    const existingData = doc.data() as BlockBooking;

    // Validate status transitions
    if (body.status) {
      const allowedTransitions: Record<string, string[]> = {
        active: ["cancelled", "refunded"],
        exhausted: ["active", "refunded"], // Can reactivate if adding sessions
        expired: ["active", "refunded"], // Can reactivate
        refunded: [], // Terminal state
        cancelled: ["active"], // Can reactivate
      };

      const currentStatus = existingData.status;
      if (!allowedTransitions[currentStatus]?.includes(body.status)) {
        return NextResponse.json(
          {
            success: false,
            error: `Cannot transition from '${currentStatus}' to '${body.status}'`,
          },
          { status: 400 }
        );
      }
    }

    // Validate remainingSessions if being updated
    if (body.remainingSessions !== undefined) {
      if (body.remainingSessions < 0) {
        return NextResponse.json(
          { success: false, error: "Remaining sessions cannot be negative" },
          { status: 400 }
        );
      }
      if (body.remainingSessions > existingData.totalSessions) {
        return NextResponse.json(
          {
            success: false,
            error: "Remaining sessions cannot exceed total sessions",
          },
          { status: 400 }
        );
      }
    }

    // Validate email if being updated
    if (body.parentEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(body.parentEmail)) {
        return NextResponse.json(
          { success: false, error: "Invalid email format" },
          { status: 400 }
        );
      }
    }

    // Prepare update data
    const updateData: Record<string, any> = {
      updatedAt: new Date(),
    };

    // Only include provided fields
    const allowedFields: (keyof UpdateBlockBookingInput)[] = [
      "studentName",
      "studentId",
      "parentName",
      "parentEmail",
      "parentPhone",
      "parentId",
      "remainingSessions",
      "totalPaid",
      "pricePerSession",
      "paymentMethod",
      "stripePaymentIntentId",
      "stripeSessionId",
      "status",
      "expiresAt",
      "notes",
    ];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        if (field === "expiresAt" && body[field]) {
          updateData[field] = new Date(body[field] as any);
        } else if (
          typeof body[field] === "string" &&
          ["studentName", "parentName", "parentEmail", "notes"].includes(field)
        ) {
          updateData[field] = (body[field] as string).trim();
          if (field === "parentEmail") {
            updateData[field] = updateData[field].toLowerCase();
          }
        } else {
          updateData[field] = body[field];
        }
      }
    }

    // Recalculate status based on new data
    const newRemainingSessions =
      updateData.remainingSessions ?? existingData.remainingSessions;
    const newExpiresAt = updateData.expiresAt ?? existingData.expiresAt;
    const manualStatus = updateData.status;

    // Only auto-calculate if status wasn't manually set
    if (!manualStatus) {
      const calculatedStatus = calculateBlockBookingStatus({
        remainingSessions: newRemainingSessions,
        expiresAt: newExpiresAt,
        status: existingData.status,
      });
      if (calculatedStatus !== existingData.status) {
        updateData.status = calculatedStatus;
      }
    }

    await docRef.update(updateData);

    // Fetch updated document
    const updatedDoc = await docRef.get();
    const updatedBooking = {
      id: updatedDoc.id,
      ...updatedDoc.data(),
    } as BlockBooking;

    const detail = toDetail(updatedBooking);

    return NextResponse.json({
      success: true,
      data: detail,
    });
  } catch (error) {
    console.error("Error updating block booking:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update block booking" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/block-bookings/[id] - Delete or cancel a block booking
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyAdmin(request);
    if (!auth.authenticated) return auth.error!;

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const hardDelete = searchParams.get("hard") === "true";

    const docRef = adminDb.collection(COLLECTION).doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json(
        { success: false, error: "Block booking not found" },
        { status: 404 }
      );
    }

    const existingData = doc.data() as BlockBooking;

    // Don't allow deleting bookings that have been used
    if (existingData.usageHistory && existingData.usageHistory.length > 0) {
      if (hardDelete) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Cannot permanently delete a block booking with usage history. Use soft delete (cancel) instead.",
          },
          { status: 400 }
        );
      }
    }

    if (hardDelete) {
      // Permanently delete the block booking
      await docRef.delete();

      return NextResponse.json({
        success: true,
        message: "Block booking permanently deleted",
      });
    } else {
      // Soft delete - mark as cancelled
      await docRef.update({
        status: "cancelled",
        updatedAt: new Date(),
      });

      return NextResponse.json({
        success: true,
        message: "Block booking cancelled",
      });
    }
  } catch (error) {
    console.error("Error deleting block booking:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete block booking" },
      { status: 500 }
    );
  }
}
