/**
 * Read layer for the test flow (§5.2).
 *
 * Two shapes come out of the same rows: the client DTO (no traitDeltas, no
 * isCorrect) and the scoring DTO (everything, server-only). Keeping them as
 * separate functions rather than one "safe by convention" object is the
 * guard against the scoring key ever ending up in a page's serialized props.
 */
import "server-only";

import type { SessionVariant } from "@prisma/client";

import { prisma } from "@/lib/db/client";
import type { ScoringOption, ScoringQuestion, TraitDeltas } from "@/lib/scoring/types";

export type ClientOption = {
  id: string;
  order: number;
  labelMn: string;
  assetSvg: string | null;
};

export type ClientQuestion = {
  id: string;
  blockId: string;
  kind: ScoringQuestion["kind"];
  promptMn: string;
  assetSvg: string | null;
  timeLimitSec: number | null;
  options: ClientOption[];
};

export type ClientBlock = {
  key: string;
  order: number;
  titleMn: string;
  descriptionMn: string;
};

async function loadActiveQuestions(variant: SessionVariant) {
  return prisma.question.findMany({
    where: { isActive: true, variant: { in: [variant, "BOTH"] } },
    include: { options: { orderBy: { order: "asc" } } },
  });
}

export async function getTestContent(
  variant: SessionVariant,
): Promise<{ blocks: ClientBlock[]; questions: ClientQuestion[] }> {
  const [blockRows, questionRows] = await Promise.all([
    prisma.block.findMany({ orderBy: { order: "asc" } }),
    loadActiveQuestions(variant),
  ]);

  const blockOrder = new Map(blockRows.map((block) => [block.key, block.order]));
  const orderOf = (blockId: string): number => blockOrder.get(blockId) ?? Number.MAX_SAFE_INTEGER;

  const questions = [...questionRows]
    .sort((a, b) => orderOf(a.blockId) - orderOf(b.blockId) || a.order - b.order)
    .map(
      (row): ClientQuestion => ({
        id: row.id,
        blockId: row.blockId,
        kind: row.kind,
        promptMn: row.promptMn,
        assetSvg: row.assetSvg,
        timeLimitSec: row.timeLimitSec,
        options: row.options.map((option) => ({
          id: option.id,
          order: option.order,
          labelMn: option.labelMn,
          assetSvg: option.assetSvg,
        })),
      }),
    );

  const blocks = blockRows.map(
    (block): ClientBlock => ({
      key: block.key,
      order: block.order,
      titleMn: block.titleMn,
      descriptionMn: block.descriptionMn,
    }),
  );

  return { blocks, questions };
}

/**
 * SERVER-ONLY. Carries traitDeltas and isCorrect — the scoring key. Never
 * return this from a server action or pass it as a prop to a client
 * component (see the file header and QuestionOption.traitDeltas in
 * schema.prisma).
 */
export async function getScoringQuestions(variant: SessionVariant): Promise<ScoringQuestion[]> {
  const rows = await loadActiveQuestions(variant);

  return rows.map(
    (row): ScoringQuestion => ({
      id: row.id,
      blockId: row.blockId,
      order: row.order,
      kind: row.kind,
      timeLimitSec: row.timeLimitSec,
      options: row.options.map(
        (option): ScoringOption => ({
          id: option.id,
          order: option.order,
          traitDeltas: option.traitDeltas as TraitDeltas,
          isCorrect: option.isCorrect,
        }),
      ),
    }),
  );
}

export type CareerPickerEntry = { slug: string; nameMn: string; categoryMn: string };

/** For the VALIDATE-path career picker. Nothing from traitWeights leaks. */
export async function getCareerPickerList(): Promise<CareerPickerEntry[]> {
  const careers = await prisma.career.findMany({
    where: { isActive: true },
    select: { slug: true, nameMn: true, categoryMn: true },
    orderBy: { nameMn: "asc" },
  });
  return careers;
}

export type ScoringCareerRow = { id: string; slug: string; traitWeights: TraitDeltas };

/** SERVER-ONLY in spirit (traitWeights is not secret like traitDeltas, but
 *  there is no product reason to ship a career's full weight vector to the
 *  client — it would let a student reverse-engineer the matching formula). */
export async function getScoringCareers(): Promise<ScoringCareerRow[]> {
  const careers = await prisma.career.findMany({
    where: { isActive: true },
    select: { id: true, slug: true, traitWeights: true },
  });
  return careers.map((career) => ({
    id: career.id,
    slug: career.slug,
    traitWeights: career.traitWeights as TraitDeltas,
  }));
}
