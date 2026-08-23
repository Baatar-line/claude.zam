/**
 * Shared helpers for the scoring engine. Not part of the public API.
 *
 * Everything here exists to serve one property: the engine is a pure
 * function of its inputs as a SET, not as an ordered list. Floating-point
 * addition is not associative, so summing the same numbers in a different
 * order can produce a different last bit — which is why every traversal in
 * this engine walks a canonical order rather than the caller's array order.
 */
import type { ScoringAnswer, ScoringOption, ScoringQuestion } from "./types";
import { ALL_TRAITS, type Trait } from "./traits";

export function clamp(value: number, min: number, max: number): number {
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

/** A trait record with every key present at zero. */
export function zeroTraitRecord(): Record<Trait, number> {
  const record = {} as Record<Trait, number>;
  for (const trait of ALL_TRAITS) record[trait] = 0;
  return record;
}

/** Canonical question order: block, then position, then id as a last resort. */
export function compareQuestions(a: ScoringQuestion, b: ScoringQuestion): number {
  if (a.blockId !== b.blockId) return a.blockId < b.blockId ? -1 : 1;
  if (a.order !== b.order) return a.order - b.order;
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

/** Canonical option order within a question. */
export function compareOptions(a: ScoringOption, b: ScoringOption): number {
  if (a.order !== b.order) return a.order - b.order;
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

export type AnsweredQuestion = {
  readonly question: ScoringQuestion;
  readonly answer: ScoringAnswer;
};

/**
 * Pairs answers with their questions and returns them in canonical question
 * order. Answers for unknown questions are dropped — a stale answer left
 * over from a retired item must not move a score.
 *
 * The database guarantees one answer per question per session, but the
 * engine cannot assume its caller respected that, so duplicates are resolved
 * deterministically instead of by array position.
 */
export function pairAnswers(
  answers: readonly ScoringAnswer[],
  questions: readonly ScoringQuestion[],
): AnsweredQuestion[] {
  const byId = new Map<string, ScoringQuestion>();
  for (const question of questions) byId.set(question.id, question);

  const chosen = new Map<string, ScoringAnswer>();
  for (const answer of answers) {
    if (!byId.has(answer.questionId)) continue;

    const existing = chosen.get(answer.questionId);
    if (existing === undefined || compareAnswers(answer, existing) < 0) {
      chosen.set(answer.questionId, answer);
    }
  }

  const paired: AnsweredQuestion[] = [];
  for (const [questionId, answer] of chosen) {
    const question = byId.get(questionId);
    if (question !== undefined) paired.push({ question, answer });
  }

  paired.sort((a, b) => compareQuestions(a.question, b.question));
  return paired;
}

/** Total order over answers, used only to break a duplicate deterministically. */
function compareAnswers(a: ScoringAnswer, b: ScoringAnswer): number {
  const optionA = a.optionId ?? "";
  const optionB = b.optionId ?? "";
  if (optionA !== optionB) return optionA < optionB ? -1 : 1;

  const sliderA = a.sliderValue ?? -1;
  const sliderB = b.sliderValue ?? -1;
  if (sliderA !== sliderB) return sliderA - sliderB;

  const rankA = (a.rankOrder ?? []).join(",");
  const rankB = (b.rankOrder ?? []).join(",");
  if (rankA !== rankB) return rankA < rankB ? -1 : 1;

  return a.elapsedMs - b.elapsedMs;
}

/** Median of a list of numbers. Empty list yields NaN, which callers guard. */
export function median(values: readonly number[]): number {
  if (values.length === 0) return Number.NaN;

  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 1) return sorted[middle] ?? Number.NaN;

  const lower = sorted[middle - 1];
  const upper = sorted[middle];
  if (lower === undefined || upper === undefined) return Number.NaN;
  return (lower + upper) / 2;
}

/** Descending rank weights: the top choice counts fully, the last counts 1/n. */
export function rankWeights(optionCount: number): number[] {
  const weights: number[] = [];
  for (let index = 0; index < optionCount; index += 1) {
    weights.push((optionCount - index) / optionCount);
  }
  return weights;
}

/**
 * Largest and smallest dot product achievable by pairing `values` with
 * `weights` in any order. By the rearrangement inequality the maximum pairs
 * both sorted the same way and the minimum pairs them oppositely — which is
 * exactly the best and worst a student could do by ranking the options
 * differently.
 */
export function extremeDotProducts(
  values: readonly number[],
  weights: readonly number[],
): { min: number; max: number } {
  const ascending = [...values].sort((a, b) => a - b);
  const descending = [...ascending].reverse();
  const sortedWeights = [...weights].sort((a, b) => b - a);

  let min = 0;
  let max = 0;
  for (let index = 0; index < sortedWeights.length; index += 1) {
    const weight = sortedWeights[index] ?? 0;
    max += (descending[index] ?? 0) * weight;
    min += (ascending[index] ?? 0) * weight;
  }

  return { min, max };
}
