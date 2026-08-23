import { describe, expect, it } from "vitest";

import { FIXTURE_CAREERS, FIXTURE_QUESTIONS, GOLDEN_ANSWERS, mulberry32, randomAnswers } from "./fixtures";
import { explainMatch } from "./explain-match";
import { FLOOR_SCORE, bandFor, matchCareers } from "./match-careers";
import { scoreTraits } from "./score-traits";
import { TRAIT_GROUPS } from "./traits";
import type { ScoringCareer } from "./types";

const goldenTraits = scoreTraits(GOLDEN_ANSWERS, FIXTURE_QUESTIONS);

describe("matchCareers", () => {
  it("produces a byte-identical snapshot for the golden answer set", () => {
    const matches = matchCareers(goldenTraits, FIXTURE_CAREERS);

    const serialised = matches
      .map(
        (match) =>
          `${match.rank}. ${match.slug} score=${match.score} raw=${match.rawScore} ` +
          `band=${match.band} ability=${match.subScores.ability} ` +
          `interest=${match.subScores.interest} personality=${match.subScores.personality} ` +
          `value=${match.subScores.value} why=${match.reasonTraits.join("+")}`,
      )
      .join("\n");

    expect(serialised).toMatchInlineSnapshot(`
      "1. software-engineer score=87 raw=87 band=STRONG ability=98 interest=84 personality=78 value=82 why=LOGIC+INVESTIGATIVE+AUTONOMY
      2. doctor score=75 raw=75 band=STRONG ability=94 interest=63 personality=84 value=38 why=INVESTIGATIVE+CONSCIENTIOUSNESS+STABILITY
      3. teacher score=70 raw=70 band=PARTIAL ability=88 interest=52 personality=76 value=58 why=CONSCIENTIOUSNESS+STABILITY+INVESTIGATIVE
      4. graphic-designer score=68 raw=68 band=PARTIAL ability=84 interest=45 personality=68 value=92 why=AUTONOMY+CREATIVITY+CONSCIENTIOUSNESS"
    `);
  });

  it("keeps every match score inside 35..100 for any input", () => {
    const random = mulberry32(4242);

    for (let run = 0; run < 400; run += 1) {
      const traits = scoreTraits(randomAnswers(random), FIXTURE_QUESTIONS);

      for (const match of matchCareers(traits, FIXTURE_CAREERS)) {
        expect(Number.isInteger(match.score)).toBe(true);
        expect(match.score).toBeGreaterThanOrEqual(FLOOR_SCORE);
        expect(match.score).toBeLessThanOrEqual(100);
        expect(match.rawScore).toBeGreaterThanOrEqual(0);
        expect(match.rawScore).toBeLessThanOrEqual(100);

        for (const group of TRAIT_GROUPS) {
          expect(match.subScores[group]).toBeGreaterThanOrEqual(0);
          expect(match.subScores[group]).toBeLessThanOrEqual(100);
        }
      }
    }
  });

  it("does not change an existing career's score when a new career joins the pool", () => {
    const newcomer: ScoringCareer = {
      id: "c-vet",
      slug: "veterinarian",
      traitWeights: {
        LOGIC: 0.7, MEMORY: 0.8, REALISTIC: 0.8, INVESTIGATIVE: 0.8,
        CONSCIENTIOUSNESS: 0.9, STABILITY: 0.8, HELPING: 0.9, AUTONOMY: 0.5,
      },
    };

    const before = matchCareers(goldenTraits, FIXTURE_CAREERS);
    const after = matchCareers(goldenTraits, [...FIXTURE_CAREERS, newcomer]);

    for (const original of before) {
      const updated = after.find((match) => match.slug === original.slug);
      expect(updated).toBeDefined();
      expect(updated?.score).toBe(original.score);
      expect(updated?.rawScore).toBe(original.rawScore);
      expect(updated?.subScores).toEqual(original.subScores);
      expect(updated?.reasonTraits).toEqual(original.reasonTraits);
    }

    expect(after).toHaveLength(before.length + 1);
  });

  it("ranks by the unfloored score with a stable tie-break", () => {
    const twins: ScoringCareer[] = [
      { id: "b", slug: "b-career", traitWeights: { LOGIC: 0.5, SOCIAL: 0.5 } },
      { id: "a", slug: "a-career", traitWeights: { LOGIC: 0.5, SOCIAL: 0.5 } },
    ];

    const matches = matchCareers(goldenTraits, twins);
    expect(matches[0]?.slug).toBe("a-career");
    expect(matches[1]?.slug).toBe("b-career");
    expect(matches[0]?.score).toBe(matches[1]?.score);
  });

  it("never returns a band that reads as unsuitable", () => {
    expect(bandFor(100)).toBe("STRONG");
    expect(bandFor(75)).toBe("STRONG");
    expect(bandFor(74)).toBe("PARTIAL");
    expect(bandFor(50)).toBe("PARTIAL");
    expect(bandFor(49)).toBe("DIVERGENT");
    expect(bandFor(FLOOR_SCORE)).toBe("DIVERGENT");
  });

  it("redistributes the weight of a group the career says nothing about", () => {
    const abilityOnly: ScoringCareer = {
      id: "c-ability",
      slug: "ability-only",
      traitWeights: { LOGIC: 1, NUMERIC: 1 },
    };

    const [match] = matchCareers(goldenTraits, [abilityOnly]);
    expect(match).toBeDefined();
    // Only the ability group is expressed, so it carries the whole score
    // rather than being diluted to 35% of it.
    expect(match?.rawScore).toBe(match?.subScores.ability);
    expect(match?.subScores.interest).toBe(0);
  });
});

describe("explainMatch", () => {
  it("pairs a divergent match with concrete gap traits to work on", () => {
    const matches = matchCareers(goldenTraits, FIXTURE_CAREERS);

    for (const match of matches) {
      const career = FIXTURE_CAREERS.find((entry) => entry.slug === match.slug);
      expect(career).toBeDefined();
      if (career === undefined) continue;

      const { topGaps } = explainMatch(goldenTraits, career);
      if (match.band === "DIVERGENT") {
        expect(topGaps.length).toBeGreaterThan(0);
      }
    }
  });

  it("never names an unmeasured trait as a reason", () => {
    const career = FIXTURE_CAREERS[0];
    expect(career).toBeDefined();
    if (career === undefined) return;

    const { topPositive, topGaps } = explainMatch(goldenTraits, career);
    for (const trait of [...topPositive, ...topGaps]) {
      expect(goldenTraits[trait].measured).toBe(true);
    }
  });
});
