import { Timestamp } from "firebase/firestore";

// Attendance record for a single child on a specific date
export interface AttendanceRecord {
  id: string;
  bookingId: string;
  sessionId: string;
  childName: string;
  date: string; // YYYY-MM-DD format
  checkedInAt?: Date | Timestamp;
  checkedOutAt?: Date | Timestamp;
  checkedInBy?: string; // Admin user who checked in
  checkedOutBy?: string; // Admin user who checked out
  method: "manual" | "qr";
  notes?: string;
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
}

// Session occurrence summary for a specific date
export interface SessionOccurrence {
  sessionId: string;
  sessionName: string;
  date: string; // YYYY-MM-DD format
  enrolledCount: number;
  attendedCount: number;
  checkedOutCount: number;
}

// Input types for creating/updating
export type CreateAttendanceInput = Omit<
  AttendanceRecord,
  "id" | "createdAt" | "updatedAt"
>;

export type UpdateAttendanceInput = Partial<
  Pick<AttendanceRecord, "checkedInAt" | "checkedOutAt" | "checkedInBy" | "checkedOutBy" | "method" | "notes">
>;

// QR validation request
export interface QRValidationRequest {
  payload: string; // JSON string from QR code
  sessionId: string;
  date: string;
}

// QR validation response
export interface QRValidationResponse {
  valid: boolean;
  bookingId?: string;
  childName?: string;
  alreadyCheckedIn?: boolean;
  error?: string;
}

// Attendance summary for dashboard
export interface AttendanceSummary {
  date: string;
  totalSessions: number;
  totalEnrolled: number;
  totalAttended: number;
  attendanceRate: number; // percentage
  sessions: SessionOccurrence[];
}

// Filter options for attendance queries
export interface AttendanceFilters {
  sessionId?: string;
  sessionType?: SessionType[];
  coachId?: string;
  location?: string;
  date?: string;
  dateFrom?: string;
  dateTo?: string;
  checkedIn?: boolean;
}

// Session types for filtering
export type SessionType =
  | "after-school"
  | "group-session"
  | "half-term"
  | "one-to-one"
  | "birthday-party";

// View mode for attendance page
export type AttendanceViewMode = "daily" | "weekly" | "monthly" | "analytics";

// Weekly attendance summary
export interface WeeklyAttendanceSummary {
  weekStart: string;
  weekEnd: string;
  totalSessions: number;
  totalEnrolled: number;
  totalAttended: number;
  attendanceRate: number;
  dailyBreakdown: DailyBreakdown[];
}

// Daily breakdown within a week
export interface DailyBreakdown {
  date: string;
  dayOfWeek: number;
  bySessionType: SessionTypeBreakdown[];
}

// Session type breakdown
export interface SessionTypeBreakdown {
  type: string;
  enrolled: number;
  attended: number;
  rate: number;
}

// Monthly attendance summary
export interface MonthlyAttendanceSummary {
  month: number;
  year: number;
  averageAttendanceRate: number;
  dailyRates: { date: string; rate: number; sessionCount: number }[];
}

// Analytics data for attendance insights
export interface AttendanceAnalytics {
  period: { start: string; end: string };
  overallRate: number;
  trendData: { date: string; rate: number }[];
  bySessionType: { type: string; rate: number; count: number }[];
  byDayOfWeek: { day: string; avgRate: number }[];
  atRiskStudents: AtRiskStudent[];
}

// At-risk student with poor attendance
export interface AtRiskStudent {
  childName: string;
  bookingId: string;
  enrolled: number;
  attended: number;
  rate: number;
  lastAttended?: string;
  consecutiveMissed: number;
}
