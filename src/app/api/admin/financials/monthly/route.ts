import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { verifyAdmin } from "@/lib/admin-auth";
import {
  DailyFinancial,
  MonthlyFinancialSummary,
  WeeklyFinancialSummary,
  DailyFinancialSummary,
  IncomeBreakdown,
  ExpenseBreakdown,
  MONTHS,
  calculateIncomeTotal,
  calculateExpenseTotal,
  calculateGrossProfit,
  calculatePercentageChange,
  getWeekStartForDate,
  getDatesInMonth,
} from "@/types/financials";

const COLLECTION = "daily_financials";

/**
 * Aggregate income breakdowns from daily records
 */
function aggregateIncome(records: DailyFinancial[]): IncomeBreakdown {
  const aggregated = {
    asc: 0,
    gds: 0,
    oneToOne: 0,
    other: 0,
  };

  for (const record of records) {
    if (record.income) {
      aggregated.asc += record.income.asc || 0;
      aggregated.gds += record.income.gds || 0;
      aggregated.oneToOne += record.income.oneToOne || 0;
      aggregated.other += record.income.other || 0;
    }
  }

  return {
    ...aggregated,
    total: calculateIncomeTotal(aggregated),
  };
}

/**
 * Aggregate expense breakdowns from daily records
 */
function aggregateExpenses(records: DailyFinancial[]): ExpenseBreakdown {
  const aggregated = {
    asc: 0,
    gds: 0,
    oneToOne: 0,
    coachWages: 0,
    equipment: 0,
    venue: 0,
    marketing: 0,
    admin: 0,
    other: 0,
  };

  for (const record of records) {
    if (record.expenses) {
      aggregated.asc += record.expenses.asc || 0;
      aggregated.gds += record.expenses.gds || 0;
      aggregated.oneToOne += record.expenses.oneToOne || 0;
      aggregated.coachWages += record.expenses.coachWages || 0;
      aggregated.equipment += record.expenses.equipment || 0;
      aggregated.venue += record.expenses.venue || 0;
      aggregated.marketing += record.expenses.marketing || 0;
      aggregated.admin += record.expenses.admin || 0;
      aggregated.other += record.expenses.other || 0;
    }
  }

  return {
    ...aggregated,
    total: calculateExpenseTotal(aggregated),
  };
}

/**
 * Convert daily record to summary format
 */
function toDailySummary(record: DailyFinancial): DailyFinancialSummary {
  return {
    date: record.date,
    dayName: record.dayName,
    income: record.income?.total || 0,
    expenses: record.expenses?.total || 0,
    grossProfit: record.grossProfit || 0,
    isVerified: record.isVerified || false,
  };
}

/**
 * Group daily records into weekly summaries
 */
function groupByWeek(records: DailyFinancial[]): WeeklyFinancialSummary[] {
  const weekMap = new Map<string, DailyFinancial[]>();

  // Group records by week start
  for (const record of records) {
    const weekStart = getWeekStartForDate(new Date(record.date));
    if (!weekMap.has(weekStart)) {
      weekMap.set(weekStart, []);
    }
    weekMap.get(weekStart)!.push(record);
  }

  // Convert to weekly summaries
  const weeklySummaries: WeeklyFinancialSummary[] = [];

  for (const [weekStart, weekRecords] of weekMap) {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);

    const income = aggregateIncome(weekRecords);
    const expenses = aggregateExpenses(weekRecords);

    weeklySummaries.push({
      weekStart,
      weekEnd: weekEnd.toISOString().split("T")[0],
      income,
      expenses,
      grossProfit: calculateGrossProfit(income.total, expenses.total),
      dailyBreakdown: weekRecords
        .sort((a, b) => a.date.localeCompare(b.date))
        .map(toDailySummary),
    });
  }

  // Sort by week start
  return weeklySummaries.sort((a, b) => a.weekStart.localeCompare(b.weekStart));
}

/**
 * Find best and worst performing days
 */
function findBestAndWorstDays(records: DailyFinancial[]): {
  bestDay?: { date: string; profit: number };
  worstDay?: { date: string; profit: number };
} {
  if (records.length === 0) {
    return {};
  }

  let bestDay = records[0];
  let worstDay = records[0];

  for (const record of records) {
    if ((record.grossProfit || 0) > (bestDay.grossProfit || 0)) {
      bestDay = record;
    }
    if ((record.grossProfit || 0) < (worstDay.grossProfit || 0)) {
      worstDay = record;
    }
  }

  return {
    bestDay: { date: bestDay.date, profit: bestDay.grossProfit || 0 },
    worstDay: { date: worstDay.date, profit: worstDay.grossProfit || 0 },
  };
}

// GET /api/admin/financials/monthly - Get monthly financial summary
export async function GET(request: NextRequest) {
  // Verify admin authentication
  const auth = await verifyAdmin(request);
  if (!auth.authenticated) return auth.error!;

  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month"); // Format: "2026-01"
    const includePreviousMonth = searchParams.get("compare") !== "false";
    const includeYTD = searchParams.get("ytd") !== "false";

    // Default to current month if not specified
    let targetMonth: string;
    if (month) {
      if (!/^\d{4}-\d{2}$/.test(month)) {
        return NextResponse.json(
          { success: false, error: "Invalid month format. Use YYYY-MM" },
          { status: 400 }
        );
      }
      targetMonth = month;
    } else {
      const now = new Date();
      targetMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    }

    const [year, monthNum] = targetMonth.split("-").map(Number);
    const monthName = MONTHS[monthNum - 1];

    // Get date range for the month
    const allDatesInMonth = getDatesInMonth(targetMonth);
    const monthStart = allDatesInMonth[0];
    const monthEnd = allDatesInMonth[allDatesInMonth.length - 1];

    // Fetch daily records for the month
    const snapshot = await adminDb
      .collection(COLLECTION)
      .where("date", ">=", monthStart)
      .where("date", "<=", monthEnd)
      .orderBy("date", "asc")
      .get();

    const records: DailyFinancial[] = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as DailyFinancial[];

    // Aggregate income and expenses
    const income = aggregateIncome(records);
    const expenses = aggregateExpenses(records);
    const grossProfit = calculateGrossProfit(income.total, expenses.total);

    // Group into weekly summaries
    const weeklyBreakdown = groupByWeek(records);

    // Calculate averages
    const daysWithData = records.length;
    const averageDailyIncome =
      daysWithData > 0 ? Math.round(income.total / daysWithData) : 0;
    const averageDailyExpenses =
      daysWithData > 0 ? Math.round(expenses.total / daysWithData) : 0;
    const averageDailyProfit =
      daysWithData > 0 ? Math.round(grossProfit / daysWithData) : 0;

    // Find best and worst days
    const { bestDay, worstDay } = findBestAndWorstDays(records);

    // Build the summary
    const summary: MonthlyFinancialSummary = {
      month: targetMonth,
      year,
      monthName,
      income,
      expenses,
      grossProfit,
      weeklyBreakdown,
      averageDailyIncome,
      averageDailyExpenses,
      averageDailyProfit,
      bestDay,
      worstDay,
    };

    // Fetch previous month for comparison if requested
    if (includePreviousMonth) {
      const prevDate = new Date(year, monthNum - 2, 1);
      const prevMonth = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, "0")}`;
      const prevDatesInMonth = getDatesInMonth(prevMonth);
      const prevMonthStart = prevDatesInMonth[0];
      const prevMonthEnd = prevDatesInMonth[prevDatesInMonth.length - 1];

      const prevSnapshot = await adminDb
        .collection(COLLECTION)
        .where("date", ">=", prevMonthStart)
        .where("date", "<=", prevMonthEnd)
        .get();

      const prevRecords: DailyFinancial[] = prevSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as DailyFinancial[];

      if (prevRecords.length > 0) {
        const prevIncome = aggregateIncome(prevRecords);
        const prevExpenses = aggregateExpenses(prevRecords);
        const prevGrossProfit = calculateGrossProfit(
          prevIncome.total,
          prevExpenses.total
        );

        summary.previousMonthProfit = prevGrossProfit;
        summary.percentageChange = calculatePercentageChange(
          grossProfit,
          prevGrossProfit
        );
      }
    }

    // Calculate Year-to-Date if requested
    if (includeYTD) {
      const ytdStart = `${year}-01-01`;

      const ytdSnapshot = await adminDb
        .collection(COLLECTION)
        .where("date", ">=", ytdStart)
        .where("date", "<=", monthEnd)
        .get();

      const ytdRecords: DailyFinancial[] = ytdSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as DailyFinancial[];

      const ytdIncome = aggregateIncome(ytdRecords);
      const ytdExpenses = aggregateExpenses(ytdRecords);
      summary.yearToDateProfit = calculateGrossProfit(
        ytdIncome.total,
        ytdExpenses.total
      );
    }

    // Additional metadata
    const metadata = {
      daysInMonth: allDatesInMonth.length,
      daysWithData,
      verifiedDays: records.filter((r) => r.isVerified).length,
      missingDays: allDatesInMonth.length - daysWithData,
      completionPercentage: Math.round(
        (daysWithData / allDatesInMonth.length) * 100
      ),
    };

    return NextResponse.json({
      success: true,
      data: summary,
      metadata,
    });
  } catch (error) {
    console.error("Error fetching monthly summary:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch monthly financial summary" },
      { status: 500 }
    );
  }
}
