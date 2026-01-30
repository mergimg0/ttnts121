import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import crypto from "crypto";

const CSRF_COOKIE_NAME = "__csrf";
const CSRF_HEADER_NAME = "x-csrf-token";
const CSRF_TOKEN_LENGTH = 32;

/**
 * Generate a cryptographically secure CSRF token
 */
export function generateCsrfToken(): string {
  return crypto.randomBytes(CSRF_TOKEN_LENGTH).toString("hex");
}

/**
 * Set CSRF cookie on response
 */
export function setCsrfCookie(response: NextResponse, token: string): void {
  response.cookies.set(CSRF_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60 * 24, // 24 hours
  });
}

/**
 * Get or create CSRF token from cookies
 */
export async function getCsrfToken(): Promise<string> {
  const cookieStore = await cookies();
  const existingToken = cookieStore.get(CSRF_COOKIE_NAME)?.value;

  if (existingToken && existingToken.length === CSRF_TOKEN_LENGTH * 2) {
    return existingToken;
  }

  return generateCsrfToken();
}

/**
 * Validate CSRF token from request header against cookie
 */
export async function validateCsrfToken(request: NextRequest): Promise<boolean> {
  const headerToken = request.headers.get(CSRF_HEADER_NAME);
  const cookieToken = request.cookies.get(CSRF_COOKIE_NAME)?.value;

  if (!headerToken || !cookieToken) {
    return false;
  }

  // Use constant-time comparison to prevent timing attacks
  if (headerToken.length !== cookieToken.length) {
    return false;
  }

  return crypto.timingSafeEqual(
    Buffer.from(headerToken),
    Buffer.from(cookieToken)
  );
}

/**
 * Middleware helper to check CSRF on state-changing requests
 */
export async function csrfProtection(
  request: NextRequest
): Promise<{ valid: true } | { valid: false; response: NextResponse }> {
  // Only check for state-changing methods
  const method = request.method.toUpperCase();
  if (["GET", "HEAD", "OPTIONS"].includes(method)) {
    return { valid: true };
  }

  // Skip for API routes that use Bearer token auth (already protected)
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return { valid: true };
  }

  const isValid = await validateCsrfToken(request);

  if (!isValid) {
    return {
      valid: false,
      response: NextResponse.json(
        { success: false, error: "Invalid or missing CSRF token" },
        { status: 403 }
      ),
    };
  }

  return { valid: true };
}

/**
 * Hook to get CSRF token for forms/fetch requests
 * Use this in client components
 */
export function useCsrfTokenEndpoint(): string {
  return "/api/csrf";
}
