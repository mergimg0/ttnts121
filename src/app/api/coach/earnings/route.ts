import { NextRequest, NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/lib/firebase-admin";

interface HoursEntry {
  id: string;
  coachId: string;
  date: string;
  hours: number;
  status: "draft" | "submitted" | "approved" | "rejected";
}

interface PaymentRecord {
  id: string;
  coachId: string;
  month: string;
  amount: number;
  hours: number;
  paidAt: string;
  reference?: string;
}

// Helper to get userId from request
async function getUserId(request: NextRequest): Promise<string | null> {
  const authHeader = request.headers.get("authorization");
  let userId: string | null = null;

  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.substring(7);
    try {
      const decodedToken = await adminAuth.verifyIdToken(token);
      userId = decodedToken.uid;
    } catch {
      // Token verification failed
    }
  }

  if (!userId) {
    const sessionCookie = request.cookies.get("session")?.value;
    if (sessionCookie) {
      try {
        const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie);
        userId = decodedClaims.uid;
      } catch {
        // Session cookie invalid
      }
    }
  }

  // For development/testing
  if (!userId) {
    const { searchParams } = new URL(request.url);
    userId = searchParams.get("userId");
  }

  return userId;
}

// Helper to verify coach role and get user data
async function verifyCoachRole(userId: string): Promise<{ valid: boolean; userData?: Record<string, unknown> }> {
  const userDoc = await adminDb.collection("users").doc(userId).get();

  if (!userDoc.exists) {
    return { valid: false };
  }

  const userData = userDoc.data();
  if (userData?.role !== "coach" && userData?.role !== "admin") {
    return { valid: false };
  }

  return { valid: true, userData };
}

// GET earnings for a year
export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId(request);

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { valid, userData } = await verifyCoachRole(userId);
    if (!valid) {
      return NextResponse.json(
        { success: false, error: "Not authorized as coach" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get("year") || String(new Date().getFullYear()));

    // Calculate date range for the year
    const startDate = `${year}-01-01`;
    const endDate = `${year}-12-31`;

    // Fetch all hours entries for this coach and year
    const hoursSnapshot = await adminDb
      .collection("coach_hours")
      .where("coachId", "==", userId)
      .where("date", ">=", startDate)
      .where("date", "<=", endDate)
      .orderBy("date", "asc")
      .get();

    const entries = hoursSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as HoursEntry[];

    // Get hourly rate from user profile or default
    const hourlyRate = (userData?.hourlyRate as number) || 1500; // Default: 15 GBP/hour in pence

    // Group entries by month and calculate earnings
    const monthlyMap = new Map<string, {
      totalHours: number;
      approvedHours: number;
      pendingHours: number;
    }>();

    entries.forEach((entry) => {
      const month = entry.date.substring(0, 7); // "2026-01"
      const existing = monthlyMap.get(month) || {
        totalHours: 0,
        approvedHours: 0,
        pendingHours: 0,
      };

      existing.totalHours += entry.hours;
      if (entry.status === "approved") {
        existing.approvedHours += entry.hours;
      } else if (entry.status === "submitted") {
        existing.pendingHours += entry.hours;
      }

      monthlyMap.set(month, existing);
    });

    // Fetch payment records for this coach and year
    const paymentsSnapshot = await adminDb
      .collection("coach_payments")
      .where("coachId", "==", userId)
      .where("month", ">=", `${year}-01`)
      .where("month", "<=", `${year}-12`)
      .orderBy("month", "desc")
      .get();

    const payments = paymentsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as PaymentRecord[];

    // Build payment lookup by month
    const paymentsByMonth = new Map<string, PaymentRecord>();
    payments.forEach((p) => paymentsByMonth.set(p.month, p));

    // Build monthly data with status
    const monthly = Array.from(monthlyMap.entries()).map(([month, data]) => {
      const payment = paymentsByMonth.get(month);
      const earnings = data.approvedHours * hourlyRate;

      let status: "pending" | "paid" | "partial" = "pending";
      if (payment) {
        if (payment.amount >= earnings) {
          status = "paid";
        } else if (payment.amount > 0) {
          status = "partial";
        }
      }

      return {
        month,
        ...data,
        earnings,
        status,
        paidAmount: payment?.amount,
        paidAt: payment?.paidAt,
      };
    });

    // Calculate totals
    const totalApprovedHours = entries
      .filter((e) => e.status === "approved")
      .reduce((sum, e) => sum + e.hours, 0);
    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
    const totalEarnings = totalApprovedHours * hourlyRate;
    const pendingPayment = totalEarnings - totalPaid;

    // Current month stats
    const currentMonth = new Date().toISOString().substring(0, 7);
    const currentMonthData = monthlyMap.get(currentMonth);
    const currentMonthHours = currentMonthData?.totalHours || 0;
    const currentMonthEarnings = (currentMonthData?.approvedHours || 0) * hourlyRate;

    return NextResponse.json({
      success: true,
      data: {
        monthly,
        payments: payments.map((p) => ({
          id: p.id,
          month: p.month,
          amount: p.amount,
          hours: p.hours,
          paidAt: p.paidAt,
          reference: p.reference,
        })),
        summary: {
          hourlyRate,
          totalEarnings,
          totalPaid,
          pendingPayment: Math.max(0, pendingPayment),
          currentMonthHours,
          currentMonthEarnings,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching earnings:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch earnings" },
      { status: 500 }
    );
  }
}
