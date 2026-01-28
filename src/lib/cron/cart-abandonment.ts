import { getCartsForRecoveryEmail, markRecoveryEmailSent } from "@/lib/cart-tracking";
import { sendEmail } from "@/lib/email";
import { cartAbandonmentRecoveryEmail } from "@/lib/email-templates";
import { formatPrice, getDayName, toDate } from "@/lib/booking-utils";
import { AbandonedCart } from "@/types/abandoned-cart";

export interface CartAbandonmentResult {
  processed: number;
  emailsSent: number;
  errors: number;
  details: Array<{
    cartId: string;
    email: string;
    success: boolean;
    error?: string;
  }>;
}

/**
 * Process abandoned carts and send recovery emails
 * This function should be called by a cron job or scheduled function
 *
 * Finds carts that have been abandoned for at least 1 hour
 * and haven't received a recovery email yet
 */
export async function processAbandonedCarts(): Promise<CartAbandonmentResult> {
  const result: CartAbandonmentResult = {
    processed: 0,
    emailsSent: 0,
    errors: 0,
    details: [],
  };

  try {
    // Get carts that need recovery emails
    const carts = await getCartsForRecoveryEmail();
    result.processed = carts.length;

    console.log(`Processing ${carts.length} abandoned carts`);

    for (const cart of carts) {
      try {
        await sendRecoveryEmailForCart(cart);
        await markRecoveryEmailSent(cart.id);

        result.emailsSent++;
        result.details.push({
          cartId: cart.id,
          email: cart.email,
          success: true,
        });
      } catch (error) {
        console.error(`Error processing cart ${cart.id}:`, error);
        result.errors++;
        result.details.push({
          cartId: cart.id,
          email: cart.email,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }
  } catch (error) {
    console.error("Error in processAbandonedCarts:", error);
    throw error;
  }

  return result;
}

/**
 * Send a recovery email for a specific cart
 */
async function sendRecoveryEmailForCart(cart: AbandonedCart): Promise<void> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://ttnts.co.uk";
  const recoveryLink = `${baseUrl}/recover-cart/${cart.recoveryToken}`;

  // Format cart items for email
  const items = cart.items.map((item) => ({
    sessionName: item.sessionName,
    programName: item.programName,
    dayOfWeek: getDayName(item.dayOfWeek),
    startTime: item.startTime,
    price: formatPrice(item.price),
  }));

  // Format expiry date
  const expiresAt = toDate(cart.expiresAt);
  const expiresAtFormatted = expiresAt.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  // Generate email content
  const emailContent = cartAbandonmentRecoveryEmail({
    customerName: cart.customerName || cart.customerDetails?.parentFirstName,
    items,
    totalAmount: formatPrice(cart.totalAmount),
    recoveryLink,
    expiresAt: expiresAtFormatted,
  });

  // Send the email
  const result = await sendEmail({
    to: cart.email,
    subject: emailContent.subject,
    html: emailContent.html,
  });

  if (!result.success) {
    throw new Error(`Failed to send email: ${result.error}`);
  }
}

/**
 * Get summary statistics for cart abandonment
 */
export async function getAbandonmentStats(): Promise<{
  pendingRecoveryEmails: number;
}> {
  const carts = await getCartsForRecoveryEmail();
  return {
    pendingRecoveryEmails: carts.length,
  };
}
