/**
 * The anonymous session cookie (§2). Holds a session id, signed with
 * SESSION_SECRET so a client cannot substitute another student's session —
 * see lib/session/crypto.ts. This is separate from the resume code: the
 * cookie lets a student continue on THIS device without re-entering
 * anything, the code is what lets them continue on a different one.
 */
import "server-only";

import { cookies } from "next/headers";

import { signSessionCookie, verifySessionCookie } from "./crypto";

const COOKIE_NAME = "zam_session";

/** 14 days: long enough to finish a roadmap check-in across a weekend, short
 *  enough that this is not a durable cross-session identifier. */
const MAX_AGE_SECONDS = 60 * 60 * 24 * 14;

export async function setSessionCookie(sessionId: string): Promise<void> {
  const jar = await cookies();
  jar.set(COOKIE_NAME, signSessionCookie(sessionId), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function getSessionIdFromCookie(): Promise<string | null> {
  const jar = await cookies();
  const raw = jar.get(COOKIE_NAME)?.value;
  if (!raw) return null;
  return verifySessionCookie(raw);
}

export async function clearSessionCookie(): Promise<void> {
  const jar = await cookies();
  jar.delete(COOKIE_NAME);
}
