// Payment types for multiple payment method support
import { Timestamp } from "firebase/firestore";

// Payment method types supported by the system
export type PaymentMethod = 'card' | 'cash' | 'bank_transfer' | 'payment_link';

// Payment status tracking
export type PaymentStatus = 'pending' | 'paid' | 'partial' | 'failed' | 'refunded';

// Individual payment record (supports partial payments)
export interface Payment {
  id: string;
  bookingId: string;
  amount: number; // in pence
  method: PaymentMethod;
  status: PaymentStatus;
  stripePaymentIntentId?: string;
  stripePaymentLinkId?: string;
  paymentLinkUrl?: string;
  notes?: string;
  recordedBy?: string; // admin who recorded manual payment (cash/bank_transfer)
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
}

// Payment link record stored in Firestore
export interface PaymentLink {
  id: string;
  bookingId?: string; // Optional - can be standalone payment link
  customerEmail: string;
  customerName?: string;
  amount: number; // in pence
  description: string;
  stripePaymentLinkId: string;
  stripePaymentLinkUrl: string;
  stripePriceId?: string;
  stripeProductId?: string;
  status: 'active' | 'completed' | 'expired' | 'cancelled';
  expiresAt?: Date | Timestamp;
  paidAt?: Date | Timestamp;
  metadata?: Record<string, string>;
  createdBy: string; // admin who created the link
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
}

// Form data for recording a manual payment
export interface RecordPaymentInput {
  bookingId: string;
  amount: number; // in pence
  method: 'cash' | 'bank_transfer';
  notes?: string;
  dateReceived?: Date | string;
}

// Form data for creating a payment link
export interface CreatePaymentLinkInput {
  customerEmail: string;
  customerName?: string;
  amount: number; // in pence
  description: string;
  bookingId?: string;
  expiryDays?: number; // Days until link expires (default: 7)
  metadata?: Record<string, string>;
}

// API response types
export interface PaymentLinkResponse {
  success: boolean;
  data?: PaymentLink;
  error?: string;
}

export interface PaymentLinksListResponse {
  success: boolean;
  data?: PaymentLink[];
  error?: string;
}

export interface RecordPaymentResponse {
  success: boolean;
  data?: Payment;
  error?: string;
}

// Payment history item for display
export interface PaymentHistoryItem {
  id: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  date: Date | Timestamp;
  recordedBy?: string;
  notes?: string;
  stripePaymentIntentId?: string;
  stripePaymentLinkId?: string;
}

// Payment summary for a booking
export interface BookingPaymentSummary {
  totalAmount: number; // Total booking amount in pence
  paidAmount: number; // Total paid so far in pence
  pendingAmount: number; // Remaining amount in pence
  payments: PaymentHistoryItem[];
  status: 'unpaid' | 'partial' | 'paid' | 'overpaid';
}
