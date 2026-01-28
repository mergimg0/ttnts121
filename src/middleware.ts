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

  // Check for Firebase auth session cookie
  // Note: Firebase client-side auth doesn't use cookies by default
  // This middleware provides basic route structure
  // Actual auth checks happen in the components via useAuth hook

  // For protected routes, we let the client-side handle redirects
  // The auth context will redirect unauthenticated users

  // For auth routes when user might be logged in
  // The components handle this via useAuth hook

  // Add security headers
  const response = NextResponse.next();

  // Security headers
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()"
  );

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
