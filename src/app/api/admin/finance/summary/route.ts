import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { verifyAdmin } from "@/lib/admin-auth";
import { DocumentData, QueryDocumentSnapshot } from "firebase-admin/firestore";
import {
  DailyFinancial,
  calculateIncomeTotal,
  calculateExpenseTotal,
  calculateGrossProfit,
  getWeekStartForDate,
} from "@/types/financials";

export async function GET(request: NextRequest) {
  const auth = await verifyAdmin(request);
  if (!auth.authenticated) return auth.error!;

  try {
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];

    // Calculate week start (Monday)
    const weekStart = getWeekStartForDate(today);

    // Calculate month start
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
      .toISOString()
      .split("T")[0];

    // Fetch all entries for this month
    const snapshot = await adminDb
      .collection("dailyFinancials")
      .where("date", ">=", monthStart)
      .where("date", "<=", todayStr)
      .orderBy("date", "desc")
      .get();

    const entries: DailyFinancial[] = snapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => ({
      id: doc.id,
      ...doc.data(),
    })) as DailyFinancial[];

    // Calculate today's totals
    const todayEntry = entries.find((e) => e.date === todayStr);
    const todayTotals = todayEntry
      ? {
          income: todayEntry.income.total,
          expenses: todayEntry.expenses.total,
          profit: todayEntry.grossProfit,
        }
      : { income: 0, expenses: 0, profit: 0 };

    // Calculate this week's totals
    const weekEntries = entries.filter((e) => e.date >= weekStart);
    const weekTotals = weekEntries.reduce(
      (acc, entry) => ({
        income: acc.income + entry.income.total,
        expenses: acc.expenses + entry.expenses.total,
        profit: acc.profit + entry.grossProfit,
      }),
      { income: 0, expenses: 0, profit: 0 }
    );

    // Calculate this month's totals
    const monthTotals = entries.reduce(
      (acc, entry) => ({
        income: acc.income + entry.income.total,
        expenses: acc.expenses + entry.expenses.total,
        profit: acc.profit + entry.grossProfit,
      }),
      { income: 0, expenses: 0, profit: 0 }
    );

    // Recent entries (last 5)
    const recentEntries = entries.slice(0, 5);

    return NextResponse.json({
      success: true,
      data: {
        today: todayTotals,
        thisWeek: weekTotals,
        thisMonth: monthTotals,
        recentEntries,
      },
    });
  } catch (error) {
    console.error("Error fetching financial summary:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch financial summary" },
      { status: 500 }
    );
  }
}
