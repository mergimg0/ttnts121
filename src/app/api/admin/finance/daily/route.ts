import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import {
  DailyFinancial,
  calculateIncomeTotal,
  calculateExpenseTotal,
  calculateGrossProfit,
  getDayName,
} from "@/types/financials";

// GET - Fetch daily entry for a specific date
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");

    if (!date) {
      return NextResponse.json(
        { success: false, error: "Date parameter is required" },
        { status: 400 }
      );
    }

    // Find entry for this date
    const snapshot = await adminDb
      .collection("dailyFinancials")
      .where("date", "==", date)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return NextResponse.json(
        { success: false, error: "No entry found for this date" },
        { status: 404 }
      );
    }

    const doc = snapshot.docs[0];
    const data = {
      id: doc.id,
      ...doc.data(),
    } as DailyFinancial;

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Error fetching daily financial:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch daily financial" },
      { status: 500 }
    );
  }
}

// POST - Create new daily entry
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { date, income, expenses, notes } = body;

    if (!date || !income || !expenses) {
      return NextResponse.json(
        { success: false, error: "Date, income, and expenses are required" },
        { status: 400 }
      );
    }

    // Check if entry already exists for this date
    const existingSnapshot = await adminDb
      .collection("dailyFinancials")
      .where("date", "==", date)
      .limit(1)
      .get();

    if (!existingSnapshot.empty) {
      return NextResponse.json(
        { success: false, error: "Entry already exists for this date. Use PUT to update." },
        { status: 409 }
      );
    }

    // Calculate totals
    const incomeTotal = calculateIncomeTotal(income);
    const expenseTotal = calculateExpenseTotal(expenses);
    const grossProfit = calculateGrossProfit(incomeTotal, expenseTotal);

    // Get day info
    const dateObj = new Date(date);
    const dayOfWeek = dateObj.getDay();
    const dayName = getDayName(date);

    // Create the entry
    const entryData = {
      date,
      dayOfWeek,
      dayName,
      income: {
        ...income,
        total: incomeTotal,
      },
      expenses: {
        ...expenses,
        total: expenseTotal,
      },
      grossProfit,
      notes: notes || undefined,
      isVerified: false,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    const docRef = await adminDb.collection("dailyFinancials").add(entryData);

    return NextResponse.json({
      success: true,
      data: {
        id: docRef.id,
        ...entryData,
      },
    });
  } catch (error) {
    console.error("Error creating daily financial:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create daily financial" },
      { status: 500 }
    );
  }
}

// PUT - Update existing daily entry
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { date, income, expenses, notes } = body;

    if (!date || !income || !expenses) {
      return NextResponse.json(
        { success: false, error: "Date, income, and expenses are required" },
        { status: 400 }
      );
    }

    // Find existing entry
    const snapshot = await adminDb
      .collection("dailyFinancials")
      .where("date", "==", date)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return NextResponse.json(
        { success: false, error: "No entry found for this date" },
        { status: 404 }
      );
    }

    const doc = snapshot.docs[0];

    // Calculate totals
    const incomeTotal = calculateIncomeTotal(income);
    const expenseTotal = calculateExpenseTotal(expenses);
    const grossProfit = calculateGrossProfit(incomeTotal, expenseTotal);

    // Update data
    const updateData = {
      income: {
        ...income,
        total: incomeTotal,
      },
      expenses: {
        ...expenses,
        total: expenseTotal,
      },
      grossProfit,
      notes: notes || null,
      updatedAt: FieldValue.serverTimestamp(),
    };

    await doc.ref.update(updateData);

    return NextResponse.json({
      success: true,
      data: {
        id: doc.id,
        ...doc.data(),
        ...updateData,
      },
    });
  } catch (error) {
    console.error("Error updating daily financial:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update daily financial" },
      { status: 500 }
    );
  }
}
