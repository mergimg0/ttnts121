import { adminDb } from "@/lib/firebase-admin";
import { ScheduledReport, ScheduledReportFilters } from "@/types/scheduled-report";
import * as XLSX from "xlsx";
import Papa from "papaparse";

/**
 * Generate report data based on report configuration
 */
export async function generateReport(
  report: ScheduledReport
): Promise<{ data: Buffer; filename: string; rowCount: number }> {
  const dateRange = calculateDateRange(report.filters?.dateRange);

  let reportData: Record<string, unknown>[];

  switch (report.reportType) {
    case "bookings":
      reportData = await generateBookingsReport(dateRange, report.filters);
      break;
    case "attendance":
      reportData = await generateAttendanceReport(dateRange, report.filters);
      break;
    case "revenue":
      reportData = await generateRevenueReport(dateRange, report.filters);
      break;
    case "sessions":
      reportData = await generateSessionsReport(dateRange, report.filters);
      break;
    default:
      throw new Error(`Unknown report type: ${report.reportType}`);
  }

  const timestamp = new Date().toISOString().split("T")[0];
  const filename = `${report.name.replace(/\s+/g, "-").toLowerCase()}-${timestamp}.${report.format}`;

  const buffer = report.format === "csv"
    ? generateCSVBuffer(reportData)
    : generateExcelBuffer(reportData, report.name);

  return { data: buffer, filename, rowCount: reportData.length };
}

/**
 * Calculate date range based on filter option
 */
function calculateDateRange(
  dateRangeOption?: ScheduledReportFilters["dateRange"]
): { start: Date; end: Date } {
  const now = new Date();
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

  switch (dateRangeOption) {
    case "last_7_days": {
      const start = new Date(end);
      start.setDate(start.getDate() - 7);
      start.setHours(0, 0, 0, 0);
      return { start, end };
    }
    case "last_30_days": {
      const start = new Date(end);
      start.setDate(start.getDate() - 30);
      start.setHours(0, 0, 0, 0);
      return { start, end };
    }
    case "current_month": {
      const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
      return { start, end };
    }
    default: {
      // Default to last 30 days
      const start = new Date(end);
      start.setDate(start.getDate() - 30);
      start.setHours(0, 0, 0, 0);
      return { start, end };
    }
  }
}

/**
 * Generate bookings report data
 */
async function generateBookingsReport(
  dateRange: { start: Date; end: Date },
  filters?: ScheduledReportFilters
): Promise<Record<string, unknown>[]> {
  let query: FirebaseFirestore.Query = adminDb
    .collection("bookings")
    .where("createdAt", ">=", dateRange.start)
    .where("createdAt", "<=", dateRange.end)
    .orderBy("createdAt", "desc");

  if (filters?.paymentStatus && filters.paymentStatus.length > 0) {
    query = query.where("paymentStatus", "in", filters.paymentStatus);
  }

  const snapshot = await query.get();

  const bookings: Record<string, unknown>[] = [];

  for (const doc of snapshot.docs) {
    const data = doc.data();

    // Filter by session if specified
    if (filters?.sessionIds && filters.sessionIds.length > 0) {
      if (!filters.sessionIds.includes(data.sessionId)) {
        continue;
      }
    }

    bookings.push({
      "Booking Ref": data.bookingRef || doc.id,
      "Child First Name": data.childFirstName || "",
      "Child Last Name": data.childLastName || "",
      "Age Group": data.ageGroup || "",
      "Parent First Name": data.parentFirstName || "",
      "Parent Last Name": data.parentLastName || "",
      "Parent Email": data.parentEmail || "",
      "Parent Phone": data.parentPhone || "",
      "Session ID": data.sessionId || "",
      "Payment Status": data.paymentStatus || "",
      "Amount": data.amount ? `${(data.amount / 100).toFixed(2)}` : "0.00",
      "Booking Date": formatFirestoreDate(data.createdAt),
      "Photo Consent": data.photoConsent ? "Yes" : "No",
      "Marketing Consent": data.marketingConsent ? "Yes" : "No",
    });
  }

  return bookings;
}

/**
 * Generate attendance report data
 */
async function generateAttendanceReport(
  dateRange: { start: Date; end: Date },
  filters?: ScheduledReportFilters
): Promise<Record<string, unknown>[]> {
  // Get sessions within the date range
  let sessionsQuery: FirebaseFirestore.Query = adminDb
    .collection("sessions")
    .where("startDate", ">=", dateRange.start)
    .where("startDate", "<=", dateRange.end);

  if (filters?.sessionIds && filters.sessionIds.length > 0) {
    sessionsQuery = sessionsQuery.where("__name__", "in", filters.sessionIds);
  }

  const sessionsSnapshot = await sessionsQuery.get();
  const sessionMap = new Map<string, { name: string; date: string; location: string }>();

  sessionsSnapshot.docs.forEach((doc) => {
    const data = doc.data();
    sessionMap.set(doc.id, {
      name: data.name || "",
      date: formatFirestoreDate(data.startDate),
      location: data.location || "",
    });
  });

  // Get bookings for these sessions
  const sessionIds = Array.from(sessionMap.keys());
  if (sessionIds.length === 0) {
    return [];
  }

  // Firestore 'in' queries are limited to 30 items, so we may need to batch
  const attendance: Record<string, unknown>[] = [];
  const batchSize = 30;

  for (let i = 0; i < sessionIds.length; i += batchSize) {
    const batchIds = sessionIds.slice(i, i + batchSize);
    const bookingsQuery = adminDb
      .collection("bookings")
      .where("sessionId", "in", batchIds)
      .where("paymentStatus", "in", ["paid", "deposit_paid"]);

    const bookingsSnapshot = await bookingsQuery.get();

    bookingsSnapshot.docs.forEach((doc) => {
      const data = doc.data();
      const session = sessionMap.get(data.sessionId);

      attendance.push({
        "Session Name": session?.name || data.sessionId,
        "Session Date": session?.date || "",
        "Location": session?.location || "",
        "Child Name": `${data.childFirstName || ""} ${data.childLastName || ""}`.trim(),
        "Parent Name": `${data.parentFirstName || ""} ${data.parentLastName || ""}`.trim(),
        "Contact Phone": data.parentPhone || "",
        "Contact Email": data.parentEmail || "",
        "Medical Conditions": data.medicalConditions || "None",
        "Emergency Contact": data.emergencyContact?.name || "",
        "Emergency Phone": data.emergencyContact?.phone || "",
        "Checked In": data.checkedIn ? "Yes" : "No",
      });
    });
  }

  return attendance;
}

/**
 * Generate revenue report data
 */
async function generateRevenueReport(
  dateRange: { start: Date; end: Date },
  filters?: ScheduledReportFilters
): Promise<Record<string, unknown>[]> {
  const query: FirebaseFirestore.Query = adminDb
    .collection("bookings")
    .where("createdAt", ">=", dateRange.start)
    .where("createdAt", "<=", dateRange.end)
    .where("paymentStatus", "in", ["paid", "deposit_paid", "partially_refunded"])
    .orderBy("createdAt", "desc");

  const snapshot = await query.get();

  const revenue: Record<string, unknown>[] = [];
  let totalRevenue = 0;
  let totalRefunds = 0;

  for (const doc of snapshot.docs) {
    const data = doc.data();

    // Filter by session if specified
    if (filters?.sessionIds && filters.sessionIds.length > 0) {
      if (!filters.sessionIds.includes(data.sessionId)) {
        continue;
      }
    }

    const amount = data.amount || 0;
    const refundedAmount = data.refundedAmount || 0;
    const netAmount = amount - refundedAmount;

    totalRevenue += amount;
    totalRefunds += refundedAmount;

    revenue.push({
      "Date": formatFirestoreDate(data.createdAt),
      "Booking Ref": data.bookingRef || doc.id,
      "Customer": `${data.parentFirstName || ""} ${data.parentLastName || ""}`.trim(),
      "Email": data.parentEmail || "",
      "Session ID": data.sessionId || "",
      "Gross Amount": `${(amount / 100).toFixed(2)}`,
      "Refunded": `${(refundedAmount / 100).toFixed(2)}`,
      "Net Amount": `${(netAmount / 100).toFixed(2)}`,
      "Payment Status": data.paymentStatus || "",
      "Payment Method": data.paymentMethod || "card",
    });
  }

  // Add summary row
  revenue.push({
    "Date": "TOTAL",
    "Booking Ref": "",
    "Customer": "",
    "Email": "",
    "Session ID": "",
    "Gross Amount": `${(totalRevenue / 100).toFixed(2)}`,
    "Refunded": `${(totalRefunds / 100).toFixed(2)}`,
    "Net Amount": `${((totalRevenue - totalRefunds) / 100).toFixed(2)}`,
    "Payment Status": "",
    "Payment Method": "",
  });

  return revenue;
}

/**
 * Generate sessions report data
 */
async function generateSessionsReport(
  dateRange: { start: Date; end: Date },
  filters?: ScheduledReportFilters
): Promise<Record<string, unknown>[]> {
  const query: FirebaseFirestore.Query = adminDb
    .collection("sessions")
    .where("startDate", ">=", dateRange.start)
    .where("startDate", "<=", dateRange.end)
    .orderBy("startDate", "asc");

  const snapshot = await query.get();

  const sessions: Record<string, unknown>[] = [];

  for (const doc of snapshot.docs) {
    const data = doc.data();

    // Filter by session IDs if specified
    if (filters?.sessionIds && filters.sessionIds.length > 0) {
      if (!filters.sessionIds.includes(doc.id)) {
        continue;
      }
    }

    // Filter by location if specified
    if (filters?.location && data.location !== filters.location) {
      continue;
    }

    const capacity = data.capacity || 0;
    const enrolled = data.enrolled || 0;
    const availableSpots = capacity - enrolled;
    const fillRate = capacity > 0 ? ((enrolled / capacity) * 100).toFixed(1) : "0.0";

    sessions.push({
      "Session ID": doc.id,
      "Name": data.name || "",
      "Program ID": data.programId || "",
      "Location": data.location || "",
      "Start Date": formatFirestoreDate(data.startDate),
      "End Date": formatFirestoreDate(data.endDate),
      "Day of Week": getDayName(data.dayOfWeek),
      "Time": `${data.startTime || ""} - ${data.endTime || ""}`,
      "Age Range": `${data.ageMin || 0}-${data.ageMax || 0}`,
      "Price": data.price ? `${(data.price / 100).toFixed(2)}` : "0.00",
      "Capacity": capacity,
      "Enrolled": enrolled,
      "Available": availableSpots,
      "Fill Rate %": fillRate,
      "Status": data.isActive ? "Active" : "Inactive",
    });
  }

  return sessions;
}

/**
 * Generate CSV buffer from data
 */
function generateCSVBuffer(data: Record<string, unknown>[]): Buffer {
  const csv = Papa.unparse(data);
  return Buffer.from(csv, "utf-8");
}

/**
 * Generate Excel buffer from data
 */
function generateExcelBuffer(
  data: Record<string, unknown>[],
  sheetName: string
): Buffer {
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName.substring(0, 31)); // Sheet names max 31 chars
  return Buffer.from(XLSX.write(wb, { bookType: "xlsx", type: "buffer" }));
}

/**
 * Format Firestore timestamp to readable date string
 */
function formatFirestoreDate(date: unknown): string {
  if (!date) return "";

  // Handle Firestore Timestamp
  if (typeof date === "object" && date !== null) {
    const timestamp = date as { _seconds?: number; seconds?: number; toDate?: () => Date };
    if (timestamp._seconds) {
      return new Date(timestamp._seconds * 1000).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    }
    if (timestamp.seconds) {
      return new Date(timestamp.seconds * 1000).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    }
    if (typeof timestamp.toDate === "function") {
      return timestamp.toDate().toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    }
  }

  // Handle Date object or string
  const d = new Date(date as string | number);
  if (isNaN(d.getTime())) return "";

  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/**
 * Get day name from day number
 */
function getDayName(dayOfWeek: number | undefined): string {
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  return days[dayOfWeek ?? 0] || "";
}

/**
 * Check if a report is due to run
 */
export function isReportDue(report: ScheduledReport): boolean {
  const now = new Date();
  const [hours, minutes] = report.time.split(":").map(Number);

  // Check if current time matches the scheduled time (within 5-minute window)
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const scheduledMinutes = hours * 60 + minutes;
  const timeDiff = Math.abs(currentMinutes - scheduledMinutes);

  if (timeDiff > 5) {
    return false;
  }

  // Check frequency
  switch (report.frequency) {
    case "daily":
      return true;

    case "weekly":
      return now.getDay() === report.dayOfWeek;

    case "monthly":
      return now.getDate() === report.dayOfMonth;

    default:
      return false;
  }
}

/**
 * Check if report was already run today (to prevent duplicate runs)
 */
export function wasRunToday(report: ScheduledReport): boolean {
  if (!report.lastRunAt) return false;

  const lastRun = report.lastRunAt instanceof Date
    ? report.lastRunAt
    : new Date(((report.lastRunAt as unknown) as { _seconds: number })._seconds * 1000);

  const today = new Date();
  return (
    lastRun.getDate() === today.getDate() &&
    lastRun.getMonth() === today.getMonth() &&
    lastRun.getFullYear() === today.getFullYear()
  );
}
