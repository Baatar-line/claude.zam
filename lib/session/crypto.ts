/**
 * Signing the anonymous session cookie, and hashing the resume code (§2, §3).
 *
 * Server-only: everything here either holds SESSION_SECRET or produces the
 * hash a student's resume code is checked against, so none of it may ever
 * reach a client bundle.
 */
import "server-only";

import { createHash, createHmac, randomInt, timingSafeEqual } from "node:crypto";

import { env } from "@/lib/env";

/**
 * Excludes 0/O and 1/I — the two pairs a 13-year-old copying a code onto
 * paper actually confuses. 32 characters, 6 of them: ~1.07 billion
 * combinations, which is what makes RATE_LIMITS.RESUME_CODE (5 / 10 min per
 * IP) an effective brute-force guard rather than a formality.
 */
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const CODE_LENGTH = 6;

export function generateResumeCode(): string {
  let code = "";
  for (let index = 0; index < CODE_LENGTH; index += 1) {
    code += CODE_ALPHABET[randomInt(0, CODE_ALPHABET.length)];
  }
  return code;
}

/**
 * The code is never stored in plaintext (schema.prisma, Session.resumeCodeHash).
 * Redemption hashes the input and does an equality lookup on the unique
 * index — brute-force resistance comes from RATE_LIMITS.RESUME_CODE, not
 * from a constant-time string compare here, since the input is hashed
 * before it is ever compared to anything.
 */
export function hashResumeCode(code: string): string {
  return createHash("sha256").update(code.trim().toUpperCase()).digest("hex");
}

const SESSION_COOKIE_SEPARATOR = ".";

function hmac(sessionId: string): string {
  return createHmac("sha256", env.SESSION_SECRET).update(sessionId).digest("base64url");
}

/** Signs a session id for the cookie. The id itself is not a secret; the
 *  signature is what stops a client from swapping in someone else's id. */
export function signSessionCookie(sessionId: string): string {
  return `${sessionId}${SESSION_COOKIE_SEPARATOR}${hmac(sessionId)}`;
}

export function verifySessionCookie(value: string): string | null {
  const separatorIndex = value.lastIndexOf(SESSION_COOKIE_SEPARATOR);
  if (separatorIndex <= 0) return null;

  const sessionId = value.slice(0, separatorIndex);
  const signature = value.slice(separatorIndex + 1);
  const expected = hmac(sessionId);

  const provided = Buffer.from(signature);
  const wanted = Buffer.from(expected);
  if (provided.length !== wanted.length) return null;
  if (!timingSafeEqual(provided, wanted)) return null;

  return sessionId;
}
