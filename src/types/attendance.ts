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
  date?: string;
  dateFrom?: string;
  dateTo?: string;
  checkedIn?: boolean;
}
