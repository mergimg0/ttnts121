import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { CoachPermissions, FULL_COACH_PERMISSIONS } from "@/types/user";

const USERS_COLLECTION = "users";

// GET current permissions for a coach
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userDoc = await adminDb.collection(USERS_COLLECTION).doc(id).get();

    if (!userDoc.exists) {
      return NextResponse.json(
        { success: false, error: "Coach not found" },
        { status: 404 }
      );
    }

    const userData = userDoc.data();

    // Verify this is a coach
    if (userData?.role !== "coach") {
      return NextResponse.json(
        { success: false, error: "User is not a coach" },
        { status: 400 }
      );
    }

    // Default to full permissions for backward compatibility (as per user.ts)
    const permissions = userData?.coachPermissions || FULL_COACH_PERMISSIONS;

    return NextResponse.json({
      success: true,
      data: {
        coachId: id,
        coachName: `${userData?.firstName || ""} ${userData?.lastName || ""}`.trim(),
        coachEmail: userData?.email || "",
        permissions,
      },
    });
  } catch (error) {
    console.error("Error fetching coach permissions:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch permissions" },
      { status: 500 }
    );
  }
}

// PUT update permissions for a coach
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const permissions: CoachPermissions = body.permissions;

    // Validate permissions object
    if (!permissions || typeof permissions !== "object") {
      return NextResponse.json(
        { success: false, error: "Invalid permissions object" },
        { status: 400 }
      );
    }

    // Validate all required fields are present
    const requiredFields: (keyof CoachPermissions)[] = [
      "canLogHours",
      "canViewEarnings",
      "canViewSessions",
      "canViewTimetable",
      "canMarkAttendance",
    ];

    for (const field of requiredFields) {
      if (typeof permissions[field] !== "boolean") {
        return NextResponse.json(
          { success: false, error: `Missing or invalid field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Verify user exists and is a coach
    const userDoc = await adminDb.collection(USERS_COLLECTION).doc(id).get();

    if (!userDoc.exists) {
      return NextResponse.json(
        { success: false, error: "Coach not found" },
        { status: 404 }
      );
    }

    const userData = userDoc.data();
    if (userData?.role !== "coach") {
      return NextResponse.json(
        { success: false, error: "User is not a coach" },
        { status: 400 }
      );
    }

    // Ensure canLogHours is always true (as per requirements)
    const sanitizedPermissions: CoachPermissions = {
      ...permissions,
      canLogHours: true, // Always enabled
    };

    await adminDb.collection(USERS_COLLECTION).doc(id).update({
      coachPermissions: sanitizedPermissions,
      updatedAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      message: "Permissions updated successfully",
      data: {
        permissions: sanitizedPermissions,
      },
    });
  } catch (error) {
    console.error("Error updating coach permissions:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update permissions" },
      { status: 500 }
    );
  }
}
