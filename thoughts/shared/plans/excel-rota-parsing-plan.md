# Implementation Plan: Excel Rota Parsing (Weekly rota & FIXED ROTA)

Generated: 2026-01-29
Status: Ready for Implementation

## Executive Summary

The current Excel import script fails to parse the "Weekly rota" and "FIXED ROTA" sheets because they use a **grid-based layout with merged cells** rather than traditional row-per-record format. This plan provides a complete solution to parse these complex structures into Firebase documents.

---

## 1. Problem Analysis

### 1.1 Why Current Parser Fails

The existing `parseWeeklyRota()` and `parseFixedRota()` functions in `scripts/import-excel-data.ts` (lines 213-481) fail because:

1. **Incorrect header detection**: Looks for "TIME", "MONDAY" as column headers in a single row
2. **Assumes row-per-record format**: Uses `XLSX.utils.sheet_to_json()` which assumes tabular data
3. **Ignores merged cells**: Day names span multiple columns via merged cells
4. **Ignores ASC row**: Row 5 contains special After-School-Club times per column
5. **Ignores time-in-name pattern**: Friday slots have times embedded like "Ayaan (4-5)"

### 1.2 Actual Excel Structure

```
Row 3: [Title merged across all columns]
Row 4: [Monday---][Tuesday---][Wednesday---][Thursday---][Friday---]  (merged cells)
Row 5: [ASC][time][time]...[time]  (ASC times for specific columns)
Row 6: [17:00-18:00][student][student][GDS][student]...
Row 7: [18:00-19:00][student][student][student]...
Row 8: [empty][student (6-7)][student (6-7)]...  (Friday extra slots)
Row 9+: [COACHES] (coach schedule section - separate data)
```

---

## 2. Detailed Structure Documentation

### 2.1 FIXED ROTA Sheet

**Range**: A3:X1000
**Merged cells**: 6

| Merge Range | Value | Purpose |
|-------------|-------|---------|
| B3:X3 | "TAKE THE NEXT STEP 1 TO 1 TIMETABLE" | Title |
| B4:G4 | "Monday - Alfie on camera" | Monday header (cols B-G = 1-6) |
| H4:K4 | "Tuesday" | Tuesday header (cols H-K = 7-10) |
| L4:O4 | "Wednesday - Alfie on camera" | Wednesday header (cols L-O = 11-14) |
| P4:T4 | "Thursday" | Thursday header (cols P-T = 15-19) |
| U4:X4 | "Friday" | Friday header (cols U-X = 20-23) |

**Day-to-Column Mapping**:
```typescript
const FIXED_ROTA_DAY_COLUMNS = {
  Monday: { start: 1, end: 6, cols: ['B', 'C', 'D', 'E', 'F', 'G'] },
  Tuesday: { start: 7, end: 10, cols: ['H', 'I', 'J', 'K'] },
  Wednesday: { start: 11, end: 14, cols: ['L', 'M', 'N', 'O'] },
  Thursday: { start: 15, end: 19, cols: ['P', 'Q', 'R', 'S', 'T'] },
  Friday: { start: 20, end: 23, cols: ['U', 'V', 'W', 'X'] },
};
```

**Row 5 - ASC Times by Column**:
| Column | Time | Day |
|--------|------|-----|
| B | 15.00 - 16.30 | Monday |
| G | 15.00 - 16.30 | Monday |
| H | 15.00 - 16.30 | Tuesday |
| I | 15.30 - 16.30 | Tuesday |
| L | 15.15 - 16.15 | Wednesday |
| O | 15.15 - 16.15 | Wednesday |
| U | 13.30 - 15.30 | Friday |
| X | 13.30 - 15.30 | Friday |

**Data Rows**:
- Row 6: A = "17.00 - 18.00" - Main time slot 1
- Row 7: A = "18.00 - 19.00" - Main time slot 2
- Row 8: A = empty - Friday extra slots (6-7pm embedded in student names)
- Row 9: A = "COACHES" - Section break

### 2.2 Weekly rota Sheet

**Range**: A1:U1000
**Merged cells**: 6

Same structure as FIXED ROTA but with different column ranges:

| Merge Range | Value |
|-------------|-------|
| B3:U3 | Title |
| B4:F4 | Monday (cols 1-5) |
| G4:J4 | Tuesday (cols 6-9) |
| K4:N4 | Wednesday (cols 10-13) |
| O4:Q4 | Thursday (cols 14-16) |
| R4:U4 | Friday (cols 17-20) |

```typescript
const WEEKLY_ROTA_DAY_COLUMNS = {
  Monday: { start: 1, end: 5 },
  Tuesday: { start: 6, end: 9 },
  Wednesday: { start: 10, end: 13 },
  Thursday: { start: 14, end: 16 },
  Friday: { start: 17, end: 20 },
};
```

### 2.3 Cell Value Patterns

| Pattern | Example | Interpretation |
|---------|---------|----------------|
| Student name | "Zachary", "Lucas" | Booked 1:1 session |
| Student with time | "Ayaan (4-5)" | Booked at 4pm-5pm (Friday pattern) |
| Multiple students | "Quinn and Seb", "Quinn Seb" | Shared session or duo |
| Split student | "Byron/Claye" | Alternative students |
| GDS | "GDS" | Group Development Session |
| OBS | "OBS" | Observation slot |
| AVAILABLE | "AVAILABLE" | Open for booking |
| AVAILABLE - N | "AVAILABLE - N" | Nathan available |
| AVAILABLE - A | "AVAILABLE - A" | Antony available |
| Time range | "15.00 - 16.30" | ASC time in row 5 |

### 2.4 Friday Special Time Pattern

Friday embeds times in student names:
- `(4-5)` = 16:00-17:00
- `(5-6)` = 17:00-18:00
- `(6-7)` = 18:00-19:00

Row 8 contains overflow Friday slots (students with 6-7 time) even though column A is empty.

---

## 3. Data Model Mapping

### 3.1 Source: Excel Cell

Each non-empty cell in the data grid represents a **slot** with:
- **Day**: Determined by column position (via merged cell headers)
- **Time**: Determined by Row 5 (ASC) or Column A (standard), or embedded in name (Friday)
- **Court/Coach Index**: Column position within the day
- **Content**: Student name, GDS, OBS, AVAILABLE, etc.

### 3.2 Target: Firebase Documents

**Collection: `timetable_slots`** (Weekly rota - current week)

```typescript
interface TimetableSlot {
  id: string;                    // Auto-generated
  dayOfWeek: number;             // 1=Monday, 5=Friday
  dayName: string;               // "Monday", "Friday"
  startTime: string;             // "17:00" or "16:00"
  endTime: string;               // "18:00" or "17:00"
  courtIndex: number;            // 0-based index within day (column position)
  slotType: 'booked' | 'available' | 'gds' | 'obs' | 'asc';
  studentName?: string;          // If booked
  studentNames?: string[];       // If multiple (shared session)
  availableCoach?: string;       // If AVAILABLE - X pattern
  isASCSlot: boolean;            // True if ASC time
  weekStart: string;             // "2026-01-27" (Monday of this week)
  sourceColumn: string;          // "B", "C", etc. for debugging
  sourceRow: number;             // 6, 7, 8 for debugging
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

**Collection: `timetable_templates`** (FIXED ROTA - default schedule)

```typescript
interface TimetableTemplate {
  id: string;
  name: string;                  // "Default Weekly Schedule"
  description: string;
  isActive: boolean;
  slots: TimetableTemplateSlot[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

interface TimetableTemplateSlot {
  dayOfWeek: number;
  dayName: string;
  startTime: string;
  endTime: string;
  courtIndex: number;
  slotType: 'booked' | 'available' | 'gds' | 'obs' | 'asc';
  defaultStudentName?: string;
  defaultStudentNames?: string[];
  availableCoach?: string;
  isASCSlot: boolean;
  sourceColumn: string;
  sourceRow: number;
}
```

---

## 4. Implementation Tasks

### Phase 1: Parser Foundation (Tasks 1-5)

#### Task 1: Create Merged Cell Parser Utility
**File**: `scripts/lib/excel-utils.ts` (new file)
**Depends on**: None
**Acceptance Criteria**:
- [ ] Function `getMergedCellRanges(sheet)` returns array of merge info
- [ ] Function `getDayColumnRanges(sheet)` returns day-to-column mapping
- [ ] Function `getColumnDay(colIndex, dayRanges)` returns day name for column
- [ ] Unit tests pass

```typescript
// Implementation outline
interface MergedCellInfo {
  startCell: string;  // "B4"
  endCell: string;    // "G4"
  startCol: number;   // 1
  endCol: number;     // 6
  row: number;        // 3 (0-indexed)
  value: string;      // "Monday - Alfie on camera"
}

interface DayColumnRange {
  day: string;        // "Monday"
  dayOfWeek: number;  // 1
  startCol: number;   // 1
  endCol: number;     // 6
  columns: string[];  // ["B", "C", "D", "E", "F", "G"]
  notes?: string;     // "Alfie on camera"
}

export function getMergedCellRanges(sheet: XLSX.WorkSheet): MergedCellInfo[];
export function getDayColumnRanges(sheet: XLSX.WorkSheet): DayColumnRange[];
export function getColumnDay(colIndex: number, dayRanges: DayColumnRange[]): string | null;
```

#### Task 2: Create ASC Time Parser
**File**: `scripts/lib/excel-utils.ts`
**Depends on**: Task 1
**Acceptance Criteria**:
- [ ] Function `getASCTimes(sheet)` returns column-to-time mapping
- [ ] Parses row 5 (index 4) for time patterns
- [ ] Handles various time formats ("15.00 - 16.30", "15:00-16:30")
- [ ] Unit tests pass

```typescript
interface ASCTime {
  column: string;     // "B"
  colIndex: number;   // 1
  startTime: string;  // "15:00"
  endTime: string;    // "16:30"
  day: string;        // "Monday"
}

export function getASCTimes(sheet: XLSX.WorkSheet, dayRanges: DayColumnRange[]): ASCTime[];
export function normalizeTimeFormat(time: string): string; // "15.00" -> "15:00"
```

#### Task 3: Create Cell Value Parser
**File**: `scripts/lib/excel-utils.ts`
**Depends on**: None
**Acceptance Criteria**:
- [ ] Function `parseCellValue(value)` extracts slot type and student info
- [ ] Handles all patterns: student names, GDS, OBS, AVAILABLE, AVAILABLE - X
- [ ] Extracts embedded time from Friday pattern "Name (4-5)"
- [ ] Handles multiple students: "Quinn and Seb", "Byron/Claye"
- [ ] Unit tests for all patterns

```typescript
interface ParsedCellValue {
  slotType: 'booked' | 'available' | 'gds' | 'obs' | 'asc' | 'empty';
  studentName?: string;
  studentNames?: string[];      // If multiple
  availableCoach?: string;      // "N" for Nathan, "A" for Antony
  embeddedTime?: {              // For Friday pattern
    startTime: string;          // "16:00"
    endTime: string;            // "17:00"
  };
  rawValue: string;
}

export function parseCellValue(value: string | undefined | null): ParsedCellValue;
```

#### Task 4: Create Time Slot Resolver
**File**: `scripts/lib/excel-utils.ts`
**Depends on**: Tasks 2, 3
**Acceptance Criteria**:
- [ ] Function `resolveTimeSlot(...)` determines correct time for a cell
- [ ] Priority: embedded time > ASC time > column A time
- [ ] Handles Friday row 8 (empty column A) with embedded times
- [ ] Unit tests pass

```typescript
interface TimeSlotContext {
  rowIndex: number;           // 5 for row 6
  colIndex: number;           // 1 for column B
  columnATime: string | null; // "17.00 - 18.00"
  ascTimes: ASCTime[];
  parsedValue: ParsedCellValue;
  day: string;
}

interface ResolvedTimeSlot {
  startTime: string;          // "17:00"
  endTime: string;            // "18:00"
  isASCSlot: boolean;
  source: 'columnA' | 'asc' | 'embedded';
}

export function resolveTimeSlot(context: TimeSlotContext): ResolvedTimeSlot;
```

#### Task 5: Create Grid Walker
**File**: `scripts/lib/excel-utils.ts`
**Depends on**: Tasks 1-4
**Acceptance Criteria**:
- [ ] Function `walkRotaGrid(sheet)` iterates all data cells
- [ ] Yields structured slot data for each non-empty cell
- [ ] Skips title, header, and coach section rows
- [ ] Handles both FIXED ROTA and Weekly rota structures
- [ ] Unit tests pass

```typescript
interface RawRotaSlot {
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

export function* walkRotaGrid(sheet: XLSX.WorkSheet): Generator<RawRotaSlot>;
```

---

### Phase 2: Parser Implementation (Tasks 6-8)

#### Task 6: Implement parseWeeklyRotaV2()
**File**: `scripts/import-excel-data.ts`
**Depends on**: Tasks 1-5
**Acceptance Criteria**:
- [ ] New function `parseWeeklyRotaV2()` replaces old `parseWeeklyRota()`
- [ ] Uses `walkRotaGrid()` to iterate cells
- [ ] Creates `timetable_slots` documents with correct structure
- [ ] Includes `weekStart` for current week
- [ ] Dry run mode works correctly
- [ ] All slots have correct times (tested against known data)

```typescript
async function parseWeeklyRotaV2(
  db: FirebaseFirestore.Firestore,
  worksheet: XLSX.WorkSheet,
  options: ImportOptions
): Promise<ImportResult>;
```

**Expected output for sample data**:
- Monday 17:00-18:00: 5 slots (OBS, AVAILABLE, GDS, GDS, Quinn Seb)
- Monday 18:00-18:00: 5 slots (GDS, AVAILABLE, Felix, GDS, Felipe)
- ...etc for all days

#### Task 7: Implement parseFixedRotaV2()
**File**: `scripts/import-excel-data.ts`
**Depends on**: Tasks 1-5
**Acceptance Criteria**:
- [ ] New function `parseFixedRotaV2()` replaces old `parseFixedRota()`
- [ ] Creates single `timetable_templates` document with all slots
- [ ] Template marked as `isActive: true`
- [ ] Slots include `defaultStudentName` for booked slots
- [ ] Dry run mode works correctly

```typescript
async function parseFixedRotaV2(
  db: FirebaseFirestore.Firestore,
  worksheet: XLSX.WorkSheet,
  options: ImportOptions
): Promise<ImportResult>;
```

#### Task 8: Update Main Import Router
**File**: `scripts/import-excel-data.ts`
**Depends on**: Tasks 6-7
**Acceptance Criteria**:
- [ ] Replace old parser references with V2 versions
- [ ] Remove old `parseWeeklyRota` and `parseFixedRota` functions
- [ ] Update sheetParsers array to use new functions
- [ ] Test full import with `--dry-run`

---

### Phase 3: Validation & Testing (Tasks 9-12)

#### Task 9: Create Test Data Snapshot
**File**: `scripts/tests/excel-rota-test-data.ts` (new file)
**Depends on**: None
**Acceptance Criteria**:
- [ ] Export known correct slot data for Monday-Friday
- [ ] Include edge cases: GDS, OBS, AVAILABLE - N, Friday embedded times
- [ ] Document expected counts per day/time

```typescript
export const EXPECTED_FIXED_ROTA_SLOTS = {
  Monday: {
    '17:00-18:00': [
      { col: 'B', student: 'Zachary', type: 'booked' },
      { col: 'C', student: null, type: 'gds' },
      // ...
    ],
    '18:00-19:00': [...],
  },
  // ...
};

export const EXPECTED_SLOT_COUNTS = {
  Monday: { total: 12, booked: 8, gds: 2, available: 2 },
  Tuesday: { total: 8, booked: 8, gds: 0, available: 0 },
  Wednesday: { total: 8, booked: 6, gds: 2, available: 0 },
  Thursday: { total: 10, booked: 5, gds: 0, available: 5 },
  Friday: { total: 12, booked: 10, gds: 0, available: 2 },
};
```

#### Task 10: Create Unit Tests for Excel Utilities
**File**: `scripts/tests/excel-utils.test.ts` (new file)
**Depends on**: Tasks 1-5, Task 9
**Acceptance Criteria**:
- [ ] Tests for `getMergedCellRanges()` with mocked sheet
- [ ] Tests for `getDayColumnRanges()` with mocked sheet
- [ ] Tests for `parseCellValue()` with all patterns
- [ ] Tests for `resolveTimeSlot()` with various contexts
- [ ] Tests for `walkRotaGrid()` with mocked sheet
- [ ] All tests pass

#### Task 11: Create Integration Test
**File**: `scripts/tests/rota-import.test.ts` (new file)
**Depends on**: Tasks 6-8, Task 9
**Acceptance Criteria**:
- [ ] Test loads actual Excel file
- [ ] Test parses both sheets in dry-run mode
- [ ] Verify slot counts match expected
- [ ] Verify sample slots have correct values
- [ ] Test runs via `npm run test:import`

```typescript
describe('Rota Import Integration', () => {
  it('parses FIXED ROTA with correct slot counts', async () => {
    // ...
  });

  it('parses Weekly rota with correct slot counts', async () => {
    // ...
  });

  it('resolves Friday embedded times correctly', async () => {
    // ...
  });
});
```

#### Task 12: Manual Verification Script
**File**: `scripts/verify-rota-import.ts` (new file)
**Depends on**: Tasks 6-8
**Acceptance Criteria**:
- [ ] Script runs with `npx tsx scripts/verify-rota-import.ts`
- [ ] Outputs human-readable grid showing parsed data
- [ ] Highlights any potential parsing errors
- [ ] Compares parsed data to expected counts

```typescript
// Output format:
// FIXED ROTA VERIFICATION
// =======================
// Monday 17:00-18:00
//   B: Zachary (booked) ✓
//   C: GDS ✓
//   D: Henry (booked) ✓
//   E: AVAILABLE - N (available, coach: Nathan) ✓
//   F: GDS ✓
//   G: Quinn and Seb (booked, 2 students) ✓
//
// Monday 18:00-19:00
// ...
//
// Summary: 50 slots parsed, 50 expected ✓
```

---

### Phase 4: Cleanup & Documentation (Tasks 13-14)

#### Task 13: Remove Old Parser Code
**File**: `scripts/import-excel-data.ts`
**Depends on**: Tasks 9-12 (all tests passing)
**Acceptance Criteria**:
- [ ] Delete old `parseWeeklyRota()` function (lines 213-353)
- [ ] Delete old `parseFixedRota()` function (lines 358-481)
- [ ] Rename `parseWeeklyRotaV2` to `parseWeeklyRota`
- [ ] Rename `parseFixedRotaV2` to `parseFixedRota`
- [ ] Update JSDoc comments
- [ ] Full import still works

#### Task 14: Update Documentation
**File**: `scripts/README.md` or inline documentation
**Depends on**: Task 13
**Acceptance Criteria**:
- [ ] Document the grid structure of rota sheets
- [ ] Document how day-column mapping works
- [ ] Document the cell value patterns
- [ ] Document ASC and Friday special handling
- [ ] Add troubleshooting section for future changes

---

## 5. Test Cases

### 5.1 Cell Value Parsing Tests

| Input | Expected Type | Expected Student | Expected Coach |
|-------|---------------|------------------|----------------|
| "Zachary" | booked | "Zachary" | - |
| "GDS" | gds | - | - |
| "OBS" | obs | - | - |
| "AVAILABLE" | available | - | - |
| "AVAILABLE - N" | available | - | "N" (Nathan) |
| "AVAILABLE - A" | available | - | "A" (Antony) |
| "Quinn and Seb" | booked | - | - (studentNames: ["Quinn", "Seb"]) |
| "Quinn Seb" | booked | - | - (studentNames: ["Quinn", "Seb"]) |
| "Byron/Claye" | booked | - | - (studentNames: ["Byron", "Claye"]) |
| "Ayaan (4-5)" | booked | "Ayaan" | - (embeddedTime: 16:00-17:00) |
| "Edison (5-6)" | booked | "Edison" | - (embeddedTime: 17:00-18:00) |
| "Freya (6-7)" | booked | "Freya" | - (embeddedTime: 18:00-19:00) |
| "" | empty | - | - |
| null | empty | - | - |

### 5.2 Time Resolution Tests

| Row | Column A | ASC Row 5 | Cell Value | Expected Time |
|-----|----------|-----------|------------|---------------|
| 6 | 17:00-18:00 | - | "Lucas" | 17:00-18:00 |
| 7 | 18:00-19:00 | - | "Lucy" | 18:00-19:00 |
| 6 | 17:00-18:00 | 15:00-16:30 (col B) | "Zachary" | 15:00-16:30 (ASC priority) |
| 6 | 17:00-18:00 | - | "Ayaan (4-5)" | 16:00-17:00 (embedded priority) |
| 8 | (empty) | - | "Stanley (6-7)" | 18:00-19:00 (embedded only) |

### 5.3 Expected Slot Counts (FIXED ROTA)

| Day | 17:00-18:00 | 18:00-19:00 | ASC | Total |
|-----|-------------|-------------|-----|-------|
| Monday | 6 | 6 | 2 | 14 |
| Tuesday | 4 | 4 | 2 | 10 |
| Wednesday | 4 | 4 | 2 | 10 |
| Thursday | 5 | 5 | 0 | 10 |
| Friday | 4 | 4 | 4 | 12 |
| **Total** | | | | **56** |

---

## 6. Rollback Procedure

If the new parser introduces bugs:

1. **Git revert**: `git revert <commit-hash>` for parser changes
2. **Firebase cleanup**:
   ```bash
   # Delete timetable_slots created by faulty import
   firebase firestore:delete timetable_slots --recursive

   # Delete timetable_templates
   firebase firestore:delete timetable_templates --recursive
   ```
3. **Re-import with old parser**: The old parser will create 0 records (known issue) but won't corrupt data

---

## 7. Dependencies

### NPM Packages (already installed)
- `xlsx`: Excel parsing (version ^0.18.5)
- `firebase-admin`: Firebase SDK

### Files to Modify
1. `scripts/import-excel-data.ts` - Main import script
2. NEW: `scripts/lib/excel-utils.ts` - Utility functions
3. NEW: `scripts/tests/excel-utils.test.ts` - Unit tests
4. NEW: `scripts/tests/rota-import.test.ts` - Integration tests
5. NEW: `scripts/tests/excel-rota-test-data.ts` - Test fixtures
6. NEW: `scripts/verify-rota-import.ts` - Manual verification

---

## 8. Estimated Complexity

| Phase | Tasks | Estimated Time | Risk |
|-------|-------|----------------|------|
| Phase 1: Foundation | 5 | 2-3 hours | Low |
| Phase 2: Implementation | 3 | 2-3 hours | Medium |
| Phase 3: Testing | 4 | 2-3 hours | Low |
| Phase 4: Cleanup | 2 | 30 min | Low |
| **Total** | **14** | **7-9 hours** | **Medium** |

### Risk Factors
- **Medium**: Friday time parsing - embedded times require careful regex
- **Low**: Column ranges may differ slightly between Weekly/FIXED sheets
- **Low**: Future Excel format changes could break parser

---

## 9. Implementation Order

```
Task 1 (Merged Cell Parser)
    ↓
Task 2 (ASC Time Parser) ← depends on Task 1
    ↓
Task 3 (Cell Value Parser) ← independent
    ↓
Task 4 (Time Slot Resolver) ← depends on Tasks 2, 3
    ↓
Task 5 (Grid Walker) ← depends on Tasks 1-4
    ↓
Task 6 (parseWeeklyRotaV2) ← depends on Task 5
    ↓
Task 7 (parseFixedRotaV2) ← depends on Task 5
    ↓
Task 8 (Update Router) ← depends on Tasks 6, 7
    ↓
Task 9 (Test Data) ← independent (can start anytime)
    ↓
Task 10 (Unit Tests) ← depends on Tasks 1-5, 9
    ↓
Task 11 (Integration Test) ← depends on Tasks 6-8, 9
    ↓
Task 12 (Verification Script) ← depends on Tasks 6-8
    ↓
Task 13 (Cleanup) ← depends on Tasks 10-12 passing
    ↓
Task 14 (Documentation) ← depends on Task 13
```

---

## 10. Quick Reference: Column-to-Day Mapping

### FIXED ROTA (B4:X)
```
Monday:    B C D E F G     (cols 1-6)
Tuesday:   H I J K         (cols 7-10)
Wednesday: L M N O         (cols 11-14)
Thursday:  P Q R S T       (cols 15-19)
Friday:    U V W X         (cols 20-23)
```

### Weekly rota (B4:U)
```
Monday:    B C D E F       (cols 1-5)
Tuesday:   G H I J         (cols 6-9)
Wednesday: K L M N         (cols 10-13)
Thursday:  O P Q           (cols 14-16)
Friday:    R S T U         (cols 17-20)
```

---

## 11. Sample Implementation: parseCellValue()

```typescript
export function parseCellValue(value: string | undefined | null): ParsedCellValue {
  if (!value || typeof value !== 'string' || value.trim() === '') {
    return { slotType: 'empty', rawValue: value || '' };
  }

  const trimmed = value.trim();
  const upper = trimmed.toUpperCase();

  // Check for special slot types
  if (upper === 'GDS') {
    return { slotType: 'gds', rawValue: trimmed };
  }
  if (upper === 'OBS') {
    return { slotType: 'obs', rawValue: trimmed };
  }
  if (upper.startsWith('AVAILABLE')) {
    const coachMatch = trimmed.match(/AVAILABLE\s*-\s*([A-Z])/i);
    return {
      slotType: 'available',
      availableCoach: coachMatch ? coachMatch[1].toUpperCase() : undefined,
      rawValue: trimmed,
    };
  }

  // Check for embedded time pattern: "Name (X-Y)"
  const timeMatch = trimmed.match(/^(.+?)\s*\((\d+)-(\d+)\)$/);
  if (timeMatch) {
    const studentName = timeMatch[1].trim();
    const startHour = parseInt(timeMatch[2]) + 12; // Convert to 24h (4 -> 16)
    const endHour = parseInt(timeMatch[3]) + 12;
    return {
      slotType: 'booked',
      studentName,
      embeddedTime: {
        startTime: `${startHour}:00`,
        endTime: `${endHour}:00`,
      },
      rawValue: trimmed,
    };
  }

  // Check for multiple students: "Name and Name" or "Name/Name"
  if (trimmed.includes(' and ') || trimmed.includes('/')) {
    const separator = trimmed.includes(' and ') ? / and /i : /\//;
    const names = trimmed.split(separator).map(n => n.trim()).filter(Boolean);
    if (names.length > 1) {
      return {
        slotType: 'booked',
        studentNames: names,
        rawValue: trimmed,
      };
    }
  }

  // Check for space-separated duo (common pattern): "Quinn Seb"
  // Only if both parts are capitalized names (not "Lewis M" which is a single name)
  const parts = trimmed.split(/\s+/);
  if (parts.length === 2 &&
      /^[A-Z][a-z]+$/.test(parts[0]) &&
      /^[A-Z][a-z]+$/.test(parts[1])) {
    return {
      slotType: 'booked',
      studentNames: parts,
      rawValue: trimmed,
    };
  }

  // Default: single student booking
  return {
    slotType: 'booked',
    studentName: trimmed,
    rawValue: trimmed,
  };
}
```

---

## 12. Appendix: Raw Data Samples

### FIXED ROTA Row 6 (17:00-18:00)
```
A: 17.00 - 18.00
B: Zachary
C: GDS
D: Henry
E: AVAILABLE - N
F: GDS
G: Quinn and Seb
H: Lucas
I: Taylor
J: Lewis M
K: Lewis O
L: Albie
M: Joey
N: (empty)
O: AVAILABLE
P: Stanley H
Q: George
R: AVAILABLE - N
S: AVAILABLE - A
T: Zach
U: Ayaan (4-5)
V: Ayaan (5-6)
W: (empty)
X: Theo (4-5)
```

### FIXED ROTA Row 7 (18:00-19:00)
```
A: 18.00 - 19.00
B: Felipe
C: GDS
D: Felix
E: AVAILABLE - N
F: GDS
G: Florence
H: Lucy
I: Abbie
J: Byron/Claye
K: Parker
L: Riley
M: Jack F
N: GDS
O: GDS
P: Alfie
Q: Shae
R: AVAILABLE - N
S: AVAILABLE - A
T: Arjun
U: Edison (5-6)
V: Hugo (5-6)
W: AVAILABLE - A
X: Lillia (5-6)
```

### FIXED ROTA Row 8 (Friday 6-7pm overflow)
```
A: (empty)
U: Stanley (6-7)
V: Jack Arron (6-7)
W: AVAILABLE - A
X: Freya (6-7)
```

---

*End of Implementation Plan*
