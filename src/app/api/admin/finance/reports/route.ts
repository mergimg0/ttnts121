import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { verifyAdmin } from "@/lib/admin-auth";
import { DocumentData, QueryDocumentSnapshot } from "firebase-admin/firestore";
import {
  DailyFinancial,
  FinancialTrendPoint,
} from "@/types/financials";

export async function GET(request: NextRequest) {
  const auth = await verifyAdmin(request);
  if (!auth.authenticated) return auth.error!;

  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    if (!startDate || !endDate) {
      return NextResponse.json(
        { success: false, error: "Start date and end date are required" },
        { status: 400 }
      );
    }

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return NextResponse.json(
        { success: false, error: "Invalid date format" },
        { status: 400 }
      );
    }

    if (start > end) {
      return NextResponse.json(
        { success: false, error: "Start date must be before end date" },
        { status: 400 }
      );
    }

    // Fetch entries for the period
    const snapshot = await adminDb
      .collection("dailyFinancials")
      .where("date", ">=", startDate)
      .where("date", "<=", endDate)
      .orderBy("date", "asc")
      .get();

    const entries: DailyFinancial[] = snapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => ({
      id: doc.id,
      ...doc.data(),
    })) as DailyFinancial[];

    // Calculate totals
    const totals = entries.reduce(
      (acc, entry) => ({
        income: acc.income + (entry.income?.total || 0),
        expenses: acc.expenses + (entry.expenses?.total || 0),
        profit: acc.profit + (entry.grossProfit || 0),
      }),
      { income: 0, expenses: 0, profit: 0 }
    );

    // Calculate income breakdown
    const incomeBreakdown: Record<string, number> = {
      asc: 0,
      gds: 0,
      oneToOne: 0,
      other: 0,
    };

    entries.forEach((entry) => {
      if (entry.income) {
        incomeBreakdown.asc += entry.income.asc || 0;
        incomeBreakdown.gds += entry.income.gds || 0;
        incomeBreakdown.oneToOne += entry.income.oneToOne || 0;
        incomeBreakdown.other += entry.income.other || 0;
      }
    });

    // Calculate expense breakdown
    const expenseBreakdown: Record<string, number> = {
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

    entries.forEach((entry) => {
      if (entry.expenses) {
        expenseBreakdown.asc += entry.expenses.asc || 0;
        expenseBreakdown.gds += entry.expenses.gds || 0;
        expenseBreakdown.oneToOne += entry.expenses.oneToOne || 0;
        expenseBreakdown.coachWages += entry.expenses.coachWages || 0;
        expenseBreakdown.equipment += entry.expenses.equipment || 0;
        expenseBreakdown.venue += entry.expenses.venue || 0;
        expenseBreakdown.marketing += entry.expenses.marketing || 0;
        expenseBreakdown.admin += entry.expenses.admin || 0;
        expenseBreakdown.other += entry.expenses.other || 0;
      }
    });

    // Generate trend data
    const trendData: FinancialTrendPoint[] = entries.map((entry) => ({
      date: entry.date,
      label: new Date(entry.date).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
      }),
      income: entry.income?.total || 0,
      expenses: entry.expenses?.total || 0,
      profit: entry.grossProfit || 0,
    }));

    // Calculate previous period comparison
    const periodDays = Math.ceil(
      (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
    );
    const previousStart = new Date(start);
    previousStart.setDate(previousStart.getDate() - periodDays - 1);
    const previousEnd = new Date(start);
    previousEnd.setDate(previousEnd.getDate() - 1);

    const previousSnapshot = await adminDb
      .collection("dailyFinancials")
      .where("date", ">=", previousStart.toISOString().split("T")[0])
      .where("date", "<=", previousEnd.toISOString().split("T")[0])
      .get();

    const previousEntries = previousSnapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => doc.data()) as DailyFinancial[];

    const comparison = previousEntries.length > 0
      ? {
          previousIncome: previousEntries.reduce((sum, e) => sum + (e.income?.total || 0), 0),
          previousExpenses: previousEntries.reduce((sum, e) => sum + (e.expenses?.total || 0), 0),
          previousProfit: previousEntries.reduce((sum, e) => sum + (e.grossProfit || 0), 0),
        }
      : undefined;

    return NextResponse.json({
      success: true,
      data: {
        entries,
        totals,
        incomeBreakdown,
        expenseBreakdown,
        trendData,
        comparison,
      },
    });
  } catch (error) {
    console.error("Error fetching financial report:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch financial report" },
      { status: 500 }
    );
  }
}
