import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { stripe } from "@/lib/stripe";
import { unstable_cache } from "next/cache";
import { verifyAdmin } from "@/lib/admin-auth";
import type { DashboardStats, Booking } from "@/types/booking";

// Cache stats for 5 minutes
const getDashboardStats = unstable_cache(
  async (): Promise<DashboardStats> => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Run all queries in parallel
    const [
      bookingsSnapshot,
      upcomingSessionsSnapshot,
      waitlistSnapshot,
      recentBookingsSnapshot,
      monthlyRevenue,
    ] = await Promise.all([
      // Total paid bookings (filter by paymentStatus only to avoid composite index)
      adminDb
        .collection("bookings")
        .where("paymentStatus", "==", "paid")
        .get(),

      // Upcoming sessions (next 7 days)
      adminDb
        .collection("sessions")
        .where("isActive", "==", true)
        .get(),

      // Waitlist count
      adminDb
        .collection("waitlist")
        .where("status", "==", "waiting")
        .get(),

      // Recent bookings (last 5)
      adminDb
        .collection("bookings")
        .orderBy("createdAt", "desc")
        .limit(5)
        .get(),

      // Monthly revenue from Stripe
      stripe.balanceTransactions.list({
        created: { gte: Math.floor(startOfMonth.getTime() / 1000) },
        type: "charge",
        limit: 100,
      }),
    ]);

    // Calculate total revenue (net after fees)
    const totalRevenue = monthlyRevenue.data.reduce(
      (sum, txn) => sum + txn.net,
      0
    );

    // Filter bookings to this month (client-side filtering to avoid composite index)
    const thisMonthBookings = bookingsSnapshot.docs.filter((doc) => {
      const data = doc.data();
      const createdAt = data.createdAt?.toDate?.() || new Date(data.createdAt);
      return createdAt >= startOfMonth;
    }).length;

    // Filter upcoming sessions (sessions with dates in the next 7 days)
    const nextWeek = new Date(now);
    nextWeek.setDate(nextWeek.getDate() + 7);

    const upcomingSessions = upcomingSessionsSnapshot.docs.filter((doc) => {
      const data = doc.data();
      const endDate = data.endDate?.toDate?.() || new Date(data.endDate);
      return endDate >= now;
    }).length;

    // Transform recent bookings
    const recentBookings: Booking[] = recentBookingsSnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        sessionId: data.sessionId || "",
        sessionIds: data.sessionIds || [],
        childFirstName: data.childFirstName || "",
        childLastName: data.childLastName || "",
        childDOB: data.childDOB,
        ageGroup: data.ageGroup || "",
        parentFirstName: data.parentFirstName || "",
        parentLastName: data.parentLastName || "",
        parentEmail: data.parentEmail || "",
        parentPhone: data.parentPhone || "",
        paymentStatus: data.paymentStatus || "pending",
        amount: data.amount || 0,
        bookingRef: data.bookingRef || doc.id.slice(0, 8).toUpperCase(),
        createdAt: data.createdAt,
      } as Booking;
    });

    return {
      totalBookings: thisMonthBookings,
      totalRevenue,
      upcomingSessions,
      waitlistCount: waitlistSnapshot.size,
      recentBookings,
    };
  },
  ["admin-dashboard-stats"],
  { revalidate: 300 } // 5 minutes
);

export async function GET(request: NextRequest) {
  const auth = await verifyAdmin(request);
  if (!auth.authenticated) return auth.error!;

  try {
    const stats = await getDashboardStats();

    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch dashboard stats" },
      { status: 500 }
    );
  }
}
