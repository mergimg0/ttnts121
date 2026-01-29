# Implementation Plan: Excel Timetable to Firebase Migration

Generated: 2026-01-29
Project: TTNTS121 (Take The Next Step 1-2-1 Football Coaching)

---

## Goal

Migrate the Excel-based operational management system ("121 weekly timetable.xlsx") to Firebase, integrating with the existing booking, attendance, and payment systems. This will enable:

1. Real-time timetable management with drag-drop UI
2. Automated coach hours tracking and payroll calculations
3. GDS (Group Development Sessions) attendance with player awards
4. Block booking session tracking with automatic deduction
5. Daily income/expense tracking by category
6. Weekly challenges and awards management
7. Customer retention (lost customer) tracking

---

## Research Summary

### Existing System Analysis

The codebase already has robust foundations:
- **Firebase setup**: Client SDK (`src/lib/firebase.ts`) + Admin SDK (`src/lib/firebase-admin.ts`)
- **19+ existing collections**: users, sessions, bookings, attendance, payments, programs, coupons, etc.
- **Type patterns**: All types in `src/types/` follow Timestamp | Date pattern with Create/Update input types
- **API patterns**: Next.js API routes in `src/app/api/` with consistent error handling
- **Admin UI**: Apple-esque design system in `src/components/admin/ui/`

### Excel Sheet Mapping

| Excel Sheet | Firebase Collection(s) | New/Existing |
|-------------|----------------------|--------------|
| Weekly rota | `timetable_slots`, `sessions` | NEW + Existing |
| FIXED ROTA | `timetable_templates` | NEW |
| Block Booking List | `block_bookings` | NEW |
| MONDAY/WED/SAT GDS | `gds_attendance`, `gds_curriculum` | NEW |
| Income and expenses | `daily_financials` | NEW |
| Monthly Hours 2025/2026 | `coach_hours`, `coach_rates` | NEW |
| Challenge Winners | `challenges`, `challenge_winners` | NEW |
| Coach of the month | `coach_awards` | NEW |
| Lost Customers | `lost_customers` | NEW |

---

## Database Schema Designs

### Phase 1: Core Timetable System

#### 1.1 `timetable_slots` Collection

```typescript
// src/types/timetable.ts

import { Timestamp } from "firebase/firestore";

// A single slot in the weekly timetable
export interface TimetableSlot {
  id: string;
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  startTime: string; // "15:00"
  endTime: string; // "16:00"
  coachId: string; // Reference to users collection (role: 'coach')
  coachName: string; // Denormalized for display
  slotType: "121" | "ASC" | "GDS" | "OBS" | "AVAILABLE";
  // For booked slots
  studentName?: string;
  bookingId?: string; // Link to existing bookings collection
  sessionId?: string; // Link to existing sessions collection
  // Metadata
  weekStart: string; // ISO date "2026-01-27" (Monday of the week)
  notes?: string;
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
}

// Weekly timetable view (computed)
export interface WeeklyTimetable {
  weekStart: string; // ISO date of Monday
  slots: TimetableSlot[];
  coaches: CoachSummary[];
}

export interface CoachSummary {
  id: string;
  name: string;
  abbreviation: string; // "VAL", "CIARAN", etc.
  totalSlots: number;
  bookedSlots: number;
  availableSlots: number;
}

export type CreateTimetableSlotInput = Omit<TimetableSlot, "id" | "createdAt" | "updatedAt">;
export type UpdateTimetableSlotInput = Partial<Omit<TimetableSlot, "id" | "createdAt">>;
```

#### 1.2 `timetable_templates` Collection (Fixed Rota)

```typescript
// Template for recurring weekly schedule
export interface TimetableTemplate {
  id: string;
  name: string; // "Default Weekly Schedule"
  isActive: boolean;
  slots: TemplateSlot[];
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
}

export interface TemplateSlot {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  coachId: string;
  coachName: string;
  slotType: "121" | "ASC" | "GDS" | "OBS" | "AVAILABLE";
  // Default student if recurring booking
  defaultStudentName?: string;
  defaultBookingId?: string;
}

export type CreateTemplateInput = Omit<TimetableTemplate, "id" | "createdAt" | "updatedAt">;
```

#### 1.3 `waiting_list` Collection

```typescript
// Students waiting for available slots
export interface WaitingListEntry {
  id: string;
  studentName: string;
  parentName: string;
  parentEmail: string;
  parentPhone: string;
  preferredDays?: number[]; // [1, 3, 5] = Mon, Wed, Fri
  preferredTimes?: string[]; // ["15:00", "16:00"]
  preferredCoaches?: string[]; // Coach user IDs
  notes?: string;
  status: "waiting" | "contacted" | "booked" | "cancelled";
  priority: number; // Lower = higher priority
  addedAt: Date | Timestamp;
  contactedAt?: Date | Timestamp;
  bookedAt?: Date | Timestamp;
}

export type CreateWaitingListInput = Omit<WaitingListEntry, "id" | "addedAt" | "status" | "priority">;
```

---

### Phase 2: Block Bookings System

#### 2.1 `block_bookings` Collection

```typescript
// src/types/block-booking.ts

import { Timestamp } from "firebase/firestore";

// Pre-paid block of sessions
export interface BlockBooking {
  id: string;
  studentName: string;
  parentName: string;
  parentEmail: string;
  parentPhone?: string;
  // Session tracking
  totalSessions: number;
  remainingSessions: number;
  // Usage history
  usageHistory: BlockBookingUsage[];
  // Payment
  totalPaid: number; // in pence
  pricePerSession: number; // in pence
  paymentMethod?: string;
  stripePaymentIntentId?: string;
  // Status
  status: "active" | "exhausted" | "expired" | "refunded";
  purchasedAt: Date | Timestamp;
  expiresAt?: Date | Timestamp; // Optional expiry
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
}

export interface BlockBookingUsage {
  usedAt: Date | Timestamp;
  sessionDate: string; // "2026-01-20"
  coachId?: string;
  coachName?: string;
  notes?: string;
  deductedBy?: string; // Admin who recorded usage
}

export type CreateBlockBookingInput = Omit<
  BlockBooking,
  "id" | "remainingSessions" | "usageHistory" | "status" | "createdAt" | "updatedAt"
>;

export interface DeductBlockSessionInput {
  blockBookingId: string;
  sessionDate: string;
  coachId?: string;
  coachName?: string;
  notes?: string;
}
```

---

### Phase 3: GDS (Group Development Sessions)

#### 3.1 `gds_attendance` Collection

```typescript
// src/types/gds.ts

import { Timestamp } from "firebase/firestore";

// GDS session types
export type GDSDay = "monday" | "wednesday" | "saturday";
export type GDSAgeGroup = "Y1-Y2" | "Y3-Y4" | "Y5-Y6" | "Y6-Y7" | "6-7" | "9-10";

// Attendance record for a single GDS session date
export interface GDSAttendance {
  id: string;
  day: GDSDay;
  ageGroup: GDSAgeGroup;
  sessionDate: string; // "2026-01-27"
  // Attendees
  attendees: GDSAttendee[];
  totalAttendees: number;
  // Player of the Session award
  playerOfSession?: {
    studentName: string;
    reason?: string;
    awardedBy?: string;
  };
  // Metadata
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
}

export interface GDSAttendee {
  studentName: string;
  studentId?: string; // If linked to users collection
  bookingId?: string; // If paid via booking system
  checkedIn: boolean;
  checkedInAt?: Date | Timestamp;
  notes?: string;
}

export type CreateGDSAttendanceInput = Omit<GDSAttendance, "id" | "createdAt" | "updatedAt">;
```

#### 3.2 `gds_curriculum` Collection

```typescript
// Training curriculum/drill schedule
export interface GDSCurriculum {
  id: string;
  day: GDSDay;
  // Date range for this curriculum block
  startDate: string; // "2026-01-01"
  endDate: string; // "2026-02-28"
  // Training focus
  focusArea: string; // "Passing and Receiving"
  // Weekly drill schedule
  drillSchedule: DrillScheduleEntry[];
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
}

export interface DrillScheduleEntry {
  weekNumber: number;
  date: string;
  drillName: string;
  drillDescription?: string;
  equipmentNeeded?: string[];
}

export type CreateGDSCurriculumInput = Omit<GDSCurriculum, "id" | "createdAt" | "updatedAt">;
```

#### 3.3 `gds_students` Collection (Roster)

```typescript
// Student enrolled in GDS
export interface GDSStudent {
  id: string;
  studentName: string;
  day: GDSDay;
  ageGroup: GDSAgeGroup;
  parentName?: string;
  parentEmail?: string;
  parentPhone?: string;
  // Attendance stats (denormalized for quick access)
  totalAttendances: number;
  playerOfSessionCount: number;
  // Status
  status: "active" | "inactive" | "trial";
  enrolledAt: Date | Timestamp;
  lastAttendedAt?: Date | Timestamp;
}

export type CreateGDSStudentInput = Omit<
  GDSStudent,
  "id" | "totalAttendances" | "playerOfSessionCount" | "enrolledAt" | "lastAttendedAt"
>;
```

---

### Phase 4: Coach Hours & Payroll

#### 4.1 `coach_rates` Collection

```typescript
// src/types/coach.ts

import { Timestamp } from "firebase/firestore";

// Coach hourly rate configuration
export interface CoachRate {
  id: string;
  coachId: string; // Reference to users collection
  coachName: string; // Denormalized
  hourlyRate: number; // in pence (e.g., 1500 = GBP15.00)
  effectiveFrom: Date | Timestamp;
  effectiveUntil?: Date | Timestamp; // Null = current rate
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
}

export type CreateCoachRateInput = Omit<CoachRate, "id" | "createdAt" | "updatedAt">;
```

#### 4.2 `coach_hours` Collection

```typescript
// Daily hours logged for a coach
export interface CoachHours {
  id: string;
  coachId: string;
  coachName: string;
  date: string; // "2026-01-27"
  // Hours worked
  hoursWorked: number; // Decimal hours (e.g., 3.5)
  // Breakdown by type (optional)
  breakdown?: {
    sessions121?: number;
    sessionsASC?: number;
    sessionsGDS?: number;
    admin?: number;
    training?: number;
  };
  // Calculated earnings (snapshot at time of logging)
  hourlyRate: number; // in pence
  earnings: number; // hoursWorked * hourlyRate in pence
  // Metadata
  notes?: string;
  loggedBy: string; // Admin or coach who logged
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
}

export type CreateCoachHoursInput = Omit<
  CoachHours,
  "id" | "earnings" | "createdAt" | "updatedAt"
>;

// Monthly summary (computed)
export interface CoachMonthlySummary {
  coachId: string;
  coachName: string;
  month: string; // "2026-01"
  totalHours: number;
  totalEarnings: number;
  dayBreakdown: Array<{
    date: string;
    hours: number;
    earnings: number;
  }>;
}
```

#### 4.3 `coach_awards` Collection

```typescript
// Employee/Coach of the Month awards
export interface CoachAward {
  id: string;
  awardType: "coach_of_month" | "employee_of_month";
  month: string; // "2026-01"
  coachId: string;
  coachName: string;
  prize?: number; // in pence (e.g., 3000 = GBP30)
  notes?: string;
  awardedBy?: string;
  createdAt: Date | Timestamp;
}

export type CreateCoachAwardInput = Omit<CoachAward, "id" | "createdAt">;
```

---

### Phase 5: Financial Tracking

#### 5.1 `daily_financials` Collection

```typescript
// src/types/financials.ts

import { Timestamp } from "firebase/firestore";

// Daily income/expense record
export interface DailyFinancial {
  id: string;
  date: string; // "2026-01-27"
  // Income by category
  income: {
    asc: number; // After School Club revenue in pence
    gds: number; // Group Development Sessions revenue
    oneToOne: number; // 1-2-1 sessions revenue
    other?: number;
    total: number;
  };
  // Expenses by category
  expenses: {
    asc: number;
    gds: number;
    oneToOne: number;
    coachWages?: number;
    equipment?: number;
    venue?: number;
    other?: number;
    total: number;
  };
  // Calculated
  grossProfit: number; // income.total - expenses.total
  // Notes
  notes?: string;
  // Metadata
  loggedBy?: string;
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
}

export type CreateDailyFinancialInput = Omit<
  DailyFinancial,
  "id" | "income.total" | "expenses.total" | "grossProfit" | "createdAt" | "updatedAt"
>;

// Weekly summary (computed)
export interface WeeklyFinancialSummary {
  weekStart: string;
  weekEnd: string;
  income: {
    asc: number;
    gds: number;
    oneToOne: number;
    other: number;
    total: number;
  };
  expenses: {
    asc: number;
    gds: number;
    oneToOne: number;
    coachWages: number;
    other: number;
    total: number;
  };
  grossProfit: number;
  dailyBreakdown: DailyFinancial[];
}

// Monthly summary (computed)
export interface MonthlyFinancialSummary {
  month: string; // "2026-01"
  income: {
    asc: number;
    gds: number;
    oneToOne: number;
    other: number;
    total: number;
  };
  expenses: {
    asc: number;
    gds: number;
    oneToOne: number;
    coachWages: number;
    other: number;
    total: number;
  };
  grossProfit: number;
  weeklyBreakdown: WeeklyFinancialSummary[];
}
```

---

### Phase 6: Challenges & Awards

#### 6.1 `challenges` Collection

```typescript
// src/types/challenges.ts

import { Timestamp } from "firebase/firestore";

// Challenge types offered
export type ChallengeType =
  | "crossbar"
  | "pass_through_gates"
  | "just_net"
  | "corner"
  | "footgolf"
  | "coaches_challenge"
  | "custom";

// Weekly challenge record
export interface WeeklyChallenge {
  id: string;
  weekStart: string; // ISO date of Monday
  weekEnd: string; // ISO date of Sunday
  isHalfTerm: boolean; // Skip challenges during half-term
  // Challenge winners
  challenges: ChallengeResult[];
  // 121 of the Week award
  oneToOneOfWeek?: {
    studentName: string;
    reason?: string;
    awardedBy?: string;
  };
  // Metadata
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
}

export interface ChallengeResult {
  challengeType: ChallengeType;
  challengeName?: string; // For custom challenges
  winnerName?: string;
  winnerScore?: number | string;
  notes?: string;
}

export type CreateWeeklyChallengeInput = Omit<WeeklyChallenge, "id" | "createdAt" | "updatedAt">;
```

---

### Phase 7: Customer Retention

#### 7.1 `lost_customers` Collection

```typescript
// src/types/retention.ts

import { Timestamp } from "firebase/firestore";

// Former customer tracking for retention
export interface LostCustomer {
  id: string;
  studentName: string;
  parentName: string;
  parentEmail: string;
  parentPhone?: string;
  // Last activity
  lastSessionDate?: string;
  lastSessionType?: "121" | "ASC" | "GDS";
  previousCoach?: string;
  // Retention tracking
  status: "lost" | "follow_up_scheduled" | "contacted" | "returned" | "declined";
  lostReason?: string; // "Moved away", "Schedule conflict", "Cost", etc.
  // Follow-up
  catchUpDate?: string; // Scheduled follow-up date
  nextStepNotes?: string; // Progress notes
  followUpHistory: FollowUpEntry[];
  // Metadata
  addedAt: Date | Timestamp;
  returnedAt?: Date | Timestamp;
  updatedAt: Date | Timestamp;
}

export interface FollowUpEntry {
  date: Date | Timestamp;
  method: "call" | "email" | "text" | "in_person";
  notes: string;
  contactedBy: string;
  outcome?: "no_answer" | "left_message" | "spoke" | "scheduled_return" | "declined";
}

export type CreateLostCustomerInput = Omit<
  LostCustomer,
  "id" | "status" | "followUpHistory" | "addedAt" | "updatedAt"
>;

export interface AddFollowUpInput {
  lostCustomerId: string;
  method: "call" | "email" | "text" | "in_person";
  notes: string;
  outcome?: "no_answer" | "left_message" | "spoke" | "scheduled_return" | "declined";
}
```

---

## API Endpoint Specifications

### Phase 1: Timetable APIs

```
GET    /api/admin/timetable?week=2026-01-27
POST   /api/admin/timetable/slots
PUT    /api/admin/timetable/slots/[id]
DELETE /api/admin/timetable/slots/[id]

GET    /api/admin/timetable/templates
POST   /api/admin/timetable/templates
PUT    /api/admin/timetable/templates/[id]
POST   /api/admin/timetable/templates/[id]/apply?week=2026-01-27

GET    /api/admin/waiting-list
POST   /api/admin/waiting-list
PUT    /api/admin/waiting-list/[id]
DELETE /api/admin/waiting-list/[id]
```

### Phase 2: Block Bookings APIs

```
GET    /api/admin/block-bookings
POST   /api/admin/block-bookings
GET    /api/admin/block-bookings/[id]
PUT    /api/admin/block-bookings/[id]
POST   /api/admin/block-bookings/[id]/deduct
POST   /api/admin/block-bookings/[id]/refund
```

### Phase 3: GDS APIs

```
GET    /api/admin/gds/attendance?day=monday&date=2026-01-27
POST   /api/admin/gds/attendance
PUT    /api/admin/gds/attendance/[id]
POST   /api/admin/gds/attendance/[id]/player-of-session

GET    /api/admin/gds/curriculum
POST   /api/admin/gds/curriculum
PUT    /api/admin/gds/curriculum/[id]

GET    /api/admin/gds/students?day=monday&ageGroup=Y3-Y4
POST   /api/admin/gds/students
PUT    /api/admin/gds/students/[id]
```

### Phase 4: Coach Hours APIs

```
GET    /api/admin/coach-rates
POST   /api/admin/coach-rates
PUT    /api/admin/coach-rates/[id]

GET    /api/admin/coach-hours?coachId=xxx&month=2026-01
POST   /api/admin/coach-hours
PUT    /api/admin/coach-hours/[id]
GET    /api/admin/coach-hours/summary?month=2026-01

GET    /api/admin/coach-awards
POST   /api/admin/coach-awards
DELETE /api/admin/coach-awards/[id]
```

### Phase 5: Financial APIs

```
GET    /api/admin/financials/daily?date=2026-01-27
POST   /api/admin/financials/daily
PUT    /api/admin/financials/daily/[id]

GET    /api/admin/financials/weekly?week=2026-01-27
GET    /api/admin/financials/monthly?month=2026-01
```

### Phase 6: Challenges APIs

```
GET    /api/admin/challenges?week=2026-01-27
POST   /api/admin/challenges
PUT    /api/admin/challenges/[id]
```

### Phase 7: Retention APIs

```
GET    /api/admin/retention
POST   /api/admin/retention
GET    /api/admin/retention/[id]
PUT    /api/admin/retention/[id]
POST   /api/admin/retention/[id]/follow-up
```

---

## UI Component Requirements

### Phase 1: Timetable UI

#### `/admin/timetable/page.tsx` - Weekly Rota Management

```
Components needed:
- WeekNavigator: Navigate between weeks
- TimetableGrid: Main grid showing days x time slots
- SlotCard: Individual slot (draggable)
- CoachColumn: Vertical coach labels
- SlotEditor: Modal for editing slot details
- BulkActions: Apply template, clear week

Features:
- Drag-drop slot reassignment
- Click to edit slot
- Color coding by slot type (121=blue, ASC=green, GDS=purple, AVAILABLE=gray)
- Real-time updates via Firebase listeners
```

#### `/admin/timetable/templates/page.tsx` - Fixed Rota

```
Components needed:
- TemplateGrid: Similar to TimetableGrid but for templates
- ApplyTemplateDialog: Confirm applying to specific week
- TemplateSelector: Choose between multiple templates
```

### Phase 2: Block Bookings UI

#### `/admin/block-bookings/page.tsx`

```
Components needed:
- BlockBookingsList: Table of all block bookings
- BlockBookingCard: Individual booking with progress bar
- DeductSessionDialog: Record session usage
- AddBlockBookingDialog: Create new block booking
- UsageHistory: List of dates used

Features:
- Progress bar showing remaining sessions
- Quick deduct button
- Filter by status (active/exhausted)
```

### Phase 3: GDS UI

#### `/admin/gds/page.tsx` - Overview

```
Components needed:
- GDSDayTabs: Monday/Wednesday/Saturday tabs
- AgeGroupSelector: Filter by age group
- AttendanceCalendar: Monthly view of sessions
```

#### `/admin/gds/attendance/[date]/page.tsx`

```
Components needed:
- AttendanceList: Checkbox list of students
- PlayerOfSessionSelector: Award dropdown
- QuickAddStudent: Add walk-in student
- AttendanceStats: Counts and percentages
```

#### `/admin/gds/curriculum/page.tsx`

```
Components needed:
- CurriculumTimeline: Visual timeline of focus areas
- DrillEditor: Edit weekly drills
- CurriculumCard: Focus area block
```

### Phase 4: Coach Hours UI

#### `/admin/coach-hours/page.tsx`

```
Components needed:
- CoachSelector: Filter by coach
- MonthNavigator: Navigate months
- HoursGrid: Calendar grid with daily hours
- HoursEntryDialog: Log hours for a day
- MonthlySummaryCard: Total hours/earnings
- PayrollExport: Export for payroll processing

Features:
- Quick entry for common patterns
- Auto-calculate earnings from rates
- Compare to previous month
```

#### `/admin/coach-hours/rates/page.tsx`

```
Components needed:
- RatesTable: All coach rates
- RateEditor: Set/update rate with effective date
- RateHistory: View rate changes over time
```

### Phase 5: Financial UI

#### `/admin/finance/daily/page.tsx`

```
Components needed:
- DateSelector: Pick date to view/edit
- IncomeCategoryInputs: ASC/GDS/121/Other inputs
- ExpenseCategoryInputs: All expense categories
- DailySummaryCard: Today's P&L
- WeeklyTrendChart: 7-day income/expense chart

Features:
- Quick copy from previous day
- Integration with Stripe data (auto-fill card payments)
```

#### `/admin/finance/reports/page.tsx`

```
Components needed:
- PeriodSelector: Weekly/Monthly/Custom
- RevenueBreakdownChart: Pie chart by category
- ExpenseBreakdownChart: Pie chart by category
- ProfitTrendLine: Line chart over time
- ExportButton: CSV/PDF export
```

### Phase 6: Challenges UI

#### `/admin/challenges/page.tsx`

```
Components needed:
- WeekSelector: Navigate weeks
- ChallengeCard: Individual challenge with winner input
- OneToOneOfWeekCard: Special award card
- ChallengeHistory: Past winners table
- HalfTermToggle: Mark week as half-term
```

### Phase 7: Retention UI

#### `/admin/retention/page.tsx`

```
Components needed:
- LostCustomersList: Table with status badges
- AddLostCustomerDialog: Add former customer
- FollowUpDialog: Record contact attempt
- RetentionStats: Dashboard cards (total lost, returned, etc.)
- FollowUpCalendar: Scheduled follow-ups

Features:
- Status workflow (lost -> contacted -> returned/declined)
- Follow-up reminders
- Success rate metrics
```

---

## Data Migration Scripts

### Excel Import Strategy

Create a one-time import script: `scripts/import-excel-data.ts`

```typescript
// Required dependencies
// npm install xlsx firebase-admin

import * as XLSX from 'xlsx';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

interface ImportConfig {
  excelPath: string;
  firebaseCredentials: string;
  dryRun: boolean;
}

async function importExcelData(config: ImportConfig) {
  // Initialize Firebase Admin
  const app = initializeApp({
    credential: cert(config.firebaseCredentials)
  });
  const db = getFirestore(app);

  // Read Excel file
  const workbook = XLSX.readFile(config.excelPath);

  // Import each sheet
  await importWeeklyRota(workbook, db, config.dryRun);
  await importFixedRota(workbook, db, config.dryRun);
  await importBlockBookings(workbook, db, config.dryRun);
  await importGDSAttendance(workbook, db, config.dryRun);
  await importIncomeExpenses(workbook, db, config.dryRun);
  await importCoachHours(workbook, db, config.dryRun);
  await importChallenges(workbook, db, config.dryRun);
  await importLostCustomers(workbook, db, config.dryRun);

  console.log('Migration complete!');
}

// Individual sheet importers follow...
```

### Sheet-Specific Import Functions

1. **Weekly Rota**: Parse grid layout, map coach abbreviations to user IDs
2. **Block Bookings**: Parse "Name - X sessions - dates" format
3. **GDS Attendance**: Parse date columns with attendance counts
4. **Income/Expenses**: Parse daily financial rows
5. **Coach Hours**: Parse monthly hour grids with rate row
6. **Challenges**: Parse weekly winner columns
7. **Lost Customers**: Parse name/date/notes columns

---

## Implementation Phases

### Phase 1: Core Timetable (Sprint 1 - Week 1-2)

**Priority: HIGH** - Foundation for all other features

| Task | Est. Hours | Files |
|------|-----------|-------|
| Create timetable types | 2h | `src/types/timetable.ts` |
| Create timetable APIs | 4h | `src/app/api/admin/timetable/` |
| Create template APIs | 3h | `src/app/api/admin/timetable/templates/` |
| Create waiting list APIs | 2h | `src/app/api/admin/waiting-list/` |
| Build TimetableGrid component | 6h | `src/components/admin/timetable/` |
| Build SlotEditor modal | 3h | `src/components/admin/timetable/` |
| Build WeekNavigator | 2h | `src/components/admin/timetable/` |
| Build admin timetable page | 4h | `src/app/admin/timetable/page.tsx` |
| Build templates page | 3h | `src/app/admin/timetable/templates/page.tsx` |
| Add drag-drop functionality | 4h | React DnD integration |
| **Total** | **33h** | |

**Acceptance Criteria:**
- [ ] Can view weekly timetable with all coaches
- [ ] Can add/edit/delete time slots
- [ ] Can drag-drop to reassign slots
- [ ] Can create/apply templates for recurring schedules
- [ ] Can manage waiting list

---

### Phase 2: Block Bookings (Sprint 1 - Week 2)

**Priority: HIGH** - Common workflow for 1-2-1 sessions

| Task | Est. Hours | Files |
|------|-----------|-------|
| Create block booking types | 2h | `src/types/block-booking.ts` |
| Create block booking APIs | 4h | `src/app/api/admin/block-bookings/` |
| Build BlockBookingsList | 3h | `src/components/admin/block-bookings/` |
| Build DeductSessionDialog | 2h | `src/components/admin/block-bookings/` |
| Build block bookings page | 3h | `src/app/admin/block-bookings/page.tsx` |
| Link to timetable (optional) | 2h | Integration work |
| **Total** | **16h** | |

**Acceptance Criteria:**
- [ ] Can create block booking with total sessions
- [ ] Can deduct session with date/notes
- [ ] Can view remaining sessions
- [ ] Can see usage history
- [ ] Can refund partial block

---

### Phase 3: GDS System (Sprint 2 - Week 1)

**Priority: MEDIUM** - Three sessions per week

| Task | Est. Hours | Files |
|------|-----------|-------|
| Create GDS types | 3h | `src/types/gds.ts` |
| Create GDS attendance APIs | 4h | `src/app/api/admin/gds/attendance/` |
| Create GDS curriculum APIs | 3h | `src/app/api/admin/gds/curriculum/` |
| Create GDS students APIs | 2h | `src/app/api/admin/gds/students/` |
| Build GDS overview page | 3h | `src/app/admin/gds/page.tsx` |
| Build attendance page | 4h | `src/app/admin/gds/attendance/` |
| Build curriculum page | 3h | `src/app/admin/gds/curriculum/` |
| Build PlayerOfSession feature | 2h | Award functionality |
| **Total** | **24h** | |

**Acceptance Criteria:**
- [ ] Can take attendance for GDS sessions by day/age group
- [ ] Can award Player of the Session
- [ ] Can manage training curriculum
- [ ] Can view attendance history
- [ ] Can manage student roster

---

### Phase 4: Coach Hours & Payroll (Sprint 2 - Week 2)

**Priority: HIGH** - Monthly payroll requirement

| Task | Est. Hours | Files |
|------|-----------|-------|
| Create coach types | 2h | `src/types/coach.ts` |
| Create coach rates APIs | 2h | `src/app/api/admin/coach-rates/` |
| Create coach hours APIs | 4h | `src/app/api/admin/coach-hours/` |
| Create coach awards APIs | 2h | `src/app/api/admin/coach-awards/` |
| Build HoursGrid component | 4h | `src/components/admin/coach-hours/` |
| Build coach hours page | 4h | `src/app/admin/coach-hours/page.tsx` |
| Build rates management | 2h | `src/app/admin/coach-hours/rates/` |
| Build monthly summary/export | 3h | Payroll export feature |
| **Total** | **23h** | |

**Acceptance Criteria:**
- [ ] Can set hourly rates per coach
- [ ] Can log daily hours per coach
- [ ] Can view monthly summary
- [ ] Can export for payroll
- [ ] Can track Coach of the Month awards

---

### Phase 5: Financial Tracking (Sprint 3 - Week 1)

**Priority: MEDIUM** - Management reporting

| Task | Est. Hours | Files |
|------|-----------|-------|
| Create financial types | 2h | `src/types/financials.ts` |
| Create daily financials APIs | 3h | `src/app/api/admin/financials/` |
| Create summary APIs | 3h | Weekly/monthly endpoints |
| Build daily entry page | 4h | `src/app/admin/finance/daily/page.tsx` |
| Build reports page | 5h | `src/app/admin/finance/reports/page.tsx` |
| Build charts/visualizations | 4h | Chart components |
| Stripe integration | 3h | Auto-fill card payments |
| **Total** | **24h** | |

**Acceptance Criteria:**
- [ ] Can log daily income/expenses by category
- [ ] Can view weekly/monthly summaries
- [ ] Can see profit trends
- [ ] Can export reports
- [ ] Can auto-fill from Stripe data

---

### Phase 6: Challenges & Awards (Sprint 3 - Week 2)

**Priority: LOW** - Nice to have

| Task | Est. Hours | Files |
|------|-----------|-------|
| Create challenges types | 1h | `src/types/challenges.ts` |
| Create challenges APIs | 2h | `src/app/api/admin/challenges/` |
| Build challenges page | 3h | `src/app/admin/challenges/page.tsx` |
| Build award cards | 2h | Challenge components |
| **Total** | **8h** | |

**Acceptance Criteria:**
- [ ] Can record weekly challenge winners
- [ ] Can award 121 of the Week
- [ ] Can mark half-term weeks
- [ ] Can view challenge history

---

### Phase 7: Customer Retention (Sprint 4)

**Priority: MEDIUM** - Business development

| Task | Est. Hours | Files |
|------|-----------|-------|
| Create retention types | 2h | `src/types/retention.ts` |
| Create retention APIs | 3h | `src/app/api/admin/retention/` |
| Build retention page | 4h | `src/app/admin/retention/page.tsx` |
| Build follow-up workflow | 3h | Status management |
| Build reminders integration | 2h | Notification system |
| **Total** | **14h** | |

**Acceptance Criteria:**
- [ ] Can track lost customers
- [ ] Can log follow-up attempts
- [ ] Can schedule follow-ups
- [ ] Can track return rate

---

### Phase 8: Data Migration & Polish (Sprint 4)

**Priority: HIGH** - Production readiness

| Task | Est. Hours | Files |
|------|-----------|-------|
| Build Excel import script | 6h | `scripts/import-excel-data.ts` |
| Data validation | 3h | Verify imported data |
| Coach portal enhancements | 4h | View timetable, log hours |
| Performance optimization | 4h | Firebase indexes, caching |
| E2E testing | 6h | Key workflow tests |
| Documentation | 3h | Admin user guide |
| **Total** | **26h** | |

**Acceptance Criteria:**
- [ ] All Excel data migrated successfully
- [ ] Coaches can view their schedules
- [ ] Coaches can log their own hours
- [ ] System performs well with real data
- [ ] Admin documentation complete

---

## Total Estimates

| Phase | Hours | Sprints |
|-------|-------|---------|
| Phase 1: Core Timetable | 33h | Sprint 1 |
| Phase 2: Block Bookings | 16h | Sprint 1 |
| Phase 3: GDS System | 24h | Sprint 2 |
| Phase 4: Coach Hours | 23h | Sprint 2 |
| Phase 5: Financials | 24h | Sprint 3 |
| Phase 6: Challenges | 8h | Sprint 3 |
| Phase 7: Retention | 14h | Sprint 4 |
| Phase 8: Migration | 26h | Sprint 4 |
| **Total** | **168h** | **4 Sprints** |

At 40 hours/week, this is approximately **4-5 weeks** of full-time development.

---

## Risks & Considerations

### Technical Risks

1. **Firebase Query Limits**: Timetable queries may need composite indexes
   - Mitigation: Pre-create indexes, use denormalization

2. **Drag-Drop Performance**: Large timetables may lag
   - Mitigation: Virtualize grid, batch updates

3. **Excel Import Complexity**: Inconsistent Excel formatting
   - Mitigation: Build robust parsers with error handling

### Business Risks

1. **Data Consistency**: Multiple admins editing timetable
   - Mitigation: Firebase real-time listeners, conflict detection

2. **Coach Adoption**: Coaches need to use the system
   - Mitigation: Simple coach portal, mobile-friendly UI

3. **Migration Period**: Running parallel systems
   - Mitigation: Phase migration, keep Excel as backup initially

---

## Integration Points

### With Existing Systems

1. **Sessions Collection**: Timetable slots link to session documents
2. **Bookings Collection**: Block bookings and timetable link to bookings
3. **Users Collection**: Coaches referenced by user ID
4. **Attendance Collection**: GDS attendance integrates with existing QR system
5. **Stripe Dashboard**: Daily financials auto-populate from Stripe

### New Firebase Indexes Needed

```
// firestore.indexes.json additions
{
  "collectionGroup": "timetable_slots",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "weekStart", "order": "ASCENDING" },
    { "fieldPath": "dayOfWeek", "order": "ASCENDING" },
    { "fieldPath": "startTime", "order": "ASCENDING" }
  ]
},
{
  "collectionGroup": "coach_hours",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "coachId", "order": "ASCENDING" },
    { "fieldPath": "date", "order": "DESCENDING" }
  ]
},
{
  "collectionGroup": "gds_attendance",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "day", "order": "ASCENDING" },
    { "fieldPath": "sessionDate", "order": "DESCENDING" }
  ]
}
```

---

## Recommended Implementation Order

1. **Sprint 1**: Timetable + Block Bookings (core daily operations)
2. **Sprint 2**: Coach Hours + GDS (coach management)
3. **Sprint 3**: Financials + Challenges (business intelligence)
4. **Sprint 4**: Retention + Migration (polish and go-live)

Start with Phase 1 (Timetable) as it's the foundation for everything else and provides immediate value for daily operations.

---

## Next Steps

1. Review this plan with stakeholders
2. Prioritize based on immediate needs
3. Create detailed task tickets for Sprint 1
4. Set up Firebase collections and indexes
5. Begin Phase 1 implementation
