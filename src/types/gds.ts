import { Timestamp } from "firebase/firestore";

// ============================================================================
// GDS (GROUP DEVELOPMENT SESSIONS) TYPES
// ============================================================================

export type GDSDay = "monday" | "wednesday" | "saturday";

export type GDSAgeGroup =
  | "Y1-Y2"
  | "Y3-Y4"
  | "Y5-Y6"
  | "Y6-Y7"
  | "6-7"
  | "9-10";

export type GDSStudentStatus = "active" | "inactive" | "trial";

// ============================================================================
// GDS ATTENDANCE TYPES
// ============================================================================

/**
 * Individual attendee in a GDS session
 */
export interface GDSAttendee {
  studentName: string;
  studentId?: string; // Link to gds_students collection
  bookingId?: string; // If paid via booking system
  checkedIn: boolean;
  checkedInAt?: Date | Timestamp;
  checkedOutAt?: Date | Timestamp;
  paymentStatus?: "paid" | "pending" | "trial" | "payg";
  notes?: string;
}

/**
 * Player of the Session award
 */
export interface PlayerOfSessionAward {
  studentName: string;
  studentId?: string;
  reason?: string;
  awardedBy?: string; // Coach/admin who gave the award
  awardedAt: Date | Timestamp;
}

/**
 * Attendance record for a single GDS session date
 */
export interface GDSAttendance {
  id: string;
  day: GDSDay;
  ageGroup: GDSAgeGroup;
  sessionDate: string; // "2026-01-27" format
  // Coach assignment
  coachId?: string;
  coachName?: string;
  // Attendees
  attendees: GDSAttendee[];
  totalAttendees: number;
  // Player of the Session award
  playerOfSession?: PlayerOfSessionAward;
  // Session details
  drillFocus?: string; // From curriculum
  sessionNotes?: string;
  // Weather/cancellation
  isCancelled?: boolean;
  cancellationReason?: string;
  // Metadata
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
}

export type CreateGDSAttendanceInput = Omit<
  GDSAttendance,
  "id" | "createdAt" | "updatedAt" | "totalAttendees"
>;

export type UpdateGDSAttendanceInput = Partial<
  Omit<GDSAttendance, "id" | "createdAt" | "day" | "ageGroup" | "sessionDate">
>;

// ============================================================================
// GDS CURRICULUM TYPES
// ============================================================================

/**
 * Single drill/training activity for a week
 */
export interface DrillScheduleEntry {
  weekNumber: number;
  date: string; // "2026-01-27"
  drillName: string;
  drillDescription?: string;
  equipmentNeeded?: string[];
  duration?: number; // Minutes
  coachNotes?: string;
}

/**
 * Training curriculum/drill schedule for a period
 */
export interface GDSCurriculum {
  id: string;
  day: GDSDay;
  ageGroups?: GDSAgeGroup[]; // If empty, applies to all age groups
  // Date range for this curriculum block
  startDate: string; // "2026-01-01"
  endDate: string; // "2026-02-28"
  // Training focus
  focusArea: string; // "Passing and Receiving"
  focusDescription?: string;
  // Weekly drill schedule
  drillSchedule: DrillScheduleEntry[];
  // Metadata
  isActive: boolean;
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
}

export type CreateGDSCurriculumInput = Omit<
  GDSCurriculum,
  "id" | "createdAt" | "updatedAt"
>;

export type UpdateGDSCurriculumInput = Partial<
  Omit<GDSCurriculum, "id" | "createdAt">
>;

// ============================================================================
// GDS STUDENT TYPES (Roster)
// ============================================================================

/**
 * Student enrolled in GDS
 */
export interface GDSStudent {
  id: string;
  studentName: string;
  day: GDSDay;
  ageGroup: GDSAgeGroup;
  // Parent info
  parentName?: string;
  parentEmail?: string;
  parentPhone?: string;
  parentId?: string; // Link to users collection
  // Medical/notes
  medicalConditions?: string;
  notes?: string;
  // Attendance stats (denormalized for quick access)
  totalAttendances: number;
  playerOfSessionCount: number;
  // Payment status
  paymentType?: "block" | "monthly" | "payg" | "trial";
  blockBookingId?: string; // If linked to block booking
  // Status
  status: GDSStudentStatus;
  enrolledAt: Date | Timestamp;
  lastAttendedAt?: Date | Timestamp;
  updatedAt: Date | Timestamp;
}

export type CreateGDSStudentInput = Omit<
  GDSStudent,
  | "id"
  | "totalAttendances"
  | "playerOfSessionCount"
  | "enrolledAt"
  | "lastAttendedAt"
  | "updatedAt"
>;

export type UpdateGDSStudentInput = Partial<
  Omit<
    GDSStudent,
    | "id"
    | "totalAttendances"
    | "playerOfSessionCount"
    | "enrolledAt"
    | "lastAttendedAt"
  >
>;

// ============================================================================
// VIEW/COMPUTED TYPES
// ============================================================================

/**
 * Summary of a GDS session for calendar view
 */
export interface GDSSessionSummary {
  date: string;
  day: GDSDay;
  ageGroup: GDSAgeGroup;
  totalAttendees: number;
  expectedAttendees: number; // Based on roster
  attendanceRate: number; // Percentage
  playerOfSession?: string;
  drillFocus?: string;
  isCancelled: boolean;
}

/**
 * Attendance summary by age group
 */
export interface GDSAgeGroupSummary {
  ageGroup: GDSAgeGroup;
  totalStudents: number;
  activeStudents: number;
  averageAttendance: number;
  totalSessions: number;
}

/**
 * Student's attendance record
 */
export interface GDSStudentAttendanceRecord {
  studentId: string;
  studentName: string;
  day: GDSDay;
  ageGroup: GDSAgeGroup;
  totalSessions: number;
  attendedSessions: number;
  attendanceRate: number;
  playerOfSessionCount: number;
  lastAttended?: string;
}

// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

export interface ListGDSAttendanceParams {
  day?: GDSDay;
  ageGroup?: GDSAgeGroup;
  startDate?: string;
  endDate?: string;
  limit?: number;
}

export interface ListGDSStudentsParams {
  day?: GDSDay;
  ageGroup?: GDSAgeGroup;
  status?: GDSStudentStatus;
  search?: string;
}

export interface AwardPlayerOfSessionInput {
  attendanceId: string;
  studentName: string;
  studentId?: string;
  reason?: string;
}

export interface BulkCheckInInput {
  attendanceId: string;
  studentNames: string[];
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const GDS_DAY_LABELS: Record<GDSDay, string> = {
  monday: "Monday",
  wednesday: "Wednesday",
  saturday: "Saturday",
};

export const GDS_DAY_TIMES: Record<GDSDay, { start: string; end: string }> = {
  monday: { start: "17:00", end: "18:00" },
  wednesday: { start: "18:00", end: "19:00" },
  saturday: { start: "09:00", end: "10:00" },
};

export const GDS_AGE_GROUP_LABELS: Record<GDSAgeGroup, string> = {
  "Y1-Y2": "Year 1-2",
  "Y3-Y4": "Year 3-4",
  "Y5-Y6": "Year 5-6",
  "Y6-Y7": "Year 6-7",
  "6-7": "Ages 6-7",
  "9-10": "Ages 9-10",
};

export const GDS_STUDENT_STATUS_COLORS: Record<GDSStudentStatus, string> = {
  active: "bg-green-100 text-green-800",
  inactive: "bg-gray-100 text-gray-800",
  trial: "bg-blue-100 text-blue-800",
};

export const GDS_STUDENT_STATUS_LABELS: Record<GDSStudentStatus, string> = {
  active: "Active",
  inactive: "Inactive",
  trial: "Trial",
};

/**
 * Standard curriculum focus areas
 */
export const GDS_FOCUS_AREAS = [
  "Passing and Receiving",
  "Dribbling and Ball Control",
  "Shooting and Finishing",
  "Defending",
  "Attacking Movement",
  "1v1 Skills",
  "Teamwork and Communication",
  "Game Situations",
  "Mini Tournament",
];

/**
 * Standard drills by focus area
 */
export const GDS_DRILLS_BY_FOCUS: Record<string, string[]> = {
  "Passing and Receiving": [
    "Mini Tournament",
    "Passing technique",
    "Receiving the ball",
    "Movement after the pass",
    "Combinations",
    "Bring a friend to training",
  ],
  "Dribbling and Ball Control": [
    "Close control",
    "Change of direction",
    "Speed dribbling",
    "Shielding the ball",
    "Turns and feints",
  ],
  "Shooting and Finishing": [
    "Shooting technique",
    "Finishing from crosses",
    "Volleys",
    "One-touch finishing",
    "Penalty practice",
  ],
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get the GDS day from a date
 */
export function getGDSDayFromDate(date: Date): GDSDay | null {
  const dayOfWeek = date.getDay();
  switch (dayOfWeek) {
    case 1:
      return "monday";
    case 3:
      return "wednesday";
    case 6:
      return "saturday";
    default:
      return null;
  }
}

/**
 * Calculate attendance rate
 */
export function calculateAttendanceRate(
  attended: number,
  total: number
): number {
  if (total === 0) return 0;
  return Math.round((attended / total) * 100);
}

/**
 * Get drill for a specific date from curriculum
 */
export function getDrillForDate(
  curriculum: GDSCurriculum,
  date: string
): DrillScheduleEntry | undefined {
  return curriculum.drillSchedule.find((drill) => drill.date === date);
}
