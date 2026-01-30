/**
 * Production-safe logger
 * Redacts sensitive information and provides structured logging
 */

type LogLevel = "debug" | "info" | "warn" | "error";

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

// Current log level from environment
const currentLevel = (process.env.LOG_LEVEL as LogLevel) || (process.env.NODE_ENV === "production" ? "info" : "debug");

// Patterns to redact
const SENSITIVE_PATTERNS = [
  { pattern: /Bearer\s+[A-Za-z0-9\-_.]+/gi, replacement: "Bearer [REDACTED]" },
  { pattern: /password["']?\s*[:=]\s*["']?[^"'\s,}]+/gi, replacement: 'password: "[REDACTED]"' },
  { pattern: /api[_-]?key["']?\s*[:=]\s*["']?[^"'\s,}]+/gi, replacement: 'apiKey: "[REDACTED]"' },
  { pattern: /secret["']?\s*[:=]\s*["']?[^"'\s,}]+/gi, replacement: 'secret: "[REDACTED]"' },
  { pattern: /token["']?\s*[:=]\s*["']?[^"'\s,}]+/gi, replacement: 'token: "[REDACTED]"' },
  { pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, replacement: "[EMAIL_REDACTED]" },
  { pattern: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, replacement: "[CARD_REDACTED]" },
  { pattern: /sk_live_[A-Za-z0-9]+/g, replacement: "sk_live_[REDACTED]" },
  { pattern: /pk_live_[A-Za-z0-9]+/g, replacement: "pk_live_[REDACTED]" },
  { pattern: /re_[A-Za-z0-9]+/g, replacement: "re_[REDACTED]" },
];

// Keys to always redact in objects
const SENSITIVE_KEYS = new Set([
  "password",
  "token",
  "accessToken",
  "refreshToken",
  "apiKey",
  "secret",
  "authorization",
  "cookie",
  "creditCard",
  "cardNumber",
  "cvv",
  "ssn",
  "stripeKey",
  "privateKey",
]);

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[currentLevel];
}

function redactString(str: string): string {
  if (process.env.NODE_ENV !== "production") return str;

  let redacted = str;
  for (const { pattern, replacement } of SENSITIVE_PATTERNS) {
    redacted = redacted.replace(pattern, replacement);
  }
  return redacted;
}

function redactValue(value: unknown, depth = 0): unknown {
  if (depth > 5) return "[MAX_DEPTH]";

  if (typeof value === "string") {
    return redactString(value);
  }

  if (Array.isArray(value)) {
    return value.map(v => redactValue(v, depth + 1));
  }

  if (value && typeof value === "object") {
    const redacted: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value)) {
      if (SENSITIVE_KEYS.has(key.toLowerCase())) {
        redacted[key] = "[REDACTED]";
      } else {
        redacted[key] = redactValue(val, depth + 1);
      }
    }
    return redacted;
  }

  return value;
}

function formatMessage(message: string, data?: unknown): string {
  const timestamp = new Date().toISOString();
  const redactedMessage = redactString(message);

  if (data) {
    const redactedData = redactValue(data);
    return `[${timestamp}] ${redactedMessage} ${JSON.stringify(redactedData)}`;
  }

  return `[${timestamp}] ${redactedMessage}`;
}

export const logger = {
  debug(message: string, data?: unknown): void {
    if (shouldLog("debug")) {
      console.debug(formatMessage(message, data));
    }
  },

  info(message: string, data?: unknown): void {
    if (shouldLog("info")) {
      console.info(formatMessage(message, data));
    }
  },

  warn(message: string, data?: unknown): void {
    if (shouldLog("warn")) {
      console.warn(formatMessage(message, data));
    }
  },

  error(message: string, error?: unknown, data?: unknown): void {
    if (shouldLog("error")) {
      const errorInfo = error instanceof Error
        ? { name: error.name, message: error.message, stack: process.env.NODE_ENV === "production" ? undefined : error.stack }
        : error;
      console.error(formatMessage(message, { error: errorInfo, ...((data as object) || {}) }));
    }
  },
};

export default logger;
