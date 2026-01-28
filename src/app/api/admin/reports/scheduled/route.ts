import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import {
  ScheduledReport,
  CreateScheduledReportInput,
} from "@/types/scheduled-report";

/**
 * GET /api/admin/reports/scheduled - List all scheduled reports
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get("active") === "true";
    const limit = parseInt(searchParams.get("limit") || "50");

    let query: FirebaseFirestore.Query = adminDb
      .collection("scheduled_reports")
      .orderBy("createdAt", "desc")
      .limit(limit);

    if (activeOnly) {
      query = query.where("isActive", "==", true);
    }

    const snapshot = await query.get();

    const reports: ScheduledReport[] = [];
    snapshot.forEach((doc) => {
      reports.push({
        id: doc.id,
        ...doc.data(),
      } as ScheduledReport);
    });

    return NextResponse.json({
      success: true,
      data: reports,
    });
  } catch (error) {
    console.error("Error fetching scheduled reports:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch scheduled reports" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/reports/scheduled - Create a new scheduled report
 */
export async function POST(request: NextRequest) {
  try {
    const body: CreateScheduledReportInput = await request.json();
    const {
      name,
      reportType,
      frequency,
      dayOfWeek,
      dayOfMonth,
      time,
      recipients,
      filters,
      format,
      isActive = true,
    } = body;

    // Validate required fields
    if (!name || !reportType || !frequency || !time || !recipients || !format) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: name, reportType, frequency, time, recipients, format",
        },
        { status: 400 }
      );
    }

    // Validate report type
    const validReportTypes = ["bookings", "attendance", "revenue", "sessions"];
    if (!validReportTypes.includes(reportType)) {
      return NextResponse.json(
        { success: false, error: `Invalid report type. Must be one of: ${validReportTypes.join(", ")}` },
        { status: 400 }
      );
    }

    // Validate frequency
    const validFrequencies = ["daily", "weekly", "monthly"];
    if (!validFrequencies.includes(frequency)) {
      return NextResponse.json(
        { success: false, error: `Invalid frequency. Must be one of: ${validFrequencies.join(", ")}` },
        { status: 400 }
      );
    }

    // Validate time format (HH:mm)
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(time)) {
      return NextResponse.json(
        { success: false, error: "Invalid time format. Must be HH:mm (24-hour)" },
        { status: 400 }
      );
    }

    // Validate recipients (at least one valid email)
    if (!Array.isArray(recipients) || recipients.length === 0) {
      return NextResponse.json(
        { success: false, error: "At least one recipient email is required" },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const invalidEmails = recipients.filter((email) => !emailRegex.test(email));
    if (invalidEmails.length > 0) {
      return NextResponse.json(
        { success: false, error: `Invalid email addresses: ${invalidEmails.join(", ")}` },
        { status: 400 }
      );
    }

    // Validate frequency-specific fields
    if (frequency === "weekly" && (dayOfWeek === undefined || dayOfWeek < 0 || dayOfWeek > 6)) {
      return NextResponse.json(
        { success: false, error: "Weekly reports require dayOfWeek (0-6, where 0 is Sunday)" },
        { status: 400 }
      );
    }

    if (frequency === "monthly" && (dayOfMonth === undefined || dayOfMonth < 1 || dayOfMonth > 31)) {
      return NextResponse.json(
        { success: false, error: "Monthly reports require dayOfMonth (1-31)" },
        { status: 400 }
      );
    }

    // Validate format
    const validFormats = ["csv", "xlsx"];
    if (!validFormats.includes(format)) {
      return NextResponse.json(
        { success: false, error: `Invalid format. Must be one of: ${validFormats.join(", ")}` },
        { status: 400 }
      );
    }

    const now = new Date();

    const reportData: Omit<ScheduledReport, "id"> = {
      name,
      reportType,
      frequency,
      ...(frequency === "weekly" && { dayOfWeek }),
      ...(frequency === "monthly" && { dayOfMonth }),
      time,
      recipients,
      filters: filters || {},
      format,
      isActive,
      createdAt: now,
      updatedAt: now,
      createdBy: "admin", // TODO: Get actual admin user from session
    };

    const docRef = await adminDb.collection("scheduled_reports").add(reportData);

    const report: ScheduledReport = {
      id: docRef.id,
      ...reportData,
    };

    return NextResponse.json({
      success: true,
      data: report,
    });
  } catch (error) {
    console.error("Error creating scheduled report:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create scheduled report" },
      { status: 500 }
    );
  }
}
