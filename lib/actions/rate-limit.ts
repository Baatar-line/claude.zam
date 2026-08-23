/**
 * Rate limiting for server actions (§2 HARD RULE 5).
 *
 * The interface exists so the store can be swapped without touching a single
 * action. The bundled implementation is in-memory and therefore per-instance:
 * it is correct for local development and a single long-lived server, and it
 * is NOT sufficient on Vercel where each lambda has its own memory.
 *
 * Before launch, back this with Postgres or Upstash and keep the interface.
 */

export type RateLimitResult = {
  allowed: boolean;
  /** Attempts left in the current window. */
  remaining: number;
  /** Epoch ms at which the window resets. */
  resetAt: number;
};

export interface RateLimiter {
  check(key: string, limit: number, windowMs: number): Promise<RateLimitResult>;
}

type Window = { count: number; resetAt: number };

export class InMemoryRateLimiter implements RateLimiter {
  private readonly windows = new Map<string, Window>();

  async check(key: string, limit: number, windowMs: number): Promise<RateLimitResult> {
    const now = Date.now();
    this.prune(now);

    const existing = this.windows.get(key);
    if (!existing || existing.resetAt <= now) {
      const fresh: Window = { count: 1, resetAt: now + windowMs };
      this.windows.set(key, fresh);
      return { allowed: true, remaining: limit - 1, resetAt: fresh.resetAt };
    }

    if (existing.count >= limit) {
      return { allowed: false, remaining: 0, resetAt: existing.resetAt };
    }

    existing.count += 1;
    return {
      allowed: true,
      remaining: limit - existing.count,
      resetAt: existing.resetAt,
    };
  }

  /** Drops expired windows so the map cannot grow without bound. */
  private prune(now: number): void {
    for (const [key, window] of this.windows) {
      if (window.resetAt <= now) this.windows.delete(key);
    }
  }
}

const globalForRateLimit = globalThis as unknown as {
  zamRateLimiter: RateLimiter | undefined;
};

export const rateLimiter: RateLimiter =
  globalForRateLimit.zamRateLimiter ?? new InMemoryRateLimiter();

globalForRateLimit.zamRateLimiter = rateLimiter;

/** Limits named in §2, kept together so they are auditable in one place. */
export const RATE_LIMITS = {
  /** Resume-code redemption: 5 attempts per IP per 10 minutes. */
  RESUME_CODE: { limit: 5, windowMs: 10 * 60 * 1000 },
  /** Follow-up chat: 15 turns per session (§6). */
  CHAT_TURN: { limit: 15, windowMs: 24 * 60 * 60 * 1000 },
} as const;
