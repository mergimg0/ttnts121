import { NextRequest, NextResponse } from "next/server";
import { processAbandonedCarts } from "@/lib/cron/cart-abandonment";

/**
 * Cron job endpoint to process abandoned carts
 *
 * This endpoint should be called by an external cron service (e.g., Vercel Cron, GitHub Actions)
 * Protected by a secret to prevent unauthorized access
 *
 * Example cron schedule: Every 15 minutes
 * curl -X POST https://your-domain.com/api/cron/abandoned-carts \
 *   -H "Authorization: Bearer YOUR_CRON_SECRET"
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authorization
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    // If CRON_SECRET is set, require authorization
    if (cronSecret) {
      if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json(
          { success: false, error: "Unauthorized" },
          { status: 401 }
        );
      }
    }

    console.log("Starting abandoned cart processing...");

    const result = await processAbandonedCarts();

    console.log(`Abandoned cart processing complete:`, result);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Error in abandoned carts cron:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process abandoned carts" },
      { status: 500 }
    );
  }
}

// Also allow GET for easier testing (with same auth)
export async function GET(request: NextRequest) {
  return POST(request);
}
