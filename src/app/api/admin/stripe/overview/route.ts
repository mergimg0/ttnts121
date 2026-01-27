import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { unstable_cache } from "next/cache";
import type { RevenueMetrics, PaymentRecord, FailedPayment, RefundRecord } from "@/types/stripe";
import Stripe from "stripe";

// Cache revenue calculation for 5 minutes
const getRevenueMetrics = unstable_cache(
  async (): Promise<RevenueMetrics> => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfYesterday = new Date(startOfToday);
    startOfYesterday.setDate(startOfYesterday.getDate() - 1);

    const startOfWeek = new Date(now);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const startOfLastWeek = new Date(startOfWeek);
    startOfLastWeek.setDate(startOfLastWeek.getDate() - 7);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    // Get balance transactions for accurate revenue
    const [todayTxns, yesterdayTxns, weekTxns, lastWeekTxns, monthTxns, lastMonthTxns, allTimeTxns] = await Promise.all([
      stripe.balanceTransactions.list({
        created: { gte: Math.floor(startOfToday.getTime() / 1000) },
        type: 'charge',
        limit: 100,
      }),
      stripe.balanceTransactions.list({
        created: {
          gte: Math.floor(startOfYesterday.getTime() / 1000),
          lt: Math.floor(startOfToday.getTime() / 1000),
        },
        type: 'charge',
        limit: 100,
      }),
      stripe.balanceTransactions.list({
        created: { gte: Math.floor(startOfWeek.getTime() / 1000) },
        type: 'charge',
        limit: 100,
      }),
      stripe.balanceTransactions.list({
        created: {
          gte: Math.floor(startOfLastWeek.getTime() / 1000),
          lt: Math.floor(startOfWeek.getTime() / 1000),
        },
        type: 'charge',
        limit: 100,
      }),
      stripe.balanceTransactions.list({
        created: { gte: Math.floor(startOfMonth.getTime() / 1000) },
        type: 'charge',
        limit: 100,
      }),
      stripe.balanceTransactions.list({
        created: {
          gte: Math.floor(startOfLastMonth.getTime() / 1000),
          lt: Math.floor(endOfLastMonth.getTime() / 1000),
        },
        type: 'charge',
        limit: 100,
      }),
      stripe.balanceTransactions.list({
        type: 'charge',
        limit: 100,
      }),
    ]);

    // Calculate totals (net amounts to account for fees)
    const sumNet = (txns: Stripe.ApiList<Stripe.BalanceTransaction>) =>
      txns.data.reduce((sum, t) => sum + t.net, 0);

    const todayTotal = sumNet(todayTxns);
    const yesterdayTotal = sumNet(yesterdayTxns);
    const weekTotal = sumNet(weekTxns);
    const lastWeekTotal = sumNet(lastWeekTxns);
    const monthTotal = sumNet(monthTxns);
    const lastMonthTotal = sumNet(lastMonthTxns);

    // Calculate percentage changes
    const calcChange = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 100);
    };

    return {
      today: todayTotal,
      thisWeek: weekTotal,
      thisMonth: monthTotal,
      allTime: sumNet(allTimeTxns),
      paymentCount: monthTxns.data.length,
      periodComparison: {
        daily: calcChange(todayTotal, yesterdayTotal),
        weekly: calcChange(weekTotal, lastWeekTotal),
        monthly: calcChange(monthTotal, lastMonthTotal),
      },
    };
  },
  ['stripe-revenue'],
  { revalidate: 300 } // 5 minutes
);

export async function GET() {
  try {
    const [revenue, payments, refunds] = await Promise.all([
      getRevenueMetrics(),
      stripe.paymentIntents.list({
        limit: 15,
        expand: ['data.customer', 'data.latest_charge'],
      }),
      stripe.refunds.list({
        limit: 5,
        expand: ['data.payment_intent']
      }),
    ]);

    // Transform successful payments
    const recentPayments: PaymentRecord[] = payments.data
      .filter(p => p.status === 'succeeded')
      .slice(0, 10)
      .map(p => ({
        id: p.id,
        amount: p.amount,
        currency: p.currency,
        status: p.status as PaymentRecord['status'],
        customerEmail: typeof p.customer === 'object' && p.customer && 'email' in p.customer ? (p.customer.email ?? null) : null,
        customerName: typeof p.customer === 'object' && p.customer && 'name' in p.customer ? (p.customer.name ?? null) : null,
        description: p.description,
        created: p.created,
        stripeUrl: `https://dashboard.stripe.com/payments/${p.id}`,
        metadata: p.metadata as Record<string, string>,
      }));

    // Transform failed payments
    const failedPayments: FailedPayment[] = payments.data
      .filter(p => p.status === 'requires_payment_method' || p.status === 'canceled')
      .slice(0, 5)
      .map(p => {
        const charge = p.latest_charge as Stripe.Charge | null;
        return {
          id: p.id,
          amount: p.amount,
          currency: p.currency,
          status: p.status as PaymentRecord['status'],
          customerEmail: typeof p.customer === 'object' && p.customer && 'email' in p.customer ? (p.customer.email ?? null) : null,
          customerName: typeof p.customer === 'object' && p.customer && 'name' in p.customer ? (p.customer.name ?? null) : null,
          description: p.description,
          created: p.created,
          stripeUrl: `https://dashboard.stripe.com/payments/${p.id}`,
          metadata: p.metadata as Record<string, string>,
          failureCode: charge?.failure_code || null,
          failureMessage: charge?.failure_message || null,
          lastAttempt: p.created,
        };
      });

    // Transform refunds
    const recentRefunds: RefundRecord[] = refunds.data.map(r => {
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

    return NextResponse.json({
      success: true,
      data: { revenue, recentPayments, failedPayments, recentRefunds },
    });
  } catch (error) {
    console.error('Stripe overview error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch Stripe data' },
      { status: 500 }
    );
  }
}
