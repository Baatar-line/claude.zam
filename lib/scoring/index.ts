/**
 * lib/scoring — the deterministic core of "Зам" (§4).
 *
 * HARD RULE (§2): this directory imports nothing from next, react or prisma
 * and must stay runnable in a plain Node or Bun script. `bun run seed`
 * imports ./traits, which is the standing proof that it still holds.
 *
 * No AI model computes a score, a match percentage, or a ranking. Everything
 * a student sees as a number is produced here.
 */
export {
  ABILITY_TRAITS,
  ALL_TRAITS,
  GROUP_WEIGHT,
  INTEREST_TRAITS,
  PERSONALITY_TRAITS,
  TRAITS_BY_GROUP,
  TRAIT_GROUP,
  TRAIT_GROUPS,
  TRAIT_GROUP_LABEL_MN,
  TRAIT_LABEL_MN,
  VALUE_TRAITS,
  isTrait,
  traitIndex,
  type Trait,
  type TraitGroup,
} from "./traits";

export {
  SPEED_FACTOR_BOUND,
  UNMEASURED_NORMALIZED,
  scoreTraits,
} from "./score-traits";

export {
  BAND_LABEL_MN,
  BAND_PARTIAL_MIN,
  BAND_STRONG_MIN,
  FLOOR_SCORE,
  bandFor,
  matchCareers,
} from "./match-careers";

export { EXPLANATION_SIZE, explainMatch } from "./explain-match";

export {
  ATTENTION_FAILURES_MAX,
  BLOCK_COVERAGE_MIN,
  MIN_BLOCK_SAMPLE,
  STRAIGHT_LINE_RUN,
  TOO_FAST_MEDIAN_MS,
  detectInvalid,
} from "./detect-invalid";

export type {
  CareerMatch,
  InvalidityFlag,
  MatchBand,
  MatchExplanation,
  QuestionKind,
  ScoringAnswer,
  ScoringCareer,
  ScoringOption,
  ScoringQuestion,
  TraitDeltas,
  TraitScoreMap,
  TraitScoreValue,
} from "./types";
