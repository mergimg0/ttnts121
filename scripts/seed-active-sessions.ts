/**
 * Seed script for ACTIVE Camps session data
 *
 * This script populates the Firestore database with sessions scraped from
 * the ACTIVE camps booking system.
 *
 * Source: https://campscui.active.com/orgs/TakeTheNextStep#/selectSessions/3739833
 * Scraped: 2026-01-26
 *
 * Usage:
 *   npx ts-node scripts/seed-active-sessions.ts
 *
 * Or via API (preferred):
 *   curl -X POST http://localhost:3000/api/admin/programs -d '...'
 *   curl -X POST http://localhost:3000/api/admin/sessions -d '...'
 */

// Program Data
export const PROGRAM_DATA = {
  name: "After School Football - Ramsey Manor (Spring 2026)",
  description: "After school football sessions at Ramsey Manor Lower School in Barton Le Clay. Fun, professional coaching for children ages 4-9.",
  location: "barton-le-clay",
  serviceType: "after-school" as const,
  dateRange: {
    start: new Date("2026-01-05T00:00:00.000Z"),
    end: new Date("2026-02-13T23:59:59.000Z"),
  },
  isActive: true,
};

// Session Data (to be created after program)
export const SESSIONS_DATA = [
  {
    name: "Reception and KS1 - Football After School Club (Mondays)",
    description: "Football coaching for Reception and KS1 children. Fun, skill-building sessions in a supportive environment.",
    dayOfWeek: 1, // Monday
    startTime: "15:30",
    endTime: "16:30",
    startDate: new Date("2026-01-05T00:00:00.000Z"),
    endDate: new Date("2026-02-09T23:59:59.000Z"),
    location: "barton-le-clay",
    ageMin: 4,
    ageMax: 7,
    price: 3000, // £30.00 in pence
    capacity: 12,
    enrolled: 12, // Full - waitlist only
    waitlistEnabled: true,
    isActive: true,
  },
  {
    name: "KS2 - Football After School Club - Tuesdays",
    description: "Football coaching for KS2 children. Develop skills and teamwork in a fun, supportive environment.",
    dayOfWeek: 2, // Tuesday
    startTime: "15:30",
    endTime: "16:30",
    startDate: new Date("2026-01-06T00:00:00.000Z"),
    endDate: new Date("2026-02-10T23:59:59.000Z"),
    location: "barton-le-clay",
    ageMin: 7,
    ageMax: 9,
    price: 3000, // £30.00 in pence
    capacity: 15,
    enrolled: 0, // Available
    waitlistEnabled: true,
    isActive: true,
  },
  {
    name: "KS1 & KS2 - Football After School Club - Fridays",
    description: "Combined football coaching for KS1 and KS2 children. A longer session for extended skill development and match play.",
    dayOfWeek: 5, // Friday
    startTime: "14:00",
    endTime: "15:30",
    startDate: new Date("2026-01-09T00:00:00.000Z"),
    endDate: new Date("2026-02-13T23:59:59.000Z"),
    location: "barton-le-clay",
    ageMin: 5,
    ageMax: 9,
    price: 4200, // £42.00 in pence
    capacity: 15,
    enrolled: 13, // Only 2 spots left
    waitlistEnabled: true,
    isActive: true,
  },
];

// API payloads for manual execution
export const API_PAYLOADS = {
  program: {
    ...PROGRAM_DATA,
    dateRange: {
      start: "2026-01-05T00:00:00.000Z",
      end: "2026-02-13T23:59:59.000Z",
    },
  },
  sessions: SESSIONS_DATA.map((s) => ({
    ...s,
    startDate: s.startDate.toISOString(),
    endDate: s.endDate.toISOString(),
  })),
};

console.log("=== ACTIVE Camps Session Seed Data ===\n");
console.log("Program Payload:");
console.log(JSON.stringify(API_PAYLOADS.program, null, 2));
console.log("\nSession Payloads:");
API_PAYLOADS.sessions.forEach((s, i) => {
  console.log(`\nSession ${i + 1}: ${s.name}`);
  console.log(JSON.stringify(s, null, 2));
});
