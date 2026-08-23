/**
 * Environment validation for "Зам".
 *
 * HARD RULE (§2): the app fails loudly at boot on a missing variable, never
 * at request time. This module is evaluated the first time anything on the
 * server imports it, which on Next.js is during boot / build — so a missing
 * DATABASE_URL breaks the deploy, not a 15-year-old's result page.
 *
 * Deliberately NOT imported by `server-only`: the seed script and any plain
 * Node/Bun script must be able to read the same validated config. Nothing
 * here is ever imported from a "use client" module.
 */
import { z } from "zod";

const envSchema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),

    /** Pooled connection string. Neon in production, plain Postgres locally. */
    DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
    /** Unpooled connection, used by `prisma migrate`. Optional outside Neon. */
    DIRECT_DATABASE_URL: z.string().min(1).optional(),
    /**
     * Which Prisma driver adapter to use at runtime.
     * "neon"  — @prisma/adapter-neon over the serverless WebSocket driver.
     * "local" — no adapter, the native engine talks to Postgres directly.
     * Left unset, it is inferred from the host in DATABASE_URL, so a local
     * checkout works with nothing but a Postgres URL.
     */
    DB_ADAPTER: z.enum(["neon", "local"]).optional(),

    /** Signs the anonymous session cookie. 32+ chars. Generate with:
     *  `openssl rand -base64 32` */
    SESSION_SECRET: z
      .string()
      .min(32, "SESSION_SECRET must be at least 32 characters"),

    /**
     * OPTIONAL ON PURPOSE (§6, §8): the result page must render fully and
     * correctly with no Anthropic key present. The AI layer writes prose,
     * never a score, so its absence degrades wording, not correctness.
     */
    ANTHROPIC_API_KEY: z.string().min(1).optional(),
    ANTHROPIC_MODEL: z.string().min(1).default("claude-sonnet-5"),

    /** Parent report delivery only. Absent = the email feature is off. */
    RESEND_API_KEY: z.string().min(1).optional(),
    RESEND_FROM_EMAIL: z.email().optional(),

    APP_URL: z.url().default("http://localhost:3000"),
  })
  .superRefine((value, ctx) => {
    if (value.RESEND_API_KEY && !value.RESEND_FROM_EMAIL) {
      ctx.addIssue({
        code: "custom",
        path: ["RESEND_FROM_EMAIL"],
        message: "RESEND_FROM_EMAIL is required when RESEND_API_KEY is set",
      });
    }
  });

export type Env = z.infer<typeof envSchema>;

function parseEnv(source: NodeJS.ProcessEnv): Env {
  const parsed = envSchema.safeParse(source);

  if (!parsed.success) {
    const lines = parsed.error.issues.map((issue) => {
      const key = issue.path.join(".") || "(root)";
      return `  - ${key}: ${issue.message}`;
    });

    // Thrown, not logged-and-continued. A half-configured deploy that boots
    // is the failure mode this rule exists to prevent.
    throw new Error(
      [
        "Invalid environment configuration. The app will not start.",
        ...lines,
        "",
        "Copy .env.example to .env and fill in the missing values.",
      ].join("\n"),
    );
  }

  return parsed.data;
}

export const env: Env = parseEnv(process.env);

/** True when the AI narrative layer is usable. Callers must still degrade. */
export const isAiConfigured = env.ANTHROPIC_API_KEY !== undefined;

/** True when the parent report can be emailed. */
export const isEmailConfigured = env.RESEND_API_KEY !== undefined;

/** Resolves the driver adapter, inferring from the URL when not set. */
export function resolveDbAdapter(): "neon" | "local" {
  if (env.DB_ADAPTER) return env.DB_ADAPTER;
  return /neon\.tech|neon\.build/.test(env.DATABASE_URL) ? "neon" : "local";
}
