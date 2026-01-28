import { Timestamp } from "firebase/firestore";

/**
 * Scheduled Report configuration
 * Defines automated report generation and delivery
 */
export interface ScheduledReport {
  id: string;
  name: string;
  reportType: "bookings" | "attendance" | "revenue" | "sessions";
  frequency: "daily" | "weekly" | "monthly";
  dayOfWeek?: number; // 0-6 for weekly (0 = Sunday)
  dayOfMonth?: number; // 1-31 for monthly
  time: string; // HH:mm format (24-hour)
  recipients: string[]; // Email addresses
  filters?: ScheduledReportFilters;
  format: "csv" | "xlsx";
  isActive: boolean;
  lastRunAt?: Date | Timestamp;
  lastRunStatus?: "success" | "failed";
  lastRunError?: string;
  createdAt: Date | Timestamp;
  updatedAt?: Date | Timestamp;
  createdBy?: string;
}

export interface ScheduledReportFilters {
  sessionIds?: string[];
  dateRange?: "last_7_days" | "last_30_days" | "current_month" | "custom";
  customDateFrom?: Date | Timestamp;
  customDateTo?: Date | Timestamp;
  paymentStatus?: string[];
  location?: string;
}

/**
 * Input type for creating a scheduled report
 */
export type CreateScheduledReportInput = Omit<
  ScheduledReport,
  "id" | "lastRunAt" | "lastRunStatus" | "lastRunError" | "createdAt" | "updatedAt"
>;

/**
 * Input type for updating a scheduled report
 */
export type UpdateScheduledReportInput = Partial<CreateScheduledReportInput>;

/**
 * Report execution result
 */
export interface ReportExecutionResult {
  reportId: string;
  reportName: string;
  success: boolean;
  recipientCount: number;
  rowCount?: number;
  error?: string;
  executedAt: Date;
}

/**
 * Frequency display helpers
 */
export const FREQUENCY_OPTIONS = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
] as const;

export const REPORT_TYPE_OPTIONS = [
  { value: "bookings", label: "Bookings Report" },
  { value: "attendance", label: "Attendance Report" },
  { value: "revenue", label: "Revenue Report" },
  { value: "sessions", label: "Sessions Report" },
] as const;

export const DATE_RANGE_OPTIONS = [
  { value: "last_7_days", label: "Last 7 Days" },
  { value: "last_30_days", label: "Last 30 Days" },
  { value: "current_month", label: "Current Month" },
  { value: "custom", label: "Custom Range" },
] as const;

export const DAY_OF_WEEK_OPTIONS = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
] as const;

export const FORMAT_OPTIONS = [
  { value: "csv", label: "CSV" },
  { value: "xlsx", label: "Excel (XLSX)" },
] as const;
