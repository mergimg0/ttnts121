/**
 * Excel Utilities for Rota Parsing
 *
 * Handles complex merged-cell Excel structures for Weekly rota and FIXED ROTA sheets.
 */

import XLSX from "xlsx";

// ============================================================================
// TYPES
// ============================================================================

export interface MergedCellInfo {
  startCell: string;   // "B4"
  endCell: string;     // "G4"
  startCol: number;    // 1 (0-indexed)
  endCol: number;      // 6
  row: number;         // 3 (0-indexed)
  value: string;       // "Monday - Alfie on camera"
}

export interface DayColumnRange {
  day: string;         // "Monday"
  dayOfWeek: number;   // 1
  startCol: number;    // 1 (0-indexed)
  endCol: number;      // 6
  columns: string[];   // ["B", "C", "D", "E", "F", "G"]
  notes?: string;      // "Alfie on camera"
}

export interface ASCTime {
  column: string;      // "B"
  colIndex: number;    // 1 (0-indexed)
  startTime: string;   // "15:00"
  endTime: string;     // "16:30"
  day: string;         // "Monday"
}

export interface ParsedCellValue {
  slotType: "booked" | "available" | "gds" | "obs" | "asc" | "empty";
  studentName?: string;
  studentNames?: string[];       // If multiple (shared session)
  availableCoach?: string;       // "N" for Nathan, "A" for Antony
  embeddedTime?: {               // For Friday pattern
    startTime: string;           // "16:00"
    endTime: string;             // "17:00"
  };
  rawValue: string;
}

export interface TimeSlotContext {
  rowIndex: number;              // 5 for row 6
  colIndex: number;              // 1 for column B
  columnATime: string | null;    // "17.00 - 18.00"
  ascTimes: ASCTime[];
  parsedValue: ParsedCellValue;
  day: string;
}

export interface ResolvedTimeSlot {
  startTime: string;             // "17:00"
  endTime: string;               // "18:00"
  isASCSlot: boolean;
  source: "columnA" | "asc" | "embedded";
}

export interface RawRotaSlot {
  day: string;
  dayOfWeek: number;
  colIndex: number;
  column: string;
  rowIndex: number;
  row: number;
  startTime: string;
  endTime: string;
  isASCSlot: boolean;
  slotType: string;
  studentName?: string;
  studentNames?: string[];
  availableCoach?: string;
  rawValue: string;
}

// ============================================================================
// COLUMN UTILITIES
// ============================================================================

/**
 * Convert column index to letter (0 = A, 1 = B, etc.)
 */
export function colIndexToLetter(index: number): string {
  let letter = "";
  let temp = index;
  while (temp >= 0) {
    letter = String.fromCharCode((temp % 26) + 65) + letter;
    temp = Math.floor(temp / 26) - 1;
  }
  return letter;
}

/**
 * Convert column letter to index (A = 0, B = 1, etc.)
 */
export function letterToColIndex(letter: string): number {
  let index = 0;
  for (let i = 0; i < letter.length; i++) {
    index = index * 26 + (letter.charCodeAt(i) - 64);
  }
  return index - 1;
}

// ============================================================================
// MERGED CELL PARSER
// ============================================================================

/**
 * Get all merged cell ranges from a worksheet
 */
export function getMergedCellRanges(sheet: XLSX.WorkSheet): MergedCellInfo[] {
  const merges = sheet["!merges"] || [];
  const results: MergedCellInfo[] = [];

  for (const merge of merges) {
    const startCol = merge.s.c;
    const endCol = merge.e.c;
    const row = merge.s.r;

    const startCell = colIndexToLetter(startCol) + (row + 1);
    const endCell = colIndexToLetter(endCol) + (row + 1);

    // Get the value from the start cell
    const cellRef = startCell;
    const cell = sheet[cellRef];
    const value = cell ? String(cell.v || "") : "";

    results.push({
      startCell,
      endCell,
      startCol,
      endCol,
      row,
      value,
    });
  }

  return results;
}

/**
 * Get day-to-column mapping from merged cell headers (Row 4)
 */
export function getDayColumnRanges(sheet: XLSX.WorkSheet): DayColumnRange[] {
  const merges = getMergedCellRanges(sheet);
  const dayRanges: DayColumnRange[] = [];

  const dayNames: { [key: string]: number } = {
    monday: 1,
    tuesday: 2,
    wednesday: 3,
    thursday: 4,
    friday: 5,
    saturday: 6,
    sunday: 0,
  };

  // Find merged cells in row 4 (index 3) that contain day names
  for (const merge of merges) {
    if (merge.row !== 3) continue; // Row 4 = index 3

    const value = merge.value.toLowerCase();

    // Extract day name from value like "Monday - Alfie on camera"
    for (const [dayName, dayOfWeek] of Object.entries(dayNames)) {
      if (value.includes(dayName)) {
        const columns: string[] = [];
        for (let c = merge.startCol; c <= merge.endCol; c++) {
          columns.push(colIndexToLetter(c));
        }

        // Extract notes (everything after the dash)
        let notes: string | undefined;
        const dashIndex = merge.value.indexOf("-");
        if (dashIndex > 0) {
          notes = merge.value.substring(dashIndex + 1).trim();
        }

        dayRanges.push({
          day: dayName.charAt(0).toUpperCase() + dayName.slice(1),
          dayOfWeek,
          startCol: merge.startCol,
          endCol: merge.endCol,
          columns,
          notes,
        });
        break;
      }
    }
  }

  // Sort by startCol to ensure consistent order
  dayRanges.sort((a, b) => a.startCol - b.startCol);

  return dayRanges;
}

/**
 * Get day name for a given column index
 */
export function getColumnDay(colIndex: number, dayRanges: DayColumnRange[]): DayColumnRange | null {
  for (const range of dayRanges) {
    if (colIndex >= range.startCol && colIndex <= range.endCol) {
      return range;
    }
  }
  return null;
}

// ============================================================================
// ASC TIME PARSER
// ============================================================================

/**
 * Normalize time format from "15.00" to "15:00"
 */
export function normalizeTimeFormat(time: string): string {
  if (!time) return "";
  return time.trim().replace(/\./g, ":").replace(/\s+/g, "");
}

/**
 * Parse time range string like "15.00 - 16.30" into start and end times
 */
export function parseTimeRange(timeStr: string): { start: string; end: string } | null {
  if (!timeStr) return null;

  const normalized = timeStr.replace(/\./g, ":");
  const match = normalized.match(/(\d{1,2}:\d{2})\s*[-–]\s*(\d{1,2}:\d{2})/);

  if (match) {
    return {
      start: match[1].padStart(5, "0"),
      end: match[2].padStart(5, "0"),
    };
  }
  return null;
}

/**
 * Get ASC times from Row 5 (index 4)
 */
export function getASCTimes(sheet: XLSX.WorkSheet, dayRanges: DayColumnRange[]): ASCTime[] {
  const ascTimes: ASCTime[] = [];
  const row = 4; // Row 5 = index 4

  // Scan all columns in the day ranges
  for (const dayRange of dayRanges) {
    for (let colIdx = dayRange.startCol; colIdx <= dayRange.endCol; colIdx++) {
      const cellRef = colIndexToLetter(colIdx) + (row + 1);
      const cell = sheet[cellRef];

      if (!cell || !cell.v) continue;

      const value = String(cell.v).trim();
      const timeRange = parseTimeRange(value);

      if (timeRange) {
        ascTimes.push({
          column: colIndexToLetter(colIdx),
          colIndex: colIdx,
          startTime: timeRange.start,
          endTime: timeRange.end,
          day: dayRange.day,
        });
      }
    }
  }

  return ascTimes;
}

// ============================================================================
// CELL VALUE PARSER
// ============================================================================

/**
 * Parse a cell value and extract slot type, student info, and embedded time
 */
export function parseCellValue(value: string | undefined | null): ParsedCellValue {
  if (!value || typeof value !== "string" || value.trim() === "") {
    return { slotType: "empty", rawValue: value || "" };
  }

  const trimmed = value.trim();
  const upper = trimmed.toUpperCase();

  // Check for special slot types
  if (upper === "GDS") {
    return { slotType: "gds", rawValue: trimmed };
  }
  if (upper === "OBS") {
    return { slotType: "obs", rawValue: trimmed };
  }
  if (upper.startsWith("AVAILABLE")) {
    const coachMatch = trimmed.match(/AVAILABLE\s*-\s*([A-Z])/i);
    return {
      slotType: "available",
      availableCoach: coachMatch ? coachMatch[1].toUpperCase() : undefined,
      rawValue: trimmed,
    };
  }

  // Skip section headers
  if (upper === "ASC" || upper === "COACHES" || upper.includes("TIMETABLE")) {
    return { slotType: "empty", rawValue: trimmed };
  }

  // Check for embedded time pattern: "Name (X-Y)"
  const timeMatch = trimmed.match(/^(.+?)\s*\((\d+)-(\d+)\)$/);
  if (timeMatch) {
    const studentName = timeMatch[1].trim();
    const startHour = parseInt(timeMatch[2]);
    const endHour = parseInt(timeMatch[3]);

    // Convert to 24h format (assume PM for typical coaching hours)
    const start24 = startHour < 12 ? startHour + 12 : startHour;
    const end24 = endHour < 12 ? endHour + 12 : endHour;

    return {
      slotType: "booked",
      studentName,
      embeddedTime: {
        startTime: `${start24}:00`,
        endTime: `${end24}:00`,
      },
      rawValue: trimmed,
    };
  }

  // Check for multiple students: "Name and Name" or "Name/Name"
  if (trimmed.toLowerCase().includes(" and ") || trimmed.includes("/")) {
    const separator = trimmed.toLowerCase().includes(" and ") ? / and /i : /\//;
    const names = trimmed.split(separator).map((n) => n.trim()).filter(Boolean);
    if (names.length > 1) {
      return {
        slotType: "booked",
        studentNames: names,
        rawValue: trimmed,
      };
    }
  }

  // Check for space-separated duo: "Quinn Seb"
  // Only if both parts are capitalized first names (not "Lewis M" which is single name)
  const parts = trimmed.split(/\s+/);
  if (
    parts.length === 2 &&
    /^[A-Z][a-z]+$/.test(parts[0]) &&
    /^[A-Z][a-z]+$/.test(parts[1])
  ) {
    return {
      slotType: "booked",
      studentNames: parts,
      rawValue: trimmed,
    };
  }

  // Default: single student booking
  return {
    slotType: "booked",
    studentName: trimmed,
    rawValue: trimmed,
  };
}

// ============================================================================
// TIME SLOT RESOLVER
// ============================================================================

/**
 * Resolve the correct time for a cell based on context
 * Priority: embedded time > ASC time > Column A time
 */
export function resolveTimeSlot(context: TimeSlotContext): ResolvedTimeSlot | null {
  const { colIndex, columnATime, ascTimes, parsedValue } = context;

  // 1. Check for embedded time (Friday pattern)
  if (parsedValue.embeddedTime) {
    return {
      startTime: parsedValue.embeddedTime.startTime,
      endTime: parsedValue.embeddedTime.endTime,
      isASCSlot: false,
      source: "embedded",
    };
  }

  // 2. Check for ASC time in this column
  const ascTime = ascTimes.find((t) => t.colIndex === colIndex);
  if (ascTime) {
    return {
      startTime: ascTime.startTime,
      endTime: ascTime.endTime,
      isASCSlot: true,
      source: "asc",
    };
  }

  // 3. Use Column A time
  if (columnATime) {
    const timeRange = parseTimeRange(columnATime);
    if (timeRange) {
      return {
        startTime: timeRange.start,
        endTime: timeRange.end,
        isASCSlot: false,
        source: "columnA",
      };
    }
  }

  return null;
}

// ============================================================================
// GRID WALKER
// ============================================================================

/**
 * Walk through the rota grid and yield structured slot data
 */
export function* walkRotaGrid(sheet: XLSX.WorkSheet): Generator<RawRotaSlot> {
  const dayRanges = getDayColumnRanges(sheet);

  if (dayRanges.length === 0) {
    console.warn("No day ranges found in sheet");
    return;
  }

  const ascTimes = getASCTimes(sheet, dayRanges);

  // Determine the column range to scan
  const minCol = Math.min(...dayRanges.map((d) => d.startCol));
  const maxCol = Math.max(...dayRanges.map((d) => d.endCol));

  // Data rows start at row 6 (index 5) - rows 6, 7, 8 contain slot data
  const dataRowStart = 5; // Row 6
  const dataRowEnd = 8;   // Row 9 (exclusive, so process 6, 7, 8)

  for (let rowIdx = dataRowStart; rowIdx < dataRowEnd; rowIdx++) {
    // Get Column A time for this row
    const colACell = sheet["A" + (rowIdx + 1)];
    const columnATime = colACell ? String(colACell.v || "").trim() : null;

    // Skip "COACHES" section header
    if (columnATime && columnATime.toUpperCase() === "COACHES") {
      break;
    }

    // Scan each column in the day ranges
    for (let colIdx = minCol; colIdx <= maxCol; colIdx++) {
      const dayRange = getColumnDay(colIdx, dayRanges);
      if (!dayRange) continue;

      const cellRef = colIndexToLetter(colIdx) + (rowIdx + 1);
      const cell = sheet[cellRef];

      if (!cell || !cell.v) continue;

      const rawValue = String(cell.v).trim();
      if (!rawValue) continue;

      const parsedValue = parseCellValue(rawValue);

      // Skip empty slots
      if (parsedValue.slotType === "empty") continue;

      const context: TimeSlotContext = {
        rowIndex: rowIdx,
        colIndex: colIdx,
        columnATime,
        ascTimes,
        parsedValue,
        day: dayRange.day,
      };

      const timeSlot = resolveTimeSlot(context);

      // For row 8, we may not have Column A time, so we need embedded time
      if (!timeSlot) {
        // Skip if we can't determine time
        continue;
      }

      yield {
        day: dayRange.day,
        dayOfWeek: dayRange.dayOfWeek,
        colIndex: colIdx,
        column: colIndexToLetter(colIdx),
        rowIndex: rowIdx,
        row: rowIdx + 1,
        startTime: timeSlot.startTime,
        endTime: timeSlot.endTime,
        isASCSlot: timeSlot.isASCSlot,
        slotType: parsedValue.slotType,
        studentName: parsedValue.studentName,
        studentNames: parsedValue.studentNames,
        availableCoach: parsedValue.availableCoach,
        rawValue,
      };
    }
  }
}

/**
 * Count slots by day and type for verification
 */
export function countSlots(slots: RawRotaSlot[]): Record<string, Record<string, number>> {
  const counts: Record<string, Record<string, number>> = {};

  for (const slot of slots) {
    if (!counts[slot.day]) {
      counts[slot.day] = { total: 0, booked: 0, gds: 0, obs: 0, available: 0, asc: 0 };
    }
    counts[slot.day].total++;
    counts[slot.day][slot.slotType]++;
  }

  return counts;
}
