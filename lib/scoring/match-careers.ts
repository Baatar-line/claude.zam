/**
 * matchCareers — how well each career fits this student (§4).
 *
 * Weighted cosine similarity, computed per trait group so the four
 * sub-scores fall out of the same arithmetic the total is built from. No
 * model is involved at any point, and no call leaves this process.
 */
import { explainMatch } from "./explain-match";
import { clamp } from "./internal";
import { GROUP_WEIGHT, TRAITS_BY_GROUP, TRAIT_GROUPS, type TraitGroup } from "./traits";
import type { CareerMatch, MatchBand, ScoringCareer, TraitScoreMap } from "./types";

/**
 * DELIBERATE PRODUCT DECISION, NOT A BUG.
 *
 * The displayed match is floored at 35. A 15-year-old reading "8%" next to a
 * job they had their heart set on hears a verdict on themselves, and that is
 * not what this number means — it is the distance between one profile and one
 * career's typical profile, measured today, on a test they took in twenty
 * minutes. The ordering below the floor is preserved in `rawScore`, so
 * nothing is lost analytically; only the number shown to a child is bounded.
 */
export const FLOOR_SCORE = 35;

/** Band thresholds (§4). No band means "unsuitable" — that is the point. */
export const BAND_STRONG_MIN = 75;
export const BAND_PARTIAL_MIN = 50;

export function bandFor(score: number): MatchBand {
  if (score >= BAND_STRONG_MIN) return "STRONG";
  if (score >= BAND_PARTIAL_MIN) return "PARTIAL";
  return "DIVERGENT";
}

/** Mongolian label for each band (§4). */
export const BAND_LABEL_MN: Readonly<Record<MatchBand, string>> = {
  STRONG: "Сайн таарч байна",
  PARTIAL: "Таарч байна, гэхдээ бэхжүүлэх зүйл бий",
  DIVERGENT: "Сонирхолтой зөрүү байна",
};

function cosine(a: readonly number[], b: readonly number[]): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let index = 0; index < a.length; index += 1) {
    const left = a[index] ?? 0;
    const right = b[index] ?? 0;
    dot += left * right;
    normA += left * left;
    normB += right * right;
  }

  if (normA === 0 || normB === 0) return 0;
  return clamp(dot / (Math.sqrt(normA) * Math.sqrt(normB)), 0, 1);
}

type GroupResult = {
  /** 0..1 similarity, or null when the career expresses nothing in this group. */
  similarity: number | null;
};

function scoreGroup(
  traits: TraitScoreMap,
  career: ScoringCareer,
  group: TraitGroup,
): GroupResult {
  const groupTraits = TRAITS_BY_GROUP[group];

  const studentVector = groupTraits.map((trait) => traits[trait].normalized / 100);
  const careerVector = groupTraits.map((trait) => career.traitWeights[trait] ?? 0);

  // A career that cares about nothing in this group tells us nothing about
  // fit here, so the group is dropped and its weight is shared out among the
  // groups that do say something, rather than counted as a zero.
  if (careerVector.every((weight) => weight === 0)) return { similarity: null };

  return { similarity: cosine(studentVector, careerVector) };
}

function scoreCareer(
  traits: TraitScoreMap,
  career: ScoringCareer,
): { rawScore: number; subScores: Record<TraitGroup, number> } {
  const similarities = {} as Record<TraitGroup, number | null>;
  let expressedWeight = 0;

  for (const group of TRAIT_GROUPS) {
    const { similarity } = scoreGroup(traits, career, group);
    similarities[group] = similarity;
    if (similarity !== null) expressedWeight += GROUP_WEIGHT[group];
  }

  const subScores = {} as Record<TraitGroup, number>;
  let total = 0;

  for (const group of TRAIT_GROUPS) {
    const similarity = similarities[group];
    subScores[group] = similarity === null ? 0 : Math.round(similarity * 100);
    if (similarity !== null && expressedWeight > 0) {
      total += (GROUP_WEIGHT[group] / expressedWeight) * similarity;
    }
  }

  return { rawScore: Math.round(clamp(total, 0, 1) * 100), subScores };
}

export function matchCareers(
  traits: TraitScoreMap,
  careers: readonly ScoringCareer[],
): CareerMatch[] {
  const scored = careers.map((career) => {
    const { rawScore, subScores } = scoreCareer(traits, career);
    const score = Math.max(rawScore, FLOOR_SCORE);

    return {
      careerId: career.id,
      slug: career.slug,
      rawScore,
      score,
      band: bandFor(score),
      subScores,
      reasonTraits: explainMatch(traits, career).topPositive,
    };
  });

  // Ordered by the unfloored score so careers below the floor still rank
  // against each other, with the slug as a stable tie-break. Each career is
  // scored independently, so adding one to the pool cannot change another's
  // score — only its position in the list.
  scored.sort((a, b) => {
    if (b.rawScore !== a.rawScore) return b.rawScore - a.rawScore;
    return a.slug < b.slug ? -1 : a.slug > b.slug ? 1 : 0;
  });

  return scored.map((entry, index) => ({ ...entry, rank: index + 1 }));
}
