import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { verifyAdmin } from "@/lib/admin-auth";
import { Timestamp } from "firebase-admin/firestore";
import {
  LostCustomer,
  LostCustomerStatus,
  LostReason,
  RetentionMetrics,
} from "@/types/retention";

// Helper to safely convert Firestore Timestamp to Date
function toDate(value: Date | Timestamp | any): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value?.toDate === "function") return value.toDate();
  if (typeof value === "string" || typeof value === "number") return new Date(value);
  return null;
}

// GET /api/admin/retention/metrics - Get retention metrics
export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAdmin(request);
    if (!auth.authenticated) return auth.error!;
    const { searchParams } = new URL(request.url);
    const year = searchParams.get("year");
    const month = searchParams.get("month");

    // Fetch all lost customers
    const snapshot = await adminDb.collection("lost_customers").get();

    // Initialize metrics
    const byStatus: Record<LostCustomerStatus, number> = {
      lost: 0,
      follow_up_scheduled: 0,
      contacted: 0,
      returning: 0,
      returned: 0,
      declined: 0,
    };

    const byReason: Record<LostReason, number> = {
      schedule_conflict: 0,
      cost: 0,
      moved_away: 0,
      lost_interest: 0,
      joined_team: 0,
      school_commitments: 0,
      health_injury: 0,
      other: 0,
      unknown: 0,
    };

    let totalLost = 0;
    let totalReturned = 0;
    let totalDeclined = 0;
    let totalPending = 0;
    let lostThisMonth = 0;
    let returnedThisMonth = 0;
    let needsFollowUp = 0;

    // For calculating averages
    const returnTimes: number[] = [];
    const returnFollowUps: number[] = [];

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Calculate the start of current month
    const monthStart = new Date(currentYear, currentMonth, 1);

    snapshot.forEach((doc) => {
      const data = doc.data() as LostCustomer;

      // Count by status
      const status = data.status || "lost";
      if (byStatus[status] !== undefined) {
        byStatus[status]++;
      }

      // Count by reason
      const reason = data.lostReason || "unknown";
      if (byReason[reason] !== undefined) {
        byReason[reason]++;
      }

      // Calculate totals
      if (status === "returned") {
        totalReturned++;

        // Calculate return time if we have both dates
        const lostAt = toDate(data.lostAt);
        const returnedAt = toDate(data.returnedAt);

        if (returnedAt && lostAt) {
          const daysDiff = Math.floor(
            (returnedAt.getTime() - lostAt.getTime()) / (1000 * 60 * 60 * 24)
          );
          if (daysDiff >= 0) {
            returnTimes.push(daysDiff);
          }
        }

        // Track follow-ups for returned customers
        if (data.totalFollowUps && data.totalFollowUps > 0) {
          returnFollowUps.push(data.totalFollowUps);
        }

        // Check if returned this month
        if (returnedAt && returnedAt >= monthStart) {
          returnedThisMonth++;
        }
      } else if (status === "declined") {
        totalDeclined++;
      } else {
        totalLost++;

        // Pending = lost + follow_up_scheduled + contacted + returning
        if (["lost", "follow_up_scheduled", "contacted", "returning"].includes(status)) {
          totalPending++;
        }

        // Check if needs follow-up (no catchUpDate or overdue)
        if (!data.catchUpDate || new Date(data.catchUpDate) < now) {
          needsFollowUp++;
        }
      }

      // Check if lost this month
      const lostAtDate = toDate(data.lostAt);
      if (lostAtDate && lostAtDate >= monthStart && status !== "returned") {
        lostThisMonth++;
      }
    });

    // Calculate return rate
    const totalEverLost = totalLost + totalReturned + totalDeclined;
    const returnRate = totalEverLost > 0
      ? Math.round((totalReturned / totalEverLost) * 100)
      : 0;

    // Calculate averages
    const averageDaysToReturn = returnTimes.length > 0
      ? Math.round(returnTimes.reduce((a, b) => a + b, 0) / returnTimes.length)
      : undefined;

    const averageFollowUpsToReturn = returnFollowUps.length > 0
      ? Math.round((returnFollowUps.reduce((a, b) => a + b, 0) / returnFollowUps.length) * 10) / 10
      : undefined;

    const metrics: RetentionMetrics = {
      totalLost,
      totalReturned,
      totalDeclined,
      totalPending,
      returnRate,
      byStatus,
      byReason,
      lostThisMonth,
      returnedThisMonth,
      needsFollowUp,
      averageDaysToReturn,
      averageFollowUpsToReturn,
    };

    return NextResponse.json({
      success: true,
      data: metrics,
      meta: {
        totalRecords: snapshot.size,
        calculatedAt: now.toISOString(),
      },
    });
  } catch (error) {
    console.error("Error calculating retention metrics:", error);
    return NextResponse.json(
      { success: false, error: "Failed to calculate retention metrics" },
      { status: 500 }
    );
  }
}
