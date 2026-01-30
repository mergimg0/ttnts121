/**
 * @fileoverview Next.js middleware for route protection and security headers
 *
 * SECURITY NOTICE: This file contains security-sensitive middleware logic.
 * For security concerns, please report to: security@example.com
 * See: /.well-known/security.txt
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Define protected route patterns
const protectedRoutes = [
  "/account",
  "/account/bookings",
  "/account/profile",
  "/account/children",
];

const coachRoutes = ["/coach"];

// Auth routes that should redirect to account if logged in
const authRoutes = ["/login", "/register", "/forgot-password", "/reset-password"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Security headers
  const securityHeaders = {
    "Content-Security-Policy": [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://challenges.cloudflare.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: blob: https: https://*.stripe.com",
      "font-src 'self' https://fonts.gstatic.com",
      "frame-src 'self' https://js.stripe.com https://challenges.cloudflare.com",
      "connect-src 'self' https://*.firebaseio.com https://*.googleapis.com https://api.stripe.com wss://*.firebaseio.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "upgrade-insecure-requests",
    ].join("; "),
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "X-XSS-Protection": "1; mode=block",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  };

  // Check for Firebase auth session cookie
  // Note: Firebase client-side auth doesn't use cookies by default
  // This middleware provides basic route structure
  // Actual auth checks happen in the components via useAuth hook

  // For protected routes, we let the client-side handle redirects
  // The auth context will redirect unauthenticated users

  // For auth routes when user might be logged in
  // The components handle this via useAuth hook

  // Create response and add security headers
  const response = NextResponse.next();

  // Apply all security headers
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api routes (handled separately)
     */
    "/((?!_next/static|_next/image|favicon.ico|public|api).*)",
  ],
};
