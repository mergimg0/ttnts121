import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import type { RefundRecord } from "@/types/stripe";
import Stripe from "stripe";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '25'), 100);

    const refunds = await stripe.refunds.list({
      limit,
      expand: ['data.payment_intent'],
    });

    const records: RefundRecord[] = refunds.data.map(r => {
      const pi = r.payment_intent as Stripe.PaymentIntent | null;
      const customer = pi?.customer as Stripe.Customer | null;

      return {
        id: r.id,
        paymentIntentId: typeof r.payment_intent === 'string' ? r.payment_intent : pi?.id || null,
        amount: r.amount,
        currency: r.currency,
        status: r.status as RefundRecord['status'],
        reason: r.reason,
        created: r.created,
        customerEmail: customer?.email || null,
      };
    });

    return NextResponse.json({ success: true, data: records });
  } catch (error) {
    console.error('Stripe refunds error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch refunds' },
      { status: 500 }
    );
  }
}
