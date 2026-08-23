/**
 * The trait vocabulary (§3, §4).
 *
 * This file is the single source of truth for which traits exist, which
 * group each belongs to, and what each is called in Mongolian. The Prisma
 * `Trait` enum mirrors it; the seed validator imports from here so content
 * can never introduce a trait the engine does not know about.
 *
 * PURE: no imports at all. lib/scoring must run in a plain Node script.
 */

export const ABILITY_TRAITS = [
  "LOGIC",
  "SPATIAL",
  "VERBAL",
  "NUMERIC",
  "MEMORY",
  "PROCESSING",
] as const;

export const INTEREST_TRAITS = [
  "REALISTIC",
  "INVESTIGATIVE",
  "ARTISTIC",
  "SOCIAL",
  "ENTERPRISING",
  "CONVENTIONAL",
] as const;

export const PERSONALITY_TRAITS = [
  "OPENNESS",
  "CONSCIENTIOUSNESS",
  "EXTRAVERSION",
  "AGREEABLENESS",
  "STABILITY",
] as const;

export const VALUE_TRAITS = [
  "STABILITY_V",
  "INCOME",
  "CREATIVITY",
  "HELPING",
  "AUTONOMY",
  "PRESTIGE",
] as const;

/** All 23 traits, in a fixed order. The order is load-bearing: it is the
 *  tie-breaker that keeps every ranking deterministic. */
export const ALL_TRAITS = [
  ...ABILITY_TRAITS,
  ...INTEREST_TRAITS,
  ...PERSONALITY_TRAITS,
  ...VALUE_TRAITS,
] as const;

export type Trait = (typeof ALL_TRAITS)[number];
export type TraitGroup = "ability" | "interest" | "personality" | "value";

export const TRAIT_GROUPS = ["ability", "interest", "personality", "value"] as const;

function groupOf(): Record<Trait, TraitGroup> {
  const map = {} as Record<Trait, TraitGroup>;
  for (const trait of ABILITY_TRAITS) map[trait] = "ability";
  for (const trait of INTEREST_TRAITS) map[trait] = "interest";
  for (const trait of PERSONALITY_TRAITS) map[trait] = "personality";
  for (const trait of VALUE_TRAITS) map[trait] = "value";
  return map;
}

export const TRAIT_GROUP: Readonly<Record<Trait, TraitGroup>> = groupOf();

export const TRAITS_BY_GROUP: Readonly<Record<TraitGroup, readonly Trait[]>> = {
  ability: ABILITY_TRAITS,
  interest: INTEREST_TRAITS,
  personality: PERSONALITY_TRAITS,
  value: VALUE_TRAITS,
};

/**
 * How much each group contributes to a career match (§4).
 * Sums to 1. Changing these changes every result in the product, so they
 * live in one place and are explained in lib/scoring/README.md.
 */
export const GROUP_WEIGHT: Readonly<Record<TraitGroup, number>> = {
  ability: 0.35,
  interest: 0.35,
  personality: 0.2,
  value: 0.1,
};

/**
 * Mongolian labels. Plain words a 12-year-old parses — no "когнитив",
 * no "компетенц" (§1 copy rules). Used by the result UI and by the AI
 * narrative layer, which may only name traits by these labels.
 */
export const TRAIT_LABEL_MN: Readonly<Record<Trait, string>> = {
  LOGIC: "Логик сэтгэх",
  SPATIAL: "Орон зайн төсөөлөл",
  VERBAL: "Үг хэлний чадвар",
  NUMERIC: "Тоотой ажиллах",
  MEMORY: "Ой тогтоолт",
  PROCESSING: "Хурдан ойлгох",

  REALISTIC: "Гараар хийх",
  INVESTIGATIVE: "Судлах",
  ARTISTIC: "Урлах, зохиох",
  SOCIAL: "Хүнтэй ажиллах",
  ENTERPRISING: "Удирдах, ятгах",
  CONVENTIONAL: "Эмх цэгцтэй ажиллах",

  OPENNESS: "Шинэд нээлттэй",
  CONSCIENTIOUSNESS: "Хариуцлагатай",
  EXTRAVERSION: "Нийтэч",
  AGREEABLENESS: "Эвсэг",
  STABILITY: "Тайван байх",

  STABILITY_V: "Тогтвортой ажил",
  INCOME: "Өндөр орлого",
  CREATIVITY: "Бүтээлч байх",
  HELPING: "Хүнд туслах",
  AUTONOMY: "Бие даасан байх",
  PRESTIGE: "Нэр хүнд",
};

export const TRAIT_GROUP_LABEL_MN: Readonly<Record<TraitGroup, string>> = {
  ability: "Чадвар",
  interest: "Сонирхол",
  personality: "Зан төлөв",
  value: "Үнэт зүйл",
};

const TRAIT_SET: ReadonlySet<string> = new Set(ALL_TRAITS);

export function isTrait(value: string): value is Trait {
  return TRAIT_SET.has(value);
}

/** Position in ALL_TRAITS, used as the deterministic tie-breaker. */
export function traitIndex(trait: Trait): number {
  return ALL_TRAITS.indexOf(trait);
}
