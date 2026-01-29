import { Timestamp } from "firebase/firestore";

// ============================================================================
// BLOCK BOOKING TYPES
// ============================================================================

export type BlockBookingStatus =
  | "active"
  | "exhausted"
  | "expired"
  | "refunded"
  | "cancelled";

/**
 * Record of a session used from a block booking
 */
export interface BlockBookingUsage {
  usedAt: Date | Timestamp;
  sessionDate: string; // "2026-01-20" format
  coachId?: string;
  coachName?: string;
  timetableSlotId?: string; // Link to timetable_slots if used
  notes?: string;
  deductedBy?: string; // Admin user ID who recorded usage
}

/**
 * Pre-paid block of sessions
 * Represents a package of sessions purchased upfront
 */
export interface BlockBooking {
  id: string;
  // Student info
  studentName: string;
  studentId?: string; // Link to child in users collection
  // Parent info
  parentName: string;
  parentEmail: string;
  parentPhone?: string;
  parentId?: string; // Link to users collection
  // Session tracking
  totalSessions: number;
  remainingSessions: number;
  // Usage history
  usageHistory: BlockBookingUsage[];
  // Payment info
  totalPaid: number; // in pence
  pricePerSession: number; // in pence (calculated or stored)
  paymentMethod?: "card" | "cash" | "bank_transfer" | "payment_link";
  stripePaymentIntentId?: string;
  stripeSessionId?: string;
  // Status
  status: BlockBookingStatus;
  // Dates
  purchasedAt: Date | Timestamp;
  expiresAt?: Date | Timestamp; // Optional expiry date
  // Metadata
  notes?: string;
  createdBy?: string; // Admin who created the booking
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
}

export type CreateBlockBookingInput = Omit<
  BlockBooking,
  | "id"
  | "remainingSessions"
  | "usageHistory"
  | "status"
  | "createdAt"
  | "updatedAt"
>;

export type UpdateBlockBookingInput = Partial<
  Omit<
    BlockBooking,
    "id" | "usageHistory" | "createdAt" | "totalSessions" | "purchasedAt"
  >
>;

// ============================================================================
// DEDUCTION TYPES
// ============================================================================

/**
 * Input for deducting a session from a block booking
 */
export interface DeductBlockSessionInput {
  blockBookingId: string;
  sessionDate: string; // "2026-01-20" format
  coachId?: string;
  coachName?: string;
  timetableSlotId?: string;
  notes?: string;
  deductedBy?: string; // Admin user ID who recorded usage
}

/**
 * Result of deducting a session
 */
export interface DeductBlockSessionResult {
  success: boolean;
  remainingSessions: number;
  newStatus: BlockBookingStatus;
  usage: BlockBookingUsage;
}

// ============================================================================
// REFUND TYPES
// ============================================================================

/**
 * Input for refunding unused sessions from a block booking
 */
export interface RefundBlockBookingInput {
  blockBookingId: string;
  sessionsToRefund?: number; // If not specified, refund all remaining
  refundAmount?: number; // In pence, if not specified, calculate from pricePerSession
  reason?: string;
}

/**
 * Result of refunding a block booking
 */
export interface RefundBlockBookingResult {
  success: boolean;
  sessionsRefunded: number;
  amountRefunded: number;
  newStatus: BlockBookingStatus;
  stripeRefundId?: string;
}

// ============================================================================
// VIEW/COMPUTED TYPES
// ============================================================================

/**
 * Summary view of a block booking for list display
 */
export interface BlockBookingSummary {
  id: string;
  studentName: string;
  parentName: string;
  parentEmail: string;
  totalSessions: number;
  remainingSessions: number;
  usedSessions: number;
  percentageUsed: number;
  status: BlockBookingStatus;
  totalPaid: number;
  pricePerSession: number;
  purchasedAt: Date | Timestamp;
  expiresAt?: Date | Timestamp;
  lastUsedAt?: Date | Timestamp;
  isExpiringSoon?: boolean; // Within 30 days
}

/**
 * Detailed view including usage history
 */
export interface BlockBookingDetail extends BlockBooking {
  usedSessions: number;
  percentageUsed: number;
  valueRemaining: number; // remainingSessions * pricePerSession
  isExpiringSoon: boolean;
  daysUntilExpiry?: number;
}

// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

export interface ListBlockBookingsParams {
  status?: BlockBookingStatus;
  studentName?: string;
  parentEmail?: string;
  hasRemaining?: boolean; // Only show bookings with remaining sessions
  sortBy?: "purchasedAt" | "remainingSessions" | "studentName";
  sortOrder?: "asc" | "desc";
  limit?: number;
  offset?: number;
}

export interface BlockBookingsListResponse {
  blockBookings: BlockBookingSummary[];
  total: number;
  hasMore: boolean;
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const BLOCK_BOOKING_STATUS_COLORS: Record<BlockBookingStatus, string> = {
  active: "bg-green-100 text-green-800",
  exhausted: "bg-gray-100 text-gray-800",
  expired: "bg-red-100 text-red-800",
  refunded: "bg-yellow-100 text-yellow-800",
  cancelled: "bg-red-100 text-red-800",
};

export const BLOCK_BOOKING_STATUS_LABELS: Record<BlockBookingStatus, string> = {
  active: "Active",
  exhausted: "All Used",
  expired: "Expired",
  refunded: "Refunded",
  cancelled: "Cancelled",
};

/**
 * Common block booking packages
 */
export const BLOCK_BOOKING_PACKAGES = [
  { sessions: 4, label: "4 Sessions" },
  { sessions: 8, label: "8 Sessions" },
  { sessions: 10, label: "10 Sessions" },
  { sessions: 12, label: "12 Sessions" },
];

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Calculate the status of a block booking based on its data
 */
export function calculateBlockBookingStatus(
  booking: Pick<
    BlockBooking,
    "remainingSessions" | "expiresAt" | "status"
  >
): BlockBookingStatus {
  // Don't change if already refunded or cancelled
  if (booking.status === "refunded" || booking.status === "cancelled") {
    return booking.status;
  }

  // Check if exhausted
  if (booking.remainingSessions <= 0) {
    return "exhausted";
  }

  // Check if expired
  if (booking.expiresAt) {
    const expiryDate =
      booking.expiresAt instanceof Date
        ? booking.expiresAt
        : booking.expiresAt.toDate();
    if (expiryDate < new Date()) {
      return "expired";
    }
  }

  return "active";
}

/**
 * Check if a block booking is expiring soon (within days)
 */
export function isBlockBookingExpiringSoon(
  expiresAt: Date | Timestamp | undefined,
  daysThreshold: number = 30
): boolean {
  if (!expiresAt) return false;

  const expiryDate =
    expiresAt instanceof Date ? expiresAt : expiresAt.toDate();
  const thresholdDate = new Date();
  thresholdDate.setDate(thresholdDate.getDate() + daysThreshold);

  return expiryDate <= thresholdDate && expiryDate > new Date();
}

/**
 * Format dates used for display (e.g., "20.1/ 27.1/")
 */
export function formatUsageDates(usageHistory: BlockBookingUsage[]): string {
  return usageHistory
    .map((usage) => {
      const date = new Date(usage.sessionDate);
      return `${date.getDate()}.${date.getMonth() + 1}/`;
    })
    .join(" ");
}
