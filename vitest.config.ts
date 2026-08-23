import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // The scoring engine is pure TypeScript with no DOM and no Next.js
    // runtime, so the node environment is the correct one and keeps the
    // suite fast enough to run on every save.
    environment: "node",
    include: ["lib/**/*.test.ts", "prisma/**/*.test.ts"],
    globals: false,
  },
  resolve: {
    alias: {
      "@": new URL(".", import.meta.url).pathname,
    },
  },
});
