import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { verifyAdmin } from "@/lib/admin-auth";
import {
  BlockBooking,
  BlockBookingSummary,
  CreateBlockBookingInput,
  BlockBookingStatus,
  calculateBlockBookingStatus,
  isBlockBookingExpiringSoon,
} from "@/types/block-booking";

const COLLECTION = "block_bookings";

/**
 * Convert a BlockBooking to a BlockBookingSummary for list display
 */
function toSummary(booking: BlockBooking): BlockBookingSummary {
  const usedSessions = booking.totalSessions - booking.remainingSessions;
  const percentageUsed = booking.totalSessions > 0
    ? Math.round((usedSessions / booking.totalSessions) * 100)
    : 0;

  const lastUsage = booking.usageHistory?.[booking.usageHistory.length - 1];
  const lastUsedAt = lastUsage?.usedAt;

  return {
    id: booking.id,
    studentName: booking.studentName,
    parentName: booking.parentName,
    parentEmail: booking.parentEmail,
    totalSessions: booking.totalSessions,
    remainingSessions: booking.remainingSessions,
    usedSessions,
    percentageUsed,
    status: booking.status,
    totalPaid: booking.totalPaid,
    pricePerSession: booking.pricePerSession,
    purchasedAt: booking.purchasedAt,
    expiresAt: booking.expiresAt,
    lastUsedAt,
    isExpiringSoon: isBlockBookingExpiringSoon(booking.expiresAt),
  };
}

// GET /api/admin/block-bookings - List all block bookings
export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAdmin(request);
    if (!auth.authenticated) return auth.error!;
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") as BlockBookingStatus | null;
    const studentName = searchParams.get("studentName");
    const hasRemaining = searchParams.get("hasRemaining");
    const sortBy = searchParams.get("sortBy") || "purchasedAt";
    const sortOrder = (searchParams.get("sortOrder") || "desc") as "asc" | "desc";
    const limit = Math.min(parseInt(searchParams.get("limit") || "100"), 500);
    const offset = parseInt(searchParams.get("offset") || "0");

    // Build query with primary sort
    let query: FirebaseFirestore.Query = adminDb
      .collection(COLLECTION)
      .orderBy("createdAt", "desc");

    // Apply status filter at query level if possible
    if (status) {
      query = adminDb
        .collection(COLLECTION)
        .where("status", "==", status)
        .orderBy("createdAt", "desc");
    }

    const snapshot = await query.limit(500).get();

    let blockBookings: BlockBooking[] = [];

    snapshot.forEach((doc) => {
      const data = doc.data();
      const booking = {
        id: doc.id,
        ...data,
      } as BlockBooking;

      // Recalculate status based on current state
      const calculatedStatus = calculateBlockBookingStatus(booking);
      if (calculatedStatus !== booking.status) {
        booking.status = calculatedStatus;
        // Optionally update in DB (fire-and-forget for performance)
        adminDb.collection(COLLECTION).doc(doc.id).update({
          status: calculatedStatus,
          updatedAt: new Date(),
        }).catch(console.error);
      }

      blockBookings.push(booking);
    });

    // Apply in-memory filters
    if (studentName) {
      const searchTerm = studentName.toLowerCase();
      blockBookings = blockBookings.filter((b) =>
        b.studentName.toLowerCase().includes(searchTerm)
      );
    }

    if (hasRemaining === "true") {
      blockBookings = blockBookings.filter((b) => b.remainingSessions > 0);
    } else if (hasRemaining === "false") {
      blockBookings = blockBookings.filter((b) => b.remainingSessions === 0);
    }

    // Sort
    blockBookings.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case "remainingSessions":
          comparison = a.remainingSessions - b.remainingSessions;
          break;
        case "studentName":
          comparison = a.studentName.localeCompare(b.studentName);
          break;
        case "purchasedAt":
        default:
          const dateA = a.purchasedAt instanceof Date
            ? a.purchasedAt.getTime()
            : (a.purchasedAt as any)?._seconds * 1000 || 0;
          const dateB = b.purchasedAt instanceof Date
            ? b.purchasedAt.getTime()
            : (b.purchasedAt as any)?._seconds * 1000 || 0;
          comparison = dateA - dateB;
          break;
      }

      return sortOrder === "desc" ? -comparison : comparison;
    });

    // Apply pagination
    const total = blockBookings.length;
    const paginatedBookings = blockBookings.slice(offset, offset + limit);

    // Convert to summaries
    const summaries: BlockBookingSummary[] = paginatedBookings.map(toSummary);

    return NextResponse.json({
      success: true,
      data: {
        blockBookings: summaries,
        total,
        hasMore: offset + limit < total,
      },
    });
  } catch (error) {
    console.error("Error fetching block bookings:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch block bookings" },
      { status: 500 }
    );
  }
}

// POST /api/admin/block-bookings - Create a new block booking
export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAdmin(request);
    if (!auth.authenticated) return auth.error!;
    const body: CreateBlockBookingInput = await request.json();

    // Validate required fields
    const requiredFields = [
      "studentName",
      "parentName",
      "parentEmail",
      "totalSessions",
      "totalPaid",
      "purchasedAt",
    ];

    const missingFields = requiredFields.filter(
      (field) => body[field as keyof CreateBlockBookingInput] === undefined
    );

    if (missingFields.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Missing required fields: ${missingFields.join(", ")}`,
        },
        { status: 400 }
      );
    }

    // Validate totalSessions
    if (body.totalSessions <= 0) {
      return NextResponse.json(
        { success: false, error: "Total sessions must be greater than 0" },
        { status: 400 }
      );
    }

    // Validate totalPaid
    if (body.totalPaid < 0) {
      return NextResponse.json(
        { success: false, error: "Total paid cannot be negative" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.parentEmail)) {
      return NextResponse.json(
        { success: false, error: "Invalid email format" },
        { status: 400 }
      );
    }

    const now = new Date();

    // Calculate price per session if not provided
    const pricePerSession =
      body.pricePerSession || Math.round(body.totalPaid / body.totalSessions);

    // Prepare booking data
    const bookingData: Omit<BlockBooking, "id"> = {
      studentName: body.studentName.trim(),
      studentId: body.studentId,
      parentName: body.parentName.trim(),
      parentEmail: body.parentEmail.trim().toLowerCase(),
      parentPhone: body.parentPhone?.trim(),
      parentId: body.parentId,
      totalSessions: body.totalSessions,
      remainingSessions: body.totalSessions, // Starts with all sessions available
      usageHistory: [],
      totalPaid: body.totalPaid,
      pricePerSession,
      paymentMethod: body.paymentMethod,
      stripePaymentIntentId: body.stripePaymentIntentId,
      stripeSessionId: body.stripeSessionId,
      status: "active",
      purchasedAt: body.purchasedAt ? new Date(body.purchasedAt as any) : now,
      expiresAt: body.expiresAt ? new Date(body.expiresAt as any) : undefined,
      notes: body.notes?.trim(),
      createdBy: body.createdBy,
      createdAt: now,
      updatedAt: now,
    };

    // Remove undefined values
    const cleanData = Object.fromEntries(
      Object.entries(bookingData).filter(([_, v]) => v !== undefined)
    );

    const docRef = await adminDb.collection(COLLECTION).add(cleanData);

    const blockBooking: BlockBooking = {
      id: docRef.id,
      ...bookingData,
    };

    return NextResponse.json({
      success: true,
      data: blockBooking,
    });
  } catch (error) {
    console.error("Error creating block booking:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create block booking" },
      { status: 500 }
    );
  }
}
