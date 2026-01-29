import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import {
  WeeklyChallenge,
  ChallengeResult,
  OneToOneOfWeekAward,
  ChallengeLeaderboardEntry,
  getWeekNumber,
  getWeekEndFromStart,
} from "@/types/challenges";

// Helper to convert Firestore data to WeeklyChallenge
function toWeeklyChallenge(doc: FirebaseFirestore.DocumentSnapshot): WeeklyChallenge {
  const data = doc.data();
  return {
    id: doc.id,
    ...data,
    createdAt: data?.createdAt?.toDate?.() || data?.createdAt,
    updatedAt: data?.updatedAt?.toDate?.() || data?.updatedAt,
  } as WeeklyChallenge;
}

// Helper to get or create a weekly challenge for a given week
async function getOrCreateWeeklyChallenge(weekStart: string): Promise<WeeklyChallenge> {
  const weekStartDate = new Date(weekStart);
  const weekNumber = getWeekNumber(weekStartDate);
  const year = weekStartDate.getFullYear();
  const weekEnd = getWeekEndFromStart(weekStart);

  // Try to find existing
  const snapshot = await adminDb
    .collection("weekly_challenges")
    .where("year", "==", year)
    .where("weekNumber", "==", weekNumber)
    .limit(1)
    .get();

  if (!snapshot.empty) {
    return toWeeklyChallenge(snapshot.docs[0]);
  }

  // Create new one
  const now = new Date();
  const challengeData = {
    weekNumber,
    weekStart,
    weekEnd,
    year,
    isHalfTerm: false,
    challenges: [],
    createdAt: now,
    updatedAt: now,
  };

  const docRef = await adminDb.collection("weekly_challenges").add(challengeData);
  return {
    id: docRef.id,
    ...challengeData,
  } as WeeklyChallenge;
}

// Helper to calculate leaderboard from all challenges
async function calculateLeaderboard(year?: number, limit: number = 10): Promise<ChallengeLeaderboardEntry[]> {
  let query: FirebaseFirestore.Query = adminDb.collection("weekly_challenges");

  if (year) {
    query = query.where("year", "==", year);
  }

  const snapshot = await query.get();

  // Aggregate wins by student
  const studentStats: Map<string, { totalWins: number; oneToOneCount: number; lastWin?: string }> = new Map();

  snapshot.forEach((doc) => {
    const data = doc.data() as WeeklyChallenge;

    // Count challenge wins
    data.challenges?.forEach((challenge) => {
      if (challenge.winnerName) {
        const name = challenge.winnerName.trim();
        const existing = studentStats.get(name) || { totalWins: 0, oneToOneCount: 0 };
        existing.totalWins += 1;
        existing.lastWin = data.weekStart;
        studentStats.set(name, existing);
      }
    });

    // Count 121 of the week awards
    if (data.oneToOneOfWeek?.studentName) {
      const name = data.oneToOneOfWeek.studentName.trim();
      const existing = studentStats.get(name) || { totalWins: 0, oneToOneCount: 0 };
      existing.oneToOneCount += 1;
      studentStats.set(name, existing);
    }
  });

  // Convert to array and sort
  const entries: ChallengeLeaderboardEntry[] = Array.from(studentStats.entries())
    .map(([name, stats]) => ({
      rank: 0,
      studentName: name,
      totalWins: stats.totalWins,
      oneToOneOfWeekCount: stats.oneToOneCount,
      lastWin: stats.lastWin,
    }))
    .sort((a, b) => {
      // Sort by total wins, then by 121 count
      if (b.totalWins !== a.totalWins) return b.totalWins - a.totalWins;
      return b.oneToOneOfWeekCount - a.oneToOneOfWeekCount;
    })
    .slice(0, limit);

  // Add rank
  entries.forEach((entry, idx) => {
    entry.rank = idx + 1;
  });

  return entries;
}

// GET /api/admin/challenges - List challenges by year OR get specific week
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const weekStart = searchParams.get("weekStart");

    // If weekStart is provided, return single week data with leaderboard
    if (weekStart) {
      const weekStartDate = new Date(weekStart);
      const weekNumber = getWeekNumber(weekStartDate);
      const year = weekStartDate.getFullYear();

      // Find existing challenge for this week
      const snapshot = await adminDb
        .collection("weekly_challenges")
        .where("year", "==", year)
        .where("weekNumber", "==", weekNumber)
        .limit(1)
        .get();

      const weeklyChallenge = snapshot.empty ? null : toWeeklyChallenge(snapshot.docs[0]);
      const leaderboard = await calculateLeaderboard(year);

      return NextResponse.json({
        success: true,
        data: {
          weeklyChallenge,
          leaderboard,
        },
      });
    }

    // Otherwise, list all challenges for the year
    const year = parseInt(searchParams.get("year") || String(new Date().getFullYear()));
    const includeHalfTerm = searchParams.get("includeHalfTerm") !== "false";
    const limit = parseInt(searchParams.get("limit") || "52");

    const query: FirebaseFirestore.Query = adminDb
      .collection("weekly_challenges")
      .where("year", "==", year)
      .orderBy("weekNumber", "asc")
      .limit(limit);

    const snapshot = await query.get();

    const challenges: WeeklyChallenge[] = [];

    snapshot.forEach((doc) => {
      const challenge = toWeeklyChallenge(doc);
      if (includeHalfTerm || !challenge.isHalfTerm) {
        challenges.push(challenge);
      }
    });

    return NextResponse.json({
      success: true,
      data: challenges,
      meta: {
        year,
        count: challenges.length,
        includeHalfTerm,
      },
    });
  } catch (error) {
    console.error("Error fetching challenges:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch challenges" },
      { status: 500 }
    );
  }
}

// POST /api/admin/challenges - Handle various challenge actions
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, weekStart } = body;

    // Handle action-based requests from the challenges page
    if (action) {
      if (!weekStart) {
        return NextResponse.json(
          { success: false, error: "Missing required field: weekStart" },
          { status: 400 }
        );
      }

      const weeklyChallenge = await getOrCreateWeeklyChallenge(weekStart);
      const docRef = adminDb.collection("weekly_challenges").doc(weeklyChallenge.id);

      switch (action) {
        case "saveChallengeResult": {
          const { result } = body as { result: ChallengeResult };
          if (!result?.challengeType) {
            return NextResponse.json(
              { success: false, error: "Missing challenge result data" },
              { status: 400 }
            );
          }

          // Update challenges array
          const challenges = [...(weeklyChallenge.challenges || [])];
          const existingIndex = challenges.findIndex(
            (c) => c.challengeType === result.challengeType
          );

          if (existingIndex >= 0) {
            challenges[existingIndex] = result;
          } else {
            challenges.push(result);
          }

          await docRef.update({
            challenges,
            updatedAt: new Date(),
          });

          const updatedDoc = await docRef.get();
          return NextResponse.json({
            success: true,
            data: {
              weeklyChallenge: toWeeklyChallenge(updatedDoc),
            },
          });
        }

        case "saveOneToOneOfWeek": {
          const { award } = body as { award: OneToOneOfWeekAward };
          if (!award?.studentName) {
            return NextResponse.json(
              { success: false, error: "Missing student name for 121 of the week" },
              { status: 400 }
            );
          }

          await docRef.update({
            oneToOneOfWeek: award,
            updatedAt: new Date(),
          });

          const updatedDoc = await docRef.get();
          return NextResponse.json({
            success: true,
            data: {
              weeklyChallenge: toWeeklyChallenge(updatedDoc),
            },
          });
        }

        case "toggleHalfTerm": {
          const { isHalfTerm } = body as { isHalfTerm: boolean };

          await docRef.update({
            isHalfTerm,
            updatedAt: new Date(),
          });

          const updatedDoc = await docRef.get();
          return NextResponse.json({
            success: true,
            data: {
              weeklyChallenge: toWeeklyChallenge(updatedDoc),
            },
          });
        }

        default:
          return NextResponse.json(
            { success: false, error: `Unknown action: ${action}` },
            { status: 400 }
          );
      }
    }

    // Handle legacy create request (no action field)
    const {
      weekEnd,
      isHalfTerm = false,
      isCancelled,
      cancellationReason,
      challenges = [],
      oneToOneOfWeek,
      notes,
    } = body;

    if (!weekStart) {
      return NextResponse.json(
        { success: false, error: "Missing required field: weekStart" },
        { status: 400 }
      );
    }

    const weekStartDate = new Date(weekStart);
    if (isNaN(weekStartDate.getTime())) {
      return NextResponse.json(
        { success: false, error: "Invalid weekStart date format" },
        { status: 400 }
      );
    }

    const weekNumber = getWeekNumber(weekStartDate);
    const year = weekStartDate.getFullYear();
    const calculatedWeekEnd = weekEnd || getWeekEndFromStart(weekStart);

    // Check for existing challenge in the same week/year
    const existingSnapshot = await adminDb
      .collection("weekly_challenges")
      .where("year", "==", year)
      .where("weekNumber", "==", weekNumber)
      .limit(1)
      .get();

    if (!existingSnapshot.empty) {
      return NextResponse.json(
        { success: false, error: `A challenge for week ${weekNumber} of ${year} already exists` },
        { status: 400 }
      );
    }

    const now = new Date();

    const challengeData: Omit<WeeklyChallenge, "id"> = {
      weekNumber,
      weekStart,
      weekEnd: calculatedWeekEnd,
      year,
      isHalfTerm,
      isCancelled: isCancelled || undefined,
      cancellationReason: cancellationReason || undefined,
      challenges,
      oneToOneOfWeek: oneToOneOfWeek || undefined,
      notes: notes || undefined,
      createdAt: now,
      updatedAt: now,
    };

    // Remove undefined values
    const cleanData = Object.fromEntries(
      Object.entries(challengeData).filter(([, v]) => v !== undefined)
    );

    const docRef = await adminDb.collection("weekly_challenges").add(cleanData);

    const challenge: WeeklyChallenge = {
      id: docRef.id,
      ...challengeData,
    };

    return NextResponse.json({
      success: true,
      data: challenge,
    });
  } catch (error) {
    console.error("Error handling challenge request:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process challenge request" },
      { status: 500 }
    );
  }
}
