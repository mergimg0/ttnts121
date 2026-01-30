import { NextRequest, NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/lib/firebase-admin";
import { CoachPermissions, FULL_COACH_PERMISSIONS } from "@/types/user";

export type PermissionKey = keyof CoachPermissions;

interface PermissionCheckResult {
  allowed: boolean;
  userId?: string;
  permissions?: CoachPermissions;
  userData?: Record<string, unknown>;
  error?: NextResponse;
}

/**
 * Get user ID from request using various auth methods.
 * Tries: Authorization header (Bearer token) -> Session cookie -> Query param (dev only)
 */
export async function getUserIdFromRequest(
  request: NextRequest
): Promise<string | null> {
  // Try Authorization header first
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.substring(7);
    try {
      const decodedToken = await adminAuth.verifyIdToken(token);
      return decodedToken.uid;
    } catch {
      // Token verification failed, try other methods
    }
  }

  // Try session cookie
  const sessionCookie = request.cookies.get("session")?.value;
  if (sessionCookie) {
    try {
      const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie);
      return decodedClaims.uid;
    } catch {
      // Session cookie invalid
    }
  }

  // For development/testing, also check for userId in query params
  const { searchParams } = new URL(request.url);
  return searchParams.get("userId");
}

/**
 * Check if the requesting user has a specific coach permission.
 * Uses Firebase Admin to verify the user from the Authorization header.
 *
 * @param request - The NextRequest object
 * @param permission - The permission key to check
 * @returns PermissionCheckResult with allowed status and optional error response
 */
export async function checkCoachPermission(
  request: NextRequest,
  permission: PermissionKey
): Promise<PermissionCheckResult> {
  try {
    // Get user ID from request
    const userId = await getUserIdFromRequest(request);

    if (!userId) {
      return {
        allowed: false,
        error: NextResponse.json(
          { success: false, error: "Unauthorized" },
          { status: 401 }
        ),
      };
    }

    // Fetch user document to get permissions
    const userDoc = await adminDb.collection("users").doc(userId).get();

    if (!userDoc.exists) {
      // User not found in users collection
      // For backward compatibility with older coach records, allow full access
      return {
        allowed: true,
        userId,
        permissions: FULL_COACH_PERMISSIONS,
      };
    }

    const userData = userDoc.data() as Record<string, unknown>;

    // Verify role is coach or admin
    if (userData?.role !== "coach" && userData?.role !== "admin") {
      return {
        allowed: false,
        userId,
        error: NextResponse.json(
          { success: false, error: "Not authorized as coach" },
          { status: 403 }
        ),
      };
    }

    // Admins always have full access
    if (userData?.role === "admin") {
      return {
        allowed: true,
        userId,
        permissions: FULL_COACH_PERMISSIONS,
        userData,
      };
    }

    // Get permissions with backward compatibility
    // If coachPermissions is undefined, default to full access for backward compatibility
    const permissions: CoachPermissions =
      (userData?.coachPermissions as CoachPermissions) || FULL_COACH_PERMISSIONS;

    const allowed = permissions[permission] ?? false;

    if (!allowed) {
      return {
        allowed: false,
        userId,
        permissions,
        userData,
        error: NextResponse.json(
          { success: false, error: `Permission denied: ${permission}` },
          { status: 403 }
        ),
      };
    }

    return {
      allowed: true,
      userId,
      permissions,
      userData,
    };
  } catch (error) {
    console.error("Permission check error:", error);
    return {
      allowed: false,
      error: NextResponse.json(
        { success: false, error: "Permission check failed" },
        { status: 500 }
      ),
    };
  }
}

/**
 * Verify coach role and get user data without permission check.
 * Use this when you need to verify the user is a coach but don't need
 * to check specific permissions.
 */
export async function verifyCoachAndGetUser(
  request: NextRequest
): Promise<{
  valid: boolean;
  userId?: string;
  userData?: Record<string, unknown>;
  error?: NextResponse;
}> {
  try {
    const userId = await getUserIdFromRequest(request);

    if (!userId) {
      return {
        valid: false,
        error: NextResponse.json(
          { success: false, error: "Unauthorized" },
          { status: 401 }
        ),
      };
    }

    const userDoc = await adminDb.collection("users").doc(userId).get();

    if (!userDoc.exists) {
      return {
        valid: false,
        userId,
        error: NextResponse.json(
          { success: false, error: "User not found" },
          { status: 404 }
        ),
      };
    }

    const userData = userDoc.data() as Record<string, unknown>;

    if (userData?.role !== "coach" && userData?.role !== "admin") {
      return {
        valid: false,
        userId,
        error: NextResponse.json(
          { success: false, error: "Not authorized as coach" },
          { status: 403 }
        ),
      };
    }

    return {
      valid: true,
      userId,
      userData,
    };
  } catch (error) {
    console.error("Coach verification error:", error);
    return {
      valid: false,
      error: NextResponse.json(
        { success: false, error: "Verification failed" },
        { status: 500 }
      ),
    };
  }
}
