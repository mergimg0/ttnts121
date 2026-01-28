import { Timestamp } from "firebase/firestore";

// Payment Plan - A template for installment payments
export interface PaymentPlan {
  id: string;
  name: string;
  description?: string;
  installmentCount: number; // e.g., 3 for 3 payments
  intervalDays: number; // Days between payments
  sessionIds?: string[]; // Empty = applies to all sessions
  minPurchaseAmount?: number; // Minimum cart total in pence to qualify
  isActive: boolean;
  createdAt: Date | Timestamp;
  updatedAt?: Date | Timestamp;
}

// Installment Schedule - Individual payment within a booking's payment plan
export interface InstallmentSchedule {
  installmentNumber: number;
  amount: number; // in pence
  dueDate: Date | Timestamp;
  paidAt?: Date | Timestamp;
  stripePaymentIntentId?: string;
  status: "pending" | "paid" | "failed" | "overdue";
  failureReason?: string;
  retryCount?: number;
  lastRetryAt?: Date | Timestamp;
}

// Input types for API operations
export type CreatePaymentPlanInput = Omit<PaymentPlan, "id" | "createdAt" | "updatedAt">;
export type UpdatePaymentPlanInput = Partial<CreatePaymentPlanInput>;

// API response for payment plan operations
export interface PaymentPlanResponse {
  success: boolean;
  data?: PaymentPlan;
  error?: string;
}

export interface PaymentPlansListResponse {
  success: boolean;
  data?: PaymentPlan[];
  error?: string;
}

// Installment billing result from cron job
export interface InstallmentBillingResult {
  processed: number;
  successful: number;
  failed: number;
  errors: Array<{
    bookingId: string;
    installmentNumber: number;
    error: string;
  }>;
}

// Helper type for checkout flow
export interface PaymentPlanOption {
  plan: PaymentPlan;
  firstPayment: number; // Amount of first installment in pence
  remainingPayments: number; // Number of remaining payments
  remainingAmount: number; // Total remaining after first payment
  installmentAmount: number; // Amount per remaining installment
}
