/**
 * Reads the caller's IP for rate limiting. Kept in its own module so that
 * define-action stays free of the Next.js request context and can be unit
 * tested as a plain function.
 *
 * The IP is used as a rate-limit key only. It is never stored, never written
 * to the database, and never associated with a session (§8 data minimization).
 */
import "server-only";

import { headers } from "next/headers";

export async function getClientIp(): Promise<string> {
  const headerList = await headers();

  // Vercel sets x-forwarded-for; the left-most entry is the original client.
  const forwarded = headerList.get("x-forwarded-for");
  const first = forwarded?.split(",")[0]?.trim();
  if (first) return first;

  return headerList.get("x-real-ip")?.trim() ?? "unknown";
}
