# Excel Data Migration - Detailed Analysis & Plan

**Generated:** 2026-01-29
**Source File:** `/Users/mghome/Downloads/121 weekly timetable.xlsx`
**Total Sheets:** 12

---

## Executive Summary

This document provides a comprehensive analysis of the Excel workbook used by Take The Next Step 121 football coaching business. The workbook contains 12 sheets tracking:
- Weekly timetable/scheduling (2 sheets)
- Block booking packages (1 sheet)
- Group Development Sessions attendance (3 sheets)
- Financial income/expenses (1 sheet)
- Coach working hours (2 sheets)
- Challenge winners & awards (1 sheet)
- Coach of the month awards (1 sheet)
- Lost customer retention tracking (1 sheet)

---

## Sheet-by-Sheet Analysis

### 1. Weekly Rota

**Purpose:** Current week's editable timetable - shows which students are booked into which time slots.

**Structure:**
- Row 0-2: Title and headers
- Row 3-4: Time slots header row (day columns, time ranges)
- Row 5-6: Time slots with student names
- Row 8+: Coach names list (VAL, CIARAN, ANTONY, NATHAN, KADEEM, HARLEY, HARRY, LUCA, LEYAH)

**Column Layout (per day):**
| Col | Content |
|-----|---------|
| A | Time slot labels (ASC, 17:00-18:00, 18:00-19:00) |
| B-F | Monday slots (camera note: "Alfie on camera") |
| G-J | Tuesday slots |
| K-N | Wednesday slots |
| O-T | Thursday slots |
| U-X | Friday slots |

**Time Slots Observed:**
- 15:00-16:30 (ASC - After School Club)
- 15:15-16:15 (alternate times)
- 15:30-16:30 (alternate times)
- 17:00-18:00 (evening 1)
- 18:00-19:00 (evening 2)
- 13:30-15:30 (Friday afternoon)

**Slot Types:**
- `ASC` - After School Club block
- `GDS` - Group Development Session
- `OBS` - Observation session
- `AVAILABLE` - Open slot (sometimes with coach suffix: "AVAILABLE - N", "AVAILABLE - A")
- Student names for booked 121 slots (e.g., "Felix", "Lucas", "Taylor")

**Student Names Sample:**
Quinn Seb, Lucas, Taylor, Lewis M, Lewis O, Albie, Joey, Felipe, Lucy, Abbie, Claye, Parker, Riley, Jack F

**Firebase Mapping:**
- Collection: `timetable_slots`
- Type: `TimetableSlot`
- UI Page: `/admin/timetable`

---

### 2. FIXED ROTA

**Purpose:** Template/default weekly schedule - the "fixed" recurring assignments.

**Structure:** Same as Weekly Rota but represents the default template.

**Additional Observations:**
- Contains waiting list notation: "Waiting list" (Row 8, Col 2)
- Additional students beyond weekly rota: Ella, Aaron, Milo, Hugo

**Day Headers with Notes:**
- "Monday - Alfie on camera"
- "Wednesday - Alfie on camera"
- (Camera duty rotation for video recording)

**Firebase Mapping:**
- Collection: `timetable_templates`
- Type: `TimetableTemplate` with `TemplateSlot[]`
- UI Page: `/admin/timetable/templates`

---

### 3. Block Booking List

**Purpose:** Track pre-paid session packages and usage dates.

**Headers (Row 0):**
| Column | Header |
|--------|--------|
| A | Block Booking Name |
| B | Amount of sessions |
| C | Dates |

**Sample Data:**
| Name | Sessions | Dates Used |
|------|----------|------------|
| Abbie | 1 | 20.1/ |
| Albie | 3 | 10.12/ 17.12/ 8.1/ |
| Alfie | 2 | 16.1/ 22.1/ |
| Arjun | (empty) | (empty) |
| Ayaan | 3 | 7.11/ 12.12/ 16.1/ |
| Felipe | 3 | 12.1/ 19.1/ 26.1/ |
| Quinn and Seb | 1 | 26.1/ |

**Total Records:** 36 students

**Date Format:** `DD.M/` (e.g., "20.1/" = January 20th)

**Data Quality Issues:**
- Empty sessions count for some (Arjun, Euan, David, Edison, etc.)
- Inconsistent spacing in names ("Henry " with trailing space)
- Some paired bookings ("Quinn and Seb", "Jack and Aaron")

**Firebase Mapping:**
- Collection: `block_bookings`
- Type: `BlockBooking`
- UI Page: `/admin/block-bookings`

**Transformation Rules:**
1. Parse date format "DD.M/" to ISO date "YYYY-MM-DD"
2. Calculate `remainingSessions` = `totalSessions` - count of dates
3. Build `usageHistory[]` from dates
4. Set `status` = empty sessions ? "exhausted" : "active"
5. Split paired names into separate records OR create compound student name

---

### 4. MONDAY GDS

**Purpose:** Monday Group Development Session attendance and curriculum.

**Structure:** Multiple age group sections stacked vertically.

**Section 1 - Y1-Y2 (Rows 0-8):**
| Column | Content |
|--------|---------|
| A | Age group label ("Y1 - Y2") |
| B-D | Student roster |
| E | DATES header |
| F | NUMBERS (attendance count) |
| G | PLAYER OF THE SESSION |
| I | Month block header (JANUARY - FEBRUARY) |
| J | PASSING AND RECEIVING (focus area) |

**Attendance Data:**
| Date | Numbers | Player of Session |
|------|---------|-------------------|
| 5.1.2026 | Cancelled | Cancelled |
| 12.1.2026 | 2 | Both |
| 19.1.2026 | 2 | Idriss |
| 26.1.2026 | 4 | Ryland |

**Student Roster Y1-Y2:**
Jenson, Idriss, Ryland, George, Liam, Eden, Jude

**Section 2 - Y3-Y4 (Rows 16-29):**
**Student Roster:**
Luke N, Patrik, Eoin, Danny, Harry, Lowen, Kasey, Alex, Elsie, Poppy, Ayaan, Luan

**Attendance Data:**
| Date | Numbers | Player of Session |
|------|---------|-------------------|
| 5.1.2026 | Cancelled | Cancelled |
| 12.1.2026 | 11 | Eoin + Elsie |
| 19.1.2026 | 8 | Alex |
| 26.1.2026 | 10 | (empty) |

**Section 3 - Y5-Y6 (Rows 32-39):**
**Student Roster:**
Bailey, Ronnie, Kellan, Lewis O, Alfie, AVAILABLE

**Attendance Data:**
| Date | Numbers | Player of Session |
|------|---------|-------------------|
| 12.1.2026 | 5 | Edison |
| 19.1.2026 | 5 | Alfie |

**Curriculum Schedule (Column I-J):**
| Date | Drill Focus |
|------|-------------|
| 5.1.2026 | Mini Tournament |
| 12.1.2026 | Passing technique |
| 19.1.2026 | Receiving the ball |
| 26.1.2026 | Movement after the pass |
| 2.2.2026 | Combinations |
| 9.2.2026 | Bring a friend to training |

**Firebase Mapping:**
- Collections: `gds_students`, `gds_attendance`, `gds_curriculum`
- Types: `GDSStudent`, `GDSAttendance`, `GDSCurriculum`
- UI Pages: `/admin/gds/monday`, `/admin/gds/attendance`, `/admin/gds/curriculum`

---

### 5. WEDNESDAY GDS

**Purpose:** Wednesday Group Development Session - 6-7pm timeslot.

**Section 1 - "6 TILL 7" (Rows 0-14):**
**Student Roster:**
Isla, Poppy, Lucia, Florence, Lucy PAYG, Ella, Renee, Ruby, Phoebe, AVAILABLE (4 slots)

**Attendance Data:**
| Date | Numbers | Player of Session |
|------|---------|-------------------|
| 7.1.2026 | 7 | Isla |
| 14.1.2026 | 6 | Lucia |
| 21.1.2026 | n/a | n/a |

**Notable:** "Lucy PAYG" indicates pay-as-you-go status.

**Section 2 - Another "6 TILL 7" group (Rows 16-23):**
**Student Roster:**
Jack, Liam

**Firebase Mapping:**
- Same as Monday GDS
- Day: `wednesday`
- Age groups observed: "6-7" (time-based naming, not year groups)

---

### 6. SATURDAY GDS

**Purpose:** Saturday morning GDS - 9am-10am timeslot.

**Section - "9 TILL 10" (Rows 0-10):**
**Student Roster:**
Giovanna, Joey, Louie, Willow, Teddy, Alex, Roman, Mia, Albie

**Attendance Data:**
| Date | Numbers | Player of Session |
|------|---------|-------------------|
| 10.1.2026 | Cancelled | (empty) |
| 17.1.2026 | 6 | EVERYONE |
| 24.1.2026 | 6 | Teddy |

**Firebase Mapping:**
- Same as other GDS sheets
- Day: `saturday`
- Time: "9-10"

---

### 7. Income and Expenses Sheet

**Purpose:** Daily revenue and expense tracking by category.

**Headers (Row 0):**
| Column | Header |
|--------|--------|
| A | Day/Date label (January) |
| B | Revenue ASC |
| C | Revenue GDS |
| D | Revenue 121 |
| E | Revenue Total |
| F | Expenses ASC |
| G | Expenses GDS |
| H | Expenses 121 |
| I | Expenses Total |
| J | Total Gross Profit |

**Sample Data (January 2026):**
| Day | Rev ASC | Rev GDS | Rev 121 | Rev Total | Exp ASC | Exp GDS | Exp 121 | Exp Total | Profit |
|-----|---------|---------|---------|-----------|---------|---------|---------|-----------|--------|
| Mon 5th | 89.3 | 0 | 0 | 89.3 | 39.75 | 0 | 23 | 62.75 | 26.55 |
| Tues 6th | 35 | 0 | 0 | 35 | 39.75 | 0 | 23 | 62.75 | -27.75 |
| Wed 7th | 35 | 52 | 125 | 212 | 17.25 | 50 | 73 | 140.25 | 71.75 |
| WEEKLY | 304.06 | 52 | 125 | 481.06 | 119.75 | 50 | 222.5 | 392.25 | 88.81 |

**Total Records:** 28 daily entries + weekly summaries

**Currency Format:** Raw numbers (pounds with decimals), some with "£" prefix

**Firebase Mapping:**
- Collection: `daily_financials`
- Type: `DailyFinancial`
- UI Page: `/admin/financials`

**Transformation Rules:**
1. Parse day/date format: "Mon 5th" -> "2026-01-05"
2. Convert pounds to pence (multiply by 100)
3. Skip "WEEKLY" summary rows (calculate dynamically)
4. Map columns to `income` and `expenses` breakdown objects

---

### 8. Monthly Hours 2026

**Purpose:** Track coach working hours per day for payroll.

**Headers (Rows 0-1):**
| Column | Header | Pay Rate |
|--------|--------|----------|
| B | Pay | (header row) |
| C | Leyah | 30 |
| D | Luca | 15 |
| E | Kadeem | 12.5 |
| F | Shaka | 12.5 |
| G | Harley | 15 |
| H | CAM | 12.5 |
| I | Harry | 15 |
| J | Ili | 12.5 |
| K | ALFIE | 6 |

**Data Structure (Row 4+):**
- Row 4: Month start (Excel serial date 46023 = Jan 2026)
- Column headers repeat: Leyah, Luca, Kadeem, Shaka, Harley, Cam, Harry, Alfie, Ili, Ciaran

**Sample Hours Data:**
| Day | Leyah | Luca | Kadeem | Shaka | Harley | Cam | Harry | Alfie | Ili |
|-----|-------|------|--------|-------|--------|-----|-------|-------|-----|
| Mon 5th | 0 | 0 | 0 | 0 | 1.5 | 0 | 0 | 0 | 0 |
| Tues 6th | 0 | 0 | 0 | 0 | 1.5 | 0 | 0 | 0 | 0 |
| Wed 7th | 1 | 0 | 0 | 0 | 0 | 0 | 2 | 2 | 0 |
| Mon 12th | 0 | 2 | 0 | 0 | 3.5 | 0 | 2 | 2 | 0 |

**Special Notations:**
- "0/2" in Ciaran column (appears to be fraction notation)
- "14/23" - possibly hours/target notation
- Empty cells = 0 hours

**Pay Rates (hourly, in pounds):**
| Coach | Rate |
|-------|------|
| Leyah | 30 |
| Luca | 15 |
| Kadeem | 12.5 |
| Shaka | 12.5 |
| Harley | 15 |
| CAM | 12.5 |
| Harry | 15 |
| Ili | 12.5 |
| ALFIE | 6 |

**Firebase Mapping:**
- Collections: `coach_hours`, `coach_rates`
- Types: `CoachHours`, `CoachRate`
- UI Page: `/admin/coaches/hours`

---

### 9. Monthly Hours 2025

**Purpose:** Historical coach hours data from 2025.

**Months Covered:** May 2025 onwards (September, June visible)

**Different Coach Roster:**
May/June: Ciaran, Freddie, Kadeem, Shaka, Harley, Val, CAM, DAN M
September: Ciaran, Freddie, Kadeem, Shaka

**Special Notations:**
- "Loads" - indicates many hours (qualitative)
- "1 + camp" - sessions plus camp work
- "35.5 + camp" - hours plus camp bonus
- "S&C" - Strength & Conditioning session

**Firebase Mapping:**
- Same as Monthly Hours 2026
- Historical data import

---

### 10. Challenge Winners

**Purpose:** Track weekly challenges and winners throughout the term.

**Headers (Row 1):**
| Column | Header |
|--------|--------|
| B | CHALLENGE |
| E | CHALLENGE WINNER |
| H | 121 OF THE WEEK |

**Sample Data:**
| Week | Challenge | Winner | 121 of Week |
|------|-----------|--------|-------------|
| WEEK 1 | CROSSBAR CHALLENGE | N/A | N/A |
| WEEK 2 | PASS THROUGH THE GATES | Joey | Claye |
| WEEK 3 | JUST NET CHALLENGE | Felix | Stan |
| WEEK 4 | CORNER CHALLENGE | (empty) | (empty) |
| WEEK 5 | FOOTGOLF CHALLENGE | (empty) | (empty) |
| WEEK 6 | COACHES CHALLENGE | COACHES CHALLENGE | (empty) |
| HALF TERM WEEK | (empty) | (empty) | (empty) |
| WEEK 8 | FIRST TOUCH (IN THE BOX) | (empty) | (empty) |

**Challenge Types Observed:**
1. CROSSBAR CHALLENGE
2. PASS THROUGH THE GATES
3. JUST NET CHALLENGE
4. CORNER CHALLENGE
5. FOOTGOLF CHALLENGE
6. COACHES CHALLENGE (special week)
7. FIRST TOUCH (IN THE BOX)
8. FIRST TOUCH IN THE AIR
9. DIZZY PENALTY
10. FREE KICK CHALLENGE
11. WOODWORK CHALLENGE
12. GOALKEEPER CHALLENGE
13. TOP BINS CHALLENGE

**Firebase Mapping:**
- Collection: `weekly_challenges`
- Type: `WeeklyChallenge`
- UI Page: `/admin/challenges`

---

### 11. Coach of the Month

**Purpose:** Track monthly coach awards.

**Headers:**
| Column | Header |
|--------|--------|
| A | MONTH |
| B | COACH |

**Note:** Row 0 contains prize info: "COACH OF THE MONTH - £30"

**Data:**
| Month | Coach |
|-------|-------|
| SEPTEMBER | Harley |
| OCTOBER | Harley |
| NOVEMBER | Ciaran |
| DECEMBER | Luca |
| JANUARY | (empty) |
| FEBRUARY | (empty) |
| ... | ... |

**Firebase Mapping:**
- Collection: `coach_awards`
- Type: `CoachAward`
- UI Page: `/admin/coaches/awards`

---

### 12. Lost Customers

**Purpose:** Track former customers for retention/win-back efforts.

**Headers (Row 0):**
| Column | Header |
|--------|--------|
| A | Names |
| B | Catch up |
| C | Next Step |

**Sample Data:**
| Name | Catch up Date | Progress Notes |
|------|---------------|----------------|
| Gabriel | 7.5.2025 | Doing very well at Houghton, Looking for a new team. Top goalscorer and assists |
| Alexander Isabelle | 7.5.2025 | (empty) |
| Taylor Dimery | 7.5.2025 | Been doing very well in recent times. Looking to come back to do 1 to 1 soon. |
| Carter Atkinson | 7.5.2025 | Been smashing it. He's pushing pre academy level. |
| Harry Gryll | 7.5.2025 | With us - group sessions |
| Jake S | 7.5.2025 | With us - group sessions |
| Larenz | 7.5.2025 | Going through SATS |
| Ciarna | 7.5.2025 | Going through GCSE |

**Status Indicators from Notes:**
- "With us - group sessions" -> status: "returned"
- "Will be back" -> status: "returning"
- "Going through SATS/GCSE" -> status: "lost", reason: "school_commitments"

**Total Records:** 21 students

**Firebase Mapping:**
- Collection: `lost_customers`
- Type: `LostCustomer`
- UI Page: `/admin/retention`

---

## Firebase Collection Mapping Summary

| Excel Sheet | Firebase Collection | TypeScript Type | Admin UI Page |
|-------------|---------------------|-----------------|---------------|
| Weekly rota | timetable_slots | TimetableSlot | /admin/timetable |
| FIXED ROTA | timetable_templates | TimetableTemplate | /admin/timetable/templates |
| Block Booking List | block_bookings | BlockBooking | /admin/block-bookings |
| MONDAY GDS | gds_students, gds_attendance | GDSStudent, GDSAttendance | /admin/gds/monday |
| WEDNESDAY GDS | gds_students, gds_attendance | GDSStudent, GDSAttendance | /admin/gds/wednesday |
| SATURDAY GDS | gds_students, gds_attendance | GDSStudent, GDSAttendance | /admin/gds/saturday |
| Income and expenses | daily_financials | DailyFinancial | /admin/financials |
| Monthly Hours 2025/2026 | coach_hours, coach_rates | CoachHours, CoachRate | /admin/coaches/hours |
| Challenge Winners | weekly_challenges | WeeklyChallenge | /admin/challenges |
| Coach of the month | coach_awards | CoachAward | /admin/coaches/awards |
| Lost Customers | lost_customers | LostCustomer | /admin/retention |

---

## Field-by-Field Transformation Rules

### Block Bookings

```typescript
// Excel: "Abbie", 1, "20.1/"
// Firebase:
{
  id: generateId(),
  studentName: "Abbie",
  totalSessions: 1,
  remainingSessions: 0, // calculated
  usageHistory: [
    { sessionDate: "2026-01-20", usedAt: Timestamp }
  ],
  status: "exhausted", // calculated from remaining
  purchasedAt: Timestamp.now(),
  createdAt: Timestamp.now(),
  updatedAt: Timestamp.now()
}
```

**Date Parsing Rule:**
```typescript
function parseBlockBookingDate(dateStr: string, year: number = 2026): string {
  // Input: "20.1/" or "10.12/"
  // Output: "2026-01-20" or "2025-12-10"
  const [day, month] = dateStr.replace('/', '').split('.');
  const monthNum = parseInt(month);
  const useYear = monthNum > 9 ? year - 1 : year; // Nov/Dec likely previous year
  return `${useYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}
```

### GDS Students

```typescript
// Excel Row: "Jenson" in Y1-Y2 Monday
// Firebase:
{
  id: generateId(),
  studentName: "Jenson",
  day: "monday",
  ageGroup: "Y1-Y2",
  status: "active",
  totalAttendances: 0, // update from attendance records
  playerOfSessionCount: 0,
  enrolledAt: Timestamp.now(),
  updatedAt: Timestamp.now()
}
```

### GDS Attendance

```typescript
// Excel: 12.1.2026, Numbers: 11, Player: "Eoin + Elsie"
// Firebase:
{
  id: generateId(),
  day: "monday",
  ageGroup: "Y3-Y4",
  sessionDate: "2026-01-12",
  totalAttendees: 11,
  playerOfSession: {
    studentName: "Eoin + Elsie", // or split into array
    awardedAt: Timestamp.now()
  },
  attendees: [], // populate from roster
  drillFocus: "Passing technique", // from curriculum column
  isCancelled: false,
  createdAt: Timestamp.now(),
  updatedAt: Timestamp.now()
}
```

### Daily Financials

```typescript
// Excel: "Mon 5th", 89.3, 0, 0, 89.3, 39.75, 0, 23, 62.75, "£26.55"
// Firebase:
{
  id: generateId(),
  date: "2026-01-05",
  dayOfWeek: 1,
  dayName: "Monday",
  income: {
    asc: 8930, // Convert to pence
    gds: 0,
    oneToOne: 0,
    total: 8930
  },
  expenses: {
    asc: 3975,
    gds: 0,
    oneToOne: 2300,
    total: 6275
  },
  grossProfit: 2655,
  isVerified: false,
  createdAt: Timestamp.now(),
  updatedAt: Timestamp.now()
}
```

### Coach Hours

```typescript
// Excel: "Mon 5th", Harley: 1.5
// Firebase:
{
  id: generateId(),
  coachId: "harley-user-id",
  coachName: "Harley",
  date: "2026-01-05",
  hoursWorked: 1.5,
  hourlyRate: 1500, // £15 in pence
  earnings: 2250, // 1.5 * 1500
  isVerified: false,
  loggedBy: "system-import",
  createdAt: Timestamp.now(),
  updatedAt: Timestamp.now()
}
```

### Weekly Challenges

```typescript
// Excel: WEEK 2, "PASS THROUGH THE GATES", "Joey", "Claye"
// Firebase:
{
  id: generateId(),
  weekNumber: 2,
  weekStart: "2026-01-06", // Calculate from week number
  weekEnd: "2026-01-12",
  year: 2026,
  isHalfTerm: false,
  challenges: [{
    challengeType: "pass_through_gates",
    winnerName: "Joey"
  }],
  oneToOneOfWeek: {
    studentName: "Claye",
    awardedAt: Timestamp.now()
  },
  createdAt: Timestamp.now(),
  updatedAt: Timestamp.now()
}
```

### Lost Customers

```typescript
// Excel: "Gabriel", "7.5.2025", "Doing very well at Houghton..."
// Firebase:
{
  id: generateId(),
  studentName: "Gabriel",
  parentName: "", // Not in Excel - needs manual entry
  parentEmail: "", // Not in Excel
  catchUpDate: "2025-05-07",
  nextStepNotes: "Doing very well at Houghton, Looking for a new team. Top goalscorer and assists",
  status: "contacted",
  lostReason: "joined_team", // Inferred from notes
  followUpHistory: [],
  totalFollowUps: 0,
  priority: 3,
  lostAt: Timestamp.now(),
  addedAt: Timestamp.now(),
  updatedAt: Timestamp.now()
}
```

---

## Data Quality Issues

### Block Booking List
| Issue | Count | Resolution |
|-------|-------|------------|
| Empty session counts | 12 | Set to 0, mark as "exhausted" |
| Trailing spaces in names | 2 | Trim whitespace |
| Paired bookings | 3 | Create single record with compound name |

### GDS Sheets
| Issue | Resolution |
|-------|------------|
| "Cancelled" as attendance | Set `isCancelled: true`, `totalAttendees: 0` |
| "n/a" values | Treat as cancelled or skip |
| "Both" as player of session | Record literal text |
| "EVERYONE" as winner | Record literal text |
| "AVAILABLE" as student | Skip - not a real student |
| "Lucy PAYG" payment indicator | Extract to `paymentType: "payg"` |

### Income/Expenses
| Issue | Resolution |
|-------|------------|
| "£" prefix on some values | Strip and parse |
| "WEEKLY" summary rows | Skip during import |
| Empty future dates | Skip |

### Coach Hours
| Issue | Resolution |
|-------|------------|
| Excel serial dates | Convert using xlsx date utilities |
| "Loads" qualitative text | Map to estimated hours or flag for review |
| "X + camp" notation | Parse hours, add camp flag |
| Fraction notation "0/2" | Parse as string note |

### Lost Customers
| Issue | Resolution |
|-------|------------|
| Missing parent contact info | Flag for manual entry |
| Date format "7.5.2025" | Parse to ISO "2025-05-07" |
| "With us - group sessions" | Auto-detect returned status |

---

## Import Script Specification

### Phase 1: Reference Data (Coaches)

```typescript
// scripts/import/01-coaches.ts
const coaches = [
  { name: "Leyah", abbreviation: "L", hourlyRate: 3000 },
  { name: "Luca", abbreviation: "LU", hourlyRate: 1500 },
  { name: "Kadeem", abbreviation: "K", hourlyRate: 1250 },
  { name: "Shaka", abbreviation: "S", hourlyRate: 1250 },
  { name: "Harley", abbreviation: "H", hourlyRate: 1500 },
  { name: "Cam", abbreviation: "C", hourlyRate: 1250 },
  { name: "Harry", abbreviation: "HA", hourlyRate: 1500 },
  { name: "Ili", abbreviation: "I", hourlyRate: 1250 },
  { name: "Alfie", abbreviation: "A", hourlyRate: 600 },
  { name: "Ciaran", abbreviation: "CI", hourlyRate: 1250 },
  { name: "Val", abbreviation: "V", hourlyRate: 1250 },
  { name: "Nathan", abbreviation: "N", hourlyRate: 1250 },
  { name: "Antony", abbreviation: "AN", hourlyRate: 1250 },
];

async function importCoaches() {
  for (const coach of coaches) {
    await db.collection('users').add({
      ...coach,
      role: 'coach',
      email: `${coach.name.toLowerCase()}@ttnts.com`,
      isActive: true,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
  }
}
```

### Phase 2: GDS Students

```typescript
// scripts/import/02-gds-students.ts
async function importGDSStudents(workbook: XLSX.WorkBook) {
  const sheets = ['MONDAY GDS', 'WEDNESDAY GDS', 'SATURDAY GDS'];
  const dayMap = { 'MONDAY GDS': 'monday', 'WEDNESDAY GDS': 'wednesday', 'SATURDAY GDS': 'saturday' };

  for (const sheetName of sheets) {
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    let currentAgeGroup = '';
    for (const row of data) {
      // Detect age group headers
      if (row[0]?.match(/^Y\d-Y\d|^\d+-\d+|^GDS$/)) {
        currentAgeGroup = normalizeAgeGroup(row[0]);
        continue;
      }

      // Extract student names (column A, skip AVAILABLE)
      const name = row[0]?.toString().trim();
      if (name && name !== 'AVAILABLE' && name !== 'GDS' && !name.includes('DATES')) {
        await db.collection('gds_students').add({
          studentName: cleanStudentName(name),
          day: dayMap[sheetName],
          ageGroup: currentAgeGroup,
          status: 'active',
          paymentType: name.includes('PAYG') ? 'payg' : 'block',
          totalAttendances: 0,
          playerOfSessionCount: 0,
          enrolledAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        });
      }
    }
  }
}
```

### Phase 3: Block Bookings

```typescript
// scripts/import/03-block-bookings.ts
async function importBlockBookings(workbook: XLSX.WorkBook) {
  const sheet = workbook.Sheets['Block Booking List'];
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  for (let i = 1; i < data.length; i++) { // Skip header
    const row = data[i];
    const name = row[0]?.toString().trim();
    const sessions = parseInt(row[1]) || 0;
    const datesStr = row[2]?.toString() || '';

    if (!name) continue;

    const usageHistory = parseBlockBookingDates(datesStr);
    const remaining = Math.max(0, sessions - usageHistory.length);

    await db.collection('block_bookings').add({
      studentName: name,
      totalSessions: sessions,
      remainingSessions: remaining,
      usageHistory,
      status: remaining === 0 ? 'exhausted' : 'active',
      purchasedAt: Timestamp.now(),
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
  }
}

function parseBlockBookingDates(datesStr: string): BlockBookingUsage[] {
  if (!datesStr) return [];

  return datesStr.split('/').filter(d => d.trim()).map(d => {
    const [day, month] = d.trim().split('.');
    const year = parseInt(month) > 9 ? 2025 : 2026;
    const isoDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;

    return {
      sessionDate: isoDate,
      usedAt: Timestamp.now(),
    };
  });
}
```

### Phase 4: GDS Attendance

```typescript
// scripts/import/04-gds-attendance.ts
async function importGDSAttendance(workbook: XLSX.WorkBook) {
  const sheets = ['MONDAY GDS', 'WEDNESDAY GDS', 'SATURDAY GDS'];
  const dayMap = { 'MONDAY GDS': 'monday', 'WEDNESDAY GDS': 'wednesday', 'SATURDAY GDS': 'saturday' };

  for (const sheetName of sheets) {
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    let currentAgeGroup = '';
    for (const row of data) {
      // Detect age group from first column
      if (row[0]?.match(/^Y\d-Y\d|^\d+ TILL \d+|^GDS$/)) {
        currentAgeGroup = normalizeAgeGroup(row[0], row[1]);
        continue;
      }

      // Check for date in column E (index 4)
      const dateCell = row[4];
      if (dateCell && isValidDate(dateCell)) {
        const numbers = row[5];
        const playerOfSession = row[6];

        const isCancelled = numbers === 'Cancelled' || playerOfSession === 'Cancelled';
        const attendeeCount = isCancelled ? 0 : (parseInt(numbers) || 0);

        await db.collection('gds_attendance').add({
          day: dayMap[sheetName],
          ageGroup: currentAgeGroup,
          sessionDate: formatExcelDate(dateCell),
          totalAttendees: attendeeCount,
          isCancelled,
          playerOfSession: playerOfSession && playerOfSession !== 'Cancelled' ? {
            studentName: playerOfSession,
            awardedAt: Timestamp.now(),
          } : null,
          attendees: [],
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        });
      }
    }
  }
}
```

### Phase 5: Daily Financials

```typescript
// scripts/import/05-financials.ts
async function importFinancials(workbook: XLSX.WorkBook) {
  const sheet = workbook.Sheets['Income and expenses sheet'];
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  // Skip header row
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const dayLabel = row[0]?.toString();

    // Skip WEEKLY summary rows and empty rows
    if (!dayLabel || dayLabel === 'WEEKLY' || dayLabel === 'Total') continue;

    const date = parseDayLabel(dayLabel, 2026, 1); // January 2026
    if (!date) continue;

    const toPence = (val: any) => Math.round((parseFloat(val) || 0) * 100);

    await db.collection('daily_financials').add({
      date,
      dayOfWeek: new Date(date).getDay(),
      dayName: getDayName(date),
      income: {
        asc: toPence(row[1]),
        gds: toPence(row[2]),
        oneToOne: toPence(row[3]),
        total: toPence(row[4]),
      },
      expenses: {
        asc: toPence(row[5]),
        gds: toPence(row[6]),
        oneToOne: toPence(row[7]),
        total: toPence(row[8]),
      },
      grossProfit: toPence(row[9]?.toString().replace('£', '')),
      isVerified: false,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
  }
}

function parseDayLabel(label: string, year: number, month: number): string | null {
  // "Mon 5th" -> "2026-01-05"
  const match = label.match(/(\w+)\s+(\d+)/);
  if (!match) return null;

  const day = parseInt(match[2]);
  return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
}
```

### Phase 6: Coach Hours

```typescript
// scripts/import/06-coach-hours.ts
async function importCoachHours(workbook: XLSX.WorkBook) {
  const sheet2026 = workbook.Sheets['Monthly Hours 2026'];
  const sheet2025 = workbook.Sheets['Monthly Hours 2025'];

  // Import 2026 hours
  const data2026 = XLSX.utils.sheet_to_json(sheet2026, { header: 1 });

  // Get coach names from header row (row 4)
  const coachNames = data2026[4].slice(1).filter(n => n);

  // Get pay rates from row 1
  const payRates: Record<string, number> = {};
  const rateRow = data2026[1];
  coachNames.forEach((name, i) => {
    payRates[name.toLowerCase()] = (parseFloat(rateRow[i + 2]) || 12.5) * 100;
  });

  // Process daily entries
  for (let i = 5; i < data2026.length; i++) {
    const row = data2026[i];
    const dayLabel = row[0]?.toString();

    if (!dayLabel || !dayLabel.match(/^\w+ \d+/)) continue;

    const date = parseDayLabel(dayLabel, 2026, 1);
    if (!date) continue;

    coachNames.forEach((coachName, col) => {
      const hours = parseFloat(row[col + 1]) || 0;
      if (hours > 0) {
        const rate = payRates[coachName.toLowerCase()] || 1250;

        db.collection('coach_hours').add({
          coachName,
          date,
          hoursWorked: hours,
          hourlyRate: rate,
          earnings: Math.round(hours * rate),
          isVerified: false,
          loggedBy: 'excel-import',
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        });
      }
    });
  }
}
```

### Phase 7: Challenges & Awards

```typescript
// scripts/import/07-challenges.ts
async function importChallenges(workbook: XLSX.WorkBook) {
  const sheet = workbook.Sheets['Challenge Winners'];
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  const challengeTypeMap: Record<string, ChallengeType> = {
    'CROSSBAR CHALLENGE': 'crossbar',
    'PASS THROUGH THE GATES': 'pass_through_gates',
    'JUST NET CHALLENGE': 'just_net',
    'CORNER CHALLENGE': 'corner',
    'FOOTGOLF CHALLENGE': 'footgolf',
    'COACHES CHALLENGE': 'coaches_challenge',
    'FIRST TOUCH (IN THE BOX)': 'first_touch_box',
    'FIRST TOUCH IN THE AIR': 'first_touch_air',
    'DIZZY PENALTY': 'dizzy_penalty',
    'FREE KICK CHALLENGE': 'free_kick',
    'WOODWORK CHALLENGE': 'woodwork',
    'GOALKEEPER CHALLENGE': 'goalkeeper',
    'TOP BINS CHALLENGE': 'top_bins',
  };

  for (let i = 2; i < data.length; i++) {
    const row = data[i];
    const weekLabel = row[0]?.toString();

    if (!weekLabel?.startsWith('WEEK')) continue;

    const weekNumber = parseInt(weekLabel.replace('WEEK ', ''));
    const challengeName = row[1]?.toString();
    const winner = row[4]?.toString();
    const oneToOneOfWeek = row[7]?.toString();

    const isHalfTerm = weekLabel === 'HALF TERM WEEK';

    await db.collection('weekly_challenges').add({
      weekNumber,
      weekStart: getWeekStartFromNumber(weekNumber, 2026),
      weekEnd: getWeekEndFromNumber(weekNumber, 2026),
      year: 2026,
      isHalfTerm,
      challenges: challengeName && winner && winner !== 'N/A' ? [{
        challengeType: challengeTypeMap[challengeName] || 'custom',
        challengeName,
        winnerName: winner,
      }] : [],
      oneToOneOfWeek: oneToOneOfWeek && oneToOneOfWeek !== 'N/A' ? {
        studentName: oneToOneOfWeek,
        awardedAt: Timestamp.now(),
      } : null,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
  }
}
```

### Phase 8: Coach Awards

```typescript
// scripts/import/08-coach-awards.ts
async function importCoachAwards(workbook: XLSX.WorkBook) {
  const sheet = workbook.Sheets['Coach of the month'];
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  const monthMap: Record<string, string> = {
    'SEPTEMBER': '09', 'OCTOBER': '10', 'NOVEMBER': '11', 'DECEMBER': '12',
    'JANUARY': '01', 'FEBRUARY': '02', 'MARCH': '03', 'APRIL': '04',
    'MAY': '05', 'JUNE': '06', 'JULY': '07', 'AUGUST': '08',
  };

  for (let i = 2; i < data.length; i++) {
    const row = data[i];
    const monthName = row[0]?.toString()?.toUpperCase();
    const coachName = row[1]?.toString();

    if (!monthName || !coachName || !monthMap[monthName]) continue;

    const year = ['SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'].includes(monthName) ? 2025 : 2026;

    await db.collection('coach_awards').add({
      awardType: 'coach_of_month',
      month: `${year}-${monthMap[monthName]}`,
      coachName,
      prize: 3000, // £30
      createdAt: Timestamp.now(),
    });
  }
}
```

### Phase 9: Lost Customers

```typescript
// scripts/import/09-lost-customers.ts
async function importLostCustomers(workbook: XLSX.WorkBook) {
  const sheet = workbook.Sheets['Lost Customers'];
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const name = row[0]?.toString().trim();
    const catchUpDate = row[1]?.toString();
    const notes = row[2]?.toString();

    if (!name) continue;

    // Infer status from notes
    let status: LostCustomerStatus = 'contacted';
    let lostReason: LostReason = 'unknown';

    if (notes?.includes('With us')) {
      status = 'returned';
    } else if (notes?.includes('Will be back') || notes?.includes('will return')) {
      status = 'returning';
    } else if (notes?.includes('SATS') || notes?.includes('GCSE')) {
      lostReason = 'school_commitments';
    } else if (notes?.includes('team') || notes?.includes('Houghton') || notes?.includes('Town')) {
      lostReason = 'joined_team';
    }

    await db.collection('lost_customers').add({
      studentName: name,
      parentName: '',
      parentEmail: '',
      catchUpDate: parseDate(catchUpDate),
      nextStepNotes: notes || '',
      status,
      lostReason,
      followUpHistory: [],
      totalFollowUps: 1, // They've been contacted at catchUpDate
      priority: 3,
      lostAt: Timestamp.now(),
      addedAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
  }
}

function parseDate(dateStr: string): string | undefined {
  if (!dateStr) return undefined;
  // "7.5.2025" -> "2025-05-07"
  const match = dateStr.match(/(\d+)\.(\d+)\.(\d+)/);
  if (!match) return undefined;
  return `${match[3]}-${match[2].padStart(2, '0')}-${match[1].padStart(2, '0')}`;
}
```

---

## Validation Checklist

### Pre-Import
- [ ] Backup existing Firebase data
- [ ] Create test environment for dry run
- [ ] Verify all coach names match user records
- [ ] Review data quality issues documented above

### During Import
- [ ] Log all skipped rows with reasons
- [ ] Validate date formats before writing
- [ ] Check for duplicate student names
- [ ] Verify currency conversion (pounds to pence)

### Post-Import
- [ ] Compare record counts: Excel vs Firebase
- [ ] Verify sample records manually
- [ ] Test UI pages load correctly
- [ ] Check calculated fields (totals, remaining sessions)
- [ ] Validate date ranges display correctly

---

## Estimated Record Counts

| Collection | Estimated Records |
|------------|-------------------|
| users (coaches) | 13 |
| timetable_templates | 1 (with ~50 slots) |
| timetable_slots | ~60 per week |
| block_bookings | 36 |
| gds_students | ~50 |
| gds_attendance | ~20 |
| gds_curriculum | 3 (one per day) |
| daily_financials | ~28 |
| coach_hours | ~200 (2025+2026) |
| coach_rates | 13 |
| coach_awards | 4 |
| weekly_challenges | 20 |
| lost_customers | 21 |

**Total: ~450 records**

---

## Implementation Order

1. **Phase 1: Reference Data** - Import coaches first (needed for foreign keys)
2. **Phase 2: GDS Students** - Independent, no dependencies
3. **Phase 3: Block Bookings** - Independent
4. **Phase 4: GDS Attendance** - Depends on GDS Students
5. **Phase 5: Financials** - Independent
6. **Phase 6: Coach Hours** - Depends on coaches
7. **Phase 7: Challenges** - Independent
8. **Phase 8: Coach Awards** - Depends on coaches
9. **Phase 9: Lost Customers** - Independent
10. **Phase 10: Timetable** - Last (most complex, depends on coaches)

---

## Notes for Manual Review

1. **Block Booking Names:**
   - "Quinn and Seb" - Should this be 2 separate records?
   - "Jack and Aaron" - Should this be 2 separate records?
   - Names with trailing spaces need trimming

2. **Lost Customer Parent Info:**
   - Excel has no parent contact details
   - Need to source from booking system or manual entry

3. **GDS Age Groups:**
   - Monday uses "Y1-Y2", "Y3-Y4", "Y5-Y6"
   - Wednesday uses "6 TILL 7" (time-based)
   - Saturday uses "9 TILL 10" (time-based)
   - Need to normalize to consistent format

4. **Coach Hours 2025:**
   - Different coach roster than 2026
   - Some qualitative entries ("Loads", "1 + camp")
   - Consider manual review before import

5. **Timetable Complexity:**
   - Multiple time slots per day
   - Camera duty notes
   - Waiting list notation
   - AVAILABLE with coach suffixes (A, N)
   - Consider building manually in UI vs. automated import
