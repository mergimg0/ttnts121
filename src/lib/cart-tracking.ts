import { adminDb } from "./firebase-admin";
import { AbandonedCart, TrackCartInput, CartRecoveryMetrics, CartRecoveryData } from "@/types/abandoned-cart";
import { CartItem } from "@/types/booking";
import crypto from "crypto";

const COLLECTION_NAME = "abandoned_carts";
const CART_EXPIRY_DAYS = 7;
const ABANDONMENT_THRESHOLD_MS = 60 * 60 * 1000; // 1 hour

/**
 * Generate a unique recovery token
 */
export function generateRecoveryToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Track a cart update - creates or updates an abandoned cart record
 */
export async function trackCartUpdate(input: TrackCartInput): Promise<string> {
  const { email, items, customerName, customerDetails } = input;

  if (!email || !items.length) {
    throw new Error("Email and items are required");
  }

  const normalizedEmail = email.toLowerCase().trim();
  const totalAmount = items.reduce((sum, item) => sum + item.price, 0);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + CART_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

  // Check for existing cart with this email that isn't recovered
  const existingQuery = await adminDb
    .collection(COLLECTION_NAME)
    .where("email", "==", normalizedEmail)
    .where("recovered", "==", false)
    .orderBy("createdAt", "desc")
    .limit(1)
    .get();

  if (!existingQuery.empty) {
    // Update existing cart
    const existingDoc = existingQuery.docs[0];
    await existingDoc.ref.update({
      items,
      totalAmount,
      customerName: customerName || existingDoc.data().customerName,
      customerDetails: customerDetails || existingDoc.data().customerDetails,
      updatedAt: now,
      expiresAt,
    });
    return existingDoc.id;
  }

  // Create new cart
  const recoveryToken = generateRecoveryToken();
  const cartData: Omit<AbandonedCart, "id"> = {
    email: normalizedEmail,
    customerName,
    items,
    totalAmount,
    createdAt: now,
    updatedAt: now,
    recoveryEmailSent: false,
    recovered: false,
    recoveryToken,
    expiresAt,
    customerDetails,
  };

  const docRef = await adminDb.collection(COLLECTION_NAME).add(cartData);
  return docRef.id;
}

/**
 * Mark a cart as abandoned (called by cron job)
 * Returns true if cart should receive recovery email
 */
export async function markCartAbandoned(cartId: string): Promise<boolean> {
  const cartRef = adminDb.collection(COLLECTION_NAME).doc(cartId);
  const cartDoc = await cartRef.get();

  if (!cartDoc.exists) {
    return false;
  }

  const cartData = cartDoc.data() as AbandonedCart;

  // Already recovered or already sent email
  if (cartData.recovered || cartData.recoveryEmailSent) {
    return false;
  }

  // Check if cart has been abandoned long enough
  const updatedAt = cartData.updatedAt instanceof Date
    ? cartData.updatedAt
    : (cartData.updatedAt as any).toDate();

  const timeSinceUpdate = Date.now() - updatedAt.getTime();

  return timeSinceUpdate >= ABANDONMENT_THRESHOLD_MS;
}

/**
 * Mark a cart as recovered (called when booking is completed)
 */
export async function markCartRecovered(cartId: string): Promise<void> {
  const cartRef = adminDb.collection(COLLECTION_NAME).doc(cartId);

  await cartRef.update({
    recovered: true,
    recoveredAt: new Date(),
    updatedAt: new Date(),
  });
}

/**
 * Mark a cart as recovered by email (called when booking is completed)
 */
export async function markCartRecoveredByEmail(email: string): Promise<void> {
  const normalizedEmail = email.toLowerCase().trim();

  const cartsQuery = await adminDb
    .collection(COLLECTION_NAME)
    .where("email", "==", normalizedEmail)
    .where("recovered", "==", false)
    .get();

  const batch = adminDb.batch();
  const now = new Date();

  cartsQuery.docs.forEach((doc) => {
    batch.update(doc.ref, {
      recovered: true,
      recoveredAt: now,
      updatedAt: now,
    });
  });

  await batch.commit();
}

/**
 * Mark recovery email as sent
 */
export async function markRecoveryEmailSent(cartId: string): Promise<void> {
  const cartRef = adminDb.collection(COLLECTION_NAME).doc(cartId);

  await cartRef.update({
    recoveryEmailSent: true,
    recoveryEmailSentAt: new Date(),
    updatedAt: new Date(),
  });
}

/**
 * Get cart by recovery token
 */
export async function getCartByRecoveryToken(token: string): Promise<CartRecoveryData | null> {
  const cartsQuery = await adminDb
    .collection(COLLECTION_NAME)
    .where("recoveryToken", "==", token)
    .limit(1)
    .get();

  if (cartsQuery.empty) {
    return null;
  }

  const cartDoc = cartsQuery.docs[0];
  const cartData = cartDoc.data() as AbandonedCart;

  // Check if expired
  const expiresAt = cartData.expiresAt instanceof Date
    ? cartData.expiresAt
    : (cartData.expiresAt as any).toDate();

  if (expiresAt < new Date()) {
    return null;
  }

  // Check if already recovered
  if (cartData.recovered) {
    return null;
  }

  return {
    cartId: cartDoc.id,
    items: cartData.items,
    customerDetails: cartData.customerDetails,
    expiresAt,
  };
}

/**
 * Get abandoned carts ready for recovery email
 * Returns carts that have been abandoned for at least 1 hour and haven't received email
 */
export async function getCartsForRecoveryEmail(): Promise<AbandonedCart[]> {
  const thresholdTime = new Date(Date.now() - ABANDONMENT_THRESHOLD_MS);
  const now = new Date();

  const cartsQuery = await adminDb
    .collection(COLLECTION_NAME)
    .where("recoveryEmailSent", "==", false)
    .where("recovered", "==", false)
    .where("updatedAt", "<=", thresholdTime)
    .where("expiresAt", ">", now)
    .get();

  return cartsQuery.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as AbandonedCart[];
}

/**
 * Get abandoned cart by ID
 */
export async function getAbandonedCartById(cartId: string): Promise<AbandonedCart | null> {
  const cartDoc = await adminDb.collection(COLLECTION_NAME).doc(cartId).get();

  if (!cartDoc.exists) {
    return null;
  }

  return {
    id: cartDoc.id,
    ...cartDoc.data(),
  } as AbandonedCart;
}

/**
 * Get all abandoned carts for admin dashboard
 */
export async function getAbandonedCarts(options: {
  status?: "pending" | "email_sent" | "recovered" | "all";
  limit?: number;
  daysBack?: number;
}): Promise<AbandonedCart[]> {
  const { status = "all", limit = 100, daysBack = 30 } = options;
  const cutoffDate = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000);

  let query = adminDb
    .collection(COLLECTION_NAME)
    .where("createdAt", ">=", cutoffDate)
    .orderBy("createdAt", "desc");

  if (status === "pending") {
    query = query.where("recoveryEmailSent", "==", false).where("recovered", "==", false);
  } else if (status === "email_sent") {
    query = query.where("recoveryEmailSent", "==", true).where("recovered", "==", false);
  } else if (status === "recovered") {
    query = query.where("recovered", "==", true);
  }

  const snapshot = await query.limit(limit).get();

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as AbandonedCart[];
}

/**
 * Calculate recovery metrics for admin dashboard
 */
export async function getCartRecoveryMetrics(daysBack: number = 30): Promise<CartRecoveryMetrics> {
  const cutoffDate = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000);

  const allCartsQuery = await adminDb
    .collection(COLLECTION_NAME)
    .where("createdAt", ">=", cutoffDate)
    .get();

  const carts = allCartsQuery.docs.map((doc) => doc.data() as AbandonedCart);

  const totalAbandoned = carts.length;
  const emailsSent = carts.filter((c) => c.recoveryEmailSent).length;
  const recovered = carts.filter((c) => c.recovered).length;
  const revenueAbandoned = carts.reduce((sum, c) => sum + c.totalAmount, 0);
  const revenueRecovered = carts
    .filter((c) => c.recovered)
    .reduce((sum, c) => sum + c.totalAmount, 0);

  return {
    totalAbandoned,
    emailsSent,
    recovered,
    recoveryRate: totalAbandoned > 0 ? (recovered / totalAbandoned) * 100 : 0,
    revenueAbandoned,
    revenueRecovered,
    averageCartValue: totalAbandoned > 0 ? revenueAbandoned / totalAbandoned : 0,
  };
}

/**
 * Delete a cart (for cleanup)
 */
export async function deleteAbandonedCart(cartId: string): Promise<void> {
  await adminDb.collection(COLLECTION_NAME).doc(cartId).delete();
}

/**
 * Clear cart by email (when user completes checkout)
 */
export async function clearCartByEmail(email: string): Promise<void> {
  const normalizedEmail = email.toLowerCase().trim();

  const cartsQuery = await adminDb
    .collection(COLLECTION_NAME)
    .where("email", "==", normalizedEmail)
    .where("recovered", "==", false)
    .get();

  const batch = adminDb.batch();
  cartsQuery.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });

  await batch.commit();
}
