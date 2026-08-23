/**
 * detectInvalid — flags a session whose answers cannot be trusted (§4).
 *
 * These flags NEVER block a student. They put a quiet note on the result
 * page suggesting a retake, and they exclude the session from a class
 * aggregate so one bored student cannot skew a teacher's view of a class.
 *
 * SIGNATURE NOTE: §4 lists this as detectInvalid(answers). It takes the
 * question set too, because three of the four rules are unanswerable without
 * it — you cannot know an item was an attention check, which option was
 * correct, or how many questions a block contained, from the answers alone.
 */
import { median, pairAnswers } from "./internal";
import type { InvalidityFlag, ScoringAnswer, ScoringQuestion } from "./types";

/** Same option position this many times in a row reads as tapping through. */
export const STRAIGHT_LINE_RUN = 8;

/** A block answered faster than this median was not read. */
export const TOO_FAST_MEDIAN_MS = 1200;

/** Below this, a block is too sparse to score honestly. */
export const BLOCK_COVERAGE_MIN = 0.8;

/** A block needs at least this many answers before its median means anything. */
export const MIN_BLOCK_SAMPLE = 3;

/** Failing this many attention checks is a pattern, not a slip. */
export const ATTENTION_FAILURES_MAX = 1;

/** Fixed output order, so the flag list is itself deterministic. */
const FLAG_ORDER: readonly InvalidityFlag[] = [
  "STRAIGHT_LINE",
  "TOO_FAST",
  "ATTENTION_FAILED",
  "INCOMPLETE",
];

export function detectInvalid(
  answers: readonly ScoringAnswer[],
  questions: readonly ScoringQuestion[],
): InvalidityFlag[] {
  const paired = pairAnswers(answers, questions);
  const flags = new Set<InvalidityFlag>();

  if (paired.length === 0) {
    // Nothing was answered. Incomplete is the honest description, and it is
    // the only flag that can be established without any data.
    flags.add("INCOMPLETE");
    return FLAG_ORDER.filter((flag) => flags.has(flag));
  }

  // --- STRAIGHT_LINE: the same option position, over and over -------------
  let runLength = 0;
  let runOrder: number | null = null;

  for (const { question, answer } of paired) {
    const option = question.options.find((candidate) => candidate.id === answer.optionId);
    if (option === undefined) {
      // A rank or slider answer breaks the run rather than continuing it.
      runLength = 0;
      runOrder = null;
      continue;
    }

    if (option.order === runOrder) {
      runLength += 1;
    } else {
      runOrder = option.order;
      runLength = 1;
    }

    if (runLength >= STRAIGHT_LINE_RUN) flags.add("STRAIGHT_LINE");
  }

  // --- per-block statistics ------------------------------------------------
  const answeredByBlock = new Map<string, number[]>();
  for (const { question, answer } of paired) {
    const times = answeredByBlock.get(question.blockId) ?? [];
    times.push(answer.elapsedMs);
    answeredByBlock.set(question.blockId, times);
  }

  const totalByBlock = new Map<string, number>();
  for (const question of questions) {
    totalByBlock.set(question.blockId, (totalByBlock.get(question.blockId) ?? 0) + 1);
  }

  for (const [, times] of answeredByBlock) {
    if (times.length < MIN_BLOCK_SAMPLE) continue;
    if (median(times) < TOO_FAST_MEDIAN_MS) flags.add("TOO_FAST");
  }

  for (const [blockId, total] of totalByBlock) {
    const answered = answeredByBlock.get(blockId)?.length ?? 0;
    if (total > 0 && answered / total < BLOCK_COVERAGE_MIN) flags.add("INCOMPLETE");
  }

  // --- ATTENTION_FAILED ----------------------------------------------------
  let attentionFailures = 0;
  for (const { question, answer } of paired) {
    if (question.kind !== "ATTENTION_CHECK") continue;

    const option = question.options.find((candidate) => candidate.id === answer.optionId);
    // An unanswered check is covered by INCOMPLETE; only a wrong answer to a
    // check the student did engage with counts as a failure.
    if (option !== undefined && option.isCorrect !== true) attentionFailures += 1;
  }
  if (attentionFailures > ATTENTION_FAILURES_MAX) flags.add("ATTENTION_FAILED");

  return FLAG_ORDER.filter((flag) => flags.has(flag));
}
