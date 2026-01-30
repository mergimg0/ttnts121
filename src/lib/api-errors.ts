import { NextResponse } from "next/server";

const isDev = process.env.NODE_ENV === "development";

interface ErrorDetails {
  code?: string;
  field?: string;
  [key: string]: unknown;
}

interface SafeErrorOptions {
  status?: number;
  details?: ErrorDetails;
  logError?: boolean;
}

/**
 * Create a safe error response that doesn't leak sensitive info in production
 */
export function safeErrorResponse(
  message: string,
  devMessage: string | Error,
  options: SafeErrorOptions = {}
): NextResponse {
  const { status = 500, details, logError = true } = options;

  // Always log the real error server-side
  if (logError) {
    console.error(`[API Error] ${message}:`, devMessage);
  }

  // In dev, include full error details
  // In production, only show the safe message
  const errorMessage = isDev
    ? devMessage instanceof Error
      ? devMessage.message
      : devMessage
    : message;

  const response: Record<string, unknown> = {
    success: false,
    error: errorMessage,
  };

  // Add error details if provided (safe to include)
  if (details) {
    response.details = details;
  }

  // In dev, include stack trace
  if (isDev && devMessage instanceof Error && devMessage.stack) {
    response.stack = devMessage.stack;
  }

  return NextResponse.json(response, { status });
}

// Common error responses
export const errors = {
  unauthorized: (devMessage: string | Error = "Missing or invalid authorization") =>
    safeErrorResponse("Unauthorized", devMessage, { status: 401 }),

  forbidden: (devMessage: string | Error = "Access denied") =>
    safeErrorResponse("Forbidden", devMessage, { status: 403 }),

  notFound: (resource: string, devMessage?: string | Error) =>
    safeErrorResponse(`${resource} not found`, devMessage || `${resource} not found`, {
      status: 404,
    }),

  badRequest: (message: string, details?: ErrorDetails) =>
    safeErrorResponse(message, message, { status: 400, details }),

  validation: (field: string, message: string) =>
    safeErrorResponse(message, message, {
      status: 400,
      details: { field },
    }),

  serverError: (devMessage: string | Error = "Internal server error") =>
    safeErrorResponse("An unexpected error occurred", devMessage, { status: 500 }),

  conflict: (message: string) =>
    safeErrorResponse(message, message, { status: 409 }),

  tooManyRequests: (retryAfter?: number) => {
    const response = safeErrorResponse("Too many requests", "Rate limit exceeded", {
      status: 429,
      logError: false,
    });
    if (retryAfter) {
      response.headers.set("Retry-After", String(retryAfter));
    }
    return response;
  },
};

// Success response helper
export function successResponse<T>(data: T, status = 200): NextResponse {
  return NextResponse.json({ success: true, ...data }, { status });
}
