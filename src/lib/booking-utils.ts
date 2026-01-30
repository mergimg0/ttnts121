import { Session, SessionFilters } from "@/types/booking";
import { secureRandomInt } from "@/lib/secure-random";

// Convert Firestore timestamp or Date to JS Date
export function toDate(value: any): Date {
  if (!value) return new Date();
  if (value instanceof Date) return value;
  if (value._seconds !== undefined) {
    return new Date(value._seconds * 1000);
  }
  if (value.seconds !== undefined) {
    return new Date(value.seconds * 1000);
  }
  if (typeof value === "string" || typeof value === "number") {
    return new Date(value);
  }
  return new Date();
}

// Generate a unique booking reference
export function generateBookingRef(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let ref = "TTNTS-";
  for (let i = 0; i < 6; i++) {
    ref += chars.charAt(secureRandomInt(0, chars.length));
  }
  return ref;
}

// Format price from pence to display string
export function formatPrice(pence: number): string {
  return `£${(pence / 100).toFixed(2)}`;
}

// Parse price from pounds to pence
export function parsePriceToPence(pounds: number): number {
  return Math.round(pounds * 100);
}

// Calculate age from date of birth
export function calculateAge(dob: Date): number {
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--;
  }

  return age;
}

// Get age group from age
export function getAgeGroup(age: number): string {
  if (age >= 4 && age <= 5) return "mini-kickers";
  if (age >= 6 && age <= 7) return "juniors";
  if (age >= 8 && age <= 9) return "seniors";
  if (age >= 10 && age <= 11) return "advanced";
  return "unknown";
}

// Calculate age group from date of birth
export function calculateAgeGroup(dob: Date): string {
  const age = calculateAge(dob);
  return getAgeGroup(age);
}

// Check if session has availability
export function hasAvailability(session: Session): boolean {
  return session.enrolled < session.capacity;
}

// Get availability status
export function getAvailabilityStatus(session: Session): {
  status: "available" | "low" | "full" | "waitlist";
  spotsLeft: number;
  message: string;
} {
  const spotsLeft = session.capacity - session.enrolled;

  if (spotsLeft <= 0) {
    return {
      status: session.waitlistEnabled ? "waitlist" : "full",
      spotsLeft: 0,
      message: session.waitlistEnabled ? "Waitlist Only" : "Full",
    };
  }

  if (spotsLeft <= 3) {
    return {
      status: "low",
      spotsLeft,
      message: `Only ${spotsLeft} spot${spotsLeft === 1 ? "" : "s"} left!`,
    };
  }

  return {
    status: "available",
    spotsLeft,
    message: `${spotsLeft} spots available`,
  };
}

// Format time from 24h to 12h
export function formatTime(time: string): string {
  const [hours, minutes] = time.split(":").map(Number);
  const period = hours >= 12 ? "pm" : "am";
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes.toString().padStart(2, "0")}${period}`;
}

// Get day name from number
export function getDayName(day: number): string {
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  return days[day];
}

// Filter sessions based on criteria
export function filterSessions(
  sessions: Session[],
  filters: SessionFilters
): Session[] {
  return sessions.filter((session) => {
    // Location filter
    if (filters.location && session.location !== filters.location) {
      return false;
    }

    // Age group filter
    if (filters.ageGroup) {
      const ageRange = getAgeRangeFromGroup(filters.ageGroup);
      if (ageRange && (session.ageMax < ageRange.min || session.ageMin > ageRange.max)) {
        return false;
      }
    }

    // Date range filter
    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom);
      const sessionEnd = session.endDate instanceof Date
        ? session.endDate
        : session.endDate.toDate();
      if (sessionEnd < fromDate) {
        return false;
      }
    }

    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo);
      const sessionStart = session.startDate instanceof Date
        ? session.startDate
        : session.startDate.toDate();
      if (sessionStart > toDate) {
        return false;
      }
    }

    // Time of day filter
    if (filters.timeOfDay) {
      const [hours] = session.startTime.split(":").map(Number);
      switch (filters.timeOfDay) {
        case "morning":
          if (hours >= 12) return false;
          break;
        case "afternoon":
          if (hours < 12 || hours >= 17) return false;
          break;
        case "evening":
          if (hours < 17) return false;
          break;
      }
    }

    return true;
  });
}

function getAgeRangeFromGroup(group: string): { min: number; max: number } | null {
  const ranges: Record<string, { min: number; max: number }> = {
    "mini-kickers": { min: 4, max: 5 },
    "juniors": { min: 6, max: 7 },
    "seniors": { min: 8, max: 9 },
    "advanced": { min: 10, max: 11 },
  };
  return ranges[group] || null;
}

// Sort sessions by date and time
export function sortSessionsByDateTime(sessions: Session[]): Session[] {
  return [...sessions].sort((a, b) => {
    const dateA = a.startDate instanceof Date ? a.startDate : a.startDate.toDate();
    const dateB = b.startDate instanceof Date ? b.startDate : b.startDate.toDate();

    if (dateA.getTime() !== dateB.getTime()) {
      return dateA.getTime() - dateB.getTime();
    }

    return a.startTime.localeCompare(b.startTime);
  });
}

// Group sessions by program
export function groupSessionsByProgram(
  sessions: Session[]
): Record<string, Session[]> {
  return sessions.reduce((acc, session) => {
    if (!acc[session.programId]) {
      acc[session.programId] = [];
    }
    acc[session.programId].push(session);
    return acc;
  }, {} as Record<string, Session[]>);
}
