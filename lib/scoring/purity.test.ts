/**
 * HARD RULE 1 (§2), enforced rather than trusted: lib/scoring must be
 * importable from a plain Node or Bun script with no Next.js runtime.
 *
 * This test is the guard that stops a convenient `import { cache } from
 * "react"` from quietly making the engine un-runnable outside the app.
 */
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const SCORING_DIR = join(process.cwd(), "lib", "scoring");

const FORBIDDEN = [
  /from\s+["']next[/"']/,
  /from\s+["']react["']/,
  /from\s+["']@prisma\//,
  /from\s+["']\.\.\/db\//,
  /from\s+["']server-only["']/,
  /require\(["'](next|react|@prisma)/,
];

/** Nothing in here may reach for the clock or the RNG. */
const NON_DETERMINISTIC = [/Date\.now\(/, /new Date\(/, /Math\.random\(/];

/**
 * Strips comments before scanning, so the doc comment that says "no
 * Date.now()" does not itself trip the check. The `[^:]` guard keeps a
 * "https://" inside a string from being read as a line comment.
 */
function stripComments(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|[^:])\/\/.*$/gm, "$1");
}

function sourceFiles(): string[] {
  return readdirSync(SCORING_DIR)
    .filter((name) => name.endsWith(".ts"))
    .filter((name) => !name.endsWith(".test.ts"))
    .filter((name) => name !== "fixtures.ts");
}

describe("lib/scoring purity", () => {
  it("imports nothing from next, react, prisma or server-only", () => {
    for (const file of sourceFiles()) {
      const source = stripComments(readFileSync(join(SCORING_DIR, file), "utf8"));
      for (const pattern of FORBIDDEN) {
        expect(pattern.test(source), `${file} matches ${pattern}`).toBe(false);
      }
    }
  });

  it("uses no clock and no randomness", () => {
    for (const file of sourceFiles()) {
      const source = stripComments(readFileSync(join(SCORING_DIR, file), "utf8"));
      for (const pattern of NON_DETERMINISTIC) {
        expect(pattern.test(source), `${file} matches ${pattern}`).toBe(false);
      }
    }
  });

  it("covers every source file in the directory", () => {
    expect(sourceFiles().sort()).toEqual([
      "detect-invalid.ts",
      "explain-match.ts",
      "index.ts",
      "internal.ts",
      "match-careers.ts",
      "score-traits.ts",
      "traits.ts",
      "types.ts",
    ]);
  });
});
