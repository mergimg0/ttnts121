import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import {
  DailyFinancial,
  UpdateDailyFinancialInput,
  IncomeBreakdown,
  ExpenseBreakdown,
  calculateIncomeTotal,
  calculateExpenseTotal,
  calculateGrossProfit,
} from "@/types/financials";

const COLLECTION = "daily_financials";

/**
 * Merge income breakdown, recalculating total
 */
function mergeIncomeBreakdown(
  existing: IncomeBreakdown,
  updates: Partial<IncomeBreakdown>
): IncomeBreakdown {
  const merged = {
    asc: updates.asc ?? existing.asc,
    gds: updates.gds ?? existing.gds,
    oneToOne: updates.oneToOne ?? existing.oneToOne,
    other: updates.other ?? existing.other,
  };
  return {
    ...merged,
    total: calculateIncomeTotal(merged),
  };
}

/**
 * Merge expense breakdown, recalculating total
 */
function mergeExpenseBreakdown(
  existing: ExpenseBreakdown,
  updates: Partial<ExpenseBreakdown>
): ExpenseBreakdown {
  const merged = {
    asc: updates.asc ?? existing.asc,
    gds: updates.gds ?? existing.gds,
    oneToOne: updates.oneToOne ?? existing.oneToOne,
    coachWages: updates.coachWages ?? existing.coachWages,
    equipment: updates.equipment ?? existing.equipment,
    venue: updates.venue ?? existing.venue,
    marketing: updates.marketing ?? existing.marketing,
    admin: updates.admin ?? existing.admin,
    other: updates.other ?? existing.other,
  };
  return {
    ...merged,
    total: calculateExpenseTotal(merged),
  };
}

// GET /api/admin/financials/daily/[id] - Get a single daily financial record
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const doc = await adminDb.collection(COLLECTION).doc(id).get();

    if (!doc.exists) {
      return NextResponse.json(
        { success: false, error: "Daily financial record not found" },
        { status: 404 }
      );
    }

    const financial: DailyFinancial = {
      id: doc.id,
      ...doc.data(),
    } as DailyFinancial;

    return NextResponse.json({
      success: true,
      data: financial,
    });
  } catch (error) {
    console.error("Error fetching daily financial:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch daily financial record" },
      { status: 500 }
    );
  }
}

// PUT /api/admin/financials/daily/[id] - Update a daily financial record
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body: UpdateDailyFinancialInput = await request.json();

    const docRef = adminDb.collection(COLLECTION).doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json(
        { success: false, error: "Daily financial record not found" },
        { status: 404 }
      );
    }

    const existingData = doc.data() as DailyFinancial;

    // Build update data
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    // Handle income updates - recalculate totals
    if (body.income) {
      updateData.income = mergeIncomeBreakdown(existingData.income, body.income);
    }

    // Handle expense updates - recalculate totals
    if (body.expenses) {
      updateData.expenses = mergeExpenseBreakdown(
        existingData.expenses,
        body.expenses
      );
    }

    // Recalculate gross profit if income or expenses changed
    if (body.income || body.expenses) {
      const finalIncome = (updateData.income as IncomeBreakdown) || existingData.income;
      const finalExpenses =
        (updateData.expenses as ExpenseBreakdown) || existingData.expenses;
      updateData.grossProfit = calculateGrossProfit(
        finalIncome.total,
        finalExpenses.total
      );
    }

    // Handle other optional fields
    if (body.paymentMethods !== undefined) {
      updateData.paymentMethods = body.paymentMethods;
    }
    if (body.stripeRevenue !== undefined) {
      updateData.stripeRevenue = body.stripeRevenue;
    }
    if (body.stripeTransactionIds !== undefined) {
      updateData.stripeTransactionIds = body.stripeTransactionIds;
    }
    if (body.notes !== undefined) {
      updateData.notes = body.notes;
    }
    if (body.loggedBy !== undefined) {
      updateData.loggedBy = body.loggedBy;
    }
    if (body.verifiedBy !== undefined) {
      updateData.verifiedBy = body.verifiedBy;
    }
    if (body.isVerified !== undefined) {
      updateData.isVerified = body.isVerified;
    }

    await docRef.update(updateData);

    // Fetch and return updated document
    const updatedDoc = await docRef.get();
    const updatedFinancial: DailyFinancial = {
      id: updatedDoc.id,
      ...updatedDoc.data(),
    } as DailyFinancial;

    return NextResponse.json({
      success: true,
      data: updatedFinancial,
    });
  } catch (error) {
    console.error("Error updating daily financial:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update daily financial record" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/financials/daily/[id] - Delete a daily financial record
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const docRef = adminDb.collection(COLLECTION).doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json(
        { success: false, error: "Daily financial record not found" },
        { status: 404 }
      );
    }

    const data = doc.data() as DailyFinancial;

    // Prevent deletion of verified records without explicit override
    const { searchParams } = new URL(request.url);
    const force = searchParams.get("force") === "true";

    if (data.isVerified && !force) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Cannot delete a verified record. Use ?force=true to override.",
        },
        { status: 400 }
      );
    }

    await docRef.delete();

    return NextResponse.json({
      success: true,
      message: `Daily financial record for ${data.date} deleted`,
      deletedDate: data.date,
    });
  } catch (error) {
    console.error("Error deleting daily financial:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete daily financial record" },
      { status: 500 }
    );
  }
}
