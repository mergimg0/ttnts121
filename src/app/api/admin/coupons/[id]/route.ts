import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { verifyAdmin } from "@/lib/admin-auth";
import { Coupon, UpdateCouponInput } from "@/types/coupon";

// GET /api/admin/coupons/[id] - Get a single coupon
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAdmin(request);
  if (!auth.authenticated) return auth.error!;

  try {
    const { id } = await params;

    const doc = await adminDb.collection("coupons").doc(id).get();

    if (!doc.exists) {
      return NextResponse.json(
        { success: false, error: "Coupon not found" },
        { status: 404 }
      );
    }

    const coupon: Coupon = {
      id: doc.id,
      ...doc.data(),
    } as Coupon;

    return NextResponse.json({
      success: true,
      data: coupon,
    });
  } catch (error) {
    console.error("Error fetching coupon:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch coupon" },
      { status: 500 }
    );
  }
}

// PUT /api/admin/coupons/[id] - Update a coupon
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAdmin(request);
  if (!auth.authenticated) return auth.error!;

  try {
    const { id } = await params;
    const body: UpdateCouponInput = await request.json();

    const docRef = adminDb.collection("coupons").doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json(
        { success: false, error: "Coupon not found" },
        { status: 404 }
      );
    }

    const existingData = doc.data() as Coupon;

    // If code is being changed, check for duplicates
    if (body.code && body.code !== existingData.code) {
      const normalizedCode = body.code.trim().toUpperCase();

      // Validate code format
      if (!/^[A-Z0-9-]+$/.test(normalizedCode)) {
        return NextResponse.json(
          { success: false, error: "Coupon code can only contain letters, numbers, and hyphens" },
          { status: 400 }
        );
      }

      const existingSnapshot = await adminDb
        .collection("coupons")
        .where("code", "==", normalizedCode)
        .limit(1)
        .get();

      if (!existingSnapshot.empty && existingSnapshot.docs[0].id !== id) {
        return NextResponse.json(
          { success: false, error: "A coupon with this code already exists" },
          { status: 400 }
        );
      }

      body.code = normalizedCode;
    }

    // Validate discount value if provided
    if (body.discountType !== undefined || body.discountValue !== undefined) {
      const discountType = body.discountType || existingData.discountType;
      const discountValue = body.discountValue ?? existingData.discountValue;

      if (discountType === "percentage" && (discountValue < 0 || discountValue > 100)) {
        return NextResponse.json(
          { success: false, error: "Percentage discount must be between 0 and 100" },
          { status: 400 }
        );
      }

      if (discountType === "fixed" && discountValue < 0) {
        return NextResponse.json(
          { success: false, error: "Fixed discount must be positive" },
          { status: 400 }
        );
      }
    }

    // Prepare update data
    const updateData: Record<string, any> = {
      ...body,
      updatedAt: new Date(),
    };

    // Convert date strings to Date objects
    if (body.validFrom) {
      updateData.validFrom = new Date(body.validFrom as any);
    }
    if (body.validUntil) {
      updateData.validUntil = new Date(body.validUntil as any);
    }

    await docRef.update(updateData);

    // Fetch updated document
    const updatedDoc = await docRef.get();
    const updatedCoupon: Coupon = {
      id: updatedDoc.id,
      ...updatedDoc.data(),
    } as Coupon;

    return NextResponse.json({
      success: true,
      data: updatedCoupon,
    });
  } catch (error) {
    console.error("Error updating coupon:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update coupon" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/coupons/[id] - Delete a coupon (or deactivate)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAdmin(request);
  if (!auth.authenticated) return auth.error!;

  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const hardDelete = searchParams.get("hard") === "true";

    const docRef = adminDb.collection("coupons").doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json(
        { success: false, error: "Coupon not found" },
        { status: 404 }
      );
    }

    if (hardDelete) {
      // Permanently delete the coupon
      await docRef.delete();
    } else {
      // Soft delete - just deactivate
      await docRef.update({
        isActive: false,
        updatedAt: new Date(),
      });
    }

    return NextResponse.json({
      success: true,
      message: hardDelete ? "Coupon deleted" : "Coupon deactivated",
    });
  } catch (error) {
    console.error("Error deleting coupon:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete coupon" },
      { status: 500 }
    );
  }
}
