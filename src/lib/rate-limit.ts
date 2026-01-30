import { NextRequest, NextResponse } from "next/server";

interface RateLimitOptions {
  interval: number;  // Time window in milliseconds
  maxRequests: number;  // Max requests per interval
}

// In-memory store (use Redis in production for multi-instance deployments)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Clean up expired entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimitStore.entries()) {
    if (value.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
}, 60000); // Clean every minute

function getClientIdentifier(request: NextRequest): string {
  // Try to get real IP from various headers (respecting proxies)
  const forwarded = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");

  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  if (realIp) {
    return realIp;
  }

  // Fallback to a generic identifier
  return "unknown";
}

export function rateLimit(options: RateLimitOptions) {
  const { interval, maxRequests } = options;

  return async function checkRateLimit(
    request: NextRequest
  ): Promise<{ success: true } | { success: false; response: NextResponse }> {
    const identifier = getClientIdentifier(request);
    const key = `${identifier}:${request.nextUrl.pathname}`;
    const now = Date.now();

    const record = rateLimitStore.get(key);

    if (!record || record.resetTime < now) {
      // New window
      rateLimitStore.set(key, { count: 1, resetTime: now + interval });
      return { success: true };
    }

    if (record.count >= maxRequests) {
      const retryAfter = Math.ceil((record.resetTime - now) / 1000);
      return {
        success: false,
        response: NextResponse.json(
          { success: false, error: "Too many requests. Please try again later." },
          {
            status: 429,
            headers: {
              "Retry-After": String(retryAfter),
              "X-RateLimit-Limit": String(maxRequests),
              "X-RateLimit-Remaining": "0",
              "X-RateLimit-Reset": String(Math.ceil(record.resetTime / 1000)),
            },
          }
        ),
      };
    }

    // Increment counter
    record.count++;
    rateLimitStore.set(key, record);

    return { success: true };
  };
}

// Pre-configured rate limiters
export const rateLimiters = {
  // Strict: 10 requests per minute (sensitive operations like auth, checkout)
  strict: rateLimit({ interval: 60000, maxRequests: 10 }),

  // Standard: 60 requests per minute (general API calls)
  standard: rateLimit({ interval: 60000, maxRequests: 60 }),

  // Lenient: 120 requests per minute (read-heavy endpoints)
  lenient: rateLimit({ interval: 60000, maxRequests: 120 }),

  // Contact form: 5 per hour
  contact: rateLimit({ interval: 3600000, maxRequests: 5 }),
};

// Helper to apply rate limiting in route handlers
export async function withRateLimit(
  request: NextRequest,
  limiter: ReturnType<typeof rateLimit>
): Promise<NextResponse | null> {
  const result = await limiter(request);
  if (!result.success) {
    return result.response;
  }
  return null;
}
