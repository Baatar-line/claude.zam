/**
 * The engine's own input and output types (§4).
 *
 * These are NOT Prisma models. The engine is a pure function over plain data
 * so it can be run from a script, a test, or a future batch job with no
 * database anywhere near it. The server maps Prisma rows onto these types at
 * the boundary — which is also HARD RULE 4 working in the other direction.
 */
import type { Trait, TraitGroup } from "./traits";

export type QuestionKind =
  | "SINGLE"
  | "RANK"
  | "SLIDER"
  | "TIMED_ABILITY"
  | "ATTENTION_CHECK";

/** A trait vector. Absent keys mean zero. */
export type TraitDeltas = Readonly<Partial<Record<Trait, number>>>;

export type ScoringOption = {
  readonly id: string;
  readonly order: number;
  readonly traitDeltas: TraitDeltas;
  readonly isCorrect?: boolean | null;
};

export type ScoringQuestion = {
  readonly id: string;
  readonly blockId: string;
  readonly order: number;
  readonly kind: QuestionKind;
  readonly timeLimitSec?: number | null;
  readonly options: readonly ScoringOption[];
};

export type ScoringAnswer = {
  readonly questionId: string;
  readonly optionId?: string | null;
  /** Ordered option `order` values for RANK items, best first. Empty for
   *  every other kind. */
  readonly rankOrder?: readonly number[];
  /** 0..100 for SLIDER items. */
  readonly sliderValue?: number | null;
  readonly elapsedMs: number;
};

export type TraitScoreValue = {
  /** Sum of the deltas the student actually earned. Can be negative. */
  readonly raw: number;
  /** 0..100 against the theoretical range of the active question set. */
  readonly normalized: number;
  /**
   * False when the active question set cannot move this trait at all. The
   * engine still returns 50 (neutral) so matching is unbiased, but the UI
   * must not present an unmeasured trait as a finding about the student.
   */
  readonly measured: boolean;
};

export type TraitScoreMap = Readonly<Record<Trait, TraitScoreValue>>;

export type ScoringCareer = {
  readonly id: string;
  readonly slug: string;
  /** Each value 0..1. Absent keys mean the career does not care. */
  readonly traitWeights: TraitDeltas;
};

export type MatchBand = "STRONG" | "PARTIAL" | "DIVERGENT";

export type CareerMatch = {
  readonly careerId: string;
  readonly slug: string;
  /**
   * 35..100. This is the number stored and shown. The floor is deliberate —
   * see the comment on FLOOR_SCORE in match-careers.ts.
   */
  readonly score: number;
  /** 0..100, unfloored. Kept for auditing and for ordering below the floor. */
  readonly rawScore: number;
  readonly band: MatchBand;
  /** 1-based. */
  readonly rank: number;
  /** 0..100 per group, so the career page can say what drove the match. */
  readonly subScores: Readonly<Record<TraitGroup, number>>;
  /** Top contributing traits, for explainability. */
  readonly reasonTraits: readonly Trait[];
};

export type MatchExplanation = {
  /** Traits where the student is strong and the career wants it. */
  readonly topPositive: readonly Trait[];
  /** Traits the career wants that the student has yet to build. */
  readonly topGaps: readonly Trait[];
};

export type InvalidityFlag =
  | "STRAIGHT_LINE"
  | "TOO_FAST"
  | "ATTENTION_FAILED"
  | "INCOMPLETE";
