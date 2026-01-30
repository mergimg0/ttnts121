import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import type { PaymentRecord } from "@/types/stripe";
import Stripe from "stripe";
import { verifyAdmin } from "@/lib/admin-auth";

export async function GET(request: NextRequest) {
  // Verify admin authentication
  const auth = await verifyAdmin(request);
  if (!auth.authenticated) return auth.error!;

  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '25'), 100);
    const startingAfter = searchParams.get('cursor') || undefined;
    const status = searchParams.get('status'); // succeeded, failed, pending

    const payments = await stripe.paymentIntents.list({
      limit,
      starting_after: startingAfter,
      expand: ['data.customer', 'data.latest_charge'],
    });

    // Filter by status if provided
    let filtered = payments.data;
    if (status) {
      filtered = filtered.filter(p => {
        if (status === 'failed') {
          return p.status === 'requires_payment_method' || p.status === 'canceled';
        }
        return p.status === status;
      });
    }

    const records: PaymentRecord[] = filtered.map(p => ({
      id: p.id,
      amount: p.amount,
      currency: p.currency,
      status: p.status as PaymentRecord['status'],
      customerEmail: typeof p.customer === 'object' && p.customer ? ((p.customer as Stripe.Customer).email ?? null) : null,
      customerName: typeof p.customer === 'object' && p.customer ? ((p.customer as Stripe.Customer).name ?? null) : null,
      description: p.description,
      created: p.created,
      stripeUrl: `https://dashboard.stripe.com/payments/${p.id}`,
      metadata: p.metadata as Record<string, string>,
    }));

    return NextResponse.json({
      success: true,
      data: records,
      hasMore: payments.has_more,
      nextCursor: payments.data[payments.data.length - 1]?.id,
    });
  } catch (error) {
    console.error('Stripe payments error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch payments' },
      { status: 500 }
    );
  }
}
