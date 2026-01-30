import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { verifyAdmin } from "@/lib/admin-auth";
import { DocumentData, QueryDocumentSnapshot } from "firebase-admin/firestore";
import { DailyFinancial } from "@/types/financials";

export async function GET(request: NextRequest) {
  const auth = await verifyAdmin(request);
  if (!auth.authenticated) return auth.error!;

  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const format = searchParams.get("format") || "csv";

    if (!startDate || !endDate) {
      return NextResponse.json(
        { success: false, error: "Start date and end date are required" },
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

    if (format === "csv") {
      // Generate CSV
      const headers = [
        "Date",
        "Day",
        // Income columns
        "Income - ASC",
        "Income - GDS",
        "Income - 1-to-1",
        "Income - Other",
        "Income Total",
        // Expense columns
        "Expense - ASC",
        "Expense - GDS",
        "Expense - 1-to-1",
        "Expense - Coach Wages",
        "Expense - Equipment",
        "Expense - Venue",
        "Expense - Marketing",
        "Expense - Admin",
        "Expense - Other",
        "Expense Total",
        // Profit
        "Gross Profit",
        "Notes",
      ];

      const rows = entries.map((entry) => {
        const formatCurrency = (pence: number) => (pence / 100).toFixed(2);

        return [
          entry.date,
          entry.dayName,
          // Income
          formatCurrency(entry.income?.asc || 0),
          formatCurrency(entry.income?.gds || 0),
          formatCurrency(entry.income?.oneToOne || 0),
          formatCurrency(entry.income?.other || 0),
          formatCurrency(entry.income?.total || 0),
          // Expenses
          formatCurrency(entry.expenses?.asc || 0),
          formatCurrency(entry.expenses?.gds || 0),
          formatCurrency(entry.expenses?.oneToOne || 0),
          formatCurrency(entry.expenses?.coachWages || 0),
          formatCurrency(entry.expenses?.equipment || 0),
          formatCurrency(entry.expenses?.venue || 0),
          formatCurrency(entry.expenses?.marketing || 0),
          formatCurrency(entry.expenses?.admin || 0),
          formatCurrency(entry.expenses?.other || 0),
          formatCurrency(entry.expenses?.total || 0),
          // Profit
          formatCurrency(entry.grossProfit || 0),
          // Notes (escape for CSV)
          entry.notes ? `"${entry.notes.replace(/"/g, '""')}"` : "",
        ];
      });

      // Add totals row
      const totals = entries.reduce(
        (acc, entry) => ({
          incomeAsc: acc.incomeAsc + (entry.income?.asc || 0),
          incomeGds: acc.incomeGds + (entry.income?.gds || 0),
          incomeOneToOne: acc.incomeOneToOne + (entry.income?.oneToOne || 0),
          incomeOther: acc.incomeOther + (entry.income?.other || 0),
          incomeTotal: acc.incomeTotal + (entry.income?.total || 0),
          expenseAsc: acc.expenseAsc + (entry.expenses?.asc || 0),
          expenseGds: acc.expenseGds + (entry.expenses?.gds || 0),
          expenseOneToOne: acc.expenseOneToOne + (entry.expenses?.oneToOne || 0),
          expenseCoachWages: acc.expenseCoachWages + (entry.expenses?.coachWages || 0),
          expenseEquipment: acc.expenseEquipment + (entry.expenses?.equipment || 0),
          expenseVenue: acc.expenseVenue + (entry.expenses?.venue || 0),
          expenseMarketing: acc.expenseMarketing + (entry.expenses?.marketing || 0),
          expenseAdmin: acc.expenseAdmin + (entry.expenses?.admin || 0),
          expenseOther: acc.expenseOther + (entry.expenses?.other || 0),
          expenseTotal: acc.expenseTotal + (entry.expenses?.total || 0),
          profit: acc.profit + (entry.grossProfit || 0),
        }),
        {
          incomeAsc: 0,
          incomeGds: 0,
          incomeOneToOne: 0,
          incomeOther: 0,
          incomeTotal: 0,
          expenseAsc: 0,
          expenseGds: 0,
          expenseOneToOne: 0,
          expenseCoachWages: 0,
          expenseEquipment: 0,
          expenseVenue: 0,
          expenseMarketing: 0,
          expenseAdmin: 0,
          expenseOther: 0,
          expenseTotal: 0,
          profit: 0,
        }
      );

      const formatCurrency = (pence: number) => (pence / 100).toFixed(2);

      const totalsRow = [
        "TOTAL",
        "",
        formatCurrency(totals.incomeAsc),
        formatCurrency(totals.incomeGds),
        formatCurrency(totals.incomeOneToOne),
        formatCurrency(totals.incomeOther),
        formatCurrency(totals.incomeTotal),
        formatCurrency(totals.expenseAsc),
        formatCurrency(totals.expenseGds),
        formatCurrency(totals.expenseOneToOne),
        formatCurrency(totals.expenseCoachWages),
        formatCurrency(totals.expenseEquipment),
        formatCurrency(totals.expenseVenue),
        formatCurrency(totals.expenseMarketing),
        formatCurrency(totals.expenseAdmin),
        formatCurrency(totals.expenseOther),
        formatCurrency(totals.expenseTotal),
        formatCurrency(totals.profit),
        "",
      ];

      rows.push(totalsRow);

      const csv = [headers.join(","), ...rows.map((row) => row.join(","))].join(
        "\n"
      );

      return new NextResponse(csv, {
        status: 200,
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="finance-report-${startDate}-to-${endDate}.csv"`,
        },
      });
    }

    // For other formats, return JSON for now
    return NextResponse.json({
      success: true,
      data: entries,
    });
  } catch (error) {
    console.error("Error exporting financial data:", error);
    return NextResponse.json(
      { success: false, error: "Failed to export financial data" },
      { status: 500 }
    );
  }
}
