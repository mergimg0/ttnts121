import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("Missing STRIPE_SECRET_KEY environment variable");
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-12-15.clover",
  typescript: true,
});

// Client-side Stripe initialization helper
export function getStripePublishableKey(): string {
  const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  if (!key) {
    throw new Error("Missing NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY");
  }
  return key;
}

// Payment Link types
export interface CreatePaymentLinkParams {
  amount: number; // in pence
  description: string;
  customerEmail: string;
  metadata?: Record<string, string>;
  expiresAfterDays?: number;
}

export interface PaymentLinkResult {
  paymentLinkId: string;
  paymentLinkUrl: string;
  priceId: string;
  productId: string;
}

/**
 * Create a Stripe Payment Link for custom amounts
 * Uses one-time prices with ad-hoc product creation
 */
export async function createPaymentLink(
  params: CreatePaymentLinkParams
): Promise<PaymentLinkResult> {
  const { amount, description, customerEmail, metadata = {}, expiresAfterDays } = params;

  // Create a one-time product for this payment
  const product = await stripe.products.create({
    name: description,
    metadata: {
      ...metadata,
      customerEmail,
      type: 'payment_link',
    },
  });

  // Create a one-time price for the product
  const price = await stripe.prices.create({
    product: product.id,
    unit_amount: amount,
    currency: 'gbp',
  });

  // Calculate expiration if specified
  const paymentLinkParams: Stripe.PaymentLinkCreateParams = {
    line_items: [
      {
        price: price.id,
        quantity: 1,
      },
    ],
    metadata: {
      ...metadata,
      customerEmail,
      productId: product.id,
      priceId: price.id,
    },
    // Collect customer email for receipts
    invoice_creation: {
      enabled: true,
    },
    // Allow promotion codes
    allow_promotion_codes: false,
  };

  // Add expiration if specified
  if (expiresAfterDays && expiresAfterDays > 0) {
    const expiresAt = Math.floor(Date.now() / 1000) + (expiresAfterDays * 24 * 60 * 60);
    paymentLinkParams.restrictions = {
      completed_sessions: {
        limit: 1,
      },
    };
    // Note: Payment Links don't have built-in expiration, but we can deactivate them manually
    // The expiresAt is stored in our database for manual deactivation via cron
  }

  // Create the payment link
  const paymentLink = await stripe.paymentLinks.create(paymentLinkParams);

  return {
    paymentLinkId: paymentLink.id,
    paymentLinkUrl: paymentLink.url,
    priceId: price.id,
    productId: product.id,
  };
}

/**
 * Deactivate a Stripe Payment Link
 */
export async function deactivatePaymentLink(paymentLinkId: string): Promise<void> {
  await stripe.paymentLinks.update(paymentLinkId, {
    active: false,
  });
}

/**
 * Get Payment Link details from Stripe
 */
export async function getPaymentLink(paymentLinkId: string): Promise<Stripe.PaymentLink> {
  return await stripe.paymentLinks.retrieve(paymentLinkId);
}
