import { Timestamp } from "firebase/firestore";
import { CartItem } from "./booking";

// Abandoned cart stored in Firestore
export interface AbandonedCart {
  id: string;
  email: string;
  customerName?: string;
  items: CartItem[];
  totalAmount: number; // in pence
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
  recoveryEmailSent: boolean;
  recoveryEmailSentAt?: Date | Timestamp;
  recovered: boolean;
  recoveredAt?: Date | Timestamp;
  recoveryToken: string; // unique token for recovery link
  expiresAt: Date | Timestamp; // 7 days from creation
  // Optional customer details captured during checkout
  customerDetails?: {
    parentFirstName?: string;
    parentLastName?: string;
    parentPhone?: string;
    childFirstName?: string;
    childLastName?: string;
  };
}

// Status filter options for admin dashboard
export type AbandonedCartStatus = "pending" | "email_sent" | "recovered" | "expired";

// Metrics for admin dashboard
export interface CartRecoveryMetrics {
  totalAbandoned: number;
  emailsSent: number;
  recovered: number;
  recoveryRate: number; // percentage
  revenueAbandoned: number; // total value of abandoned carts in pence
  revenueRecovered: number; // total value recovered in pence
  averageCartValue: number; // in pence
}

// Input for tracking cart updates
export interface TrackCartInput {
  email: string;
  items: CartItem[];
  customerName?: string;
  customerDetails?: AbandonedCart["customerDetails"];
}

// Recovery link data
export interface CartRecoveryData {
  cartId: string;
  items: CartItem[];
  customerDetails?: AbandonedCart["customerDetails"];
  expiresAt: Date;
}

// API response for abandoned carts list
export interface AbandonedCartsListResponse {
  carts: AbandonedCart[];
  metrics: CartRecoveryMetrics;
  total: number;
}
