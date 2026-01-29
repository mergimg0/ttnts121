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
import XLSX from "xlsx";
import * as dotenv from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import {
  walkRotaGrid,
  countSlots,
  RawRotaSlot,
} from "./lib/excel-utils.js";

// ES Module compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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
// Based on Excel analysis - rates from Monthly Hours sheets
const COACH_MAPPING: CoachMapping = {
  // Primary coaches from Monthly Hours 2026
  VAL: { id: "coach_val", abbreviation: "VAL", hourlyRate: 1500 },
  CIARAN: { id: "coach_ciaran", abbreviation: "CIARAN", hourlyRate: 1500 },
  HARLEY: { id: "coach_harley", abbreviation: "HARLEY", hourlyRate: 1500 },
  LUCA: { id: "coach_luca", abbreviation: "LUCA", hourlyRate: 1500 },
  KADEEM: { id: "coach_kadeem", abbreviation: "KADEEM", hourlyRate: 1250 },
  SHAKA: { id: "coach_shaka", abbreviation: "SHAKA", hourlyRate: 1250 },
  HARRY: { id: "coach_harry", abbreviation: "HARRY", hourlyRate: 1500 },
  CAM: { id: "coach_cam", abbreviation: "CAM", hourlyRate: 1250 },
  ALFIE: { id: "coach_alfie", abbreviation: "ALFIE", hourlyRate: 600 },
  ILI: { id: "coach_ili", abbreviation: "ILI", hourlyRate: 1250 },
  LEYAH: { id: "coach_leyah", abbreviation: "LEYAH", hourlyRate: 3000 },
  // Historical coaches from 2025
  FREDDIE: { id: "coach_freddie", abbreviation: "FREDDIE", hourlyRate: 1500 },
  "DAN M": { id: "coach_dan_m", abbreviation: "DAN M", hourlyRate: 1500 },
  DAN: { id: "coach_dan_m", abbreviation: "DAN", hourlyRate: 1500 },
  // From Weekly Rota
  ANTONY: { id: "coach_antony", abbreviation: "ANTONY", hourlyRate: 1250 },
  NATHAN: { id: "coach_nathan", abbreviation: "NATHAN", hourlyRate: 1250 },
  TOM: { id: "coach_tom", abbreviation: "TOM", hourlyRate: 1250 },
  MIKE: { id: "coach_mike", abbreviation: "MIKE", hourlyRate: 1250 },
  // Abbreviation variations
  N: { id: "coach_nathan", abbreviation: "N", hourlyRate: 1250 },
  A: { id: "coach_antony", abbreviation: "A", hourlyRate: 1250 },
  V: { id: "coach_val", abbreviation: "V", hourlyRate: 1500 },
  C: { id: "coach_ciaran", abbreviation: "C", hourlyRate: 1500 },
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
 * Parse Weekly Rota V2 - Uses grid walker for merged cell structure
 */
async function parseWeeklyRotaV2(
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
    const weekStart = getWeekStart(new Date());
    const slots: RawRotaSlot[] = [];

    // Use grid walker to extract all slots
    for (const slot of walkRotaGrid(worksheet)) {
      slots.push(slot);
    }

    result.recordsProcessed = slots.length;

    if (slots.length === 0) {
      log("No slots found in Weekly rota", options.verbose);
      return result;
    }

    // Log slot counts for verification
    const counts = countSlots(slots);
    log(`Weekly rota slot counts: ${JSON.stringify(counts)}`, options.verbose, true);

    const batch = db.batch();

    for (const slot of slots) {
      const slotDoc: Record<string, unknown> = {
        dayOfWeek: slot.dayOfWeek,
        dayName: slot.day,
        startTime: slot.startTime,
        endTime: slot.endTime,
        courtIndex: slot.colIndex,
        slotType: slot.slotType,
        isASCSlot: slot.isASCSlot,
        weekStart,
        sourceColumn: slot.column,
        sourceRow: slot.row,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      };

      if (slot.studentName) slotDoc.studentName = slot.studentName;
      if (slot.studentNames) slotDoc.studentNames = slot.studentNames;
      if (slot.availableCoach) slotDoc.availableCoach = slot.availableCoach;

      if (!options.dryRun) {
        const docRef = db.collection("timetable_slots").doc();
        batch.set(docRef, slotDoc);
      }

      result.recordsCreated++;
      log(
        `  Slot: ${slot.day} ${slot.startTime}-${slot.endTime} [${slot.column}]: ${slot.rawValue}`,
        options.verbose,
        true
      );
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
 * Parse FIXED ROTA V2 - Uses grid walker for merged cell structure
 */
async function parseFixedRotaV2(
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
    const slots: RawRotaSlot[] = [];

    // Use grid walker to extract all slots
    for (const slot of walkRotaGrid(worksheet)) {
      slots.push(slot);
    }

    result.recordsProcessed = slots.length;

    if (slots.length === 0) {
      log("No slots found in FIXED ROTA", options.verbose);
      return result;
    }

    // Log slot counts for verification
    const counts = countSlots(slots);
    log(`FIXED ROTA slot counts: ${JSON.stringify(counts)}`, options.verbose, true);

    // Convert to template slot format
    const templateSlots = slots.map((slot) => {
      const templateSlot: Record<string, unknown> = {
        dayOfWeek: slot.dayOfWeek,
        dayName: slot.day,
        startTime: slot.startTime,
        endTime: slot.endTime,
        courtIndex: slot.colIndex,
        slotType: slot.slotType,
        isASCSlot: slot.isASCSlot,
        sourceColumn: slot.column,
        sourceRow: slot.row,
      };

      if (slot.studentName) templateSlot.defaultStudentName = slot.studentName;
      if (slot.studentNames) templateSlot.defaultStudentNames = slot.studentNames;
      if (slot.availableCoach) templateSlot.availableCoach = slot.availableCoach;

      return templateSlot;
    });

    const template = {
      name: "Default Weekly Schedule",
      description: "Imported from FIXED ROTA sheet",
      isActive: true,
      slots: templateSlots,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    if (!options.dryRun) {
      await db.collection("timetable_templates").add(template);
    }

    result.recordsCreated = 1;
    log(`Created template with ${templateSlots.length} slots`, options.verbose);
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

      // Actual Excel columns: "Block Booking Name", "Amount of sessions", "Dates"
      const studentName =
        (row["Block Booking Name"] as string) ||
        (row["Student Name"] as string) ||
        (row["Name"] as string) ||
        "";

      // No parent info in this sheet - will need to match later
      const parentName = "Unknown";
      const parentEmail = "";
      const parentPhone = "";

      // Amount of sessions = total sessions remaining in the block
      const sessionCount = parseInt(
        (row["Amount of sessions"] as string) ||
        (row["Sessions"] as string) ||
        (row["Total Sessions"] as string) ||
        "0"
      ) || 0;

      // Parse usage dates (format like "20.1/ 27.1/")
      const usageDatesStr =
        (row["Dates"] as string) ||
        (row["Dates Used"] as string) ||
        "";
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

      // In Excel: "Amount of sessions" = remaining sessions
      // Dates = sessions already used
      // Total = remaining + used
      const usedSessions = usageHistory.length;
      const remainingSessions = sessionCount;
      const totalSessions = remainingSessions + usedSessions;

      // Estimate price (no payment data in sheet, use typical £25/session)
      const estimatedPrice = totalSessions * 2500;

      const blockBooking: Record<string, unknown> = {
        studentName,
        parentName: parentName || "Unknown",
        parentEmail: parentEmail || "",
        totalSessions,
        remainingSessions,
        usageHistory,
        totalPaid: estimatedPrice,
        pricePerSession: 2500, // £25 per session default
        status: remainingSessions > 0 ? "active" : "exhausted",
        purchasedAt: FieldValue.serverTimestamp(),
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      };
      if (parentPhone) blockBooking.parentPhone = parentPhone;

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
 * Excel structure:
 *   Row 0: Headers ["GDS", null, null, null, "DATES", "NUMBERS", "PLAYER OF THE SESSION", ...]
 *   Row 1+: Age group headers (like "Y1 - Y2") or student names in column A
 *   Column A contains both age group labels and student names interspersed
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
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as unknown[][];
    const batch = db.batch();

    // Age group patterns
    const ageGroupPattern = /^Y\d+\s*[-–]\s*Y\d+$/i;
    let currentAgeGroup = "Y3-Y4"; // default

    // Skip header row (row 0), process from row 1
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (!row || row.length === 0) continue;

      const firstCell = (row[0] || "").toString().trim();
      if (!firstCell) continue;

      result.recordsProcessed++;

      // Check if this is an age group header
      if (ageGroupPattern.test(firstCell) || firstCell.toUpperCase() === "GDS") {
        currentAgeGroup = firstCell;
        result.recordsSkipped++;
        continue;
      }

      // Skip known non-student rows
      if (firstCell.toLowerCase().includes("cancelled") ||
          firstCell.toLowerCase() === "dates" ||
          firstCell.toLowerCase().includes("player of")) {
        result.recordsSkipped++;
        continue;
      }

      // This should be a student name
      const studentName = firstCell;

      const student = {
        studentName,
        day,
        ageGroup: currentAgeGroup,
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
        `  GDS Student: ${studentName} (${day}, ${currentAgeGroup})`,
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
 * Excel structure:
 *   Row 0: ["January", "Revenue ASC", "Revenue GDS", "Revenue 121", "Revenue Total",
 *           "Expenses ASC", "Expenses GDS", "Expenses 121", "Expenses Total", "Total Gross Profit"]
 *   Row 1+: ["Mon 5th", 89.3, 0, 0, 89.3, 39.75, 0, 23, 62.75, "£26.55"]
 *   First column has "January" header but contains day descriptions like "Mon 5th"
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

    // Month from first column header - extract to get year context
    const currentYear = new Date().getFullYear();
    let currentMonth = 0; // January = 0

    // Day name mapping for parsing "Mon 5th" etc
    const dayNameMap: { [key: string]: number } = {
      mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6, sun: 0,
      monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6, sunday: 0,
    };

    for (const row of data) {
      result.recordsProcessed++;

      // First column could be named "January", "February", etc. based on month
      // Value is like "Mon 5th", "Tues 6th", etc.
      const dateCell =
        (row["January"] as string) ||
        (row["February"] as string) ||
        (row["March"] as string) ||
        (row["Date"] as string) ||
        "";

      if (!dateCell || typeof dateCell !== "string") {
        result.recordsSkipped++;
        continue;
      }

      // Parse "Mon 5th" format
      const match = dateCell.match(/^(\w+)\s+(\d+)/);
      if (!match) {
        result.recordsSkipped++;
        continue;
      }

      const dayName = match[1].toLowerCase();
      const dayNum = parseInt(match[2]);
      const dayOfWeek = dayNameMap[dayName];

      if (dayOfWeek === undefined || !dayNum) {
        result.recordsSkipped++;
        continue;
      }

      // Construct date (assume January 2026 for now based on sample)
      const date = new Date(currentYear, currentMonth, dayNum);
      const dateStr = formatDateString(date);

      // Parse revenue columns (actual column names from Excel)
      const ascIncome = parseCurrency(row["Revenue ASC"] as string | number || 0);
      const gdsIncome = parseCurrency(row["Revenue GDS"] as string | number || 0);
      const oneToOneIncome = parseCurrency(row["Revenue 121"] as string | number || 0);
      const revenueTotal = parseCurrency(row["Revenue Total"] as string | number || 0);

      // Parse expense columns
      const ascExpenses = parseCurrency(row["Expenses ASC"] as string | number || 0);
      const gdsExpenses = parseCurrency(row["Expenses GDS"] as string | number || 0);
      const oneToOneExpenses = parseCurrency(row["Expenses 121"] as string | number || 0);
      const expenseTotal = parseCurrency(row["Expenses Total"] as string | number || 0);

      const financial = {
        date: dateStr,
        dayOfWeek,
        dayName: date.toLocaleDateString("en-GB", { weekday: "long" }),
        income: {
          asc: ascIncome,
          gds: gdsIncome,
          oneToOne: oneToOneIncome,
          other: 0,
          total: revenueTotal || (ascIncome + gdsIncome + oneToOneIncome),
        },
        expenses: {
          asc: ascExpenses,
          gds: gdsExpenses,
          oneToOne: oneToOneExpenses,
          coachWages: 0,
          equipment: 0,
          venue: 0,
          other: 0,
          total: expenseTotal || (ascExpenses + gdsExpenses + oneToOneExpenses),
        },
        grossProfit: (revenueTotal || (ascIncome + gdsIncome + oneToOneIncome)) -
                     (expenseTotal || (ascExpenses + gdsExpenses + oneToOneExpenses)),
        isVerified: false,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      };

      if (!options.dryRun) {
        const docRef = db.collection("daily_financials").doc(dateStr);
        batch.set(docRef, financial);
      }

      result.recordsCreated++;
      log(
        `  Financial: ${dateStr} - Income: £${financial.income.total / 100}, Expenses: £${financial.expenses.total / 100}`,
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
 * Excel structure (2026):
 *   Row 0: [null, "Pay", "Leyah", "Luca", "Kadeem", "Shaka", "Harley", "CAM", "Harry", "Ili", "ALFIE"]
 *   Row 1: [null, null, 30, 15, 12.5, 12.5, 15, 12.5, 15, 12.5, 6] - hourly rates
 *   Row 4+: [46023, hours, hours, hours, ...] - first col is Excel serial date
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

    // Row 0 has coach names starting at column 2 (skip null and "Pay")
    const headerRow = data[0] as (string | null)[];
    const ratesRow = data[1] as (number | null)[];

    if (!headerRow || headerRow.length < 3) {
      result.errors.push("Could not find coach columns in header");
      return result;
    }

    // Build coach column mapping from header row
    // Format: { columnIndex: { name: "LEYAH", rate: 3000 } }
    const coachColumns: { [idx: number]: { name: string; rate: number } } = {};

    for (let i = 2; i < headerRow.length; i++) {
      const coachName = (headerRow[i] || "").toString().trim().toUpperCase();
      if (!coachName) continue;

      const rateValue = ratesRow?.[i];
      const hourlyRate = typeof rateValue === "number"
        ? Math.round(rateValue * 100) // Convert to pence
        : 1500; // Default £15/hr

      coachColumns[i] = { name: coachName, rate: hourlyRate };
    }

    if (Object.keys(coachColumns).length === 0) {
      result.errors.push("Could not find coach columns in header");
      return result;
    }

    log(`Found ${Object.keys(coachColumns).length} coaches with rates`, options.verbose, true);

    // Day name mapping for parsing "Mon 5th" style dates
    const dayNameMap: { [key: string]: number } = {
      mon: 1, tue: 2, tues: 2, wed: 3, thu: 4, thurs: 4, fri: 5, friday: 5, sat: 6, sun: 0,
      monday: 1, tuesday: 2, wednesday: 3, thursday: 4, saturday: 6, sunday: 0,
    };

    // Process data rows starting from row 5 (row 4 is a repeated header with coach names)
    let currentMonth = 0; // January
    for (let rowIdx = 5; rowIdx < data.length; rowIdx++) {
      const row = data[rowIdx] as (number | string | null)[];
      if (!row || row.length === 0) continue;

      const dateValue = row[0];
      if (!dateValue) continue;

      let date: Date;

      // Check if it's an Excel serial date number
      if (typeof dateValue === "number" && dateValue > 40000) {
        date = parseExcelDate(dateValue);
      } else if (typeof dateValue === "string") {
        // Parse "Mon 5th", "Tues 6th" style dates
        const match = dateValue.match(/^(\w+)\s+(\d+)/);
        if (!match) continue;

        const dayName = match[1].toLowerCase();
        const dayNum = parseInt(match[2]);

        if (dayNameMap[dayName] === undefined || !dayNum) continue;

        // Construct date using current month
        date = new Date(year, currentMonth, dayNum);

        // If day number seems to reset, we might be in a new month
        // Simple heuristic: if day < 5 and previous was > 25, advance month
      } else {
        continue;
      }

      if (isNaN(date.getTime())) continue;

      // Only process dates from the target year
      if (date.getFullYear() !== year) continue;

      const dateStr = formatDateString(date);

      // Process each coach's hours for this day
      for (const [colIdxStr, coachData] of Object.entries(coachColumns)) {
        const colIdx = parseInt(colIdxStr);
        const hoursValue = row[colIdx];
        if (hoursValue === null || hoursValue === undefined || hoursValue === "") continue;

        const hours = typeof hoursValue === "number" ? hoursValue : parseHours(hoursValue.toString());
        if (hours <= 0) continue;

        result.recordsProcessed++;

        // Normalize coach name and get info
        const coachInfo = getCoachInfo(coachData.name);
        const coachId = coachInfo?.id || `coach_${coachData.name.toLowerCase().replace(/\s+/g, "_")}`;
        const coachName = coachInfo?.abbreviation || coachData.name;
        const hourlyRate = coachData.rate;

        // Create coach rate if not already created
        if (!processedRates.has(coachId) && !options.dryRun) {
          const rateRef = db.collection("coach_rates").doc();
          ratesBatch.set(rateRef, {
            coachId,
            coachName,
            hourlyRate,
            effectiveFrom: Timestamp.fromDate(new Date(year, 0, 1)),
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
          });
          processedRates.add(coachId);
        }

        const hoursDoc = {
          coachId,
          coachName,
          date: dateStr,
          hoursWorked: hours,
          hourlyRate,
          earnings: Math.round(hours * hourlyRate),
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
          `  Hours: ${coachName} on ${dateStr} - ${hours}h @ £${hourlyRate / 100}/hr`,
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
 * Excel structure:
 *   Row 0: [null, "TAKE THE NEXT STEP CALENDAR AND WINNERS"]
 *   Row 1: [null, "CHALLENGE", null, null, "CHALLENGE WINNER", null, null, "121 OF THE WEEK"]
 *   Row 2+: ["WEEK 1", "CROSSBAR CHALLENGE", null, null, "N/A", null, null, "N/A"]
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
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as unknown[][];
    const batch = db.batch();

    const currentYear = new Date().getFullYear();

    // Process each row looking for "WEEK N" pattern
    for (let i = 2; i < data.length; i++) {
      const row = data[i];
      if (!row || row.length === 0) continue;

      const weekCell = (row[0] || "").toString().trim();
      const weekMatch = weekCell.match(/WEEK\s*(\d+)/i);

      if (!weekMatch) continue;

      result.recordsProcessed++;

      const weekNumber = parseInt(weekMatch[1]);
      const challengeName = (row[1] || "").toString().trim();
      const challengeWinner = (row[4] || "").toString().trim();
      const oneToOneOfWeek = (row[7] || "").toString().trim();

      // Skip if no valid winner data
      if (challengeWinner.toLowerCase() === "n/a" && oneToOneOfWeek.toLowerCase() === "n/a") {
        result.recordsSkipped++;
        continue;
      }

      // Calculate week start date from week number (approximate)
      const weekStart = new Date(currentYear, 0, 1 + (weekNumber - 1) * 7);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);

      const challenges: Array<{
        challengeType: string;
        challengeName: string;
        winnerName: string;
      }> = [];

      if (challengeWinner && challengeWinner.toLowerCase() !== "n/a") {
        challenges.push({
          challengeType: challengeName.toLowerCase().replace(/\s+/g, "_"),
          challengeName,
          winnerName: challengeWinner,
        });
      }

      const challenge: Record<string, unknown> = {
        weekNumber,
        weekStart: formatDateString(weekStart),
        weekEnd: formatDateString(weekEnd),
        year: currentYear,
        isHalfTerm: false,
        challenges,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      };
      if (oneToOneOfWeek && oneToOneOfWeek.toLowerCase() !== "n/a") {
        challenge.oneToOneOfWeek = { studentName: oneToOneOfWeek };
      }

      if (!options.dryRun) {
        const docRef = db.collection("weekly_challenges").doc();
        batch.set(docRef, challenge);
      }

      result.recordsCreated++;
      log(
        `  Challenge week ${weekNumber}: ${challengeName} winner: ${challengeWinner}, 121: ${oneToOneOfWeek}`,
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
 * Excel structure:
 *   Row 0: ["COACH OF THE MONTH - £30"]
 *   Row 1: ["MONTH", "COACH"]
 *   Row 2+: ["SEPTEMBER", "Harley"]
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
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as unknown[][];
    const batch = db.batch();

    // Month name to number mapping
    const monthNameMap: { [key: string]: number } = {
      january: 1, february: 2, march: 3, april: 4, may: 5, june: 6,
      july: 7, august: 8, september: 9, october: 10, november: 11, december: 12,
      jan: 1, feb: 2, mar: 3, apr: 4, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
    };

    const currentYear = new Date().getFullYear();
    // Assume awards are for the academic year starting Sept previous year
    const academicYearStart = currentYear - 1;

    // Skip header rows (0 = title, 1 = column headers), start from row 2
    for (let i = 2; i < data.length; i++) {
      const row = data[i];
      if (!row || row.length < 2) continue;

      const monthName = (row[0] || "").toString().trim();
      const coachName = (row[1] || "").toString().trim();

      if (!monthName || !coachName) continue;

      result.recordsProcessed++;

      const monthNum = monthNameMap[monthName.toLowerCase()];
      if (!monthNum) {
        result.recordsSkipped++;
        continue;
      }

      // Determine year based on month (Sept-Dec = previous year, Jan-Aug = current year)
      const year = monthNum >= 9 ? academicYearStart : currentYear;
      const monthStr = `${year}-${String(monthNum).padStart(2, "0")}`;

      const coachInfo = getCoachInfo(coachName);

      const award = {
        awardType: "coach_of_month",
        month: monthStr,
        coachId: coachInfo?.id || "unknown",
        coachName: coachInfo?.abbreviation || coachName,
        prize: 3000, // £30 as stated in header
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

      // Actual Excel columns: "Names", "Catch up", "Next Step"
      const studentName =
        (row["Names"] as string) ||
        (row["Name"] as string) ||
        (row["Student"] as string) ||
        "";

      // No parent info in this sheet
      const parentName = "";
      const parentEmail = "";
      const parentPhone = "";

      // "Catch up" column contains the follow-up date
      const catchUpRaw = row["Catch up"] as string | number || "";

      // "Next Step" column contains progress notes
      const notes =
        (row["Next Step"] as string) ||
        (row["Notes"] as string) ||
        "";

      // No explicit reason column - infer from notes
      const reason = "";

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

      // Parse catch up date
      let catchUpDateStr = "";
      if (catchUpRaw) {
        const date = parseExcelDate(catchUpRaw);
        if (!isNaN(date.getTime())) {
          catchUpDateStr = formatDateString(date);
        }
      }

      const lostCustomer: Record<string, unknown> = {
        studentName,
        parentName: parentName || "Unknown",
        parentEmail: parentEmail || "",
        lostReason,
        lostAt: FieldValue.serverTimestamp(),
        status: catchUpDateStr ? "follow_up_scheduled" : "lost",
        followUpHistory: [],
        totalFollowUps: 0,
        priority: 2, // Default medium priority
        addedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      };
      if (parentPhone) lostCustomer.parentPhone = parentPhone;
      if (reason) lostCustomer.lostReasonDetails = reason;
      if (catchUpDateStr) lostCustomer.catchUpDate = catchUpDateStr;
      if (notes) lostCustomer.nextStepNotes = notes;

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
      parser: parseWeeklyRotaV2,
    },
    {
      patterns: ["FIXED ROTA", "Fixed Rota", "fixed rota"],
      parser: parseFixedRotaV2,
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
