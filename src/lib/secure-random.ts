import * as crypto from "crypto";

/**
 * Generate a cryptographically secure random string
 */
export function secureRandomString(length: number = 32): string {
  return crypto.randomBytes(length).toString("hex").slice(0, length);
}

/**
 * Generate a cryptographically secure random integer between min (inclusive) and max (exclusive)
 */
export function secureRandomInt(min: number, max: number): number {
  const range = max - min;
  const bytesNeeded = Math.ceil(Math.log2(range) / 8) || 1;
  const maxValid = Math.floor(256 ** bytesNeeded / range) * range - 1;

  let randomValue: number;
  do {
    const randomBytes = crypto.randomBytes(bytesNeeded);
    randomValue = randomBytes.reduce((acc, byte, i) => acc + byte * 256 ** i, 0);
  } while (randomValue > maxValid);

  return min + (randomValue % range);
}

/**
 * Generate a secure random UUID v4
 */
export function secureUUID(): string {
  return crypto.randomUUID();
}

/**
 * Securely shuffle an array (Fisher-Yates with crypto random)
 */
export function secureShuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = secureRandomInt(0, i + 1);
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Generate a secure alphanumeric code (for coupon codes, confirmation codes, etc.)
 */
export function secureAlphanumericCode(length: number = 8): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Excluding ambiguous: 0OI1
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars[secureRandomInt(0, chars.length)];
  }
  return result;
}
