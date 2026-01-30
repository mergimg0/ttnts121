import { NextRequest, NextResponse } from "next/server";
import { getAbandonedCarts, getCartRecoveryMetrics } from "@/lib/cart-tracking";
import { verifyAdmin } from "@/lib/admin-auth";
import { AbandonedCartsListResponse } from "@/types/abandoned-cart";

type CartStatusFilter = "pending" | "email_sent" | "recovered" | "all";

export async function GET(request: NextRequest) {
  const auth = await verifyAdmin(request);
  if (!auth.authenticated) return auth.error!;

  try {
    const searchParams = request.nextUrl.searchParams;
    const rawStatus = searchParams.get("status") || "all";
    // Map "expired" to "all" since expired is computed client-side
    const status: CartStatusFilter = rawStatus === "expired" ? "all" : rawStatus as CartStatusFilter;
    const limit = parseInt(searchParams.get("limit") || "100", 10);
    const daysBack = parseInt(searchParams.get("days") || "30", 10);

    const [carts, metrics] = await Promise.all([
      getAbandonedCarts({ status, limit, daysBack }),
      getCartRecoveryMetrics(daysBack),
    ]);

    const response: AbandonedCartsListResponse = {
      carts,
      metrics,
      total: carts.length,
    };

    return NextResponse.json({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error("Error fetching abandoned carts:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch abandoned carts" },
      { status: 500 }
    );
  }
}
