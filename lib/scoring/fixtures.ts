/**
 * Test fixtures for the scoring engine.
 *
 * TEST-ONLY. Nothing in the app imports this; it is here rather than inside
 * a single .test.ts so that every scoring test scores the same question set
 * and a change to the fixture shows up in every suite at once.
 *
 * The set is shaped to exercise every question kind and to make the validity
 * rules reachable: eight consecutive option-answerable items so a
 * straight-liner trips STRAIGHT_LINE, and two attention checks so
 * ATTENTION_FAILED is testable.
 */
import type { ScoringAnswer, ScoringCareer, ScoringQuestion } from "./types";
import type { Trait } from "./traits";

type Deltas = Partial<Record<Trait, number>>;

function options(
  questionId: string,
  specs: readonly { deltas: Deltas; correct?: boolean }[],
): ScoringQuestion["options"] {
  return specs.map((spec, index) => ({
    id: `${questionId}.o${index}`,
    order: index,
    traitDeltas: spec.deltas,
    ...(spec.correct === undefined ? {} : { isCorrect: spec.correct }),
  }));
}

function question(
  id: string,
  blockId: string,
  order: number,
  kind: ScoringQuestion["kind"],
  specs: readonly { deltas: Deltas; correct?: boolean }[],
  timeLimitSec?: number,
): ScoringQuestion {
  return {
    id,
    blockId,
    order,
    kind,
    options: options(id, specs),
    ...(timeLimitSec === undefined ? {} : { timeLimitSec }),
  };
}

export const FIXTURE_QUESTIONS: readonly ScoringQuestion[] = [
  // --- ability -------------------------------------------------------------
  question("ab1", "ability", 0, "TIMED_ABILITY", [
    { deltas: { LOGIC: 0 } },
    { deltas: { LOGIC: 3, NUMERIC: 1 }, correct: true },
    { deltas: { LOGIC: 0 } },
  ], 45),
  question("ab2", "ability", 1, "TIMED_ABILITY", [
    { deltas: { NUMERIC: 3 }, correct: true },
    { deltas: { NUMERIC: 0 } },
    { deltas: { NUMERIC: 0 } },
  ], 30),

  // --- interest: six SINGLE items, then a RANK -----------------------------
  question("in1", "interest", 0, "SINGLE", [
    { deltas: { REALISTIC: 3 } },
    { deltas: { INVESTIGATIVE: 3 } },
    { deltas: { ARTISTIC: 3 } },
    { deltas: { SOCIAL: 3 } },
  ]),
  question("in2", "interest", 1, "SINGLE", [
    { deltas: { INVESTIGATIVE: 2, LOGIC: 1 } },
    { deltas: { SOCIAL: 2, HELPING: 1 } },
    { deltas: { ENTERPRISING: 2 } },
    { deltas: { CONVENTIONAL: 2 } },
  ]),
  question("in3", "interest", 2, "SINGLE", [
    { deltas: { ARTISTIC: 3, CREATIVITY: 1 } },
    { deltas: { REALISTIC: 3 } },
    { deltas: { INVESTIGATIVE: 3 } },
    { deltas: { CONVENTIONAL: 3 } },
  ]),
  question("in4", "interest", 3, "SINGLE", [
    { deltas: { SOCIAL: 3 } },
    { deltas: { ENTERPRISING: 3, EXTRAVERSION: 1 } },
    { deltas: { INVESTIGATIVE: 3 } },
    { deltas: { REALISTIC: 3 } },
  ]),
  question("in5", "interest", 4, "SINGLE", [
    { deltas: { CONVENTIONAL: 3 } },
    { deltas: { ARTISTIC: 3 } },
    { deltas: { SOCIAL: 3 } },
    { deltas: { INVESTIGATIVE: 3 } },
  ]),
  question("in6", "interest", 5, "SINGLE", [
    { deltas: { ENTERPRISING: 3 } },
    { deltas: { REALISTIC: 3 } },
    { deltas: { ARTISTIC: 3 } },
    { deltas: { CONVENTIONAL: 3 } },
  ]),
  question("in7", "interest", 6, "RANK", [
    { deltas: { ENTERPRISING: 3, EXTRAVERSION: 1 } },
    { deltas: { INVESTIGATIVE: 3 } },
    { deltas: { REALISTIC: 3 } },
    { deltas: { CONVENTIONAL: 3 } },
  ]),

  // --- personality ---------------------------------------------------------
  question("pe1", "personality", 0, "SINGLE", [
    { deltas: { CONSCIENTIOUSNESS: 3, STABILITY: 1 } },
    { deltas: { CONSCIENTIOUSNESS: 2 } },
    { deltas: { OPENNESS: 2 } },
  ]),
  question("pe2", "personality", 1, "SINGLE", [
    { deltas: { AGREEABLENESS: 3 } },
    { deltas: { STABILITY: 3 } },
    { deltas: { OPENNESS: 3 } },
  ]),
  question("pe3", "personality", 2, "SLIDER", [
    { deltas: { EXTRAVERSION: 0, OPENNESS: 1 } },
    { deltas: { EXTRAVERSION: 4, SOCIAL: 1 } },
  ]),
  question("pe4", "personality", 3, "ATTENTION_CHECK", [
    { deltas: {} },
    { deltas: {} },
    { deltas: {}, correct: true },
    { deltas: {} },
  ]),

  // --- value ---------------------------------------------------------------
  question("va1", "value", 0, "SINGLE", [
    { deltas: { STABILITY_V: 3 } },
    { deltas: { INCOME: 3 } },
    { deltas: { HELPING: 3 } },
    { deltas: { AUTONOMY: 3, CREATIVITY: 1 } },
  ]),
  question("va2", "value", 1, "SINGLE", [
    { deltas: { PRESTIGE: 3 } },
    { deltas: { CREATIVITY: 3 } },
    { deltas: { HELPING: 3 } },
    { deltas: { INCOME: 3 } },
  ]),
  question("va3", "value", 2, "ATTENTION_CHECK", [
    { deltas: {} },
    { deltas: {}, correct: true },
    { deltas: {} },
    { deltas: {} },
  ]),
  question("va4", "value", 3, "RANK", [
    { deltas: { PRESTIGE: 3 } },
    { deltas: { CREATIVITY: 3 } },
    { deltas: { AUTONOMY: 3 } },
    { deltas: { INCOME: 2, STABILITY_V: 2 } },
  ]),
];

function weights(partial: Partial<Record<Trait, number>>): Partial<Record<Trait, number>> {
  return partial;
}

export const FIXTURE_CAREERS: readonly ScoringCareer[] = [
  {
    id: "c-doctor",
    slug: "doctor",
    traitWeights: weights({
      LOGIC: 0.8, VERBAL: 0.7, MEMORY: 0.9, PROCESSING: 0.6, NUMERIC: 0.5, SPATIAL: 0.4,
      INVESTIGATIVE: 0.9, SOCIAL: 0.8, CONVENTIONAL: 0.6, REALISTIC: 0.5,
      CONSCIENTIOUSNESS: 0.9, STABILITY: 0.9, AGREEABLENESS: 0.8, OPENNESS: 0.5, EXTRAVERSION: 0.5,
      HELPING: 1, STABILITY_V: 0.7, PRESTIGE: 0.7, INCOME: 0.5, AUTONOMY: 0.3, CREATIVITY: 0.2,
    }),
  },
  {
    id: "c-engineer",
    slug: "software-engineer",
    traitWeights: weights({
      LOGIC: 1, NUMERIC: 0.7, PROCESSING: 0.8, SPATIAL: 0.5, VERBAL: 0.5, MEMORY: 0.5,
      INVESTIGATIVE: 0.9, ARTISTIC: 0.4, CONVENTIONAL: 0.5, ENTERPRISING: 0.4, REALISTIC: 0.3, SOCIAL: 0.3,
      OPENNESS: 0.8, CONSCIENTIOUSNESS: 0.7, STABILITY: 0.6, AGREEABLENESS: 0.4, EXTRAVERSION: 0.3,
      INCOME: 0.8, AUTONOMY: 0.8, CREATIVITY: 0.7, PRESTIGE: 0.5, STABILITY_V: 0.4, HELPING: 0.3,
    }),
  },
  {
    id: "c-teacher",
    slug: "teacher",
    traitWeights: weights({
      VERBAL: 0.9, MEMORY: 0.6, LOGIC: 0.5, PROCESSING: 0.5, NUMERIC: 0.4, SPATIAL: 0.3,
      SOCIAL: 1, CONVENTIONAL: 0.6, ARTISTIC: 0.5, INVESTIGATIVE: 0.5, ENTERPRISING: 0.5, REALISTIC: 0.2,
      AGREEABLENESS: 0.9, CONSCIENTIOUSNESS: 0.8, STABILITY: 0.8, EXTRAVERSION: 0.7, OPENNESS: 0.6,
      HELPING: 0.9, STABILITY_V: 0.8, CREATIVITY: 0.6, PRESTIGE: 0.4, AUTONOMY: 0.4, INCOME: 0.3,
    }),
  },
  {
    id: "c-artist",
    slug: "graphic-designer",
    traitWeights: weights({
      SPATIAL: 0.8, VERBAL: 0.5, LOGIC: 0.4, PROCESSING: 0.5, MEMORY: 0.4, NUMERIC: 0.2,
      ARTISTIC: 1, INVESTIGATIVE: 0.4, ENTERPRISING: 0.4, SOCIAL: 0.4, REALISTIC: 0.4, CONVENTIONAL: 0.3,
      OPENNESS: 0.9, CONSCIENTIOUSNESS: 0.6, EXTRAVERSION: 0.4, AGREEABLENESS: 0.5, STABILITY: 0.5,
      CREATIVITY: 1, AUTONOMY: 0.8, INCOME: 0.4, PRESTIGE: 0.4, STABILITY_V: 0.3, HELPING: 0.3,
    }),
  },
];

/**
 * One fixed, hand-written answer set. The golden snapshot test pins the exact
 * numbers this produces, so any change to the arithmetic has to be an
 * explicit, reviewed decision rather than a side effect.
 */
export const GOLDEN_ANSWERS: readonly ScoringAnswer[] = [
  { questionId: "ab1", optionId: "ab1.o1", elapsedMs: 18_000 },
  { questionId: "ab2", optionId: "ab2.o0", elapsedMs: 24_000 },
  { questionId: "in1", optionId: "in1.o1", elapsedMs: 6_100 },
  { questionId: "in2", optionId: "in2.o0", elapsedMs: 5_400 },
  { questionId: "in3", optionId: "in3.o2", elapsedMs: 7_200 },
  { questionId: "in4", optionId: "in4.o2", elapsedMs: 4_900 },
  { questionId: "in5", optionId: "in5.o3", elapsedMs: 5_800 },
  { questionId: "in6", optionId: "in6.o0", elapsedMs: 6_600 },
  { questionId: "in7", rankOrder: [1, 0, 3, 2], elapsedMs: 15_300 },
  { questionId: "pe1", optionId: "pe1.o0", elapsedMs: 4_200 },
  { questionId: "pe2", optionId: "pe2.o1", elapsedMs: 3_900 },
  { questionId: "pe3", sliderValue: 30, elapsedMs: 5_100 },
  { questionId: "pe4", optionId: "pe4.o2", elapsedMs: 3_300 },
  { questionId: "va1", optionId: "va1.o3", elapsedMs: 6_800 },
  { questionId: "va2", optionId: "va2.o1", elapsedMs: 5_500 },
  { questionId: "va3", optionId: "va3.o1", elapsedMs: 2_900 },
  { questionId: "va4", rankOrder: [2, 1, 3, 0], elapsedMs: 14_100 },
];

/** Deterministic PRNG, so the property tests are reproducible forever. */
export function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4_294_967_296;
  };
}

/** Builds a random but valid answer set for the fixture question set. */
export function randomAnswers(
  random: () => number,
  questions: readonly ScoringQuestion[] = FIXTURE_QUESTIONS,
): ScoringAnswer[] {
  const answers: ScoringAnswer[] = [];

  for (const question of questions) {
    // Sometimes leave a question unanswered — a real session has gaps.
    if (random() < 0.15) continue;

    const elapsedMs = Math.floor(random() * 40_000);

    if (question.kind === "SLIDER") {
      answers.push({
        questionId: question.id,
        sliderValue: Math.floor(random() * 101),
        elapsedMs,
      });
      continue;
    }

    if (question.kind === "RANK") {
      const orders = question.options.map((option) => option.order);
      for (let i = orders.length - 1; i > 0; i -= 1) {
        const j = Math.floor(random() * (i + 1));
        const a = orders[i];
        const b = orders[j];
        if (a !== undefined && b !== undefined) {
          orders[i] = b;
          orders[j] = a;
        }
      }
      answers.push({ questionId: question.id, rankOrder: orders, elapsedMs });
      continue;
    }

    const index = Math.floor(random() * question.options.length);
    const option = question.options[index];
    if (option === undefined) continue;
    answers.push({ questionId: question.id, optionId: option.id, elapsedMs });
  }

  return answers;
}
