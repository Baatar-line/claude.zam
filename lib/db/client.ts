/**
 * Prisma client singleton.
 *
 * `server-only` makes it a build error to import this from a client
 * component, which is the guard behind HARD RULE 4 (§2): no client component
 * ever receives a Prisma model.
 */
import "server-only";

import { neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@prisma/client";
import ws from "ws";

import { env, resolveDbAdapter } from "@/lib/env";

/**
 * The Neon serverless driver speaks WebSocket. Node 22 ships a global
 * WebSocket, but the Vercel Node runtime and older local toolchains do not
 * always expose one, so fall back to `ws` when it is missing.
 */
if (typeof globalThis.WebSocket === "undefined") {
  neonConfig.webSocketConstructor = ws;
}

function createPrismaClient(): PrismaClient {
  /**
   * Local development runs a plain Postgres, which the Neon serverless driver
   * cannot reach without Neon's WebSocket proxy in front of it. So the adapter
   * is used for Neon and the native engine for a local database. Both paths
   * run the same schema and the same migrations — only the transport differs.
   */
  if (resolveDbAdapter() === "neon") {
    const adapter = new PrismaNeon({ connectionString: env.DATABASE_URL });
    return new PrismaClient({
      adapter,
      log: env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
    });
  }

  return new PrismaClient({
    datasources: { db: { url: env.DATABASE_URL } },
    log: env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

/**
 * Next.js re-evaluates modules on every hot reload in development, which would
 * otherwise open a new connection pool per edit until Postgres refuses them.
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma: PrismaClient = globalForPrisma.prisma ?? createPrismaClient();

if (env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
