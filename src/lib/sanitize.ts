import DOMPurify, { DOMPurify as DOMPurifyType } from "dompurify";

// Server-side: Use JSDOM for DOMPurify
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let purify: DOMPurifyType | any;

if (typeof window === "undefined") {
  // Server-side - use jsdom
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { JSDOM } = require("jsdom");
  const jsdomWindow = new JSDOM("").window;
  // DOMPurify accepts JSDOM window - use any to bypass strict type checking
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  purify = DOMPurify(jsdomWindow as any);
} else {
  // Client-side - use browser window
  purify = DOMPurify;
}

/**
 * Sanitize HTML to prevent XSS attacks.
 * Allows safe formatting tags only - strips scripts, event handlers, etc.
 *
 * Use this for any user-supplied HTML content rendered with dangerouslySetInnerHTML.
 *
 * @param dirty - Untrusted HTML string
 * @returns Sanitized HTML string safe for rendering
 */
export function sanitizeHtml(dirty: string): string {
  if (!dirty) return "";

  return purify.sanitize(dirty, {
    ALLOWED_TAGS: [
      // Text formatting
      "p",
      "br",
      "strong",
      "em",
      "b",
      "i",
      "u",
      "s",
      "strike",
      "sub",
      "sup",
      // Headings
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      // Lists
      "ul",
      "ol",
      "li",
      // Links (href only, no javascript:)
      "a",
      // Block elements
      "blockquote",
      "hr",
      "pre",
      "code",
      // Tables
      "table",
      "thead",
      "tbody",
      "tfoot",
      "tr",
      "th",
      "td",
      // Other safe elements
      "div",
      "span",
    ],
    ALLOWED_ATTR: [
      "href",
      "target",
      "rel",
      "class",
      "id",
      // Table attributes
      "colspan",
      "rowspan",
    ],
    ALLOW_DATA_ATTR: false,
    // Ensure links open safely
    ADD_ATTR: ["target", "rel"],
    // Force safe link attributes
    FORCE_BODY: true,
  });
}

/**
 * Escape HTML entities for safe display in non-HTML contexts.
 * Use this for email templates and plain text rendering where you
 * want to display user input without interpreting it as HTML.
 *
 * @param text - Untrusted text string
 * @returns Escaped string safe for embedding in HTML
 */
export function escapeHtml(text: string): string {
  if (!text) return "";

  const escapeMap: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
    "/": "&#x2F;",
    "`": "&#x60;",
    "=": "&#x3D;",
  };

  return text.replace(/[&<>"'`=/]/g, (char) => escapeMap[char] || char);
}

/**
 * Strip all HTML tags and return plain text.
 * Useful for generating text previews or search content.
 *
 * @param html - HTML string
 * @returns Plain text with all tags removed
 */
export function stripHtml(html: string): string {
  if (!html) return "";

  return purify
    .sanitize(html, { ALLOWED_TAGS: [] })
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
