/**
 * explainMatch — why a career matched, in traits (§4).
 *
 * The result page has to name the actual reason on every card. That reason
 * comes from here, not from the model: the AI layer may rephrase these
 * traits warmly, but it never chooses them.
 */
import { ALL_TRAITS, traitIndex, type Trait } from "./traits";
import type { MatchExplanation, ScoringCareer, TraitScoreMap } from "./types";

/** How many traits each side of the explanation carries. */
export const EXPLANATION_SIZE = 3;

type Scored = { trait: Trait; value: number };

function topBy(scored: Scored[]): Trait[] {
  return scored
    .filter((entry) => entry.value > 0)
    .sort((a, b) => {
      if (b.value !== a.value) return b.value - a.value;
      // Fixed trait order as the tie-break, so two equally good traits always
      // come out in the same sequence.
      return traitIndex(a.trait) - traitIndex(b.trait);
    })
    .slice(0, EXPLANATION_SIZE)
    .map((entry) => entry.trait);
}

export function explainMatch(
  traits: TraitScoreMap,
  career: ScoringCareer,
): MatchExplanation {
  const positive: Scored[] = [];
  const gaps: Scored[] = [];

  for (const trait of ALL_TRAITS) {
    const weight = career.traitWeights[trait] ?? 0;
    if (weight <= 0) continue;

    const score = traits[trait];
    // An unmeasured trait is not evidence. Telling a student their strength
    // is something the test never asked about would be a lie they could
    // check, and the product's credibility is the whole asset.
    if (!score.measured) continue;

    const level = score.normalized / 100;
    positive.push({ trait, value: weight * level });
    gaps.push({ trait, value: weight * (1 - level) });
  }

  return {
    topPositive: topBy(positive),
    topGaps: topBy(gaps),
  };
}
