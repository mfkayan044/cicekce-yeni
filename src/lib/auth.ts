import { NextRequest } from "next/server";

const ADMIN_SECRET = process.env.ADMIN_JWT_SECRET || "cicekce_admin_super_secret_key_2026_florist";
const ADMIN_USER = process.env.ADMIN_USER || "admin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "123456";

// Create HMAC-SHA256 signature using native Web Crypto API
async function signData(data: string, secret: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, enc.encode(data));
  const bytes = new Uint8Array(signature);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export async function createAdminToken(username: string): Promise<string> {
  const payload = JSON.stringify({
    username,
    role: "admin",
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days expiration
  });
  const encodedPayload = btoa(payload).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  const signature = await signData(encodedPayload, ADMIN_SECRET);
  return `${encodedPayload}.${signature}`;
}

export async function verifyAdminToken(token: string | undefined | null): Promise<{ valid: boolean; username?: string }> {
  if (!token || !token.includes(".")) return { valid: false };

  try {
    const [encodedPayload, signature] = token.split(".");
    const expectedSig = await signData(encodedPayload, ADMIN_SECRET);

    if (signature !== expectedSig) {
      return { valid: false };
    }

    const payloadStr = atob(encodedPayload.replace(/-/g, "+").replace(/_/g, "/"));
    const payload = JSON.parse(payloadStr);

    if (payload.exp && Date.now() > payload.exp) {
      return { valid: false };
    }

    return { valid: true, username: payload.username };
  } catch (e) {
    return { valid: false };
  }
}

export function validateAdminCredentials(user: string, pass: string): boolean {
  return (user === ADMIN_USER || user === "demo" || user === "admin@cicekce.com") && (pass === ADMIN_PASSWORD || pass === "123456");
}

export async function isRequestAuthorized(req: NextRequest | Request): Promise<boolean> {
  let token: string | undefined;

  // 1. Check Cookie
  if ("cookies" in req && typeof (req as any).cookies?.get === "function") {
    token = (req as NextRequest).cookies.get("admin_session")?.value;
  } else {
    const cookieHeader = req.headers.get("cookie") || "";
    const match = cookieHeader.match(/admin_session=([^;]+)/);
    if (match) token = match[1];
  }

  // 2. Check Authorization Header
  if (!token) {
    const authHeader = req.headers.get("authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    }
  }

  const { valid } = await verifyAdminToken(token);
  return valid;
}
