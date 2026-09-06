/**
 * Sanitizes input string to prevent XSS attacks.
 * Strips HTML tags, script elements, event attributes, and dangerous protocols.
 */
export function sanitizeString(input?: string | null): string {
  if (!input) return "";
  let str = String(input);

  // Strip script tags and content
  str = str.replace(/<script\b[^<]*>([\s\S]*?)<\/script>/gi, "");

  // Strip all HTML tags
  str = str.replace(/<[^>]*>/g, "");

  // Strip inline event attributes like onload=, onerror=, onclick=
  str = str.replace(/on\w+\s*=\s*["'][^"']*["']/gi, "");

  // Strip javascript: protocols
  str = str.replace(/javascript\s*:/gi, "");

  return str.trim();
}

/**
 * Deeply sanitizes object string properties.
 */
export function sanitizeObject<T>(obj: T): T {
  if (!obj || typeof obj !== "object") return obj;

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeObject(item)) as unknown as T;
  }

  const sanitized: any = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === "string") {
      sanitized[key] = sanitizeString(value);
    } else if (typeof value === "object" && value !== null) {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized as T;
}
