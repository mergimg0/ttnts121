import { Timestamp } from "firebase/firestore";

// ============================================================================
// COACH RATE TYPES
// ============================================================================

/**
 * Coach hourly rate configuration
 * Supports rate history with effective dates
 */
export interface CoachRate {
  id: string;
  coachId: string; // Reference to users collection
  coachName: string; // Denormalized for display
  hourlyRate: number; // in pence (e.g., 1500 = £15.00)
  effectiveFrom: Date | Timestamp;
  effectiveUntil?: Date | Timestamp; // Null = current rate
  notes?: string;
  createdBy?: string;
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
}

export type CreateCoachRateInput = Omit<
  CoachRate,
  "id" | "createdAt" | "updatedAt"
>;

export type UpdateCoachRateInput = Partial<
  Omit<CoachRate, "id" | "coachId" | "createdAt">
>;

// ============================================================================
// COACH HOURS TYPES
// ============================================================================

export type HoursCategory =
  | "sessions121"
  | "sessionsASC"
  | "sessionsGDS"
  | "admin"
  | "training"
  | "camp"
  | "other";

/**
 * Breakdown of hours by category
 */
export interface HoursBreakdown {
  sessions121?: number;
  sessionsASC?: number;
  sessionsGDS?: number;
  admin?: number;
  training?: number;
  camp?: number;
  other?: number;
}

/**
 * Daily hours logged for a coach
 */
export interface CoachHours {
  id: string;
  coachId: string;
  coachName: string; // Denormalized
  date: string; // "2026-01-27" format
  // Hours worked
  hoursWorked: number; // Decimal hours (e.g., 3.5)
  // Breakdown by type (optional)
  breakdown?: HoursBreakdown;
  // Calculated earnings (snapshot at time of logging)
  hourlyRate: number; // in pence
  earnings: number; // hoursWorked * hourlyRate in pence
  // Special pay modifiers
  bonusPay?: number; // Additional bonus in pence
  deductions?: number; // Deductions in pence
  deductionReason?: string;
  // Metadata
  notes?: string;
  loggedBy: string; // Admin or coach user ID who logged
  verifiedBy?: string; // Admin who verified
  isVerified: boolean;
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
}

export type CreateCoachHoursInput = Omit<
  CoachHours,
  "id" | "earnings" | "isVerified" | "createdAt" | "updatedAt"
>;

export type UpdateCoachHoursInput = Partial<
  Omit<CoachHours, "id" | "coachId" | "date" | "createdAt">
>;

// ============================================================================
// COACH AWARDS TYPES
// ============================================================================

export type CoachAwardType = "coach_of_month" | "employee_of_month";

/**
 * Employee/Coach of the Month awards
 */
export interface CoachAward {
  id: string;
  awardType: CoachAwardType;
  month: string; // "2026-01" format
  coachId: string;
  coachName: string; // Denormalized
  prize?: number; // in pence (e.g., 3000 = £30)
  reason?: string;
  nominatedBy?: string;
  notes?: string;
  awardedBy?: string; // Admin who gave the award
  createdAt: Date | Timestamp;
}

export type CreateCoachAwardInput = Omit<CoachAward, "id" | "createdAt">;

// ============================================================================
// COMPUTED/VIEW TYPES
// ============================================================================

/**
 * Day entry for hours grid
 */
export interface CoachDayEntry {
  date: string;
  dayOfWeek: number;
  dayName: string;
  hours: number;
  earnings: number;
  breakdown?: HoursBreakdown;
  isVerified: boolean;
  notes?: string;
}

/**
 * Weekly summary for a coach
 */
export interface CoachWeeklySummary {
  coachId: string;
  coachName: string;
  weekStart: string;
  weekEnd: string;
  totalHours: number;
  totalEarnings: number;
  dayBreakdown: CoachDayEntry[];
  hoursBreakdown: HoursBreakdown;
}

/**
 * Monthly summary for a coach
 */
export interface CoachMonthlySummary {
  coachId: string;
  coachName: string;
  month: string; // "2026-01"
  // Totals
  totalHours: number;
  totalEarnings: number;
  totalBonuses: number;
  totalDeductions: number;
  netPay: number;
  // Breakdown by category
  hoursBreakdown: HoursBreakdown;
  // Day-by-day
  dayBreakdown: CoachDayEntry[];
  // Verification status
  verifiedDays: number;
  unverifiedDays: number;
  allVerified: boolean;
  // Comparison
  previousMonthHours?: number;
  percentageChange?: number;
}

/**
 * Payroll export record for a coach
 */
export interface CoachPayrollRecord {
  coachId: string;
  coachName: string;
  month: string;
  totalHours: number;
  hourlyRate: number;
  baseEarnings: number;
  bonuses: number;
  deductions: number;
  netPay: number;
  hoursBreakdown: HoursBreakdown;
}

/**
 * Coach overview for admin dashboard
 */
export interface CoachOverview {
  id: string;
  name: string;
  abbreviation: string;
  currentHourlyRate: number;
  monthToDateHours: number;
  monthToDateEarnings: number;
  lastLoggedDate?: string;
  isActive: boolean;
  awards: CoachAward[];
}

// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

export interface ListCoachHoursParams {
  coachId?: string;
  month?: string; // "2026-01"
  startDate?: string;
  endDate?: string;
  isVerified?: boolean;
}

export interface ListCoachRatesParams {
  coachId?: string;
  activeOnly?: boolean;
}

export interface ListCoachAwardsParams {
  coachId?: string;
  awardType?: CoachAwardType;
  year?: string; // "2026"
}

export interface BulkLogHoursInput {
  entries: Array<{
    coachId: string;
    date: string;
    hoursWorked: number;
    breakdown?: HoursBreakdown;
    notes?: string;
  }>;
}

export interface VerifyHoursInput {
  hoursIds: string[];
}

export interface PayrollExportParams {
  month: string; // "2026-01"
  format?: "csv" | "json";
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const COACH_AWARD_TYPE_LABELS: Record<CoachAwardType, string> = {
  coach_of_month: "Coach of the Month",
  employee_of_month: "Employee of the Month",
};

export const COACH_AWARD_PRIZES: Record<CoachAwardType, number> = {
  coach_of_month: 3000, // £30
  employee_of_month: 3000, // £30
};

export const HOURS_CATEGORY_LABELS: Record<HoursCategory, string> = {
  sessions121: "1-to-1 Sessions",
  sessionsASC: "After School Club",
  sessionsGDS: "Group Development",
  admin: "Admin Work",
  training: "Training",
  camp: "Camp",
  other: "Other",
};

export const HOURS_CATEGORY_COLORS: Record<HoursCategory, string> = {
  sessions121: "bg-blue-100 text-blue-800",
  sessionsASC: "bg-green-100 text-green-800",
  sessionsGDS: "bg-purple-100 text-purple-800",
  admin: "bg-gray-100 text-gray-800",
  training: "bg-yellow-100 text-yellow-800",
  camp: "bg-orange-100 text-orange-800",
  other: "bg-slate-100 text-slate-800",
};

/**
 * Default hourly rates for reference (in pence)
 * From Excel: Leyah £30, Luca £15, Kadeem £12.5, etc.
 */
export const DEFAULT_HOURLY_RATES: Record<string, number> = {
  default: 1250, // £12.50
  senior: 1500, // £15.00
  lead: 2000, // £20.00
  director: 3000, // £30.00
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Calculate earnings from hours and rate
 */
export function calculateEarnings(
  hoursWorked: number,
  hourlyRate: number
): number {
  return Math.round(hoursWorked * hourlyRate);
}

/**
 * Calculate total hours from breakdown
 */
export function calculateTotalHours(breakdown?: HoursBreakdown): number {
  if (!breakdown) return 0;
  return (
    (breakdown.sessions121 || 0) +
    (breakdown.sessionsASC || 0) +
    (breakdown.sessionsGDS || 0) +
    (breakdown.admin || 0) +
    (breakdown.training || 0) +
    (breakdown.camp || 0) +
    (breakdown.other || 0)
  );
}

/**
 * Get the current rate for a coach at a specific date
 */
export function getCurrentRate(
  rates: CoachRate[],
  date: Date = new Date()
): CoachRate | undefined {
  return rates.find((rate) => {
    const effectiveFrom =
      rate.effectiveFrom instanceof Date
        ? rate.effectiveFrom
        : rate.effectiveFrom.toDate();

    const effectiveUntil = rate.effectiveUntil
      ? rate.effectiveUntil instanceof Date
        ? rate.effectiveUntil
        : rate.effectiveUntil.toDate()
      : null;

    return effectiveFrom <= date && (!effectiveUntil || effectiveUntil >= date);
  });
}

/**
 * Format hours for display (e.g., "3.5" -> "3h 30m")
 */
export function formatHours(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

/**
 * Format currency (pence to pounds)
 */
export function formatCurrency(pence: number): string {
  return `£${(pence / 100).toFixed(2)}`;
}

/**
 * Get month string from date
 */
export function getMonthString(date: Date): string {
  return date.toISOString().slice(0, 7); // "2026-01"
}

/**
 * Get days in month
 */
export function getDaysInMonth(month: string): number {
  const [year, monthNum] = month.split("-").map(Number);
  return new Date(year, monthNum, 0).getDate();
}
