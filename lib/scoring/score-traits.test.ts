import { describe, expect, it } from "vitest";

import { FIXTURE_QUESTIONS, GOLDEN_ANSWERS, mulberry32, randomAnswers } from "./fixtures";
import { scoreTraits } from "./score-traits";
import { ALL_TRAITS } from "./traits";

describe("scoreTraits", () => {
  it("produces a byte-identical snapshot for the golden answer set", () => {
    const scores = scoreTraits(GOLDEN_ANSWERS, FIXTURE_QUESTIONS);

    // Serialised in a fixed trait order so the snapshot pins the numbers,
    // not the key order of an object literal.
    const serialised = ALL_TRAITS.map((trait) => {
      const score = scores[trait];
      return `${trait} raw=${score.raw} norm=${score.normalized} measured=${score.measured}`;
    }).join("\n");

    expect(serialised).toMatchInlineSnapshot(`
      "LOGIC raw=4.09 norm=92 measured=true
      SPATIAL raw=0 norm=50 measured=false
      VERBAL raw=0 norm=50 measured=false
      NUMERIC raw=3.76 norm=82 measured=true
      MEMORY raw=0 norm=50 measured=false
      PROCESSING raw=0 norm=50 measured=false
      REALISTIC raw=0.75 norm=5 measured=true
      INVESTIGATIVE raw=17 norm=100 measured=true
      ARTISTIC raw=0 norm=0 measured=true
      SOCIAL raw=0.3 norm=3 measured=true
      ENTERPRISING raw=5.25 norm=48 measured=true
      CONVENTIONAL raw=1.5 norm=11 measured=true
      OPENNESS raw=0.7 norm=12 measured=true
      CONSCIENTIOUSNESS raw=3 norm=100 measured=true
      EXTRAVERSION raw=1.95 norm=33 measured=true
      AGREEABLENESS raw=0 norm=0 measured=true
      STABILITY raw=4 norm=100 measured=true
      STABILITY_V raw=1 norm=20 measured=true
      INCOME raw=1 norm=13 measured=true
      CREATIVITY raw=6.25 norm=78 measured=true
      HELPING raw=0 norm=0 measured=true
      AUTONOMY raw=6 norm=100 measured=true
      PRESTIGE raw=0.75 norm=13 measured=true"
    `);
  });

  it("keeps every normalized trait inside 0..100 for any input", () => {
    const random = mulberry32(20260823);

    for (let run = 0; run < 500; run += 1) {
      const scores = scoreTraits(randomAnswers(random), FIXTURE_QUESTIONS);

      for (const trait of ALL_TRAITS) {
        const { normalized } = scores[trait];
        expect(Number.isInteger(normalized)).toBe(true);
        expect(normalized).toBeGreaterThanOrEqual(0);
        expect(normalized).toBeLessThanOrEqual(100);
      }
    }
  });

  it("returns a full trait map for an empty answer set without throwing", () => {
    const scores = scoreTraits([], FIXTURE_QUESTIONS);

    expect(Object.keys(scores)).toHaveLength(ALL_TRAITS.length);
    for (const trait of ALL_TRAITS) {
      expect(scores[trait].raw).toBe(0);
      expect(scores[trait].normalized).toBeGreaterThanOrEqual(0);
      expect(scores[trait].normalized).toBeLessThanOrEqual(100);
    }
  });

  it("marks a trait the question set cannot move as unmeasured", () => {
    const scores = scoreTraits(GOLDEN_ANSWERS, FIXTURE_QUESTIONS);

    // No fixture item touches PRESTIGE negatively or MEMORY at all.
    expect(scores.MEMORY.measured).toBe(false);
    expect(scores.MEMORY.normalized).toBe(50);
    expect(scores.LOGIC.measured).toBe(true);
  });

  it("never lets a fast wrong answer beat a slow correct one", () => {
    const fastWrong = scoreTraits(
      [{ questionId: "ab1", optionId: "ab1.o0", elapsedMs: 500 }],
      FIXTURE_QUESTIONS,
    );
    const slowCorrect = scoreTraits(
      [{ questionId: "ab1", optionId: "ab1.o1", elapsedMs: 44_900 }],
      FIXTURE_QUESTIONS,
    );

    expect(slowCorrect.LOGIC.raw).toBeGreaterThan(fastWrong.LOGIC.raw);
  });

  it("bounds the speed factor to plus or minus 15 percent", () => {
    const instant = scoreTraits(
      [{ questionId: "ab1", optionId: "ab1.o1", elapsedMs: 0 }],
      FIXTURE_QUESTIONS,
    );
    const atTheBuzzer = scoreTraits(
      [{ questionId: "ab1", optionId: "ab1.o1", elapsedMs: 45_000 }],
      FIXTURE_QUESTIONS,
    );

    // The correct option carries LOGIC: 3.
    expect(instant.LOGIC.raw).toBeCloseTo(3 * 1.15, 10);
    expect(atTheBuzzer.LOGIC.raw).toBeCloseTo(3 * 0.85, 10);
  });

  it("ignores answers to questions outside the active set", () => {
    const withStale = scoreTraits(
      [...GOLDEN_ANSWERS, { questionId: "retired-item", optionId: "x", elapsedMs: 100 }],
      FIXTURE_QUESTIONS,
    );

    expect(withStale).toEqual(scoreTraits(GOLDEN_ANSWERS, FIXTURE_QUESTIONS));
  });
});
