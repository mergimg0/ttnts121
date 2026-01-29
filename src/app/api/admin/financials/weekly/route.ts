import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import {
  DailyFinancial,
  WeeklyFinancialSummary,
  DailyFinancialSummary,
  IncomeBreakdown,
  ExpenseBreakdown,
  calculateIncomeTotal,
  calculateExpenseTotal,
  calculateGrossProfit,
  calculatePercentageChange,
  getWeekStartForDate,
} from "@/types/financials";

const COLLECTION = "daily_financials";

/**
 * Get the Sunday date for a given Monday (week start)
 */
function getWeekEnd(weekStart: string): string {
  const date = new Date(weekStart);
  date.setDate(date.getDate() + 6);
  return date.toISOString().split("T")[0];
}

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

// GET /api/admin/financials/weekly - Get weekly financial summary
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const weekStart = searchParams.get("weekStart"); // Monday of the week (YYYY-MM-DD)
    const includePreviousWeek = searchParams.get("compare") !== "false";

    // Default to current week if not specified
    let targetWeekStart: string;
    if (weekStart) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(weekStart)) {
        return NextResponse.json(
          { success: false, error: "Invalid weekStart format. Use YYYY-MM-DD" },
          { status: 400 }
        );
      }
      targetWeekStart = weekStart;
    } else {
      targetWeekStart = getWeekStartForDate(new Date());
    }

    const weekEnd = getWeekEnd(targetWeekStart);

    // Fetch daily records for the week
    const snapshot = await adminDb
      .collection(COLLECTION)
      .where("date", ">=", targetWeekStart)
      .where("date", "<=", weekEnd)
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

    // Build daily breakdown
    const dailyBreakdown: DailyFinancialSummary[] = records.map(toDailySummary);

    // Build the summary
    const summary: WeeklyFinancialSummary = {
      weekStart: targetWeekStart,
      weekEnd,
      income,
      expenses,
      grossProfit,
      dailyBreakdown,
    };

    // Fetch previous week for comparison if requested
    if (includePreviousWeek) {
      const prevWeekStart = new Date(targetWeekStart);
      prevWeekStart.setDate(prevWeekStart.getDate() - 7);
      const prevWeekStartStr = prevWeekStart.toISOString().split("T")[0];
      const prevWeekEnd = getWeekEnd(prevWeekStartStr);

      const prevSnapshot = await adminDb
        .collection(COLLECTION)
        .where("date", ">=", prevWeekStartStr)
        .where("date", "<=", prevWeekEnd)
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

        summary.previousWeekProfit = prevGrossProfit;
        summary.percentageChange = calculatePercentageChange(
          grossProfit,
          prevGrossProfit
        );
      }
    }

    // Additional metadata
    const metadata = {
      daysWithData: records.length,
      verifiedDays: records.filter((r) => r.isVerified).length,
      missingDays: 7 - records.length,
    };

    return NextResponse.json({
      success: true,
      data: summary,
      metadata,
    });
  } catch (error) {
    console.error("Error fetching weekly summary:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch weekly financial summary" },
      { status: 500 }
    );
  }
}
