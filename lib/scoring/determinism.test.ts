/**
 * The property the whole product's credibility rests on: two students who
 * answer identically get identical results, however the answers happened to
 * be loaded, sorted or paginated on the way in.
 */
import { describe, expect, it } from "vitest";

import { detectInvalid } from "./detect-invalid";
import { explainMatch } from "./explain-match";
import {
  FIXTURE_CAREERS,
  FIXTURE_QUESTIONS,
  GOLDEN_ANSWERS,
  mulberry32,
  randomAnswers,
} from "./fixtures";
import { matchCareers } from "./match-careers";
import { scoreTraits } from "./score-traits";
import type { ScoringAnswer } from "./types";

function shuffle<T>(items: readonly T[], random: () => number): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    const a = copy[i];
    const b = copy[j];
    if (a !== undefined && b !== undefined) {
      copy[i] = b;
      copy[j] = a;
    }
  }
  return copy;
}

function fullResult(answers: readonly ScoringAnswer[]): string {
  const traits = scoreTraits(answers, FIXTURE_QUESTIONS);
  const matches = matchCareers(traits, FIXTURE_CAREERS);
  const explanations = FIXTURE_CAREERS.map((career) => explainMatch(traits, career));
  const flags = detectInvalid(answers, FIXTURE_QUESTIONS);

  return JSON.stringify({ traits, matches, explanations, flags });
}

describe("determinism", () => {
  it("does not change any output when the answers array is reordered", () => {
    const random = mulberry32(97531);
    const expected = fullResult(GOLDEN_ANSWERS);

    for (let run = 0; run < 50; run += 1) {
      expect(fullResult(shuffle(GOLDEN_ANSWERS, random))).toBe(expected);
    }
  });

  it("holds for random answer sets too", () => {
    const source = mulberry32(13579);
    const shuffler = mulberry32(24680);

    for (let run = 0; run < 100; run += 1) {
      const answers = randomAnswers(source);
      expect(fullResult(shuffle(answers, shuffler))).toBe(fullResult(answers));
    }
  });

  it("does not change when the questions array is reordered", () => {
    const random = mulberry32(11223);
    const traits = scoreTraits(GOLDEN_ANSWERS, FIXTURE_QUESTIONS);

    for (let run = 0; run < 20; run += 1) {
      const reordered = shuffle(FIXTURE_QUESTIONS, random);
      expect(scoreTraits(GOLDEN_ANSWERS, reordered)).toEqual(traits);
    }
  });

  it("does not change when the career pool is reordered", () => {
    const random = mulberry32(55555);
    const traits = scoreTraits(GOLDEN_ANSWERS, FIXTURE_QUESTIONS);
    const expected = matchCareers(traits, FIXTURE_CAREERS);

    for (let run = 0; run < 20; run += 1) {
      expect(matchCareers(traits, shuffle(FIXTURE_CAREERS, random))).toEqual(expected);
    }
  });

  it("returns the same result when called twice", () => {
    expect(fullResult(GOLDEN_ANSWERS)).toBe(fullResult(GOLDEN_ANSWERS));
  });
});
