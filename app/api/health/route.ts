/**
 * Health check.
 *
 * Reports what a deploy needs to know before it takes traffic: can we reach
 * the database, and which optional subsystems are configured. The AI and
 * email keys are reported but never make the check fail — the product is
 * required to work without them (§6, §8).
 */
import { NextResponse } from "next/server";

import { prisma } from "@/lib/db/client";
import { isAiConfigured, isEmailConfigured, resolveDbAdapter } from "@/lib/env";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(): Promise<NextResponse> {
  let database: "up" | "down" = "down";
  let databaseError: string | undefined;

  try {
    await prisma.$queryRaw`SELECT 1`;
    database = "up";
  } catch (error) {
    databaseError = error instanceof Error ? error.message : "unknown error";
    console.error("[health] database unreachable", error);
  }

  const body = {
    status: database === "up" ? "ok" : "degraded",
    database,
    databaseAdapter: resolveDbAdapter(),
    ...(databaseError ? { databaseError } : {}),
    // Absent keys are a configuration fact, not a failure.
    ai: isAiConfigured ? "configured" : "absent",
    email: isEmailConfigured ? "configured" : "absent",
  } as const;

  return NextResponse.json(body, { status: database === "up" ? 200 : 503 });
}
