import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { verifyAdmin } from "@/lib/admin-auth";
import { PaymentPlan, CreatePaymentPlanInput } from "@/types/payment-plan";

// GET /api/admin/payment-plans - List all payment plans
export async function GET(request: NextRequest) {
  const auth = await verifyAdmin(request);
  if (!auth.authenticated) return auth.error!;

  try {
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get("active") === "true";
    const sessionId = searchParams.get("sessionId");
    const minAmount = searchParams.get("minAmount");

    let query: FirebaseFirestore.Query = adminDb
      .collection("payment_plans")
      .orderBy("createdAt", "desc");

    if (activeOnly) {
      query = query.where("isActive", "==", true);
    }

    const snapshot = await query.get();

    let paymentPlans: PaymentPlan[] = [];
    snapshot.forEach((doc) => {
      paymentPlans.push({
        id: doc.id,
        ...doc.data(),
      } as PaymentPlan);
    });

    // Filter by session ID if provided (client-side filter since Firestore doesn't support array-contains with empty check)
    if (sessionId) {
      paymentPlans = paymentPlans.filter((plan) => {
        // Plan applies if sessionIds is empty/undefined (all sessions) or includes the specific session
        return !plan.sessionIds || plan.sessionIds.length === 0 || plan.sessionIds.includes(sessionId);
      });
    }

    // Filter by minimum amount if provided
    if (minAmount) {
      const amount = parseInt(minAmount, 10);
      paymentPlans = paymentPlans.filter((plan) => {
        return !plan.minPurchaseAmount || plan.minPurchaseAmount <= amount;
      });
    }

    return NextResponse.json({
      success: true,
      data: paymentPlans,
    });
  } catch (error) {
    console.error("Error fetching payment plans:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch payment plans" },
      { status: 500 }
    );
  }
}

// POST /api/admin/payment-plans - Create a new payment plan
export async function POST(request: NextRequest) {
  const auth = await verifyAdmin(request);
  if (!auth.authenticated) return auth.error!;

  try {
    const body: CreatePaymentPlanInput = await request.json();
    const {
      name,
      description,
      installmentCount,
      intervalDays,
      sessionIds,
      minPurchaseAmount,
      isActive = true,
    } = body;

    // Validate required fields
    if (!name || !installmentCount || !intervalDays) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: name, installmentCount, intervalDays" },
        { status: 400 }
      );
    }

    // Validate installment count (minimum 2, maximum 12)
    if (installmentCount < 2 || installmentCount > 12) {
      return NextResponse.json(
        { success: false, error: "Installment count must be between 2 and 12" },
        { status: 400 }
      );
    }

    // Validate interval days (minimum 7, maximum 90)
    if (intervalDays < 7 || intervalDays > 90) {
      return NextResponse.json(
        { success: false, error: "Interval days must be between 7 and 90" },
        { status: 400 }
      );
    }

    // Validate minimum purchase amount if provided
    if (minPurchaseAmount !== undefined && minPurchaseAmount < 0) {
      return NextResponse.json(
        { success: false, error: "Minimum purchase amount cannot be negative" },
        { status: 400 }
      );
    }

    const now = new Date();

    const paymentPlanData: Omit<PaymentPlan, "id"> = {
      name,
      description: description || undefined,
      installmentCount,
      intervalDays,
      sessionIds: sessionIds && sessionIds.length > 0 ? sessionIds : undefined,
      minPurchaseAmount: minPurchaseAmount || undefined,
      isActive,
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await adminDb.collection("payment_plans").add(paymentPlanData);

    const paymentPlan: PaymentPlan = {
      id: docRef.id,
      ...paymentPlanData,
    };

    return NextResponse.json({
      success: true,
      data: paymentPlan,
    });
  } catch (error) {
    console.error("Error creating payment plan:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create payment plan" },
      { status: 500 }
    );
  }
}
