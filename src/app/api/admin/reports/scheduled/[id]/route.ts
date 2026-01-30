import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { verifyAdmin } from "@/lib/admin-auth";
import {
  ScheduledReport,
  UpdateScheduledReportInput,
} from "@/types/scheduled-report";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/admin/reports/scheduled/[id] - Get a single scheduled report
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const auth = await verifyAdmin(request);
  if (!auth.authenticated) return auth.error!;

  try {
    const { id } = await params;

    const doc = await adminDb.collection("scheduled_reports").doc(id).get();

    if (!doc.exists) {
      return NextResponse.json(
        { success: false, error: "Scheduled report not found" },
        { status: 404 }
      );
    }

    const report: ScheduledReport = {
      id: doc.id,
      ...doc.data(),
    } as ScheduledReport;

    return NextResponse.json({
      success: true,
      data: report,
    });
  } catch (error) {
    console.error("Error fetching scheduled report:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch scheduled report" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/reports/scheduled/[id] - Update a scheduled report
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const auth = await verifyAdmin(request);
  if (!auth.authenticated) return auth.error!;

  try {
    const { id } = await params;
    const body: UpdateScheduledReportInput = await request.json();

    const docRef = adminDb.collection("scheduled_reports").doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json(
        { success: false, error: "Scheduled report not found" },
        { status: 404 }
      );
    }

    // Validate fields if provided
    if (body.reportType) {
      const validReportTypes = ["bookings", "attendance", "revenue", "sessions"];
      if (!validReportTypes.includes(body.reportType)) {
        return NextResponse.json(
          { success: false, error: `Invalid report type. Must be one of: ${validReportTypes.join(", ")}` },
          { status: 400 }
        );
      }
    }

    if (body.frequency) {
      const validFrequencies = ["daily", "weekly", "monthly"];
      if (!validFrequencies.includes(body.frequency)) {
        return NextResponse.json(
          { success: false, error: `Invalid frequency. Must be one of: ${validFrequencies.join(", ")}` },
          { status: 400 }
        );
      }
    }

    if (body.time) {
      const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(body.time)) {
        return NextResponse.json(
          { success: false, error: "Invalid time format. Must be HH:mm (24-hour)" },
          { status: 400 }
        );
      }
    }

    if (body.recipients) {
      if (!Array.isArray(body.recipients) || body.recipients.length === 0) {
        return NextResponse.json(
          { success: false, error: "At least one recipient email is required" },
          { status: 400 }
        );
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const invalidEmails = body.recipients.filter((email) => !emailRegex.test(email));
      if (invalidEmails.length > 0) {
        return NextResponse.json(
          { success: false, error: `Invalid email addresses: ${invalidEmails.join(", ")}` },
          { status: 400 }
        );
      }
    }

    if (body.format) {
      const validFormats = ["csv", "xlsx"];
      if (!validFormats.includes(body.format)) {
        return NextResponse.json(
          { success: false, error: `Invalid format. Must be one of: ${validFormats.join(", ")}` },
          { status: 400 }
        );
      }
    }

    // Build update data (only include provided fields)
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    const allowedFields: (keyof UpdateScheduledReportInput)[] = [
      "name",
      "reportType",
      "frequency",
      "dayOfWeek",
      "dayOfMonth",
      "time",
      "recipients",
      "filters",
      "format",
      "isActive",
    ];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    await docRef.update(updateData);

    const updatedDoc = await docRef.get();
    const report: ScheduledReport = {
      id: updatedDoc.id,
      ...updatedDoc.data(),
    } as ScheduledReport;

    return NextResponse.json({
      success: true,
      data: report,
    });
  } catch (error) {
    console.error("Error updating scheduled report:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update scheduled report" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/reports/scheduled/[id] - Delete a scheduled report
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const auth = await verifyAdmin(request);
  if (!auth.authenticated) return auth.error!;

  try {
    const { id } = await params;

    const docRef = adminDb.collection("scheduled_reports").doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json(
        { success: false, error: "Scheduled report not found" },
        { status: 404 }
      );
    }

    await docRef.delete();

    return NextResponse.json({
      success: true,
      message: "Scheduled report deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting scheduled report:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete scheduled report" },
      { status: 500 }
    );
  }
}
