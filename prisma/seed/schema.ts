/**
 * Seed input validation (§3).
 *
 * Every shape that `bun run seed` can write is described here, and nothing
 * reaches the database without passing through it. Three kinds of rule live
 * in this file:
 *
 *   1. Shape and range — what Prisma also enforces, checked earlier so the
 *      error names the career rather than a constraint number.
 *   2. Rules Prisma CANNOT express — timeLimitSec required only when the
 *      question is timed, traitWeights bounded to 0..1, a SLIDER having
 *      exactly two endpoints.
 *   3. Referential integrity across the String[] id arrays, which Postgres
 *      cannot enforce inside an array (see the header of schema.prisma).
 *
 * Content references careers by SLUG, never by id: ids are generated, slugs
 * are authored, and a seed file has to stay readable and diffable.
 */
import { z } from "zod";

import { ALL_TRAITS } from "@/lib/scoring/traits";

// --- primitives -------------------------------------------------------------

export const traitSchema = z.enum(ALL_TRAITS);

const slugSchema = z
  .string()
  .min(2)
  .max(64)
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "slug must be kebab-case ascii");

const keySchema = z
  .string()
  .min(2)
  .max(80)
  .regex(/^[a-z0-9]+([._-][a-z0-9]+)*$/, "key must be lowercase, dot/dash separated");

const mnText = (min: number, max: number) => z.string().trim().min(min).max(max);

/**
 * §7 sourcing rule: every number comes from a real source and the URL is
 * recorded next to it. A field with no source is null, not invented.
 */
export const sourceSchema = z.object({
  /** Which field this backs, e.g. "salaryStartMnt". */
  field: z.string().min(1),
  url: z.url(),
  note: z.string().max(300).optional(),
  /** ISO date the figure was read, so staleness is visible. */
  retrievedOn: z.iso.date().optional(),
});

/** All 23 traits required, each 0..1 (§3 "validate at seed"). */
export const traitWeightsSchema = z.record(traitSchema, z.number().min(0).max(1));

/**
 * Sparse by design: an option moves the few traits it is about. Allowed to be
 * empty only for attention checks, which measure whether the student is
 * reading rather than what they are like — enforced per question below.
 */
export const traitDeltasSchema = z.partialRecord(traitSchema, z.number().finite());

// --- blocks -------------------------------------------------------------

/// One-sentence transition copy shown between blocks (§5.2). Not in the
/// original §3 model list — see the comment on `model Block` in
/// schema.prisma for why this is seeded content rather than a label map.
export const blockSeedSchema = z.object({
  key: keySchema,
  order: z.int().min(0).max(100),
  titleMn: mnText(2, 60),
  descriptionMn: mnText(5, 200),
});

// --- questions --------------------------------------------------------------

export const questionKindSchema = z.enum([
  "SINGLE",
  "RANK",
  "SLIDER",
  "TIMED_ABILITY",
  "ATTENTION_CHECK",
]);

export const questionVariantSchema = z.enum(["JUNIOR", "SENIOR", "BOTH"]);

export const questionOptionSeedSchema = z.object({
  order: z.int().min(0).max(20),
  labelMn: mnText(1, 200),
  assetSvg: z.string().min(1).optional(),
  traitDeltas: traitDeltasSchema,
  isCorrect: z.boolean().optional(),
});

export const questionSeedSchema = z
  .object({
    key: keySchema,
    blockId: keySchema,
    order: z.int().min(0).max(500),
    variant: questionVariantSchema,
    kind: questionKindSchema,
    promptMn: mnText(3, 400),
    assetSvg: z.string().min(1).optional(),
    timeLimitSec: z.int().min(3).max(300).optional(),
    isActive: z.boolean().default(true),
    options: z.array(questionOptionSeedSchema).min(1).max(12),
  })
  .superRefine((question, ctx) => {
    const orders = question.options.map((option) => option.order);
    if (new Set(orders).size !== orders.length) {
      ctx.addIssue({
        code: "custom",
        path: ["options"],
        message: "option `order` values must be unique within a question",
      });
    }

    const correctCount = question.options.filter((o) => o.isCorrect === true).length;

    switch (question.kind) {
      case "TIMED_ABILITY": {
        // §3: Prisma cannot express "NOT NULL when kind = TIMED_ABILITY".
        if (question.timeLimitSec === undefined) {
          ctx.addIssue({
            code: "custom",
            path: ["timeLimitSec"],
            message: "timeLimitSec is required when kind = TIMED_ABILITY",
          });
        }
        if (correctCount !== 1) {
          ctx.addIssue({
            code: "custom",
            path: ["options"],
            message: "an ability item must have exactly one correct option",
          });
        }
        if (question.options.length < 2) {
          ctx.addIssue({
            code: "custom",
            path: ["options"],
            message: "an ability item needs at least two options",
          });
        }
        break;
      }
      case "ATTENTION_CHECK": {
        // Renders identically to SINGLE (§5.2) so it stays undetectable,
        // but it needs a right answer to be checkable.
        if (correctCount !== 1) {
          ctx.addIssue({
            code: "custom",
            path: ["options"],
            message: "an attention check must have exactly one correct option",
          });
        }
        break;
      }
      case "SLIDER": {
        // Two labelled endpoints, no numeric readout (§5.2). The engine
        // interpolates between them, so exactly two is load-bearing.
        if (question.options.length !== 2) {
          ctx.addIssue({
            code: "custom",
            path: ["options"],
            message: "a slider must have exactly two options: the two endpoints",
          });
        }
        break;
      }
      case "SINGLE":
      case "RANK": {
        if (question.options.length < 2) {
          ctx.addIssue({
            code: "custom",
            path: ["options"],
            message: `${question.kind} needs at least two options`,
          });
        }
        break;
      }
    }

    if (question.kind !== "ATTENTION_CHECK") {
      question.options.forEach((option, index) => {
        if (Object.keys(option.traitDeltas).length === 0) {
          ctx.addIssue({
            code: "custom",
            path: ["options", index, "traitDeltas"],
            message: "every scored option must move at least one trait",
          });
        }
      });
    }

    if (question.kind !== "TIMED_ABILITY" && question.timeLimitSec !== undefined) {
      ctx.addIssue({
        code: "custom",
        path: ["timeLimitSec"],
        message: "only TIMED_ABILITY items may set timeLimitSec",
      });
    }
  });

// --- careers ----------------------------------------------------------------

export const demandLevelSchema = z.enum(["HIGH", "MEDIUM", "LOW"]);
export const aiRiskSchema = z.enum(["LOW", "MEDIUM", "HIGH"]);
export const saturationSchema = z.enum(["SATURATED", "BALANCED", "UNDERSUPPLIED"]);
export const roadmapCategorySchema = z.enum([
  "SUBJECT",
  "SKILL",
  "ACTIVITY",
  "EXPERIENCE",
  "RESOURCE",
]);

export const realityCheckSeedSchema = z.object({
  order: z.int().min(0).max(20),
  questionMn: mnText(5, 300),
  factMn: mnText(5, 600),
  /** How surprising this is if unknown, 1..5. */
  weight: z.int().min(1).max(5),
});

export const roadmapStepSeedSchema = z.object({
  key: keySchema,
  gradeLevel: z.int().min(7).max(12),
  category: roadmapCategorySchema,
  titleMn: mnText(3, 160),
  detailMn: mnText(5, 600),
  resourceUrl: z.url().optional(),
});

export const careerSeedSchema = z
  .object({
    slug: slugSchema,
    nameMn: mnText(2, 80),
    categoryMn: mnText(2, 60),
    summaryMn: mnText(10, 300),
    dayInLifeMn: mnText(40, 1200),

    traitWeights: traitWeightsSchema,

    demandNow: demandLevelSchema,
    demandFuture: demandLevelSchema,
    aiRisk: aiRiskSchema,
    /** One sentence: what AI takes, and what stays. */
    aiRiskNoteMn: mnText(15, 300),
    saturation: saturationSchema,

    /** Null when no real figure exists. The UI omits the row (§7). */
    gradsPerYear: z.int().min(0).nullable(),
    openingsPerYear: z.int().min(0).nullable(),

    salaryStartMnt: z.int().min(0),
    salaryMidMnt: z.int().min(0),

    yearsOfStudy: z.number().min(0).max(15),
    yearsToIndependence: z.number().min(0).max(30).nullable(),

    requiredEeshSubjects: z.array(mnText(2, 60)).max(6),
    /** Three, chosen for trait overlap rather than category (§7). */
    adjacentCareerSlugs: z.array(slugSchema).length(3),

    isActive: z.boolean().default(true),

    sources: z.array(sourceSchema).default([]),
    /** Flag every entry needing human verification before launch (§7). */
    needsVerification: z.boolean(),

    realityChecks: z.array(realityCheckSeedSchema).max(10),
    roadmapSteps: z.array(roadmapStepSeedSchema).default([]),
  })
  .superRefine((career, ctx) => {
    if (career.salaryMidMnt < career.salaryStartMnt) {
      ctx.addIssue({
        code: "custom",
        path: ["salaryMidMnt"],
        message: "mid-career salary cannot be below the starting salary",
      });
    }

    if (career.adjacentCareerSlugs.includes(career.slug)) {
      ctx.addIssue({
        code: "custom",
        path: ["adjacentCareerSlugs"],
        message: "a career cannot be adjacent to itself",
      });
    }

    if (new Set(career.adjacentCareerSlugs).size !== 3) {
      ctx.addIssue({
        code: "custom",
        path: ["adjacentCareerSlugs"],
        message: "adjacent careers must be three distinct slugs",
      });
    }

    const orders = career.realityChecks.map((item) => item.order);
    if (new Set(orders).size !== orders.length) {
      ctx.addIssue({
        code: "custom",
        path: ["realityChecks"],
        message: "reality check `order` values must be unique",
      });
    }
  });

// --- universities, scholarships, schools -------------------------------------

export const programSeedSchema = z.object({
  key: keySchema,
  nameMn: mnText(2, 160),
  careerSlugs: z.array(slugSchema).min(1),
  tuitionMnt: z.int().min(0).nullable(),
  eeshThreshold: z.int().min(0).max(800).nullable(),
  durationYears: z.number().min(0.5).max(10),
  quotaNotes: mnText(2, 300).optional(),
});

export const universitySeedSchema = z.object({
  key: keySchema,
  nameMn: mnText(2, 160),
  city: mnText(2, 60),
  isPublic: z.boolean(),
  website: z.url().optional(),
  sources: z.array(sourceSchema).default([]),
  needsVerification: z.boolean(),
  programs: z.array(programSeedSchema).default([]),
});

export const scholarshipSeedSchema = z.object({
  key: keySchema,
  nameMn: mnText(2, 160),
  country: mnText(2, 60),
  provider: mnText(2, 120),
  coverageMn: mnText(5, 400),
  /** Month only: exact deadlines move every year (§3). */
  deadlineMonth: z.int().min(1).max(12),
  eligibilityMn: mnText(5, 500),
  url: z.url(),
  careerSlugs: z.array(slugSchema).default([]),
  sources: z.array(sourceSchema).default([]),
  needsVerification: z.boolean(),
});

export const classSeedSchema = z.object({
  code: z
    .string()
    .min(3)
    .max(16)
    .regex(/^[0-9A-ZА-ЯӨҮ-]+$/u, "class code is uppercase, digits and dashes"),
  gradeLevel: z.int().min(7).max(12),
  teacherName: mnText(2, 120),
});

export const schoolSeedSchema = z.object({
  key: keySchema,
  nameMn: mnText(2, 160),
  aimag: mnText(2, 60),
  contactEmail: z.email(),
  classes: z.array(classSeedSchema).default([]),
});

// --- the dataset ------------------------------------------------------------

export const seedDatasetSchema = z
  .object({
    /**
     * "fixture" is throwaway development data whose numbers are placeholders.
     * "content" is the real §7 dataset and is held to the sourcing rule.
     */
    kind: z.enum(["fixture", "content"]),
    blocks: z.array(blockSeedSchema).default([]),
    questions: z.array(questionSeedSchema).default([]),
    careers: z.array(careerSeedSchema).default([]),
    universities: z.array(universitySeedSchema).default([]),
    scholarships: z.array(scholarshipSeedSchema).default([]),
    schools: z.array(schoolSeedSchema).default([]),
  })
  .superRefine((dataset, ctx) => {
    const careerSlugs = new Set(dataset.careers.map((career) => career.slug));

    const duplicate = <T>(values: T[]): T[] => {
      const seen = new Set<T>();
      const dupes = new Set<T>();
      for (const value of values) {
        if (seen.has(value)) dupes.add(value);
        seen.add(value);
      }
      return [...dupes];
    };

    const reportDuplicates = (values: string[], path: string, label: string): void => {
      for (const value of duplicate(values)) {
        ctx.addIssue({
          code: "custom",
          path: [path],
          message: `duplicate ${label}: ${value}`,
        });
      }
    };

    reportDuplicates(dataset.blocks.map((b) => b.key), "blocks", "block key");
    reportDuplicates(dataset.careers.map((c) => c.slug), "careers", "career slug");
    reportDuplicates(dataset.questions.map((q) => q.key), "questions", "question key");
    reportDuplicates(
      dataset.universities.map((u) => u.key),
      "universities",
      "university key",
    );
    reportDuplicates(
      dataset.universities.flatMap((u) => u.programs.map((p) => p.key)),
      "universities",
      "programme key",
    );
    reportDuplicates(
      dataset.scholarships.map((s) => s.key),
      "scholarships",
      "scholarship key",
    );
    reportDuplicates(
      dataset.careers.flatMap((c) => c.roadmapSteps.map((step) => step.key)),
      "careers",
      "roadmap step key",
    );
    reportDuplicates(
      dataset.schools.flatMap((s) => s.classes.map((klass) => klass.code)),
      "schools",
      "class code",
    );

    const blockKeys = new Set(dataset.blocks.map((block) => block.key));
    dataset.questions.forEach((question, index) => {
      if (!blockKeys.has(question.blockId)) {
        ctx.addIssue({
          code: "custom",
          path: ["questions", index, "blockId"],
          message: `unknown block key: ${question.blockId}`,
        });
      }
    });

    // Referential integrity for the String[] id arrays.
    const checkCareerRefs = (slugs: string[], path: (string | number)[]): void => {
      for (const slug of slugs) {
        if (!careerSlugs.has(slug)) {
          ctx.addIssue({
            code: "custom",
            path,
            message: `unknown career slug: ${slug}`,
          });
        }
      }
    };

    dataset.careers.forEach((career, index) => {
      checkCareerRefs(career.adjacentCareerSlugs, [
        "careers",
        index,
        "adjacentCareerSlugs",
      ]);
    });

    dataset.universities.forEach((university, uIndex) => {
      university.programs.forEach((programme, pIndex) => {
        checkCareerRefs(programme.careerSlugs, [
          "universities",
          uIndex,
          "programs",
          pIndex,
          "careerSlugs",
        ]);
      });
    });

    dataset.scholarships.forEach((scholarship, index) => {
      checkCareerRefs(scholarship.careerSlugs, ["scholarships", index, "careerSlugs"]);
    });

    // The §7 contract, enforced only on the real dataset so a development
    // fixture is not required to pretend it has sources.
    if (dataset.kind === "content") {
      dataset.careers.forEach((career, index) => {
        if (career.realityChecks.length !== 6) {
          ctx.addIssue({
            code: "custom",
            path: ["careers", index, "realityChecks"],
            message: "content careers carry exactly 6 reality check items (§7)",
          });
        }

        const sourced = new Set(career.sources.map((source) => source.field));
        for (const field of ["salaryStartMnt", "salaryMidMnt"] as const) {
          if (!sourced.has(field)) {
            ctx.addIssue({
              code: "custom",
              path: ["careers", index, "sources"],
              message: `${field} needs a source URL before it may ship (§7)`,
            });
          }
        }

        if (career.requiredEeshSubjects.length === 0) {
          ctx.addIssue({
            code: "custom",
            path: ["careers", index, "requiredEeshSubjects"],
            message: "content careers must state their EESH subjects",
          });
        }
      });
    }
  });

export type SeedDatasetInput = z.input<typeof seedDatasetSchema>;
export type SeedDataset = z.output<typeof seedDatasetSchema>;
export type CareerSeed = z.output<typeof careerSeedSchema>;
export type QuestionSeed = z.output<typeof questionSeedSchema>;
export type UniversitySeed = z.output<typeof universitySeedSchema>;
export type ScholarshipSeed = z.output<typeof scholarshipSeedSchema>;
export type SchoolSeed = z.output<typeof schoolSeedSchema>;
