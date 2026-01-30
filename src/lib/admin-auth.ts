import { NextRequest, NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/lib/firebase-admin";

export interface AdminAuthResult {
  authenticated: boolean;
  userId?: string;
  adminData?: {
    email: string;
    role: "admin" | "super-admin";
    name?: string;
  };
  error?: NextResponse;
}

/**
 * Get user ID from request Authorization header.
 * Returns null if token is invalid or missing.
 */
async function getUserIdFromToken(request: NextRequest): Promise<string | null> {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.substring(7);
  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    return decodedToken.uid;
  } catch {
    return null;
  }
}

/**
 * Verify that the request comes from an authenticated admin user.
 * Checks Firebase Auth token and verifies user exists in admins collection.
 *
 * Usage:
 *   const auth = await verifyAdmin(request);
 *   if (!auth.authenticated) return auth.error!;
 *   // proceed with authenticated admin user
 */
export async function verifyAdmin(
  request: NextRequest
): Promise<AdminAuthResult> {
  try {
    // Check for Authorization header
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return {
        authenticated: false,
        error: NextResponse.json(
          { success: false, error: "Authorization header required" },
          { status: 401 }
        ),
      };
    }

    // Get user ID from token
    const userId = await getUserIdFromToken(request);
    if (!userId) {
      return {
        authenticated: false,
        error: NextResponse.json(
          { success: false, error: "Invalid or expired token" },
          { status: 401 }
        ),
      };
    }

    // Check if user is in admins collection
    const adminDoc = await adminDb.collection("admins").doc(userId).get();

    if (!adminDoc.exists) {
      return {
        authenticated: false,
        error: NextResponse.json(
          { success: false, error: "Not authorized as admin" },
          { status: 403 }
        ),
      };
    }

    const adminData = adminDoc.data() as {
      email: string;
      role: "admin" | "super-admin";
      name?: string;
    };

    return {
      authenticated: true,
      userId,
      adminData,
    };
  } catch (error) {
    console.error("Admin auth error:", error);
    return {
      authenticated: false,
      error: NextResponse.json(
        { success: false, error: "Authentication failed" },
        { status: 500 }
      ),
    };
  }
}

/**
 * Verify super-admin role for sensitive operations.
 * Returns 403 if user is admin but not super-admin.
 */
export async function verifySuperAdmin(
  request: NextRequest
): Promise<AdminAuthResult> {
  const result = await verifyAdmin(request);

  if (!result.authenticated) {
    return result;
  }

  if (result.adminData?.role !== "super-admin") {
    return {
      authenticated: false,
      error: NextResponse.json(
        { success: false, error: "Super-admin access required" },
        { status: 403 }
      ),
    };
  }

  return result;
}

/**
 * Higher-order function to wrap admin route handlers with authentication.
 *
 * Usage:
 *   export const GET = withAdminAuth(async (request, { userId, adminData }) => {
 *     // Your handler code - user is guaranteed to be authenticated admin
 *   });
 */
export function withAdminAuth<T extends { params?: Promise<Record<string, string>> }>(
  handler: (
    request: NextRequest,
    context: { userId: string; adminData: AdminAuthResult["adminData"] },
    routeContext?: T
  ) => Promise<NextResponse>
) {
  return async (request: NextRequest, routeContext?: T): Promise<NextResponse> => {
    const authResult = await verifyAdmin(request);

    if (!authResult.authenticated) {
      return authResult.error!;
    }

    return handler(
      request,
      { userId: authResult.userId!, adminData: authResult.adminData },
      routeContext
    );
  };
}
