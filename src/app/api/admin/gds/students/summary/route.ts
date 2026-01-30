import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { verifyAdmin } from "@/lib/admin-auth";
import type { GDSDay, GDSAgeGroup } from "@/types/gds";

interface AgeGroupSummary {
  ageGroup: string;
  totalStudents: number;
  activeStudents: number;
  trialStudents: number;
  inactiveStudents: number;
}

interface DaySummary {
  day: GDSDay;
  totalStudents: number;
  byAgeGroup: AgeGroupSummary[];
}

const AGE_GROUPS: GDSAgeGroup[] = ["Y1-Y2", "Y3-Y4", "Y5-Y6", "Y6-Y7"];
const DAYS: GDSDay[] = ["monday", "wednesday", "saturday"];

/**
 * GET /api/admin/gds/students/summary
 * Get summary statistics for GDS students
 *
 * Query params:
 * - day: monday | wednesday | saturday (optional - filter by day)
 */
export async function GET(request: NextRequest) {
  const auth = await verifyAdmin(request);
  if (!auth.authenticated) return auth.error!;

  try {
    const { searchParams } = new URL(request.url);
    const day = searchParams.get("day") as GDSDay | null;

    const snapshot = await adminDb.collection("gds_students").get();
    const students = snapshot.docs.map((doc) => doc.data());

    // Normalize age group values for consistent matching
    const normalizeAgeGroup = (ag: string | undefined): string => {
      if (!ag) return "Unknown";
      // Remove spaces: "Y1 - Y2" -> "Y1-Y2"
      const normalized = ag.replace(/\s+/g, "").replace(/-+/g, "-");
      // Map known variations
      if (normalized === "GDS") return "Y3-Y4"; // Default GDS to Y3-Y4
      return normalized;
    };

    if (day) {
      // Return summary for specific day
      const dayStudents = students.filter((s) => s.day === day);

      const summaryMap = new Map<string, AgeGroupSummary>();
      AGE_GROUPS.forEach((ag) => {
        summaryMap.set(ag, {
          ageGroup: ag,
          totalStudents: 0,
          activeStudents: 0,
          trialStudents: 0,
          inactiveStudents: 0,
        });
      });

      dayStudents.forEach((student) => {
        const ag = normalizeAgeGroup(student.ageGroup);
        let summary = summaryMap.get(ag);

        // Create entry for unknown age groups
        if (!summary) {
          summary = {
            ageGroup: ag,
            totalStudents: 0,
            activeStudents: 0,
            trialStudents: 0,
            inactiveStudents: 0,
          };
          summaryMap.set(ag, summary);
        }

        summary.totalStudents++;
        if (student.status === "active") {
          summary.activeStudents++;
        } else if (student.status === "trial") {
          summary.trialStudents++;
        } else {
          summary.inactiveStudents++;
        }
      });

      const data = Array.from(summaryMap.values()).filter(
        (s) => s.totalStudents > 0
      );

      return NextResponse.json({
        success: true,
        data: {
          day,
          totalStudents: dayStudents.length,
          byAgeGroup: data,
        },
      });
    }

    // Return summary for all days
    const summaries: DaySummary[] = DAYS.map((dayValue) => {
      const dayStudents = students.filter((s) => s.day === dayValue);

      const summaryMap = new Map<string, AgeGroupSummary>();
      AGE_GROUPS.forEach((ag) => {
        summaryMap.set(ag, {
          ageGroup: ag,
          totalStudents: 0,
          activeStudents: 0,
          trialStudents: 0,
          inactiveStudents: 0,
        });
      });

      dayStudents.forEach((student) => {
        const ag = normalizeAgeGroup(student.ageGroup);
        let summary = summaryMap.get(ag);

        if (!summary) {
          summary = {
            ageGroup: ag,
            totalStudents: 0,
            activeStudents: 0,
            trialStudents: 0,
            inactiveStudents: 0,
          };
          summaryMap.set(ag, summary);
        }

        summary.totalStudents++;
        if (student.status === "active") {
          summary.activeStudents++;
        } else if (student.status === "trial") {
          summary.trialStudents++;
        } else {
          summary.inactiveStudents++;
        }
      });

      return {
        day: dayValue,
        totalStudents: dayStudents.length,
        byAgeGroup: Array.from(summaryMap.values()).filter(
          (s) => s.totalStudents > 0
        ),
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        totalStudents: students.length,
        byDay: summaries,
      },
    });
  } catch (error) {
    console.error("Error fetching GDS summary:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch GDS summary" },
      { status: 500 }
    );
  }
}
