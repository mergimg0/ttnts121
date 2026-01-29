import { Timestamp } from "firebase/firestore";

// ============================================================================
// CHALLENGE TYPES
// ============================================================================

export type ChallengeType =
  | "crossbar"
  | "pass_through_gates"
  | "just_net"
  | "corner"
  | "footgolf"
  | "coaches_challenge"
  | "first_touch_box"
  | "first_touch_air"
  | "dizzy_penalty"
  | "free_kick"
  | "woodwork"
  | "goalkeeper"
  | "top_bins"
  | "custom";

/**
 * Result of an individual challenge
 */
export interface ChallengeResult {
  challengeType: ChallengeType;
  challengeName?: string; // For custom challenges or display override
  winnerName?: string;
  winnerScore?: number | string; // Could be numeric or descriptive
  runnersUp?: string[]; // Optional 2nd, 3rd place
  notes?: string;
  videoUrl?: string; // Optional video of winning attempt
}

/**
 * 121 of the Week award
 */
export interface OneToOneOfWeekAward {
  studentName: string;
  coachName?: string;
  reason?: string;
  awardedBy?: string;
}

/**
 * Weekly challenge record
 */
export interface WeeklyChallenge {
  id: string;
  weekNumber: number; // Week of the year (1-52)
  weekStart: string; // ISO date of Monday
  weekEnd: string; // ISO date of Sunday
  year: number;
  // Special week markers
  isHalfTerm: boolean; // Skip challenges during half-term
  isCancelled?: boolean;
  cancellationReason?: string;
  // Challenge results
  challenges: ChallengeResult[];
  // 121 of the Week award
  oneToOneOfWeek?: OneToOneOfWeekAward;
  // Metadata
  notes?: string;
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
}

export type CreateWeeklyChallengeInput = Omit<
  WeeklyChallenge,
  "id" | "weekNumber" | "year" | "createdAt" | "updatedAt"
>;

export type UpdateWeeklyChallengeInput = Partial<
  Omit<WeeklyChallenge, "id" | "weekStart" | "weekEnd" | "createdAt">
>;

// ============================================================================
// STUDENT CHALLENGE STATS
// ============================================================================

/**
 * Student's challenge statistics
 */
export interface StudentChallengeStats {
  studentName: string;
  totalWins: number;
  winsByType: Partial<Record<ChallengeType, number>>;
  oneToOneOfWeekCount: number;
  lastWinDate?: string;
  winStreak?: number;
}

/**
 * Challenge leaderboard entry
 */
export interface ChallengeLeaderboardEntry {
  rank: number;
  studentName: string;
  totalWins: number;
  oneToOneOfWeekCount: number;
  lastWin?: string;
}

// ============================================================================
// VIEW/COMPUTED TYPES
// ============================================================================

/**
 * Weekly challenge summary for list view
 */
export interface WeeklyChallengeSummary {
  weekStart: string;
  weekEnd: string;
  weekLabel: string; // "Week 3"
  isHalfTerm: boolean;
  challengeCount: number;
  hasOneToOneOfWeek: boolean;
  topChallenger?: string;
}

/**
 * Challenge type statistics
 */
export interface ChallengeTypeStats {
  challengeType: ChallengeType;
  label: string;
  timesRun: number;
  uniqueWinners: number;
  mostWins: { name: string; count: number };
}

// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

export interface ListWeeklyChallengesParams {
  year?: number;
  startWeek?: number;
  endWeek?: number;
  includeHalfTerm?: boolean;
  limit?: number;
}

export interface GetLeaderboardParams {
  year?: number;
  challengeType?: ChallengeType;
  limit?: number;
}

export interface AwardChallengeWinnerInput {
  weeklyChallengeId: string;
  challengeType: ChallengeType;
  winnerName: string;
  winnerScore?: number | string;
  notes?: string;
}

export interface AwardOneToOneOfWeekInput {
  weeklyChallengeId: string;
  studentName: string;
  reason?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const CHALLENGE_TYPE_LABELS: Record<ChallengeType, string> = {
  crossbar: "Crossbar Challenge",
  pass_through_gates: "Pass Through The Gates",
  just_net: "Just Net Challenge",
  corner: "Corner Challenge",
  footgolf: "Footgolf Challenge",
  coaches_challenge: "Coaches Challenge",
  first_touch_box: "First Touch (In The Box)",
  first_touch_air: "First Touch In The Air",
  dizzy_penalty: "Dizzy Penalty",
  free_kick: "Free Kick Challenge",
  woodwork: "Woodwork Challenge",
  goalkeeper: "Goalkeeper Challenge",
  top_bins: "Top Bins Challenge",
  custom: "Custom Challenge",
};

export const CHALLENGE_TYPE_ICONS: Record<ChallengeType, string> = {
  crossbar: "goal",
  pass_through_gates: "pass",
  just_net: "net",
  corner: "corner-flag",
  footgolf: "golf",
  coaches_challenge: "whistle",
  first_touch_box: "touch",
  first_touch_air: "air",
  dizzy_penalty: "dizzy",
  free_kick: "free-kick",
  woodwork: "wood",
  goalkeeper: "gloves",
  top_bins: "target",
  custom: "star",
};

/**
 * Standard weekly challenge rotation
 */
export const CHALLENGE_ROTATION: ChallengeType[] = [
  "crossbar",
  "pass_through_gates",
  "just_net",
  "corner",
  "footgolf",
  "coaches_challenge", // Week 6
  // Half-term break typically here
  "first_touch_box",
  "first_touch_air",
  "dizzy_penalty",
  "free_kick",
  "woodwork",
  "coaches_challenge", // Week 12
  // Half-term break typically here
  "goalkeeper",
  "top_bins",
];

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get week number from date
 */
export function getWeekNumber(date: Date): number {
  const d = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  );
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

/**
 * Get week start (Monday) from week number and year
 */
export function getWeekStartFromNumber(
  weekNumber: number,
  year: number
): string {
  const simple = new Date(year, 0, 1 + (weekNumber - 1) * 7);
  const dow = simple.getDay();
  const ISOweekStart = simple;
  if (dow <= 4) {
    ISOweekStart.setDate(simple.getDate() - simple.getDay() + 1);
  } else {
    ISOweekStart.setDate(simple.getDate() + 8 - simple.getDay());
  }
  return ISOweekStart.toISOString().split("T")[0];
}

/**
 * Get week end (Sunday) from week start
 */
export function getWeekEndFromStart(weekStart: string): string {
  const date = new Date(weekStart);
  date.setDate(date.getDate() + 6);
  return date.toISOString().split("T")[0];
}

/**
 * Format week label
 */
export function formatWeekLabel(weekNumber: number): string {
  return `Week ${weekNumber}`;
}

/**
 * Get suggested challenge for a week (based on rotation)
 */
export function getSuggestedChallenge(weekNumber: number): ChallengeType {
  const index = (weekNumber - 1) % CHALLENGE_ROTATION.length;
  return CHALLENGE_ROTATION[index];
}

/**
 * Check if a week is likely half-term (weeks 7-8, 14-15 typically)
 */
export function isLikelyHalfTerm(weekNumber: number): boolean {
  // Approximate half-term weeks - adjust as needed
  const halfTermWeeks = [7, 8, 14, 15, 22, 23, 30, 31, 42, 43];
  return halfTermWeeks.includes(weekNumber);
}

/**
 * Calculate win streak for a student
 */
export function calculateWinStreak(
  challenges: WeeklyChallenge[],
  studentName: string
): number {
  let streak = 0;

  // Sort by week descending
  const sorted = [...challenges].sort((a, b) =>
    b.weekStart.localeCompare(a.weekStart)
  );

  for (const week of sorted) {
    const hasWin = week.challenges.some(
      (c) => c.winnerName?.toLowerCase() === studentName.toLowerCase()
    );

    if (hasWin) {
      streak++;
    } else if (!week.isHalfTerm) {
      break;
    }
  }

  return streak;
}
