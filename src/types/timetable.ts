import { Timestamp } from "firebase/firestore";

// ============================================================================
// TIMETABLE SLOT TYPES
// ============================================================================

export type SlotType = "121" | "ASC" | "GDS" | "OBS" | "AVAILABLE";

/**
 * A single slot in the weekly timetable
 * Represents one time block assigned to a coach
 */
export interface TimetableSlot {
  id: string;
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  startTime: string; // "15:00" format
  endTime: string; // "16:00" format
  coachId: string; // Reference to users collection (role: 'coach')
  coachName: string; // Denormalized for display
  slotType: SlotType;
  // For booked slots
  studentName?: string;
  studentId?: string; // Link to child in users collection
  bookingId?: string; // Link to bookings collection
  sessionId?: string; // Link to sessions collection
  blockBookingId?: string; // Link to block_bookings collection if using pre-paid block
  // Metadata
  weekStart: string; // ISO date "2026-01-27" (Monday of the week)
  notes?: string;
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
}

export type CreateTimetableSlotInput = Omit<
  TimetableSlot,
  "id" | "createdAt" | "updatedAt"
>;

export type UpdateTimetableSlotInput = Partial<
  Omit<TimetableSlot, "id" | "createdAt">
>;

// ============================================================================
// TIMETABLE TEMPLATE TYPES (Fixed Rota)
// ============================================================================

/**
 * A template slot for recurring weekly schedules
 * Used to quickly populate a new week's timetable
 */
export interface TemplateSlot {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  coachId: string;
  coachName: string;
  slotType: SlotType;
  // Default student if recurring booking
  defaultStudentName?: string;
  defaultBookingId?: string;
}

/**
 * Template for recurring weekly schedule
 * The "Fixed Rota" from the Excel sheet
 */
export interface TimetableTemplate {
  id: string;
  name: string; // "Default Weekly Schedule"
  description?: string;
  isActive: boolean;
  slots: TemplateSlot[];
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
}

export type CreateTimetableTemplateInput = Omit<
  TimetableTemplate,
  "id" | "createdAt" | "updatedAt"
>;

export type UpdateTimetableTemplateInput = Partial<
  Omit<TimetableTemplate, "id" | "createdAt">
>;

// ============================================================================
// WAITING LIST TYPES
// ============================================================================

export type WaitingListStatus =
  | "waiting"
  | "contacted"
  | "booked"
  | "cancelled";

/**
 * Students waiting for available slots
 */
export interface WaitingListEntry {
  id: string;
  studentName: string;
  parentName: string;
  parentEmail: string;
  parentPhone: string;
  // Preferences
  preferredDays?: number[]; // [1, 3, 5] = Mon, Wed, Fri
  preferredTimes?: string[]; // ["15:00", "16:00"]
  preferredCoaches?: string[]; // Coach user IDs
  ageGroup?: string;
  // Status tracking
  status: WaitingListStatus;
  priority: number; // Lower = higher priority
  notes?: string;
  // Timestamps
  addedAt: Date | Timestamp;
  contactedAt?: Date | Timestamp;
  bookedAt?: Date | Timestamp;
  updatedAt: Date | Timestamp;
}

export type CreateWaitingListInput = Omit<
  WaitingListEntry,
  "id" | "addedAt" | "status" | "priority" | "updatedAt"
>;

export type UpdateWaitingListInput = Partial<
  Omit<WaitingListEntry, "id" | "addedAt">
>;

// ============================================================================
// COMPUTED/VIEW TYPES
// ============================================================================

/**
 * Summary of a coach's schedule for display
 */
export interface CoachSummary {
  id: string;
  name: string;
  abbreviation: string; // "VAL", "CIARAN", etc.
  hourlyRate?: number; // in pence
  totalSlots: number;
  bookedSlots: number;
  availableSlots: number;
  gdsSlots: number;
  ascSlots: number;
}

/**
 * Full weekly timetable view (computed from slots)
 */
export interface WeeklyTimetable {
  weekStart: string; // ISO date of Monday
  weekEnd: string; // ISO date of Sunday
  slots: TimetableSlot[];
  coaches: CoachSummary[];
  // Stats
  totalSlots: number;
  bookedSlots: number;
  availableSlots: number;
  utilizationRate: number; // percentage
}

/**
 * Time slot definition for the grid
 */
export interface TimeSlotDefinition {
  startTime: string;
  endTime: string;
  label: string; // "15:00 - 16:00"
}

/**
 * Day column definition for the grid
 */
export interface DayColumnDefinition {
  dayOfWeek: number;
  name: string; // "Monday"
  shortName: string; // "Mon"
  date?: string; // ISO date for specific week view
}

// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

export interface GetTimetableParams {
  weekStart: string; // ISO date of Monday
  coachId?: string; // Filter by specific coach
}

export interface ApplyTemplateParams {
  templateId: string;
  weekStart: string; // ISO date of Monday to apply template to
  overwriteExisting?: boolean; // Whether to replace existing slots
}

export interface MoveSlotParams {
  slotId: string;
  newDayOfWeek?: number;
  newStartTime?: string;
  newEndTime?: string;
  newCoachId?: string;
}

export interface BulkCreateSlotsParams {
  weekStart: string;
  slots: CreateTimetableSlotInput[];
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const SLOT_TYPE_COLORS: Record<SlotType, string> = {
  "121": "bg-blue-100 border-blue-300 text-blue-800",
  ASC: "bg-green-100 border-green-300 text-green-800",
  GDS: "bg-purple-100 border-purple-300 text-purple-800",
  OBS: "bg-yellow-100 border-yellow-300 text-yellow-800",
  AVAILABLE: "bg-gray-100 border-gray-300 text-gray-500",
};

export const SLOT_TYPE_LABELS: Record<SlotType, string> = {
  "121": "1-to-1 Session",
  ASC: "After School Club",
  GDS: "Group Development",
  OBS: "Observation",
  AVAILABLE: "Available",
};

export const DEFAULT_TIME_SLOTS: TimeSlotDefinition[] = [
  { startTime: "15:00", endTime: "16:00", label: "15:00 - 16:00" },
  { startTime: "16:00", endTime: "17:00", label: "16:00 - 17:00" },
  { startTime: "17:00", endTime: "18:00", label: "17:00 - 18:00" },
  { startTime: "18:00", endTime: "19:00", label: "18:00 - 19:00" },
];

export const DAYS_OF_WEEK: DayColumnDefinition[] = [
  { dayOfWeek: 1, name: "Monday", shortName: "Mon" },
  { dayOfWeek: 2, name: "Tuesday", shortName: "Tue" },
  { dayOfWeek: 3, name: "Wednesday", shortName: "Wed" },
  { dayOfWeek: 4, name: "Thursday", shortName: "Thu" },
  { dayOfWeek: 5, name: "Friday", shortName: "Fri" },
  { dayOfWeek: 6, name: "Saturday", shortName: "Sat" },
];

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get the Monday of the week for a given date
 */
export function getWeekStart(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
  d.setDate(diff);
  return d.toISOString().split("T")[0];
}

/**
 * Get the Sunday of the week for a given date
 */
export function getWeekEnd(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? 0 : 7); // Adjust for Sunday
  d.setDate(diff);
  return d.toISOString().split("T")[0];
}

/**
 * Format a date for display in the timetable
 */
export function formatTimetableDate(
  weekStart: string,
  dayOfWeek: number
): string {
  const date = new Date(weekStart);
  date.setDate(date.getDate() + (dayOfWeek - 1)); // dayOfWeek 1 = Monday
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
}
