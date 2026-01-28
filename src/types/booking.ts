import { Timestamp } from "firebase/firestore";
import { InstallmentSchedule } from "./payment-plan";
import { BookingOption } from "./session-option";

// Program - A category of sessions (e.g., "After School Club - Spring 2024")
export interface Program {
  id: string;
  name: string;
  description: string;
  location: string;
  serviceType: "after-school" | "group-session" | "half-term" | "one-to-one" | "birthday-party";
  dateRange: {
    start: Date | Timestamp;
    end: Date | Timestamp;
  };
  isActive: boolean;
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
}

// Session - Individual bookable time slot within a program
export interface Session {
  id: string;
  programId: string;
  name: string;
  description: string;
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  daysOfWeek?: number[]; // Multi-day support [1, 3] = Mon, Wed
  startTime: string; // "15:30"
  endTime: string; // "16:30"
  startDate: Date | Timestamp;
  endDate: Date | Timestamp;
  location: string;
  ageMin: number;
  ageMax: number;
  price: number; // in pence
  capacity: number;
  enrolled: number;
  waitlistEnabled: boolean;
  isActive: boolean;
  // Availability controls
  lowStockThreshold?: number; // Default: 3, show "X spots left" badge when <= this
  isForceClosed?: boolean; // Manual "Sold Out" toggle regardless of capacity
  // Deposit settings
  depositEnabled?: boolean; // Allow partial payment via deposit
  depositAmount?: number; // Fixed deposit amount in pence
  depositPercentage?: number; // Or percentage of price (e.g., 25 = 25%)
  balanceDueDays?: number; // Days before session start when balance is due
  // Coach assignments
  coaches?: string[]; // User IDs of assigned coaches
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
}

// Secondary parent/guardian for pickup authorization and email notifications
export interface SecondaryParent {
  name: string;
  email?: string;
  phone: string;
  relationship: string; // e.g., "Father", "Grandmother", "Authorized Pickup"
  canPickup: boolean;
  receiveEmails: boolean;
}

// Booking - A parent's registration for a session
export interface Booking {
  id: string;
  sessionId: string;
  sessionIds?: string[]; // For multi-session bookings
  programId?: string;
  // Child info
  childFirstName: string;
  childLastName: string;
  childDOB: Date | Timestamp;
  ageGroup: string;
  medicalConditions?: string;
  // Parent info
  parentFirstName: string;
  parentLastName: string;
  parentEmail: string;
  parentPhone: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship?: string;
  };
  // Secondary parent/guardian (optional)
  secondaryParent?: SecondaryParent;
  // Payment
  paymentStatus: "pending" | "paid" | "failed" | "refunded" | "partially_refunded" | "expired" | "deposit_paid";
  paymentMethod?: string;
  stripePaymentIntentId?: string;
  stripePaymentId?: string; // Payment intent ID for refund lookups
  stripeSessionId?: string;
  amount: number; // in pence (total amount)
  // Deposit/Partial Payment tracking
  paymentType?: "full" | "deposit"; // How the customer chose to pay
  depositPaid?: number; // Amount paid as deposit in pence
  balanceDue?: number; // Remaining balance in pence
  balanceDueDate?: Date | Timestamp; // When the remaining balance is due
  balancePaidAt?: Date | Timestamp; // When the balance was paid
  balanceStripeSessionId?: string; // Stripe session ID for balance payment
  balanceReminderSent?: boolean; // Whether balance reminder email was sent
  // Payment Plan / Installments
  paymentPlanId?: string; // Reference to the payment plan used
  installmentSchedule?: InstallmentSchedule[]; // Array of scheduled installments
  // Refund tracking
  refundedAmount?: number; // in pence
  refundedAt?: Date | Timestamp;
  failureReason?: string; // Payment failure reason from Stripe
  // Consent
  photoConsent?: boolean;
  termsAccepted?: boolean;
  marketingConsent?: boolean;
  // Guardian Declaration
  guardianDeclaration?: {
    accepted: boolean;
    signature: string;
    childrenNames: string[];
    ipAddress?: string;
    userAgent?: string;
    acceptedAt: Date | Timestamp;
  };
  // Transfer tracking
  transferredFrom?: string; // Original session ID before transfer
  transferredAt?: Date | Timestamp;
  transferPriceDifference?: number; // in pence, positive = upgrade, negative = downgrade
  // Session options (add-ons)
  sessionOptions?: BookingOption[]; // Selected add-ons for this booking
  optionsTotal?: number; // Total price of all options in pence
  // Cancellation tracking
  cancellationReason?: string;
  cancelledAt?: Date | Timestamp;
  cancelledBy?: "customer" | "admin";
  cancellationRefundAmount?: number; // in pence - refund issued for cancellation
  cancellationRefundStatus?: "pending" | "processed" | "failed" | "none";
  refundPolicyId?: string; // Reference to the policy used
  cancellationStripeRefundId?: string;
  // Metadata
  bookingRef: string;
  status?: "confirmed" | "cancelled" | "waitlist";
  createdAt: Date | Timestamp;
  updatedAt?: Date | Timestamp;
}

// Waitlist entry
export interface WaitlistEntry {
  id: string;
  sessionId: string;
  // Child info
  childFirstName: string;
  childLastName: string;
  ageGroup: string;
  // Parent info
  parentFirstName: string;
  parentLastName: string;
  parentEmail: string;
  parentPhone?: string;
  // Status
  position?: number;
  notifiedAt?: Date | Timestamp;
  expiresAt?: Date | Timestamp;
  status: "waiting" | "notified" | "expired" | "converted";
  createdAt: Date | Timestamp;
}

// Cart item for frontend state
export interface CartItem {
  sessionId: string;
  sessionName: string;
  programId: string;
  programName: string;
  price: number;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  ageMin: number;
  ageMax: number;
  addedAt: Date;
}

// Admin user
export interface AdminUser {
  uid: string;
  email: string;
  displayName?: string;
  role: "admin" | "super-admin";
  createdAt: Date | Timestamp;
}

// Form data types for creating/updating
export type CreateProgramInput = Omit<Program, "id" | "createdAt" | "updatedAt">;
export type UpdateProgramInput = Partial<CreateProgramInput>;

export type CreateSessionInput = Omit<Session, "id" | "enrolled" | "createdAt" | "updatedAt">;
export type UpdateSessionInput = Partial<CreateSessionInput>;

export type CreateBookingInput = Omit<
  Booking,
  "id" | "bookingRef" | "status" | "paymentStatus" | "createdAt" | "updatedAt"
>;

// API response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Filter types for sessions
export interface SessionFilters {
  location?: string;
  ageGroup?: string;
  dateFrom?: string;
  dateTo?: string;
  timeOfDay?: "morning" | "afternoon" | "evening";
  serviceType?: string;
}

// QR Code for booking check-in
export interface BookingQRCode {
  childIndex: number;
  childName: string;
  qrCodeUrl: string;
  generatedAt: Date | Timestamp;
}

// Stats for admin dashboard
export interface DashboardStats {
  totalBookings: number;
  totalRevenue: number;
  upcomingSessions: number;
  waitlistCount: number;
  recentBookings: Booking[];
}

// Guardian declaration for legal compliance
export interface GuardianDeclaration {
  accepted: boolean;
  signature: string; // typed name
  childrenNames: string[];
  ipAddress?: string;
  userAgent?: string;
  acceptedAt: Date;
}
