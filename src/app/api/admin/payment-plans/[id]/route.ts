import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { PaymentPlan, UpdatePaymentPlanInput } from "@/types/payment-plan";

// GET /api/admin/payment-plans/[id] - Get a single payment plan
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const doc = await adminDb.collection("payment_plans").doc(id).get();

    if (!doc.exists) {
      return NextResponse.json(
        { success: false, error: "Payment plan not found" },
        { status: 404 }
      );
    }

    const paymentPlan: PaymentPlan = {
      id: doc.id,
      ...doc.data(),
    } as PaymentPlan;

    return NextResponse.json({
      success: true,
      data: paymentPlan,
    });
  } catch (error) {
    console.error("Error fetching payment plan:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch payment plan" },
      { status: 500 }
    );
  }
}

// PUT /api/admin/payment-plans/[id] - Update a payment plan
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body: UpdatePaymentPlanInput = await request.json();

    // Check if the payment plan exists
    const docRef = adminDb.collection("payment_plans").doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json(
        { success: false, error: "Payment plan not found" },
        { status: 404 }
      );
    }

    // Validate installment count if provided
    if (body.installmentCount !== undefined) {
      if (body.installmentCount < 2 || body.installmentCount > 12) {
        return NextResponse.json(
          { success: false, error: "Installment count must be between 2 and 12" },
          { status: 400 }
        );
      }
    }

    // Validate interval days if provided
    if (body.intervalDays !== undefined) {
      if (body.intervalDays < 7 || body.intervalDays > 90) {
        return NextResponse.json(
          { success: false, error: "Interval days must be between 7 and 90" },
          { status: 400 }
        );
      }
    }

    // Validate minimum purchase amount if provided
    if (body.minPurchaseAmount !== undefined && body.minPurchaseAmount < 0) {
      return NextResponse.json(
        { success: false, error: "Minimum purchase amount cannot be negative" },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = {
      ...body,
      updatedAt: new Date(),
    };

    // Handle sessionIds - if empty array, set to undefined
    if (body.sessionIds !== undefined) {
      updateData.sessionIds = body.sessionIds.length > 0 ? body.sessionIds : null;
    }

    await docRef.update(updateData);

    // Fetch the updated document
    const updatedDoc = await docRef.get();
    const paymentPlan: PaymentPlan = {
      id: updatedDoc.id,
      ...updatedDoc.data(),
    } as PaymentPlan;

    return NextResponse.json({
      success: true,
      data: paymentPlan,
    });
  } catch (error) {
    console.error("Error updating payment plan:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update payment plan" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/payment-plans/[id] - Delete (deactivate) a payment plan
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const docRef = adminDb.collection("payment_plans").doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json(
        { success: false, error: "Payment plan not found" },
        { status: 404 }
      );
    }

    // Check if any active bookings are using this payment plan
    const activeBookings = await adminDb
      .collection("bookings")
      .where("paymentPlanId", "==", id)
      .where("paymentStatus", "in", ["pending", "deposit_paid"])
      .limit(1)
      .get();

    if (!activeBookings.empty) {
      // Soft delete - just deactivate
      await docRef.update({
        isActive: false,
        updatedAt: new Date(),
      });

      return NextResponse.json({
        success: true,
        message: "Payment plan deactivated (has active bookings)",
      });
    }

    // Hard delete if no active bookings
    await docRef.delete();

    return NextResponse.json({
      success: true,
      message: "Payment plan deleted",
    });
  } catch (error) {
    console.error("Error deleting payment plan:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete payment plan" },
      { status: 500 }
    );
  }
}
