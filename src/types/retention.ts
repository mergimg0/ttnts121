import { Timestamp } from "firebase/firestore";

// ============================================================================
// LOST CUSTOMER TYPES
// ============================================================================

export type LostCustomerStatus =
  | "lost"
  | "follow_up_scheduled"
  | "contacted"
  | "returning"
  | "returned"
  | "declined";

export type ContactMethod = "call" | "email" | "text" | "whatsapp" | "in_person";

export type LostReason =
  | "schedule_conflict"
  | "cost"
  | "moved_away"
  | "lost_interest"
  | "joined_team"
  | "school_commitments"
  | "health_injury"
  | "other"
  | "unknown";

export type FollowUpOutcome =
  | "no_answer"
  | "left_message"
  | "spoke"
  | "scheduled_return"
  | "declined"
  | "needs_follow_up";

// ============================================================================
// FOLLOW-UP TRACKING
// ============================================================================

/**
 * Individual follow-up attempt record
 */
export interface FollowUpEntry {
  id: string;
  date: Date | Timestamp;
  method: ContactMethod;
  notes: string;
  contactedBy: string; // Admin user ID
  contactedByName?: string;
  outcome: FollowUpOutcome;
  nextFollowUpDate?: string; // If needs follow-up
}

// ============================================================================
// LOST CUSTOMER TYPES
// ============================================================================

/**
 * Former customer tracking for retention
 */
export interface LostCustomer {
  id: string;
  // Student info
  studentName: string;
  studentId?: string; // Link to child in users if they had account
  // Parent info
  parentName: string;
  parentEmail: string;
  parentPhone?: string;
  parentId?: string; // Link to users collection
  // Last activity
  lastSessionDate?: string;
  lastSessionType?: "121" | "ASC" | "GDS";
  previousCoach?: string;
  previousCoachId?: string;
  totalSessionsAttended?: number;
  // Loss details
  lostReason?: LostReason;
  lostReasonDetails?: string;
  lostAt: Date | Timestamp; // When they stopped coming
  // Retention tracking
  status: LostCustomerStatus;
  // Follow-up management
  catchUpDate?: string; // Scheduled follow-up date
  nextStepNotes?: string; // Progress notes ("Doing well at Houghton...")
  followUpHistory: FollowUpEntry[];
  lastContactedAt?: Date | Timestamp;
  totalFollowUps: number;
  // Return tracking
  returnedAt?: Date | Timestamp;
  returnBookingId?: string;
  returnNotes?: string;
  // Metadata
  priority: number; // 1=high, 2=medium, 3=low
  tags?: string[]; // Custom tags for filtering
  addedBy?: string;
  addedAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
}

export type CreateLostCustomerInput = Omit<
  LostCustomer,
  | "id"
  | "status"
  | "followUpHistory"
  | "totalFollowUps"
  | "addedAt"
  | "updatedAt"
>;

export type UpdateLostCustomerInput = Partial<
  Omit<LostCustomer, "id" | "followUpHistory" | "totalFollowUps" | "addedAt">
>;

// ============================================================================
// FOLLOW-UP INPUT TYPES
// ============================================================================

export interface AddFollowUpInput {
  lostCustomerId: string;
  method: ContactMethod;
  notes: string;
  outcome: FollowUpOutcome;
  nextFollowUpDate?: string;
}

export interface ScheduleFollowUpInput {
  lostCustomerId: string;
  followUpDate: string;
  notes?: string;
}

export interface MarkAsReturnedInput {
  lostCustomerId: string;
  bookingId?: string;
  notes?: string;
}

// ============================================================================
// VIEW/COMPUTED TYPES
// ============================================================================

/**
 * Summary for list view
 */
export interface LostCustomerSummary {
  id: string;
  studentName: string;
  parentName: string;
  parentEmail: string;
  status: LostCustomerStatus;
  lostReason?: LostReason;
  lastSessionDate?: string;
  catchUpDate?: string;
  daysSinceLost: number;
  daysSinceContact?: number;
  totalFollowUps: number;
  priority: number;
  nextStepNotes?: string;
}

/**
 * Retention metrics/dashboard
 */
export interface RetentionMetrics {
  totalLost: number;
  totalReturned: number;
  totalDeclined: number;
  totalPending: number; // Lost + follow_up_scheduled + contacted
  returnRate: number; // Percentage
  // By status
  byStatus: Record<LostCustomerStatus, number>;
  // By reason
  byReason: Record<LostReason, number>;
  // Time-based
  lostThisMonth: number;
  returnedThisMonth: number;
  needsFollowUp: number; // Overdue follow-ups
  // Average times
  averageDaysToReturn?: number;
  averageFollowUpsToReturn?: number;
}

/**
 * Follow-up calendar entry
 */
export interface FollowUpCalendarEntry {
  date: string;
  lostCustomerId: string;
  studentName: string;
  parentName: string;
  parentPhone?: string;
  parentEmail: string;
  notes?: string;
  isOverdue: boolean;
}

// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

export interface ListLostCustomersParams {
  status?: LostCustomerStatus | LostCustomerStatus[];
  lostReason?: LostReason;
  priority?: number;
  hasFollowUpScheduled?: boolean;
  search?: string; // Search by name/email
  sortBy?: "lostAt" | "catchUpDate" | "lastContactedAt" | "priority";
  sortOrder?: "asc" | "desc";
  limit?: number;
  offset?: number;
}

export interface LostCustomersListResponse {
  customers: LostCustomerSummary[];
  total: number;
  hasMore: boolean;
  metrics: Pick<
    RetentionMetrics,
    "totalLost" | "totalReturned" | "returnRate" | "needsFollowUp"
  >;
}

export interface GetFollowUpCalendarParams {
  startDate: string;
  endDate: string;
  includeOverdue?: boolean;
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const LOST_CUSTOMER_STATUS_LABELS: Record<LostCustomerStatus, string> = {
  lost: "Lost",
  follow_up_scheduled: "Follow-up Scheduled",
  contacted: "Contacted",
  returning: "Returning",
  returned: "Returned",
  declined: "Declined",
};

export const LOST_CUSTOMER_STATUS_COLORS: Record<LostCustomerStatus, string> = {
  lost: "bg-red-100 text-red-800",
  follow_up_scheduled: "bg-yellow-100 text-yellow-800",
  contacted: "bg-blue-100 text-blue-800",
  returning: "bg-green-100 text-green-800",
  returned: "bg-emerald-100 text-emerald-800",
  declined: "bg-gray-100 text-gray-800",
};

export const LOST_REASON_LABELS: Record<LostReason, string> = {
  schedule_conflict: "Schedule Conflict",
  cost: "Cost",
  moved_away: "Moved Away",
  lost_interest: "Lost Interest",
  joined_team: "Joined a Team",
  school_commitments: "School Commitments",
  health_injury: "Health/Injury",
  other: "Other",
  unknown: "Unknown",
};

export const CONTACT_METHOD_LABELS: Record<ContactMethod, string> = {
  call: "Phone Call",
  email: "Email",
  text: "Text Message",
  whatsapp: "WhatsApp",
  in_person: "In Person",
};

export const CONTACT_METHOD_ICONS: Record<ContactMethod, string> = {
  call: "phone",
  email: "mail",
  text: "message-square",
  whatsapp: "message-circle",
  in_person: "user",
};

export const FOLLOW_UP_OUTCOME_LABELS: Record<FollowUpOutcome, string> = {
  no_answer: "No Answer",
  left_message: "Left Message",
  spoke: "Spoke With",
  scheduled_return: "Scheduled Return",
  declined: "Declined",
  needs_follow_up: "Needs Follow-up",
};

export const PRIORITY_LABELS: Record<number, string> = {
  1: "High",
  2: "Medium",
  3: "Low",
};

export const PRIORITY_COLORS: Record<number, string> = {
  1: "bg-red-100 text-red-800",
  2: "bg-yellow-100 text-yellow-800",
  3: "bg-gray-100 text-gray-800",
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Calculate days since a date
 */
export function daysSince(date: Date | Timestamp | string): number {
  const d =
    date instanceof Date
      ? date
      : typeof date === "string"
        ? new Date(date)
        : date.toDate();
  const now = new Date();
  const diffTime = now.getTime() - d.getTime();
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Check if a follow-up is overdue
 */
export function isFollowUpOverdue(catchUpDate: string | undefined): boolean {
  if (!catchUpDate) return false;
  const date = new Date(catchUpDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date < today;
}

/**
 * Get next suggested follow-up date (7 days from now)
 */
export function getSuggestedFollowUpDate(daysFromNow: number = 7): string {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date.toISOString().split("T")[0];
}

/**
 * Calculate return rate
 */
export function calculateReturnRate(
  returned: number,
  totalLost: number
): number {
  if (totalLost === 0) return 0;
  return Math.round((returned / totalLost) * 100);
}

/**
 * Get status color class
 */
export function getStatusColor(status: LostCustomerStatus): string {
  return LOST_CUSTOMER_STATUS_COLORS[status] || "bg-gray-100 text-gray-800";
}

/**
 * Sort lost customers by priority and recency
 */
export function sortByPriorityAndRecency(
  customers: LostCustomerSummary[]
): LostCustomerSummary[] {
  return [...customers].sort((a, b) => {
    // First by priority
    if (a.priority !== b.priority) {
      return a.priority - b.priority;
    }
    // Then by days since lost (more recent first)
    return a.daysSinceLost - b.daysSinceLost;
  });
}

/**
 * Filter customers needing follow-up
 */
export function filterNeedsFollowUp(
  customers: LostCustomerSummary[]
): LostCustomerSummary[] {
  return customers.filter(
    (c) =>
      c.status !== "returned" &&
      c.status !== "declined" &&
      (!c.catchUpDate || isFollowUpOverdue(c.catchUpDate))
  );
}
