import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { verifyAdmin } from "@/lib/admin-auth";
import { UpdateDiscountRuleInput } from "@/types/discount-rule";

// GET single discount rule
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyAdmin(request);
    if (!auth.authenticated) return auth.error!;

    const { id } = await params;
    const doc = await adminDb.collection("discountRules").doc(id).get();

    if (!doc.exists) {
      return NextResponse.json(
        { success: false, error: "Discount rule not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { id: doc.id, ...doc.data() },
    });
  } catch (error) {
    console.error("Error fetching discount rule:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch discount rule" },
      { status: 500 }
    );
  }
}

// PUT update discount rule
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyAdmin(request);
    if (!auth.authenticated) return auth.error!;

    const { id } = await params;
    const body: UpdateDiscountRuleInput = await request.json();

    const docRef = adminDb.collection("discountRules").doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json(
        { success: false, error: "Discount rule not found" },
        { status: 404 }
      );
    }

    // Validate discount type if provided
    if (body.type && !["sibling", "bulk", "early_bird"].includes(body.type)) {
      return NextResponse.json(
        { success: false, error: "Invalid discount type" },
        { status: 400 }
      );
    }

    // Validate discount value if provided
    if (body.discount?.type === "percentage" && body.discount.value !== undefined) {
      if (body.discount.value < 0 || body.discount.value > 100) {
        return NextResponse.json(
          { success: false, error: "Percentage discount must be between 0 and 100" },
          { status: 400 }
        );
      }
    }

    const updateData = {
      ...body,
      updatedAt: new Date(),
    };

    await docRef.update(updateData);

    // Fetch updated document
    const updatedDoc = await docRef.get();

    return NextResponse.json({
      success: true,
      data: { id: updatedDoc.id, ...updatedDoc.data() },
      message: "Discount rule updated successfully",
    });
  } catch (error) {
    console.error("Error updating discount rule:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: `Failed to update discount rule: ${errorMessage}` },
      { status: 500 }
    );
  }
}

// DELETE discount rule
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyAdmin(request);
    if (!auth.authenticated) return auth.error!;

    const { id } = await params;
    const docRef = adminDb.collection("discountRules").doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json(
        { success: false, error: "Discount rule not found" },
        { status: 404 }
      );
    }

    await docRef.delete();

    return NextResponse.json({
      success: true,
      message: "Discount rule deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting discount rule:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete discount rule" },
      { status: 500 }
    );
  }
}
