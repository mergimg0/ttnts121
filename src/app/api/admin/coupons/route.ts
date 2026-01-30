import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { verifyAdmin } from "@/lib/admin-auth";
import { Coupon, CreateCouponInput } from "@/types/coupon";

// GET /api/admin/coupons - List all coupons
export async function GET(request: NextRequest) {
  const auth = await verifyAdmin(request);
  if (!auth.authenticated) return auth.error!;

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status"); // active, inactive, expired
    const limit = parseInt(searchParams.get("limit") || "50");

    let query: FirebaseFirestore.Query = adminDb
      .collection("coupons")
      .orderBy("createdAt", "desc")
      .limit(limit);

    if (status === "active") {
      query = query.where("isActive", "==", true);
    } else if (status === "inactive") {
      query = query.where("isActive", "==", false);
    }

    const snapshot = await query.get();

    const coupons: Coupon[] = [];
    const now = new Date();

    snapshot.forEach((doc) => {
      const data = doc.data();
      const coupon = {
        id: doc.id,
        ...data,
      } as Coupon;

      // Filter by expired status if requested
      if (status === "expired") {
        const validUntil = data.validUntil?._seconds
          ? new Date(data.validUntil._seconds * 1000)
          : data.validUntil
            ? new Date(data.validUntil)
            : null;

        if (validUntil && validUntil < now) {
          coupons.push(coupon);
        }
      } else if (status !== "expired") {
        coupons.push(coupon);
      }
    });

    return NextResponse.json({
      success: true,
      data: coupons,
    });
  } catch (error) {
    console.error("Error fetching coupons:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch coupons" },
      { status: 500 }
    );
  }
}

// POST /api/admin/coupons - Create a new coupon
export async function POST(request: NextRequest) {
  const auth = await verifyAdmin(request);
  if (!auth.authenticated) return auth.error!;

  try {
    const body: CreateCouponInput = await request.json();
    const {
      code,
      description,
      discountType,
      discountValue,
      minPurchase,
      maxUses,
      validFrom,
      validUntil,
      applicableSessions,
      isActive = true,
    } = body;

    // Validate required fields
    if (!code || !discountType || discountValue === undefined) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: code, discountType, discountValue" },
        { status: 400 }
      );
    }

    // Normalize code to uppercase
    const normalizedCode = code.trim().toUpperCase();

    // Validate code format (alphanumeric and hyphens only)
    if (!/^[A-Z0-9-]+$/.test(normalizedCode)) {
      return NextResponse.json(
        { success: false, error: "Coupon code can only contain letters, numbers, and hyphens" },
        { status: 400 }
      );
    }

    // Check if code already exists
    const existingSnapshot = await adminDb
      .collection("coupons")
      .where("code", "==", normalizedCode)
      .limit(1)
      .get();

    if (!existingSnapshot.empty) {
      return NextResponse.json(
        { success: false, error: "A coupon with this code already exists" },
        { status: 400 }
      );
    }

    // Validate discount value
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

    const now = new Date();

    const couponData: Omit<Coupon, "id"> = {
      code: normalizedCode,
      description: description || undefined,
      discountType,
      discountValue,
      minPurchase: minPurchase || undefined,
      maxUses: maxUses || undefined,
      usedCount: 0,
      validFrom: validFrom ? new Date(validFrom as any) : undefined,
      validUntil: validUntil ? new Date(validUntil as any) : undefined,
      applicableSessions: applicableSessions?.length ? applicableSessions : undefined,
      isActive,
      createdAt: now,
      updatedAt: now,
    };

    // Remove undefined values
    const cleanData = Object.fromEntries(
      Object.entries(couponData).filter(([_, v]) => v !== undefined)
    );

    const docRef = await adminDb.collection("coupons").add(cleanData);

    const coupon: Coupon = {
      id: docRef.id,
      ...couponData,
    };

    return NextResponse.json({
      success: true,
      data: coupon,
    });
  } catch (error) {
    console.error("Error creating coupon:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create coupon" },
      { status: 500 }
    );
  }
}
