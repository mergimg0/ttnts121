/**
 * NoSQL Query Input Sanitizer
 * Prevents injection attacks in Firestore queries
 */

// Characters that could be used in NoSQL injection attacks
const DANGEROUS_PATTERNS = [
  /\$where/i,
  /\$gt/i,
  /\$lt/i,
  /\$ne/i,
  /\$in/i,
  /\$nin/i,
  /\$or/i,
  /\$and/i,
  /\$not/i,
  /\$exists/i,
  /\$type/i,
  /\$regex/i,
  /\.\./,      // Path traversal
  /\/\//,      // Double slashes
  /__/,        // Reserved Firestore names
];

/**
 * Check if a string contains potentially dangerous patterns
 */
export function containsDangerousPatterns(input: string): boolean {
  if (typeof input !== "string") return false;
  return DANGEROUS_PATTERNS.some(pattern => pattern.test(input));
}

/**
 * Sanitize a string value for use in Firestore queries
 * Returns null if the value is potentially dangerous
 */
export function sanitizeQueryValue(value: unknown): string | null {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value !== "string") {
    // Convert to string safely
    value = String(value);
  }

  const strValue = value as string;

  // Check for dangerous patterns
  if (containsDangerousPatterns(strValue)) {
    console.warn(`Potentially dangerous query value detected: ${strValue.slice(0, 50)}...`);
    return null;
  }

  // Limit length to prevent DoS
  if (strValue.length > 1000) {
    return null;
  }

  return strValue;
}

/**
 * Sanitize a document ID for Firestore
 */
export function sanitizeDocumentId(id: unknown): string | null {
  if (typeof id !== "string") return null;

  // Firestore document ID rules:
  // - 1-1500 bytes UTF-8
  // - No forward slash
  // - Cannot be . or ..
  // - Cannot be __.*__

  if (id.length < 1 || id.length > 1500) return null;
  if (id.includes("/")) return null;
  if (id === "." || id === "..") return null;
  if (id.startsWith("__") && id.endsWith("__")) return null;

  // Only allow alphanumeric, dash, underscore for safety
  if (!/^[a-zA-Z0-9_-]+$/.test(id)) return null;

  return id;
}

/**
 * Sanitize collection path
 */
export function sanitizeCollectionPath(path: unknown): string | null {
  if (typeof path !== "string") return null;

  // Collection paths should be alphanumeric
  if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(path)) return null;

  // No path traversal
  if (path.includes("..") || path.includes("//")) return null;

  return path;
}

/**
 * Sanitize an object for use in Firestore writes
 * Removes any keys that start with $ or contain . (MongoDB operators)
 */
export function sanitizeWriteData<T extends Record<string, unknown>>(data: T): Partial<T> {
  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(data)) {
    // Skip dangerous keys
    if (key.startsWith("$") || key.includes(".")) {
      console.warn(`Skipping dangerous key in write data: ${key}`);
      continue;
    }

    // Skip reserved Firestore field names
    if (key.startsWith("__") && key.endsWith("__")) {
      console.warn(`Skipping reserved key: ${key}`);
      continue;
    }

    // Recursively sanitize nested objects
    if (value && typeof value === "object" && !Array.isArray(value) && !(value instanceof Date)) {
      sanitized[key] = sanitizeWriteData(value as Record<string, unknown>);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized as Partial<T>;
}

/**
 * Validate and sanitize query parameters
 */
export function sanitizeQueryParams(params: Record<string, unknown>): Record<string, string> {
  const sanitized: Record<string, string> = {};

  for (const [key, value] of Object.entries(params)) {
    const sanitizedKey = sanitizeQueryValue(key);
    const sanitizedValue = sanitizeQueryValue(value);

    if (sanitizedKey && sanitizedValue) {
      sanitized[sanitizedKey] = sanitizedValue;
    }
  }

  return sanitized;
}
