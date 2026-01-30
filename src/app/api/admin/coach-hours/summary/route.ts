import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { verifyAdmin } from "@/lib/admin-auth";
import {
  CoachHours,
  CoachMonthlySummary,
  HoursBreakdown,
  CoachDayEntry,
} from "@/types/coach";

// Fetch all hours and filter in memory to avoid composite index requirement
async function fetchHoursInRange(
  coachId: string | null,
  monthStart: string,
  monthEnd: string
): Promise<CoachHours[]> {
  // Fetch all coach_hours and filter in memory
  const snapshot = await adminDb.collection("coach_hours").get();

  let allHours = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as CoachHours[];

  // Filter by date range
  allHours = allHours.filter(
    (h) => h.date >= monthStart && h.date <= monthEnd
  );

  // Filter by coach if specified
  if (coachId) {
    allHours = allHours.filter((h) => h.coachId === coachId);
  }

  // Sort by date
  allHours.sort((a, b) => a.date.localeCompare(b.date));

  return allHours;
}

// Fetch previous month hours for comparison
async function fetchPrevMonthHours(
  coachId: string | null,
  prevMonthStart: string,
  prevMonthEnd: string
): Promise<Map<string, number>> {
  const snapshot = await adminDb.collection("coach_hours").get();

  const prevHoursByCoach = new Map<string, number>();

  snapshot.docs.forEach((doc) => {
    const data = doc.data();
    // Filter by date range
    if (data.date >= prevMonthStart && data.date <= prevMonthEnd) {
      // Filter by coach if specified
      if (!coachId || data.coachId === coachId) {
        const existing = prevHoursByCoach.get(data.coachId) || 0;
        prevHoursByCoach.set(data.coachId, existing + (data.hoursWorked || 0));
      }
    }
  });

  return prevHoursByCoach;
}

// GET monthly summary for all coaches or a specific coach
export async function GET(request: NextRequest) {
  const auth = await verifyAdmin(request);
  if (!auth.authenticated) return auth.error!;

  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month"); // Required: "2026-01" format
    const coachId = searchParams.get("coachId"); // Optional: filter to specific coach

    if (!month) {
      return NextResponse.json(
        {
          success: false,
          error: "Month parameter is required (YYYY-MM format)",
        },
        { status: 400 }
      );
    }

    // Validate month format
    if (!/^\d{4}-\d{2}$/.test(month)) {
      return NextResponse.json(
        { success: false, error: "Month must be in YYYY-MM format" },
        { status: 400 }
      );
    }

    // Calculate date range for the month
    const [year, monthNum] = month.split("-").map(Number);
    const daysInMonth = new Date(year, monthNum, 0).getDate();
    const monthStart = `${month}-01`;
    const monthEnd = `${month}-${daysInMonth.toString().padStart(2, "0")}`;

    // Fetch hours for the month (filtered in memory to avoid composite index)
    const allHours = await fetchHoursInRange(coachId, monthStart, monthEnd);

    // Group hours by coach
    const hoursByCoach = new Map<string, CoachHours[]>();
    allHours.forEach((hours) => {
      const existing = hoursByCoach.get(hours.coachId) || [];
      existing.push(hours);
      hoursByCoach.set(hours.coachId, existing);
    });

    // Calculate previous month for comparison
    const prevMonth = monthNum === 1 ? 12 : monthNum - 1;
    const prevYear = monthNum === 1 ? year - 1 : year;
    const prevMonthStr = `${prevYear}-${prevMonth.toString().padStart(2, "0")}`;
    const prevDaysInMonth = new Date(prevYear, prevMonth, 0).getDate();
    const prevMonthStart = `${prevMonthStr}-01`;
    const prevMonthEnd = `${prevMonthStr}-${prevDaysInMonth.toString().padStart(2, "0")}`;

    // Fetch previous month hours for comparison (filtered in memory)
    const prevHoursByCoach = await fetchPrevMonthHours(
      coachId,
      prevMonthStart,
      prevMonthEnd
    );

    // Build summaries for each coach
    const summaries: CoachMonthlySummary[] = [];

    hoursByCoach.forEach((coachHours, cId) => {
      // Sort by date
      coachHours.sort((a, b) => a.date.localeCompare(b.date));

      // Calculate totals
      let totalHours = 0;
      let totalEarnings = 0;
      let totalBonuses = 0;
      let totalDeductions = 0;
      let verifiedDays = 0;
      let unverifiedDays = 0;

      // Aggregate breakdown
      const hoursBreakdown: HoursBreakdown = {
        sessions121: 0,
        sessionsASC: 0,
        sessionsGDS: 0,
        admin: 0,
        training: 0,
        camp: 0,
        other: 0,
      };

      // Day breakdown
      const dayBreakdown: CoachDayEntry[] = [];

      coachHours.forEach((entry) => {
        totalHours += entry.hoursWorked;
        totalEarnings += entry.earnings;
        totalBonuses += entry.bonusPay || 0;
        totalDeductions += entry.deductions || 0;

        if (entry.isVerified) {
          verifiedDays++;
        } else {
          unverifiedDays++;
        }

        // Aggregate breakdown
        if (entry.breakdown) {
          hoursBreakdown.sessions121! += entry.breakdown.sessions121 || 0;
          hoursBreakdown.sessionsASC! += entry.breakdown.sessionsASC || 0;
          hoursBreakdown.sessionsGDS! += entry.breakdown.sessionsGDS || 0;
          hoursBreakdown.admin! += entry.breakdown.admin || 0;
          hoursBreakdown.training! += entry.breakdown.training || 0;
          hoursBreakdown.camp! += entry.breakdown.camp || 0;
          hoursBreakdown.other! += entry.breakdown.other || 0;
        }

        // Day entry
        const date = new Date(entry.date);
        dayBreakdown.push({
          date: entry.date,
          dayOfWeek: date.getDay(),
          dayName: date.toLocaleDateString("en-GB", { weekday: "short" }),
          hours: entry.hoursWorked,
          earnings: entry.earnings,
          breakdown: entry.breakdown,
          isVerified: entry.isVerified,
          notes: entry.notes,
        });
      });

      const netPay = totalEarnings + totalBonuses - totalDeductions;
      const previousMonthHours = prevHoursByCoach.get(cId);
      const percentageChange =
        previousMonthHours !== undefined && previousMonthHours > 0
          ? ((totalHours - previousMonthHours) / previousMonthHours) * 100
          : undefined;

      summaries.push({
        coachId: cId,
        coachName: coachHours[0]?.coachName || "Unknown",
        month,
        totalHours,
        totalEarnings,
        totalBonuses,
        totalDeductions,
        netPay,
        hoursBreakdown,
        dayBreakdown,
        verifiedDays,
        unverifiedDays,
        allVerified: unverifiedDays === 0 && verifiedDays > 0,
        previousMonthHours,
        percentageChange:
          percentageChange !== undefined
            ? Math.round(percentageChange * 10) / 10
            : undefined,
      });
    });

    // Sort by total hours descending
    summaries.sort((a, b) => b.totalHours - a.totalHours);

    // Calculate overall totals
    const overallTotals = {
      totalCoaches: summaries.length,
      totalHours: summaries.reduce((sum, s) => sum + s.totalHours, 0),
      totalEarnings: summaries.reduce((sum, s) => sum + s.totalEarnings, 0),
      totalBonuses: summaries.reduce((sum, s) => sum + s.totalBonuses, 0),
      totalDeductions: summaries.reduce((sum, s) => sum + s.totalDeductions, 0),
      totalNetPay: summaries.reduce((sum, s) => sum + s.netPay, 0),
      fullyVerified: summaries.filter((s) => s.allVerified).length,
      partiallyVerified: summaries.filter(
        (s) => s.verifiedDays > 0 && !s.allVerified
      ).length,
      unverified: summaries.filter((s) => s.verifiedDays === 0).length,
    };

    return NextResponse.json({
      success: true,
      data: {
        month,
        summaries,
        totals: overallTotals,
      },
    });
  } catch (error) {
    console.error("Error calculating coach hours summary:", error);
    return NextResponse.json(
      { success: false, error: "Failed to calculate coach hours summary" },
      { status: 500 }
    );
  }
}
