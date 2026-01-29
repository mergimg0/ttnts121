import { Timestamp } from "firebase/firestore";

// ============================================================================
// DAILY FINANCIAL TYPES
// ============================================================================

/**
 * Income breakdown by category
 */
export interface IncomeBreakdown {
  asc: number; // After School Club revenue in pence
  gds: number; // Group Development Sessions revenue
  oneToOne: number; // 1-2-1 sessions revenue
  other?: number; // Other income
  total: number; // Calculated sum
}

/**
 * Expense breakdown by category
 */
export interface ExpenseBreakdown {
  asc: number; // ASC-related expenses
  gds: number; // GDS-related expenses
  oneToOne: number; // 1-2-1 session expenses
  coachWages?: number; // Coach payments
  equipment?: number; // Equipment costs
  venue?: number; // Venue hire
  marketing?: number; // Marketing costs
  admin?: number; // Administrative costs
  other?: number; // Other expenses
  total: number; // Calculated sum
}

/**
 * Daily income/expense record
 */
export interface DailyFinancial {
  id: string;
  date: string; // "2026-01-27" format
  dayOfWeek: number; // 0-6
  dayName: string; // "Monday"
  // Income by category
  income: IncomeBreakdown;
  // Expenses by category
  expenses: ExpenseBreakdown;
  // Calculated
  grossProfit: number; // income.total - expenses.total
  // Payment method breakdown (optional)
  paymentMethods?: {
    card?: number;
    cash?: number;
    bankTransfer?: number;
  };
  // Link to Stripe data (optional)
  stripeRevenue?: number; // Auto-fetched from Stripe
  stripeTransactionIds?: string[];
  // Notes
  notes?: string;
  // Metadata
  loggedBy?: string;
  verifiedBy?: string;
  isVerified: boolean;
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
}

export type CreateDailyFinancialInput = Omit<
  DailyFinancial,
  | "id"
  | "dayOfWeek"
  | "dayName"
  | "income.total"
  | "expenses.total"
  | "grossProfit"
  | "isVerified"
  | "createdAt"
  | "updatedAt"
> & {
  income: Omit<IncomeBreakdown, "total">;
  expenses: Omit<ExpenseBreakdown, "total">;
};

export type UpdateDailyFinancialInput = Partial<
  Omit<DailyFinancial, "id" | "date" | "createdAt">
>;

// ============================================================================
// WEEKLY SUMMARY TYPES
// ============================================================================

/**
 * Weekly financial summary
 */
export interface WeeklyFinancialSummary {
  weekStart: string; // ISO date of Monday
  weekEnd: string; // ISO date of Sunday
  // Aggregated income
  income: IncomeBreakdown;
  // Aggregated expenses
  expenses: ExpenseBreakdown;
  // Calculated
  grossProfit: number;
  // Daily breakdown
  dailyBreakdown: DailyFinancialSummary[];
  // Comparison
  previousWeekProfit?: number;
  percentageChange?: number;
}

/**
 * Simplified daily record for weekly view
 */
export interface DailyFinancialSummary {
  date: string;
  dayName: string;
  income: number;
  expenses: number;
  grossProfit: number;
  isVerified: boolean;
}

// ============================================================================
// MONTHLY SUMMARY TYPES
// ============================================================================

/**
 * Monthly financial summary
 */
export interface MonthlyFinancialSummary {
  month: string; // "2026-01"
  year: number;
  monthName: string; // "January"
  // Aggregated income
  income: IncomeBreakdown;
  // Aggregated expenses
  expenses: ExpenseBreakdown;
  // Calculated
  grossProfit: number;
  // Weekly breakdown
  weeklyBreakdown: WeeklyFinancialSummary[];
  // Comparison
  previousMonthProfit?: number;
  percentageChange?: number;
  yearToDateProfit?: number;
  // Statistics
  averageDailyIncome: number;
  averageDailyExpenses: number;
  averageDailyProfit: number;
  bestDay?: { date: string; profit: number };
  worstDay?: { date: string; profit: number };
}

// ============================================================================
// CATEGORY BREAKDOWN TYPES
// ============================================================================

/**
 * Revenue breakdown by category for charts
 */
export interface CategoryRevenueSummary {
  category: string;
  label: string;
  amount: number;
  percentage: number;
  color: string;
}

/**
 * Expense breakdown by category for charts
 */
export interface CategoryExpenseSummary {
  category: string;
  label: string;
  amount: number;
  percentage: number;
  color: string;
}

// ============================================================================
// TREND/ANALYTICS TYPES
// ============================================================================

/**
 * Data point for trend charts
 */
export interface FinancialTrendPoint {
  date: string;
  label: string;
  income: number;
  expenses: number;
  profit: number;
}

/**
 * Period comparison
 */
export interface PeriodComparison {
  currentPeriod: {
    start: string;
    end: string;
    income: number;
    expenses: number;
    profit: number;
  };
  previousPeriod: {
    start: string;
    end: string;
    income: number;
    expenses: number;
    profit: number;
  };
  changes: {
    income: number; // Percentage change
    expenses: number;
    profit: number;
  };
}

// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

export interface GetDailyFinancialParams {
  date: string;
}

export interface ListDailyFinancialsParams {
  startDate?: string;
  endDate?: string;
  month?: string; // "2026-01"
  isVerified?: boolean;
}

export interface GetWeeklySummaryParams {
  weekStart: string; // Monday of the week
}

export interface GetMonthlySummaryParams {
  month: string; // "2026-01"
}

export interface GetTrendParams {
  startDate: string;
  endDate: string;
  granularity: "daily" | "weekly" | "monthly";
}

export interface BulkCreateFinancialsInput {
  entries: CreateDailyFinancialInput[];
}

export interface FinancialExportParams {
  startDate: string;
  endDate: string;
  format: "csv" | "xlsx" | "pdf";
  includeBreakdown?: boolean;
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const INCOME_CATEGORY_LABELS: Record<string, string> = {
  asc: "After School Club",
  gds: "Group Development",
  oneToOne: "1-to-1 Sessions",
  other: "Other Income",
};

export const EXPENSE_CATEGORY_LABELS: Record<string, string> = {
  asc: "ASC Expenses",
  gds: "GDS Expenses",
  oneToOne: "1-to-1 Expenses",
  coachWages: "Coach Wages",
  equipment: "Equipment",
  venue: "Venue Hire",
  marketing: "Marketing",
  admin: "Admin",
  other: "Other Expenses",
};

export const INCOME_CATEGORY_COLORS: Record<string, string> = {
  asc: "#10B981", // green
  gds: "#8B5CF6", // purple
  oneToOne: "#3B82F6", // blue
  other: "#6B7280", // gray
};

export const EXPENSE_CATEGORY_COLORS: Record<string, string> = {
  asc: "#10B981",
  gds: "#8B5CF6",
  oneToOne: "#3B82F6",
  coachWages: "#F59E0B", // amber
  equipment: "#EF4444", // red
  venue: "#EC4899", // pink
  marketing: "#06B6D4", // cyan
  admin: "#6366F1", // indigo
  other: "#6B7280",
};

export const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Calculate income total from breakdown
 */
export function calculateIncomeTotal(
  income: Omit<IncomeBreakdown, "total">
): number {
  return (
    (income.asc || 0) +
    (income.gds || 0) +
    (income.oneToOne || 0) +
    (income.other || 0)
  );
}

/**
 * Calculate expense total from breakdown
 */
export function calculateExpenseTotal(
  expenses: Omit<ExpenseBreakdown, "total">
): number {
  return (
    (expenses.asc || 0) +
    (expenses.gds || 0) +
    (expenses.oneToOne || 0) +
    (expenses.coachWages || 0) +
    (expenses.equipment || 0) +
    (expenses.venue || 0) +
    (expenses.marketing || 0) +
    (expenses.admin || 0) +
    (expenses.other || 0)
  );
}

/**
 * Calculate gross profit
 */
export function calculateGrossProfit(
  incomeTotal: number,
  expenseTotal: number
): number {
  return incomeTotal - expenseTotal;
}

/**
 * Format currency for display
 */
export function formatFinancialAmount(pence: number): string {
  const isNegative = pence < 0;
  const absAmount = Math.abs(pence);
  const formatted = `£${(absAmount / 100).toFixed(2)}`;
  return isNegative ? `-${formatted}` : formatted;
}

/**
 * Get percentage change between two values
 */
export function calculatePercentageChange(
  current: number,
  previous: number
): number {
  if (previous === 0) return current === 0 ? 0 : 100;
  return Math.round(((current - previous) / Math.abs(previous)) * 100);
}

/**
 * Get day name from date string
 */
export function getDayName(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-GB", { weekday: "long" });
}

/**
 * Get week start (Monday) for a date
 */
export function getWeekStartForDate(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().split("T")[0];
}

/**
 * Get all dates in a month
 */
export function getDatesInMonth(month: string): string[] {
  const [year, monthNum] = month.split("-").map(Number);
  const daysInMonth = new Date(year, monthNum, 0).getDate();
  const dates: string[] = [];

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, monthNum - 1, day);
    dates.push(date.toISOString().split("T")[0]);
  }

  return dates;
}

/**
 * Convert category breakdown to chart data
 */
export function toChartData(
  breakdown: Record<string, number>,
  labels: Record<string, string>,
  colors: Record<string, string>
): CategoryRevenueSummary[] {
  const total = Object.values(breakdown).reduce((sum, val) => sum + val, 0);

  return Object.entries(breakdown)
    .filter(([_, amount]) => amount > 0)
    .map(([category, amount]) => ({
      category,
      label: labels[category] || category,
      amount,
      percentage: total > 0 ? Math.round((amount / total) * 100) : 0,
      color: colors[category] || "#6B7280",
    }))
    .sort((a, b) => b.amount - a.amount);
}
