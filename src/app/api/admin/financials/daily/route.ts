import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { verifyAdmin } from "@/lib/admin-auth";
import {
  DailyFinancial,
  CreateDailyFinancialInput,
  IncomeBreakdown,
  ExpenseBreakdown,
  calculateIncomeTotal,
  calculateExpenseTotal,
  calculateGrossProfit,
  getDayName,
} from "@/types/financials";

const COLLECTION = "daily_financials";

/**
 * Validate date format YYYY-MM-DD
 */
function isValidDateFormat(dateStr: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(dateStr);
}

/**
 * Parse date string to get day of week (0-6, Sunday=0)
 */
function getDayOfWeek(dateStr: string): number {
  return new Date(dateStr).getDay();
}

/**
 * Build complete income breakdown with calculated total
 */
function buildIncomeBreakdown(
  input: Omit<IncomeBreakdown, "total">
): IncomeBreakdown {
  return {
    asc: input.asc || 0,
    gds: input.gds || 0,
    oneToOne: input.oneToOne || 0,
    other: input.other || 0,
    total: calculateIncomeTotal(input),
  };
}

/**
 * Build complete expense breakdown with calculated total
 */
function buildExpenseBreakdown(
  input: Omit<ExpenseBreakdown, "total">
): ExpenseBreakdown {
  return {
    asc: input.asc || 0,
    gds: input.gds || 0,
    oneToOne: input.oneToOne || 0,
    coachWages: input.coachWages || 0,
    equipment: input.equipment || 0,
    venue: input.venue || 0,
    marketing: input.marketing || 0,
    admin: input.admin || 0,
    other: input.other || 0,
    total: calculateExpenseTotal(input),
  };
}

// GET /api/admin/financials/daily - List daily financials with filters
export async function GET(request: NextRequest) {
  // Verify admin authentication
  const auth = await verifyAdmin(request);
  if (!auth.authenticated) return auth.error!;

  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date"); // Single date
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const month = searchParams.get("month"); // Format: "2026-01"
    const isVerified = searchParams.get("isVerified");
    const limit = parseInt(searchParams.get("limit") || "100");

    let query: FirebaseFirestore.Query = adminDb
      .collection(COLLECTION)
      .orderBy("date", "desc");

    // Filter by single date
    if (date) {
      if (!isValidDateFormat(date)) {
        return NextResponse.json(
          { success: false, error: "Invalid date format. Use YYYY-MM-DD" },
          { status: 400 }
        );
      }
      query = query.where("date", "==", date);
    }
    // Filter by date range
    else if (startDate && endDate) {
      if (!isValidDateFormat(startDate) || !isValidDateFormat(endDate)) {
        return NextResponse.json(
          {
            success: false,
            error: "Invalid date format. Use YYYY-MM-DD for startDate and endDate",
          },
          { status: 400 }
        );
      }
      query = query.where("date", ">=", startDate).where("date", "<=", endDate);
    }
    // Filter by month
    else if (month) {
      if (!/^\d{4}-\d{2}$/.test(month)) {
        return NextResponse.json(
          { success: false, error: "Invalid month format. Use YYYY-MM" },
          { status: 400 }
        );
      }
      const monthStart = `${month}-01`;
      const [year, monthNum] = month.split("-").map(Number);
      const lastDay = new Date(year, monthNum, 0).getDate();
      const monthEnd = `${month}-${String(lastDay).padStart(2, "0")}`;
      query = query.where("date", ">=", monthStart).where("date", "<=", monthEnd);
    }

    // Filter by verification status
    if (isVerified === "true") {
      query = query.where("isVerified", "==", true);
    } else if (isVerified === "false") {
      query = query.where("isVerified", "==", false);
    }

    const snapshot = await query.limit(limit).get();

    const records: DailyFinancial[] = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as DailyFinancial[];

    // Calculate summary totals
    const summary = {
      totalIncome: records.reduce((sum, r) => sum + (r.income?.total || 0), 0),
      totalExpenses: records.reduce(
        (sum, r) => sum + (r.expenses?.total || 0),
        0
      ),
      totalGrossProfit: records.reduce((sum, r) => sum + (r.grossProfit || 0), 0),
      recordCount: records.length,
      verifiedCount: records.filter((r) => r.isVerified).length,
    };

    return NextResponse.json({
      success: true,
      data: records,
      summary,
    });
  } catch (error) {
    console.error("Error fetching daily financials:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch daily financials" },
      { status: 500 }
    );
  }
}

// POST /api/admin/financials/daily - Create a new daily financial record
export async function POST(request: NextRequest) {
  // Verify admin authentication
  const auth = await verifyAdmin(request);
  if (!auth.authenticated) return auth.error!;

  try {
    const body: CreateDailyFinancialInput = await request.json();
    const { date, income, expenses, paymentMethods, notes, loggedBy } = body;

    // Validate required fields
    if (!date) {
      return NextResponse.json(
        { success: false, error: "Date is required" },
        { status: 400 }
      );
    }

    if (!isValidDateFormat(date)) {
      return NextResponse.json(
        { success: false, error: "Invalid date format. Use YYYY-MM-DD" },
        { status: 400 }
      );
    }

    if (!income || !expenses) {
      return NextResponse.json(
        { success: false, error: "Income and expenses breakdowns are required" },
        { status: 400 }
      );
    }

    // Check if record for this date already exists
    const existingSnapshot = await adminDb
      .collection(COLLECTION)
      .where("date", "==", date)
      .limit(1)
      .get();

    if (!existingSnapshot.empty) {
      return NextResponse.json(
        {
          success: false,
          error: `A financial record for ${date} already exists`,
          existingId: existingSnapshot.docs[0].id,
        },
        { status: 400 }
      );
    }

    // Build complete breakdowns with calculated totals
    const incomeBreakdown = buildIncomeBreakdown(income);
    const expenseBreakdown = buildExpenseBreakdown(expenses);
    const grossProfit = calculateGrossProfit(
      incomeBreakdown.total,
      expenseBreakdown.total
    );

    const now = new Date();

    const financialData: Omit<DailyFinancial, "id"> = {
      date,
      dayOfWeek: getDayOfWeek(date),
      dayName: getDayName(date),
      income: incomeBreakdown,
      expenses: expenseBreakdown,
      grossProfit,
      paymentMethods: paymentMethods || undefined,
      notes: notes || undefined,
      loggedBy: loggedBy || undefined,
      isVerified: false,
      createdAt: now,
      updatedAt: now,
    };

    // Remove undefined values for clean Firestore document
    const cleanData = Object.fromEntries(
      Object.entries(financialData).filter(([_, v]) => v !== undefined)
    );

    const docRef = await adminDb.collection(COLLECTION).add(cleanData);

    const financial: DailyFinancial = {
      id: docRef.id,
      ...financialData,
    };

    return NextResponse.json({
      success: true,
      data: financial,
    });
  } catch (error) {
    console.error("Error creating daily financial:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create daily financial record" },
      { status: 500 }
    );
  }
}
