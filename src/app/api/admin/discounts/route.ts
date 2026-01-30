import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { verifyAdmin } from "@/lib/admin-auth";
import { DiscountRule, CreateDiscountRuleInput } from "@/types/discount-rule";

// GET all discount rules
export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAdmin(request);
    if (!auth.authenticated) return auth.error!;
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get("active") === "true";

    let query = adminDb.collection("discountRules").orderBy("priority", "desc");

    if (activeOnly) {
      query = adminDb
        .collection("discountRules")
        .where("isActive", "==", true)
        .orderBy("priority", "desc");
    }

    const snapshot = await query.get();

    const rules = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as DiscountRule[];

    return NextResponse.json({ success: true, data: rules });
  } catch (error) {
    console.error("Error fetching discount rules:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch discount rules" },
      { status: 500 }
    );
  }
}

// POST create new discount rule
export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAdmin(request);
    if (!auth.authenticated) return auth.error!;
    const body: CreateDiscountRuleInput = await request.json();

    // Validate required fields
    if (!body.name || !body.type || !body.discount) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: name, type, discount" },
        { status: 400 }
      );
    }

    // Validate discount type
    if (!["sibling", "bulk", "early_bird"].includes(body.type)) {
      return NextResponse.json(
        { success: false, error: "Invalid discount type" },
        { status: 400 }
      );
    }

    // Validate discount value
    if (body.discount.type === "percentage" && (body.discount.value < 0 || body.discount.value > 100)) {
      return NextResponse.json(
        { success: false, error: "Percentage discount must be between 0 and 100" },
        { status: 400 }
      );
    }

    const ruleData = {
      ...body,
      conditions: body.conditions || {},
      priority: body.priority ?? 0,
      isActive: body.isActive ?? true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const docRef = await adminDb.collection("discountRules").add(ruleData);

    // Verify write succeeded
    const verifyDoc = await docRef.get();
    if (!verifyDoc.exists) {
      console.error("Firebase write verification failed");
      return NextResponse.json(
        { success: false, error: "Failed to verify discount rule creation" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { id: docRef.id, ...verifyDoc.data() },
      message: "Discount rule created successfully",
    });
  } catch (error) {
    console.error("Error creating discount rule:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: `Failed to create discount rule: ${errorMessage}` },
      { status: 500 }
    );
  }
}
