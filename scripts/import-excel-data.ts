/**
 * Excel Import Script for TTNTS 121
 *
 * Imports data from "121 weekly timetable.xlsx" into Firebase collections.
 *
 * Usage:
 *   npx ts-node scripts/import-excel-data.ts [options]
 *
 * Options:
 *   --dry-run       Preview changes without writing to Firebase
 *   --sheet <name>  Import only a specific sheet
 *   --file <path>   Path to Excel file (default: ./121 weekly timetable.xlsx)
 *   --verbose       Show detailed logging
 *
 * Sheets imported:
 *   1. Weekly rota -> timetable_slots (current week)
 *   2. FIXED ROTA -> timetable_templates
 *   3. Block Booking List -> block_bookings
 *   4. MONDAY GDS, WEDNESDAY GDS, SATURDAY GDS -> gds_students + gds_attendance
 *   5. Income and expenses sheet -> daily_financials
 *   6. Monthly Hours 2025, Monthly Hours 2026 -> coach_hours + coach_rates
 *   7. Challenge Winners -> weekly_challenges
 *   8. Coach of the month -> coach_awards
 *   9. Lost Customers -> lost_customers
 */

import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore, Timestamp, FieldValue } from "firebase-admin/firestore";
import * as XLSX from "xlsx";
import * as dotenv from "dotenv";
import { resolve } from "path";

// Load environment variables
dotenv.config({ path: resolve(__dirname, "../.env.local") });

// ============================================================================
// TYPES
// ============================================================================

interface ImportOptions {
  dryRun: boolean;
  sheetFilter?: string;
  filePath: string;
  verbose: boolean;
}

interface ImportResult {
  sheet: string;
  collection: string;
  recordsProcessed: number;
  recordsCreated: number;
  recordsSkipped: number;
  errors: string[];
}

interface CoachMapping {
  [name: string]: {
    id: string;
    abbreviation: string;
    hourlyRate: number; // in pence
  };
}

// ============================================================================
// CONFIGURATION
// ============================================================================

// Map coach names/abbreviations to IDs and rates
// These are placeholder IDs - in production, look up from users collection
const COACH_MAPPING: CoachMapping = {
  VAL: { id: "coach_val", abbreviation: "VAL", hourlyRate: 1500 },
  VALERIE: { id: "coach_val", abbreviation: "VAL", hourlyRate: 1500 },
  CIARAN: { id: "coach_ciaran", abbreviation: "CIARAN", hourlyRate: 1500 },
  ELISHA: { id: "coach_elisha", abbreviation: "ELISHA", hourlyRate: 1250 },
  KADEEM: { id: "coach_kadeem", abbreviation: "KADEEM", hourlyRate: 1250 },
  JERMAINE: { id: "coach_jermaine", abbreviation: "JERMAINE", hourlyRate: 1250 },
  CHRIS: { id: "coach_chris", abbreviation: "CHRIS", hourlyRate: 1250 },
  LUCA: { id: "coach_luca", abbreviation: "LUCA", hourlyRate: 1500 },
  LEYAH: { id: "coach_leyah", abbreviation: "LEYAH", hourlyRate: 3000 },
  DIVA: { id: "coach_diva", abbreviation: "DIVA", hourlyRate: 1250 },
  JAYDEN: { id: "coach_jayden", abbreviation: "JAYDEN", hourlyRate: 1250 },
  "JAYDEN SR": { id: "coach_jayden_sr", abbreviation: "JAYDEN SR", hourlyRate: 1500 },
  ZION: { id: "coach_zion", abbreviation: "ZION", hourlyRate: 1250 },
  OMER: { id: "coach_omer", abbreviation: "OMER", hourlyRate: 1250 },
  ETHAN: { id: "coach_ethan", abbreviation: "ETHAN", hourlyRate: 1250 },
  SIENNA: { id: "coach_sienna", abbreviation: "SIENNA", hourlyRate: 1250 },
};

const DAY_MAPPING: { [key: string]: number } = {
  MONDAY: 1,
  TUESDAY: 2,
  WEDNESDAY: 3,
  THURSDAY: 4,
  FRIDAY: 5,
  SATURDAY: 6,
  SUNDAY: 0,
  MON: 1,
  TUE: 2,
  WED: 3,
  THU: 4,
  FRI: 5,
  SAT: 6,
  SUN: 0,
};

// ============================================================================
// FIREBASE INITIALIZATION
// ============================================================================

function initFirebase() {
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(
    /\\n/g,
    "\n"
  );

  const app = initializeApp({
    credential: cert({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey,
    }),
  });

  return getFirestore(app);
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function parseExcelDate(excelDate: number | string | Date): Date {
  if (excelDate instanceof Date) return excelDate;
  if (typeof excelDate === "number") {
    // Excel serial date number
    const utcDays = Math.floor(excelDate - 25569);
    const utcValue = utcDays * 86400 * 1000;
    return new Date(utcValue);
  }
  // Try parsing as string
  return new Date(excelDate);
}

function formatDateString(date: Date): string {
  return date.toISOString().split("T")[0];
}

function getWeekStart(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return formatDateString(d);
}

function normalizeCoachName(name: string): string {
  return name?.trim().toUpperCase() || "";
}

function getCoachInfo(name: string): CoachMapping[string] | null {
  const normalized = normalizeCoachName(name);
  return COACH_MAPPING[normalized] || null;
}

function parseCurrency(value: string | number): number {
  if (typeof value === "number") return Math.round(value * 100);
  if (!value) return 0;
  const cleaned = value.toString().replace(/[^0-9.-]/g, "");
  return Math.round(parseFloat(cleaned) * 100) || 0;
}

function parseHours(value: string | number): number {
  if (typeof value === "number") return value;
  if (!value) return 0;
  // Handle formats like "3:30" or "3.5"
  if (value.includes(":")) {
    const [hours, mins] = value.split(":").map(Number);
    return hours + mins / 60;
  }
  return parseFloat(value) || 0;
}

function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function log(message: string, verbose: boolean = false, isVerbose: boolean = false) {
  if (isVerbose && !verbose) return;
  console.log(message);
}

// ============================================================================
// SHEET PARSERS
// ============================================================================

/**
 * Parse Weekly Rota sheet -> timetable_slots
 */
async function parseWeeklyRota(
  db: FirebaseFirestore.Firestore,
  worksheet: XLSX.WorkSheet,
  options: ImportOptions
): Promise<ImportResult> {
  const result: ImportResult = {
    sheet: "Weekly rota",
    collection: "timetable_slots",
    recordsProcessed: 0,
    recordsCreated: 0,
    recordsSkipped: 0,
    errors: [],
  };

  try {
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as unknown[][];
    const weekStart = getWeekStart(new Date());
    const batch = db.batch();

    // Find the header row and column mappings
    let headerRow = 0;
    for (let i = 0; i < Math.min(10, data.length); i++) {
      const row = data[i];
      if (row && (row.includes("TIME") || row.includes("Time") || row.includes("MONDAY"))) {
        headerRow = i;
        break;
      }
    }

    log(`Found header row at index ${headerRow}`, options.verbose, true);

    // Parse time slots and coaches from the grid
    const timeSlots: string[] = [];
    const dayColumns: { [day: number]: number } = {};

    // Map out the day columns
    const header = data[headerRow] as string[];
    header.forEach((cell, idx) => {
      const cellStr = (cell || "").toString().toUpperCase();
      if (DAY_MAPPING[cellStr] !== undefined) {
        dayColumns[DAY_MAPPING[cellStr]] = idx;
      }
    });

    log(`Day columns mapped: ${JSON.stringify(dayColumns)}`, options.verbose, true);

    // Process each row after header
    for (let rowIdx = headerRow + 1; rowIdx < data.length; rowIdx++) {
      const row = data[rowIdx] as (string | number)[];
      if (!row || row.length === 0) continue;

      const timeCell = row[0]?.toString();
      if (!timeCell || !timeCell.includes(":")) continue;

      // Parse time range (e.g., "15:00-16:00" or "15:00 - 16:00")
      const timeParts = timeCell.split(/[-–]/);
      const startTime = timeParts[0]?.trim();
      const endTime = timeParts[1]?.trim() || startTime;

      // Process each day column
      for (const [day, colIdx] of Object.entries(dayColumns)) {
        const cellValue = row[colIdx]?.toString()?.trim();
        if (!cellValue || cellValue === "-" || cellValue.toLowerCase() === "off") continue;

        result.recordsProcessed++;

        // Parse cell - could be coach name, student name, or both
        // Format varies: "VAL", "VAL - Student Name", "Student Name (VAL)", etc.
        let coachName = "";
        let studentName = "";
        let slotType: "121" | "ASC" | "GDS" | "OBS" | "AVAILABLE" = "AVAILABLE";

        // Try to extract coach and student info
        if (cellValue.includes("-")) {
          const parts = cellValue.split("-").map((p) => p.trim());
          coachName = parts[0];
          studentName = parts.slice(1).join(" - ");
          slotType = studentName ? "121" : "AVAILABLE";
        } else if (cellValue.match(/\(([^)]+)\)/)) {
          const match = cellValue.match(/\(([^)]+)\)/);
          coachName = match?.[1] || "";
          studentName = cellValue.replace(/\([^)]+\)/, "").trim();
          slotType = studentName ? "121" : "AVAILABLE";
        } else {
          // Just a name - could be coach or student
          const coach = getCoachInfo(cellValue);
          if (coach) {
            coachName = cellValue;
            slotType = "AVAILABLE";
          } else {
            // Assume it's a student with unknown coach
            studentName = cellValue;
            slotType = "121";
          }
        }

        // Check for special slot types
        const cellUpper = cellValue.toUpperCase();
        if (cellUpper.includes("ASC")) slotType = "ASC";
        if (cellUpper.includes("GDS")) slotType = "GDS";
        if (cellUpper.includes("OBS")) slotType = "OBS";

        const coachInfo = getCoachInfo(coachName);

        const slot = {
          dayOfWeek: parseInt(day),
          startTime,
          endTime,
          coachId: coachInfo?.id || "unknown",
          coachName: coachInfo?.abbreviation || coachName || "Unknown",
          slotType,
          studentName: studentName || undefined,
          weekStart,
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        };

        if (!options.dryRun) {
          const docRef = db.collection("timetable_slots").doc();
          batch.set(docRef, slot);
        }

        result.recordsCreated++;
        log(
          `  Slot: Day ${day}, ${startTime}-${endTime}, Coach: ${slot.coachName}, Student: ${studentName || "N/A"}`,
          options.verbose,
          true
        );
      }
    }

    if (!options.dryRun) {
      await batch.commit();
      log(`Committed ${result.recordsCreated} timetable slots`, options.verbose);
    }
  } catch (error) {
    result.errors.push(`Error parsing Weekly rota: ${error}`);
  }

  return result;
}

/**
 * Parse FIXED ROTA sheet -> timetable_templates
 */
async function parseFixedRota(
  db: FirebaseFirestore.Firestore,
  worksheet: XLSX.WorkSheet,
  options: ImportOptions
): Promise<ImportResult> {
  const result: ImportResult = {
    sheet: "FIXED ROTA",
    collection: "timetable_templates",
    recordsProcessed: 0,
    recordsCreated: 0,
    recordsSkipped: 0,
    errors: [],
  };

  try {
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as unknown[][];

    // Similar structure to weekly rota but creates a template
    const slots: Array<{
      dayOfWeek: number;
      startTime: string;
      endTime: string;
      coachId: string;
      coachName: string;
      slotType: string;
      defaultStudentName?: string;
    }> = [];

    // Find header row
    let headerRow = 0;
    for (let i = 0; i < Math.min(10, data.length); i++) {
      const row = data[i];
      if (row && (row.includes("TIME") || row.includes("Time") || row.includes("MONDAY"))) {
        headerRow = i;
        break;
      }
    }

    const header = data[headerRow] as string[];
    const dayColumns: { [day: number]: number } = {};
    header?.forEach((cell, idx) => {
      const cellStr = (cell || "").toString().toUpperCase();
      if (DAY_MAPPING[cellStr] !== undefined) {
        dayColumns[DAY_MAPPING[cellStr]] = idx;
      }
    });

    // Process rows
    for (let rowIdx = headerRow + 1; rowIdx < data.length; rowIdx++) {
      const row = data[rowIdx] as (string | number)[];
      if (!row || row.length === 0) continue;

      const timeCell = row[0]?.toString();
      if (!timeCell || !timeCell.includes(":")) continue;

      const timeParts = timeCell.split(/[-–]/);
      const startTime = timeParts[0]?.trim();
      const endTime = timeParts[1]?.trim() || startTime;

      for (const [day, colIdx] of Object.entries(dayColumns)) {
        const cellValue = row[colIdx]?.toString()?.trim();
        if (!cellValue || cellValue === "-" || cellValue.toLowerCase() === "off") continue;

        result.recordsProcessed++;

        let coachName = "";
        let studentName = "";
        let slotType = "AVAILABLE";

        if (cellValue.includes("-")) {
          const parts = cellValue.split("-").map((p) => p.trim());
          coachName = parts[0];
          studentName = parts.slice(1).join(" - ");
          slotType = studentName ? "121" : "AVAILABLE";
        } else {
          const coach = getCoachInfo(cellValue);
          if (coach) {
            coachName = cellValue;
          } else {
            studentName = cellValue;
            slotType = "121";
          }
        }

        const cellUpper = cellValue.toUpperCase();
        if (cellUpper.includes("ASC")) slotType = "ASC";
        if (cellUpper.includes("GDS")) slotType = "GDS";
        if (cellUpper.includes("OBS")) slotType = "OBS";

        const coachInfo = getCoachInfo(coachName);

        slots.push({
          dayOfWeek: parseInt(day),
          startTime,
          endTime,
          coachId: coachInfo?.id || "unknown",
          coachName: coachInfo?.abbreviation || coachName || "Unknown",
          slotType,
          defaultStudentName: studentName || undefined,
        });
      }
    }

    const template = {
      name: "Default Weekly Schedule",
      description: "Imported from FIXED ROTA sheet",
      isActive: true,
      slots,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    if (!options.dryRun) {
      await db.collection("timetable_templates").add(template);
    }

    result.recordsCreated = 1;
    log(`Created template with ${slots.length} slots`, options.verbose);
  } catch (error) {
    result.errors.push(`Error parsing FIXED ROTA: ${error}`);
  }

  return result;
}

/**
 * Parse Block Booking List -> block_bookings
 */
async function parseBlockBookings(
  db: FirebaseFirestore.Firestore,
  worksheet: XLSX.WorkSheet,
  options: ImportOptions
): Promise<ImportResult> {
  const result: ImportResult = {
    sheet: "Block Booking List",
    collection: "block_bookings",
    recordsProcessed: 0,
    recordsCreated: 0,
    recordsSkipped: 0,
    errors: [],
  };

  try {
    const data = XLSX.utils.sheet_to_json(worksheet) as Record<string, unknown>[];
    const batch = db.batch();

    for (const row of data) {
      result.recordsProcessed++;

      // Expected columns (case-insensitive matching)
      const studentName =
        (row["Student Name"] as string) ||
        (row["student name"] as string) ||
        (row["Name"] as string) ||
        "";
      const parentName =
        (row["Parent Name"] as string) ||
        (row["parent name"] as string) ||
        (row["Parent"] as string) ||
        "";
      const parentEmail =
        (row["Email"] as string) ||
        (row["email"] as string) ||
        (row["Parent Email"] as string) ||
        "";
      const parentPhone = (row["Phone"] as string) || (row["phone"] as string) || "";

      const totalSessions =
        parseInt((row["Total Sessions"] as string) || (row["Sessions"] as string) || "0") || 10;
      const remainingSessions =
        parseInt((row["Remaining"] as string) || (row["remaining"] as string) || "0") || totalSessions;
      const totalPaid = parseCurrency(
        (row["Total Paid"] as string) || (row["Amount"] as string) || (row["amount"] as string) || "0"
      );

      // Parse usage dates if present (format like "20.1/ 27.1/")
      const usageDatesStr =
        (row["Dates Used"] as string) || (row["dates used"] as string) || (row["Usage"] as string) || "";
      const usageHistory: Array<{
        usedAt: Timestamp;
        sessionDate: string;
        notes?: string;
      }> = [];

      if (usageDatesStr) {
        const datePatterns = usageDatesStr.match(/(\d+)\.(\d+)/g) || [];
        const currentYear = new Date().getFullYear();
        datePatterns.forEach((dateStr) => {
          const [day, month] = dateStr.split(".").map(Number);
          if (day && month) {
            const date = new Date(currentYear, month - 1, day);
            usageHistory.push({
              usedAt: Timestamp.fromDate(date),
              sessionDate: formatDateString(date),
            });
          }
        });
      }

      if (!studentName) {
        result.recordsSkipped++;
        continue;
      }

      const blockBooking = {
        studentName,
        parentName: parentName || "Unknown",
        parentEmail: parentEmail || "",
        parentPhone: parentPhone || undefined,
        totalSessions,
        remainingSessions,
        usageHistory,
        totalPaid,
        pricePerSession: totalSessions > 0 ? Math.round(totalPaid / totalSessions) : 0,
        status: remainingSessions > 0 ? "active" : "exhausted",
        purchasedAt: FieldValue.serverTimestamp(),
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      };

      if (!options.dryRun) {
        const docRef = db.collection("block_bookings").doc();
        batch.set(docRef, blockBooking);
      }

      result.recordsCreated++;
      log(
        `  Block booking: ${studentName} - ${remainingSessions}/${totalSessions} remaining`,
        options.verbose,
        true
      );
    }

    if (!options.dryRun) {
      await batch.commit();
    }
  } catch (error) {
    result.errors.push(`Error parsing Block Booking List: ${error}`);
  }

  return result;
}

/**
 * Parse GDS sheets -> gds_students + gds_attendance
 */
async function parseGDSSheet(
  db: FirebaseFirestore.Firestore,
  worksheet: XLSX.WorkSheet,
  day: "monday" | "wednesday" | "saturday",
  options: ImportOptions
): Promise<ImportResult> {
  const result: ImportResult = {
    sheet: `${day.toUpperCase()} GDS`,
    collection: "gds_students",
    recordsProcessed: 0,
    recordsCreated: 0,
    recordsSkipped: 0,
    errors: [],
  };

  try {
    const data = XLSX.utils.sheet_to_json(worksheet) as Record<string, unknown>[];
    const batch = db.batch();

    for (const row of data) {
      result.recordsProcessed++;

      const studentName =
        (row["Name"] as string) ||
        (row["Student Name"] as string) ||
        (row["Student"] as string) ||
        "";
      const ageGroup =
        (row["Age Group"] as string) ||
        (row["age group"] as string) ||
        (row["Group"] as string) ||
        "Y3-Y4";
      const parentName = (row["Parent"] as string) || (row["parent"] as string) || "";
      const parentEmail = (row["Email"] as string) || (row["email"] as string) || "";
      const parentPhone = (row["Phone"] as string) || (row["phone"] as string) || "";
      const notes = (row["Notes"] as string) || (row["notes"] as string) || "";
      const medicalConditions =
        (row["Medical"] as string) || (row["medical"] as string) || "";

      if (!studentName) {
        result.recordsSkipped++;
        continue;
      }

      const student = {
        studentName,
        day,
        ageGroup,
        parentName: parentName || undefined,
        parentEmail: parentEmail || undefined,
        parentPhone: parentPhone || undefined,
        medicalConditions: medicalConditions || undefined,
        notes: notes || undefined,
        totalAttendances: 0,
        playerOfSessionCount: 0,
        status: "active",
        enrolledAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      };

      if (!options.dryRun) {
        const docRef = db.collection("gds_students").doc();
        batch.set(docRef, student);
      }

      result.recordsCreated++;
      log(
        `  GDS Student: ${studentName} (${day}, ${ageGroup})`,
        options.verbose,
        true
      );
    }

    if (!options.dryRun) {
      await batch.commit();
    }
  } catch (error) {
    result.errors.push(`Error parsing ${day.toUpperCase()} GDS: ${error}`);
  }

  return result;
}

/**
 * Parse Income and Expenses sheet -> daily_financials
 */
async function parseFinancials(
  db: FirebaseFirestore.Firestore,
  worksheet: XLSX.WorkSheet,
  options: ImportOptions
): Promise<ImportResult> {
  const result: ImportResult = {
    sheet: "Income and expenses sheet",
    collection: "daily_financials",
    recordsProcessed: 0,
    recordsCreated: 0,
    recordsSkipped: 0,
    errors: [],
  };

  try {
    const data = XLSX.utils.sheet_to_json(worksheet) as Record<string, unknown>[];
    const batch = db.batch();

    for (const row of data) {
      result.recordsProcessed++;

      // Try to parse date from various possible column names
      const dateValue =
        row["Date"] || row["date"] || row["DATE"] || row["Day"] || row["day"];
      if (!dateValue) {
        result.recordsSkipped++;
        continue;
      }

      const date = parseExcelDate(dateValue as number | string | Date);
      if (isNaN(date.getTime())) {
        result.recordsSkipped++;
        continue;
      }

      const dateStr = formatDateString(date);
      const dayOfWeek = date.getDay();
      const dayName = date.toLocaleDateString("en-GB", { weekday: "long" });

      // Parse income columns
      const ascIncome = parseCurrency(
        (row["ASC Income"] as string) || (row["asc income"] as string) || (row["ASC"] as string) || "0"
      );
      const gdsIncome = parseCurrency(
        (row["GDS Income"] as string) || (row["gds income"] as string) || (row["GDS"] as string) || "0"
      );
      const oneToOneIncome = parseCurrency(
        (row["121 Income"] as string) ||
        (row["1-2-1"] as string) ||
        (row["121"] as string) ||
        (row["One to One"] as string) ||
        "0"
      );
      const otherIncome = parseCurrency((row["Other Income"] as string) || (row["Other"] as string) || "0");

      // Parse expense columns
      const coachWages = parseCurrency(
        (row["Coach Wages"] as string) || (row["Wages"] as string) || (row["wages"] as string) || "0"
      );
      const equipment = parseCurrency((row["Equipment"] as string) || (row["equipment"] as string) || "0");
      const venue = parseCurrency((row["Venue"] as string) || (row["venue"] as string) || "0");
      const otherExpenses = parseCurrency(
        (row["Other Expenses"] as string) || (row["Expenses"] as string) || (row["expenses"] as string) || "0"
      );

      const incomeTotal = ascIncome + gdsIncome + oneToOneIncome + otherIncome;
      const expenseTotal = coachWages + equipment + venue + otherExpenses;

      const financial = {
        date: dateStr,
        dayOfWeek,
        dayName,
        income: {
          asc: ascIncome,
          gds: gdsIncome,
          oneToOne: oneToOneIncome,
          other: otherIncome,
          total: incomeTotal,
        },
        expenses: {
          asc: 0,
          gds: 0,
          oneToOne: 0,
          coachWages,
          equipment,
          venue,
          other: otherExpenses,
          total: expenseTotal,
        },
        grossProfit: incomeTotal - expenseTotal,
        isVerified: false,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      };

      if (!options.dryRun) {
        // Use date as document ID for easy lookup
        const docRef = db.collection("daily_financials").doc(dateStr);
        batch.set(docRef, financial);
      }

      result.recordsCreated++;
      log(
        `  Financial: ${dateStr} - Income: ${incomeTotal / 100}, Expenses: ${expenseTotal / 100}`,
        options.verbose,
        true
      );
    }

    if (!options.dryRun) {
      await batch.commit();
    }
  } catch (error) {
    result.errors.push(`Error parsing Income and expenses sheet: ${error}`);
  }

  return result;
}

/**
 * Parse Monthly Hours sheet -> coach_hours + coach_rates
 */
async function parseMonthlyHours(
  db: FirebaseFirestore.Firestore,
  worksheet: XLSX.WorkSheet,
  year: number,
  options: ImportOptions
): Promise<ImportResult> {
  const result: ImportResult = {
    sheet: `Monthly Hours ${year}`,
    collection: "coach_hours",
    recordsProcessed: 0,
    recordsCreated: 0,
    recordsSkipped: 0,
    errors: [],
  };

  try {
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as unknown[][];
    const batch = db.batch();
    const ratesBatch = db.batch();
    const processedRates = new Set<string>();

    // Find header row with coach names
    let headerRow = 0;
    let coachColumns: { [idx: number]: string } = {};

    for (let i = 0; i < Math.min(10, data.length); i++) {
      const row = data[i] as string[];
      if (!row) continue;

      // Look for known coach names
      let foundCoaches = 0;
      row.forEach((cell, idx) => {
        const cellStr = (cell || "").toString().toUpperCase().trim();
        if (COACH_MAPPING[cellStr]) {
          coachColumns[idx] = cellStr;
          foundCoaches++;
        }
      });

      if (foundCoaches >= 2) {
        headerRow = i;
        break;
      }
    }

    if (Object.keys(coachColumns).length === 0) {
      result.errors.push("Could not find coach columns in header");
      return result;
    }

    log(`Found ${Object.keys(coachColumns).length} coaches at row ${headerRow}`, options.verbose, true);

    // Find the date column (usually first column)
    const dateColIdx = 0;

    // Process each row (day)
    for (let rowIdx = headerRow + 1; rowIdx < data.length; rowIdx++) {
      const row = data[rowIdx] as (string | number)[];
      if (!row || row.length === 0) continue;

      const dateValue = row[dateColIdx];
      if (!dateValue) continue;

      const date = parseExcelDate(dateValue);
      if (isNaN(date.getTime()) || date.getFullYear() !== year) continue;

      const dateStr = formatDateString(date);

      // Process each coach's hours for this day
      for (const [colIdxStr, coachName] of Object.entries(coachColumns)) {
        const colIdx = parseInt(colIdxStr);
        const hoursValue = row[colIdx];
        if (!hoursValue) continue;

        const hours = parseHours(hoursValue.toString());
        if (hours <= 0) continue;

        result.recordsProcessed++;

        const coachInfo = COACH_MAPPING[coachName];
        if (!coachInfo) {
          result.recordsSkipped++;
          continue;
        }

        // Create coach rate if not already created
        if (!processedRates.has(coachInfo.id) && !options.dryRun) {
          const rateRef = db.collection("coach_rates").doc();
          ratesBatch.set(rateRef, {
            coachId: coachInfo.id,
            coachName: coachInfo.abbreviation,
            hourlyRate: coachInfo.hourlyRate,
            effectiveFrom: Timestamp.fromDate(new Date(year, 0, 1)),
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
          });
          processedRates.add(coachInfo.id);
        }

        const hoursDoc = {
          coachId: coachInfo.id,
          coachName: coachInfo.abbreviation,
          date: dateStr,
          hoursWorked: hours,
          hourlyRate: coachInfo.hourlyRate,
          earnings: Math.round(hours * coachInfo.hourlyRate),
          loggedBy: "import",
          isVerified: true,
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        };

        if (!options.dryRun) {
          const docRef = db.collection("coach_hours").doc();
          batch.set(docRef, hoursDoc);
        }

        result.recordsCreated++;
        log(
          `  Hours: ${coachName} on ${dateStr} - ${hours}h`,
          options.verbose,
          true
        );
      }
    }

    if (!options.dryRun) {
      await batch.commit();
      await ratesBatch.commit();
    }
  } catch (error) {
    result.errors.push(`Error parsing Monthly Hours ${year}: ${error}`);
  }

  return result;
}

/**
 * Parse Challenge Winners -> weekly_challenges
 */
async function parseChallengeWinners(
  db: FirebaseFirestore.Firestore,
  worksheet: XLSX.WorkSheet,
  options: ImportOptions
): Promise<ImportResult> {
  const result: ImportResult = {
    sheet: "Challenge Winners",
    collection: "weekly_challenges",
    recordsProcessed: 0,
    recordsCreated: 0,
    recordsSkipped: 0,
    errors: [],
  };

  try {
    const data = XLSX.utils.sheet_to_json(worksheet) as Record<string, unknown>[];
    const batch = db.batch();

    // Group challenges by week
    const weeklyData: Map<
      string,
      {
        weekStart: string;
        weekEnd: string;
        weekNumber: number;
        year: number;
        challenges: Array<{
          challengeType: string;
          challengeName?: string;
          winnerName?: string;
          winnerScore?: string | number;
        }>;
        oneToOneOfWeek?: { studentName: string; reason?: string };
      }
    > = new Map();

    for (const row of data) {
      result.recordsProcessed++;

      const dateValue = row["Date"] || row["date"] || row["Week"] || row["week"];
      const challengeType =
        (row["Challenge"] as string) ||
        (row["challenge"] as string) ||
        (row["Type"] as string) ||
        "custom";
      const winnerName =
        (row["Winner"] as string) ||
        (row["winner"] as string) ||
        (row["Name"] as string) ||
        "";
      const score = row["Score"] || row["score"] || "";
      const oneToOneOfWeek =
        (row["121 of the Week"] as string) || (row["121 of week"] as string) || "";

      if (!dateValue) {
        result.recordsSkipped++;
        continue;
      }

      const date = parseExcelDate(dateValue as number | string | Date);
      if (isNaN(date.getTime())) {
        result.recordsSkipped++;
        continue;
      }

      const weekStart = getWeekStart(date);
      const year = date.getFullYear();
      const weekNumber = Math.ceil(
        (date.getTime() - new Date(year, 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000)
      );

      if (!weeklyData.has(weekStart)) {
        const weekEnd = new Date(date);
        weekEnd.setDate(weekEnd.getDate() + (7 - weekEnd.getDay()));

        weeklyData.set(weekStart, {
          weekStart,
          weekEnd: formatDateString(weekEnd),
          weekNumber,
          year,
          challenges: [],
        });
      }

      const weekData = weeklyData.get(weekStart)!;

      if (winnerName) {
        weekData.challenges.push({
          challengeType: challengeType.toLowerCase().replace(/\s+/g, "_"),
          challengeName: challengeType,
          winnerName,
          winnerScore: score as string | number,
        });
      }

      if (oneToOneOfWeek && !weekData.oneToOneOfWeek) {
        weekData.oneToOneOfWeek = { studentName: oneToOneOfWeek };
      }
    }

    // Create documents for each week
    for (const [weekStart, weekData] of Array.from(weeklyData.entries())) {
      const challenge = {
        weekNumber: weekData.weekNumber,
        weekStart: weekData.weekStart,
        weekEnd: weekData.weekEnd,
        year: weekData.year,
        isHalfTerm: false,
        challenges: weekData.challenges,
        oneToOneOfWeek: weekData.oneToOneOfWeek,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      };

      if (!options.dryRun) {
        const docRef = db.collection("weekly_challenges").doc();
        batch.set(docRef, challenge);
      }

      result.recordsCreated++;
      log(
        `  Challenge week: ${weekStart} - ${weekData.challenges.length} winners`,
        options.verbose,
        true
      );
    }

    if (!options.dryRun) {
      await batch.commit();
    }
  } catch (error) {
    result.errors.push(`Error parsing Challenge Winners: ${error}`);
  }

  return result;
}

/**
 * Parse Coach of the Month -> coach_awards
 */
async function parseCoachAwards(
  db: FirebaseFirestore.Firestore,
  worksheet: XLSX.WorkSheet,
  options: ImportOptions
): Promise<ImportResult> {
  const result: ImportResult = {
    sheet: "Coach of the month",
    collection: "coach_awards",
    recordsProcessed: 0,
    recordsCreated: 0,
    recordsSkipped: 0,
    errors: [],
  };

  try {
    const data = XLSX.utils.sheet_to_json(worksheet) as Record<string, unknown>[];
    const batch = db.batch();

    for (const row of data) {
      result.recordsProcessed++;

      const month =
        (row["Month"] as string) || (row["month"] as string) || (row["Date"] as string) || "";
      const coachName =
        (row["Coach"] as string) ||
        (row["coach"] as string) ||
        (row["Winner"] as string) ||
        (row["Name"] as string) ||
        "";
      const reason = (row["Reason"] as string) || (row["reason"] as string) || "";
      const prize = parseCurrency((row["Prize"] as string) || (row["prize"] as string) || "30");

      if (!coachName || !month) {
        result.recordsSkipped++;
        continue;
      }

      // Parse month format (could be "January 2026", "Jan-26", "2026-01", etc.)
      let monthStr = "";
      const monthMatch = month.match(/(\d{4})-(\d{2})/);
      if (monthMatch) {
        monthStr = `${monthMatch[1]}-${monthMatch[2]}`;
      } else {
        const date = new Date(month);
        if (!isNaN(date.getTime())) {
          monthStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
        }
      }

      if (!monthStr) {
        result.recordsSkipped++;
        continue;
      }

      const coachInfo = getCoachInfo(coachName);

      const award = {
        awardType: "coach_of_month",
        month: monthStr,
        coachId: coachInfo?.id || "unknown",
        coachName: coachInfo?.abbreviation || coachName,
        prize,
        reason: reason || undefined,
        createdAt: FieldValue.serverTimestamp(),
      };

      if (!options.dryRun) {
        const docRef = db.collection("coach_awards").doc();
        batch.set(docRef, award);
      }

      result.recordsCreated++;
      log(
        `  Coach award: ${coachName} for ${monthStr}`,
        options.verbose,
        true
      );
    }

    if (!options.dryRun) {
      await batch.commit();
    }
  } catch (error) {
    result.errors.push(`Error parsing Coach of the month: ${error}`);
  }

  return result;
}

/**
 * Parse Lost Customers -> lost_customers
 */
async function parseLostCustomers(
  db: FirebaseFirestore.Firestore,
  worksheet: XLSX.WorkSheet,
  options: ImportOptions
): Promise<ImportResult> {
  const result: ImportResult = {
    sheet: "Lost Customers",
    collection: "lost_customers",
    recordsProcessed: 0,
    recordsCreated: 0,
    recordsSkipped: 0,
    errors: [],
  };

  try {
    const data = XLSX.utils.sheet_to_json(worksheet) as Record<string, unknown>[];
    const batch = db.batch();

    for (const row of data) {
      result.recordsProcessed++;

      const studentName =
        (row["Student"] as string) ||
        (row["student"] as string) ||
        (row["Name"] as string) ||
        (row["name"] as string) ||
        "";
      const parentName =
        (row["Parent"] as string) || (row["parent"] as string) || "";
      const parentEmail =
        (row["Email"] as string) || (row["email"] as string) || "";
      const parentPhone =
        (row["Phone"] as string) || (row["phone"] as string) || "";
      const lastSessionDate =
        (row["Last Session"] as string) ||
        (row["last session"] as string) ||
        (row["Last Date"] as string) ||
        "";
      const reason =
        (row["Reason"] as string) || (row["reason"] as string) || "";
      const notes =
        (row["Notes"] as string) ||
        (row["notes"] as string) ||
        (row["Progress"] as string) ||
        "";
      const catchUpDate =
        (row["Catch Up Date"] as string) ||
        (row["Follow Up"] as string) ||
        (row["follow up"] as string) ||
        "";

      if (!studentName) {
        result.recordsSkipped++;
        continue;
      }

      // Map reason text to enum
      let lostReason = "unknown";
      const reasonLower = reason.toLowerCase();
      if (reasonLower.includes("schedule") || reasonLower.includes("time"))
        lostReason = "schedule_conflict";
      else if (reasonLower.includes("cost") || reasonLower.includes("price") || reasonLower.includes("money"))
        lostReason = "cost";
      else if (reasonLower.includes("moved") || reasonLower.includes("moving"))
        lostReason = "moved_away";
      else if (reasonLower.includes("interest") || reasonLower.includes("bored"))
        lostReason = "lost_interest";
      else if (reasonLower.includes("team") || reasonLower.includes("club"))
        lostReason = "joined_team";
      else if (reasonLower.includes("school") || reasonLower.includes("study"))
        lostReason = "school_commitments";
      else if (reasonLower.includes("health") || reasonLower.includes("injury") || reasonLower.includes("ill"))
        lostReason = "health_injury";
      else if (reason) lostReason = "other";

      // Parse last session date
      let lastSessionDateStr = "";
      if (lastSessionDate) {
        const date = parseExcelDate(lastSessionDate);
        if (!isNaN(date.getTime())) {
          lastSessionDateStr = formatDateString(date);
        }
      }

      // Parse catch up date
      let catchUpDateStr = "";
      if (catchUpDate) {
        const date = parseExcelDate(catchUpDate);
        if (!isNaN(date.getTime())) {
          catchUpDateStr = formatDateString(date);
        }
      }

      const lostCustomer = {
        studentName,
        parentName: parentName || "Unknown",
        parentEmail: parentEmail || "",
        parentPhone: parentPhone || undefined,
        lastSessionDate: lastSessionDateStr || undefined,
        lostReason,
        lostReasonDetails: reason || undefined,
        lostAt: FieldValue.serverTimestamp(),
        status: catchUpDateStr ? "follow_up_scheduled" : "lost",
        catchUpDate: catchUpDateStr || undefined,
        nextStepNotes: notes || undefined,
        followUpHistory: [],
        totalFollowUps: 0,
        priority: 2, // Default medium priority
        addedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      };

      if (!options.dryRun) {
        const docRef = db.collection("lost_customers").doc();
        batch.set(docRef, lostCustomer);
      }

      result.recordsCreated++;
      log(
        `  Lost customer: ${studentName} - ${lostReason}`,
        options.verbose,
        true
      );
    }

    if (!options.dryRun) {
      await batch.commit();
    }
  } catch (error) {
    result.errors.push(`Error parsing Lost Customers: ${error}`);
  }

  return result;
}

// ============================================================================
// MAIN IMPORT FUNCTION
// ============================================================================

async function importExcelData(options: ImportOptions): Promise<void> {
  console.log("\n=== TTNTS 121 Excel Data Import ===\n");
  console.log(`Mode: ${options.dryRun ? "DRY RUN (no changes will be made)" : "LIVE"}`);
  console.log(`File: ${options.filePath}`);
  if (options.sheetFilter) {
    console.log(`Sheet filter: ${options.sheetFilter}`);
  }
  console.log("");

  // Initialize Firebase
  let db: FirebaseFirestore.Firestore;
  try {
    db = initFirebase();
    console.log("Firebase initialized successfully\n");
  } catch (error) {
    console.error("Failed to initialize Firebase:", error);
    process.exit(1);
  }

  // Read Excel file
  let workbook: XLSX.WorkBook;
  try {
    workbook = XLSX.readFile(options.filePath);
    console.log(`Excel file loaded. Sheets found: ${workbook.SheetNames.join(", ")}\n`);
  } catch (error) {
    console.error(`Failed to read Excel file: ${error}`);
    process.exit(1);
  }

  const results: ImportResult[] = [];

  // Sheet mappings
  const sheetParsers: {
    patterns: string[];
    parser: (
      db: FirebaseFirestore.Firestore,
      ws: XLSX.WorkSheet,
      options: ImportOptions
    ) => Promise<ImportResult>;
    extra?: unknown;
  }[] = [
    {
      patterns: ["Weekly rota", "weekly rota", "WEEKLY ROTA"],
      parser: parseWeeklyRota,
    },
    {
      patterns: ["FIXED ROTA", "Fixed Rota", "fixed rota"],
      parser: parseFixedRota,
    },
    {
      patterns: ["Block Booking", "block booking", "BLOCK BOOKING"],
      parser: parseBlockBookings,
    },
    {
      patterns: ["Income and expenses", "INCOME AND EXPENSES", "Income", "Financials"],
      parser: parseFinancials,
    },
    {
      patterns: ["Challenge Winners", "CHALLENGE WINNERS", "Challenges"],
      parser: parseChallengeWinners,
    },
    {
      patterns: ["Coach of the month", "COACH OF THE MONTH", "Coach Awards"],
      parser: parseCoachAwards,
    },
    {
      patterns: ["Lost Customers", "LOST CUSTOMERS", "Lost", "Retention"],
      parser: parseLostCustomers,
    },
  ];

  // Process each sheet
  for (const sheetName of workbook.SheetNames) {
    // Skip if filter specified and doesn't match
    if (
      options.sheetFilter &&
      !sheetName.toLowerCase().includes(options.sheetFilter.toLowerCase())
    ) {
      continue;
    }

    console.log(`\nProcessing sheet: ${sheetName}`);
    const worksheet = workbook.Sheets[sheetName];

    // Find matching parser
    let matched = false;

    // Check standard parsers
    for (const { patterns, parser } of sheetParsers) {
      if (patterns.some((p) => sheetName.toLowerCase().includes(p.toLowerCase()))) {
        const result = await parser(db, worksheet, options);
        results.push(result);
        matched = true;
        break;
      }
    }

    // Check GDS sheets
    if (!matched) {
      if (sheetName.toUpperCase().includes("MONDAY") && sheetName.toUpperCase().includes("GDS")) {
        const result = await parseGDSSheet(db, worksheet, "monday", options);
        results.push(result);
        matched = true;
      } else if (
        sheetName.toUpperCase().includes("WEDNESDAY") &&
        sheetName.toUpperCase().includes("GDS")
      ) {
        const result = await parseGDSSheet(db, worksheet, "wednesday", options);
        results.push(result);
        matched = true;
      } else if (
        sheetName.toUpperCase().includes("SATURDAY") &&
        sheetName.toUpperCase().includes("GDS")
      ) {
        const result = await parseGDSSheet(db, worksheet, "saturday", options);
        results.push(result);
        matched = true;
      }
    }

    // Check Monthly Hours sheets
    if (!matched && sheetName.toLowerCase().includes("monthly hours")) {
      const yearMatch = sheetName.match(/\d{4}/);
      if (yearMatch) {
        const year = parseInt(yearMatch[0]);
        const result = await parseMonthlyHours(db, worksheet, year, options);
        results.push(result);
        matched = true;
      }
    }

    if (!matched) {
      console.log(`  Skipped (no parser for this sheet)`);
    }
  }

  // Print summary
  console.log("\n=== Import Summary ===\n");
  console.log(
    "| Sheet | Collection | Processed | Created | Skipped | Errors |"
  );
  console.log(
    "|-------|------------|-----------|---------|---------|--------|"
  );

  let totalProcessed = 0;
  let totalCreated = 0;
  let totalSkipped = 0;
  let totalErrors = 0;

  for (const result of results) {
    console.log(
      `| ${result.sheet.padEnd(25)} | ${result.collection.padEnd(20)} | ${String(result.recordsProcessed).padStart(9)} | ${String(result.recordsCreated).padStart(7)} | ${String(result.recordsSkipped).padStart(7)} | ${String(result.errors.length).padStart(6)} |`
    );

    totalProcessed += result.recordsProcessed;
    totalCreated += result.recordsCreated;
    totalSkipped += result.recordsSkipped;
    totalErrors += result.errors.length;

    if (result.errors.length > 0) {
      console.log(`  Errors in ${result.sheet}:`);
      result.errors.forEach((e) => console.log(`    - ${e}`));
    }
  }

  console.log(
    "|-------|------------|-----------|---------|---------|--------|"
  );
  console.log(
    `| ${"TOTAL".padEnd(25)} | ${" ".padEnd(20)} | ${String(totalProcessed).padStart(9)} | ${String(totalCreated).padStart(7)} | ${String(totalSkipped).padStart(7)} | ${String(totalErrors).padStart(6)} |`
  );

  console.log("\n");
  if (options.dryRun) {
    console.log("DRY RUN COMPLETE - No data was written to Firebase");
    console.log("Run without --dry-run to import data");
  } else {
    console.log("IMPORT COMPLETE");
  }
}

// ============================================================================
// CLI ENTRY POINT
// ============================================================================

function parseArgs(): ImportOptions {
  const args = process.argv.slice(2);
  const options: ImportOptions = {
    dryRun: false,
    filePath: resolve(__dirname, "../121 weekly timetable.xlsx"),
    verbose: false,
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case "--dry-run":
        options.dryRun = true;
        break;
      case "--sheet":
        options.sheetFilter = args[++i];
        break;
      case "--file":
        options.filePath = resolve(args[++i]);
        break;
      case "--verbose":
        options.verbose = true;
        break;
      case "--help":
        console.log(`
Usage: npx ts-node scripts/import-excel-data.ts [options]

Options:
  --dry-run       Preview changes without writing to Firebase
  --sheet <name>  Import only sheets containing this name
  --file <path>   Path to Excel file (default: ./121 weekly timetable.xlsx)
  --verbose       Show detailed logging
  --help          Show this help message

Example:
  npx ts-node scripts/import-excel-data.ts --dry-run
  npx ts-node scripts/import-excel-data.ts --sheet "Block Booking"
  npx ts-node scripts/import-excel-data.ts --file ./data/timetable.xlsx
        `);
        process.exit(0);
    }
  }

  return options;
}

// Run import
const options = parseArgs();
importExcelData(options).catch((error) => {
  console.error("Import failed:", error);
  process.exit(1);
});
