/**
 * Email validation utility
 * Uses a robust regex that handles most valid email formats
 * while rejecting common invalid patterns
 */

// RFC 5322 compliant email regex (simplified but robust)
const EMAIL_REGEX = /^(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])$/i;

// Simplified but effective regex for most common cases
const SIMPLE_EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

// Common disposable email domains to optionally block
const DISPOSABLE_DOMAINS = new Set([
  "tempmail.com",
  "throwaway.email",
  "guerrillamail.com",
  "10minutemail.com",
  "mailinator.com",
  "yopmail.com",
  "fakeinbox.com",
  "trashmail.com",
  "temp-mail.org",
  "getnada.com",
]);

export interface EmailValidationOptions {
  allowDisposable?: boolean;
  maxLength?: number;
}

export interface EmailValidationResult {
  valid: boolean;
  error?: string;
  normalized?: string;
}

/**
 * Validate an email address
 */
export function validateEmail(
  email: string,
  options: EmailValidationOptions = {}
): EmailValidationResult {
  const { allowDisposable = true, maxLength = 254 } = options;

  // Basic checks
  if (!email || typeof email !== "string") {
    return { valid: false, error: "Email is required" };
  }

  // Trim and normalize
  const normalized = email.trim().toLowerCase();

  // Length check (RFC 5321 specifies max 254 characters)
  if (normalized.length > maxLength) {
    return { valid: false, error: "Email address is too long" };
  }

  if (normalized.length < 3) {
    return { valid: false, error: "Email address is too short" };
  }

  // Must contain exactly one @
  const atCount = (normalized.match(/@/g) || []).length;
  if (atCount !== 1) {
    return { valid: false, error: "Invalid email format" };
  }

  // Split into local and domain parts
  const [localPart, domain] = normalized.split("@");

  // Local part checks
  if (!localPart || localPart.length > 64) {
    return { valid: false, error: "Invalid email format" };
  }

  // Domain checks
  if (!domain || domain.length > 255) {
    return { valid: false, error: "Invalid email domain" };
  }

  // Domain must have at least one dot (TLD required)
  if (!domain.includes(".")) {
    return { valid: false, error: "Invalid email domain" };
  }

  // TLD must be at least 2 characters
  const tld = domain.split(".").pop();
  if (!tld || tld.length < 2) {
    return { valid: false, error: "Invalid email domain" };
  }

  // Regex validation
  if (!SIMPLE_EMAIL_REGEX.test(normalized)) {
    return { valid: false, error: "Invalid email format" };
  }

  // Disposable email check
  if (!allowDisposable && DISPOSABLE_DOMAINS.has(domain)) {
    return { valid: false, error: "Disposable email addresses are not allowed" };
  }

  return { valid: true, normalized };
}

/**
 * Simple boolean check for email validity
 */
export function isValidEmail(email: string): boolean {
  return validateEmail(email).valid;
}

/**
 * Normalize an email address (lowercase, trim)
 */
export function normalizeEmail(email: string): string {
  if (!email || typeof email !== "string") return "";
  return email.trim().toLowerCase();
}
