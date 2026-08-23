/**
 * The typed server-action helper (§2).
 *
 * Every mutation in the product goes through this. It validates the input
 * with Zod at the boundary, applies a rate limit when one is declared, runs
 * the handler, and returns the discriminated union — never a thrown error.
 *
 * On idempotency (HARD RULE 5): this helper cannot make a handler idempotent,
 * only make it easy to be. Handlers that write student data use `upsert`
 * against a unique key (an Answer is unique per session+question, a
 * RoadmapProgress row per session+step), so replaying the same call after a
 * flaky mobile connection is a no-op rather than a duplicate. Handlers that
 * genuinely cannot be replayed safely — resume-code redemption above all —
 * declare a `rateLimit` instead.
 */
import { z } from "zod";

import {
  ActionFailure,
  DEFAULT_ERROR_MN,
  fail,
  ok,
  type ActionResult,
} from "./types";
import { rateLimiter } from "./rate-limit";

export type RateLimitRule<TInput> = {
  limit: number;
  windowMs: number;
  /**
   * Builds the bucket key. Returning a stable string per actor is the whole
   * job: per IP for anonymous redemption, per session id for chat turns.
   */
  key: (input: TInput) => string | Promise<string>;
};

export type ActionConfig<TSchema extends z.ZodType, TData> = {
  /** Used in the rate-limit key and in server-side logs. */
  name: string;
  input: TSchema;
  rateLimit?: RateLimitRule<z.output<TSchema>>;
  handler: (input: z.output<TSchema>) => Promise<TData>;
};

/** Every action has the same call signature: unknown in, a result out. */
export type Action<TData> = (raw: unknown) => Promise<ActionResult<TData>>;

export function defineAction<TSchema extends z.ZodType, TData>(
  config: ActionConfig<TSchema, TData>,
): Action<TData> {
  return async function action(raw: unknown): Promise<ActionResult<TData>> {
    const parsed = config.input.safeParse(raw);

    if (!parsed.success) {
      const flattened = z.flattenError(parsed.error);
      return fail({
        code: "INVALID_INPUT",
        messageMn: DEFAULT_ERROR_MN.INVALID_INPUT,
        fieldErrors: flattened.fieldErrors as Record<string, string[]>,
      });
    }

    const input = parsed.data as z.output<TSchema>;

    if (config.rateLimit) {
      const bucket = await config.rateLimit.key(input);
      const verdict = await rateLimiter.check(
        `${config.name}:${bucket}`,
        config.rateLimit.limit,
        config.rateLimit.windowMs,
      );

      if (!verdict.allowed) {
        return fail({
          code: "RATE_LIMITED",
          messageMn: DEFAULT_ERROR_MN.RATE_LIMITED,
        });
      }
    }

    try {
      return ok(await config.handler(input));
    } catch (error) {
      if (error instanceof ActionFailure) {
        return fail({
          code: error.code,
          messageMn: error.messageMn,
          ...(error.fieldErrors ? { fieldErrors: error.fieldErrors } : {}),
        });
      }

      // Logged for us, generic for the student. §6/§8: never surface an
      // internal failure to a 15-year-old mid-test.
      console.error(`[action:${config.name}]`, error);
      return fail({
        code: "UNEXPECTED",
        messageMn: DEFAULT_ERROR_MN.UNEXPECTED,
      });
    }
  };
}
