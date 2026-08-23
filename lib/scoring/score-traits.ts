/**
 * scoreTraits — turns a student's answers into 23 trait scores (§4).
 *
 * Pure: same answers and same question set produce the same numbers, today
 * and in two years. No Date.now(), no randomness, no I/O.
 */
import {
  clamp,
  compareOptions,
  extremeDotProducts,
  pairAnswers,
  rankWeights,
  zeroTraitRecord,
} from "./internal";
import { ALL_TRAITS, type Trait } from "./traits";
import type {
  ScoringAnswer,
  ScoringOption,
  ScoringQuestion,
  TraitScoreMap,
  TraitScoreValue,
} from "./types";

/**
 * The speed factor is bounded to ±15% (§4). The bound is the point: a fast
 * wrong answer scores zero either way, and a slow correct answer keeps 85%
 * of its credit, so speed can shade a result but never decide it.
 */
export const SPEED_FACTOR_BOUND = 0.15;

/** Normalized value returned for a trait the active question set never touches. */
export const UNMEASURED_NORMALIZED = 50;

function speedFactor(elapsedMs: number, timeLimitSec: number | null | undefined): number {
  if (timeLimitSec === null || timeLimitSec === undefined || timeLimitSec <= 0) return 1;

  const ratio = clamp(elapsedMs / (timeLimitSec * 1000), 0, 1);
  // ratio 0 -> 1.15 (instant), ratio 0.5 -> 1.00, ratio 1 -> 0.85 (at the buzzer)
  return 1 + SPEED_FACTOR_BOUND * (1 - 2 * ratio);
}

function optionById(
  question: ScoringQuestion,
  optionId: string | null | undefined,
): ScoringOption | undefined {
  if (optionId === null || optionId === undefined) return undefined;
  return question.options.find((option) => option.id === optionId);
}

function optionByOrder(question: ScoringQuestion, order: number): ScoringOption | undefined {
  return question.options.find((option) => option.order === order);
}

function addScaled(
  target: Record<Trait, number>,
  option: ScoringOption,
  scale: number,
): void {
  for (const trait of ALL_TRAITS) {
    const delta = option.traitDeltas[trait];
    if (delta !== undefined) target[trait] += delta * scale;
  }
}

/** What this answer contributes to each trait. */
function contribution(
  question: ScoringQuestion,
  answer: ScoringAnswer,
): Record<Trait, number> {
  const result = zeroTraitRecord();

  switch (question.kind) {
    case "TIMED_ABILITY": {
      const option = optionById(question, answer.optionId);
      // Credit only for a correct answer, then shaded by speed. A wrong
      // answer earns nothing, so no speed bonus can lift it above a correct
      // one — the property §4 asks for falls out of this and needs no clamp.
      if (option?.isCorrect === true) {
        addScaled(result, option, speedFactor(answer.elapsedMs, question.timeLimitSec));
      }
      return result;
    }

    case "ATTENTION_CHECK": {
      // Measures whether the student is reading, not what they are like.
      // It must never move a trait, or a careless student would look
      // different rather than flagged.
      return result;
    }

    case "SINGLE": {
      const option = optionById(question, answer.optionId);
      if (option !== undefined) addScaled(result, option, 1);
      return result;
    }

    case "SLIDER": {
      if (answer.sliderValue === null || answer.sliderValue === undefined) return result;

      const [left, right] = [...question.options].sort(compareOptions);
      if (left === undefined || right === undefined) return result;

      // The slider interpolates between its two labelled endpoints, which is
      // why the seed validator insists a SLIDER has exactly two options.
      const t = clamp(answer.sliderValue, 0, 100) / 100;
      addScaled(result, left, 1 - t);
      addScaled(result, right, t);
      return result;
    }

    case "RANK": {
      const order = answer.rankOrder ?? [];
      if (order.length === 0) return result;

      const weights = rankWeights(question.options.length);
      order.forEach((optionOrder, position) => {
        const option = optionByOrder(question, optionOrder);
        const weight = weights[position];
        if (option !== undefined && weight !== undefined) {
          addScaled(result, option, weight);
        }
      });
      return result;
    }
  }
}

type Range = { min: number; max: number };

/**
 * The theoretical range of every trait for one question: the least and the
 * most any student could earn on it. Zero is always included because leaving
 * a question unanswered is always possible, which is what keeps a partially
 * finished test inside 0..100 rather than below it.
 */
function questionRange(question: ScoringQuestion): Record<Trait, Range> {
  const ranges = {} as Record<Trait, Range>;
  for (const trait of ALL_TRAITS) ranges[trait] = { min: 0, max: 0 };

  const consider = (trait: Trait, value: number): void => {
    const range = ranges[trait];
    if (value < range.min) range.min = value;
    if (value > range.max) range.max = value;
  };

  switch (question.kind) {
    case "ATTENTION_CHECK":
      return ranges;

    case "TIMED_ABILITY": {
      const fastest = 1 + SPEED_FACTOR_BOUND;
      const slowest = 1 - SPEED_FACTOR_BOUND;
      for (const option of question.options) {
        if (option.isCorrect !== true) continue;
        for (const trait of ALL_TRAITS) {
          const delta = option.traitDeltas[trait];
          if (delta === undefined) continue;
          consider(trait, delta * fastest);
          consider(trait, delta * slowest);
        }
      }
      return ranges;
    }

    case "SINGLE": {
      for (const option of question.options) {
        for (const trait of ALL_TRAITS) {
          const delta = option.traitDeltas[trait];
          if (delta !== undefined) consider(trait, delta);
        }
      }
      return ranges;
    }

    case "SLIDER": {
      // Linear between the endpoints, so the extremes are the endpoints.
      const [left, right] = [...question.options].sort(compareOptions);
      for (const option of [left, right]) {
        if (option === undefined) continue;
        for (const trait of ALL_TRAITS) {
          const delta = option.traitDeltas[trait];
          if (delta !== undefined) consider(trait, delta);
        }
      }
      return ranges;
    }

    case "RANK": {
      const weights = rankWeights(question.options.length);
      const sorted = [...question.options].sort(compareOptions);
      for (const trait of ALL_TRAITS) {
        const deltas = sorted.map((option) => option.traitDeltas[trait] ?? 0);
        if (deltas.every((delta) => delta === 0)) continue;
        const { min, max } = extremeDotProducts(deltas, weights);
        consider(trait, min);
        consider(trait, max);
      }
      return ranges;
    }
  }
}

export function scoreTraits(
  answers: readonly ScoringAnswer[],
  questions: readonly ScoringQuestion[],
): TraitScoreMap {
  const raw = zeroTraitRecord();

  // Canonical order, so the floating-point sum is identical whatever order
  // the caller happened to load the answers in.
  for (const { question, answer } of pairAnswers(answers, questions)) {
    const delta = contribution(question, answer);
    for (const trait of ALL_TRAITS) raw[trait] += delta[trait];
  }

  const totals = {} as Record<Trait, Range>;
  for (const trait of ALL_TRAITS) totals[trait] = { min: 0, max: 0 };

  const orderedQuestions = [...questions].sort((a, b) =>
    a.blockId === b.blockId
      ? a.order - b.order || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0)
      : a.blockId < b.blockId
        ? -1
        : 1,
  );

  for (const question of orderedQuestions) {
    const ranges = questionRange(question);
    for (const trait of ALL_TRAITS) {
      totals[trait].min += ranges[trait].min;
      totals[trait].max += ranges[trait].max;
    }
  }

  const scores = {} as Record<Trait, TraitScoreValue>;
  for (const trait of ALL_TRAITS) {
    const { min, max } = totals[trait];
    const span = max - min;

    if (span <= 0) {
      // Nothing in the active set can move this trait. 50 is "no
      // information", chosen so the trait neither helps nor hurts a career
      // match; `measured: false` tells the UI not to present it as a finding.
      scores[trait] = { raw: raw[trait], normalized: UNMEASURED_NORMALIZED, measured: false };
      continue;
    }

    const normalized = Math.round(clamp(((raw[trait] - min) / span) * 100, 0, 100));
    scores[trait] = { raw: raw[trait], normalized, measured: true };
  }

  return scores;
}
