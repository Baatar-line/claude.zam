/**
 * `bun run seed` (§3).
 *
 * Validates the whole dataset before it writes a single row, then writes it
 * idempotently: every content row is upserted on a stable authoring key, so
 * running the seed twice leaves the database in the same state as running it
 * once, and re-running it after an edit updates rather than duplicates.
 *
 * Run `bun run seed:check` to validate without touching the database.
 *
 * This script deliberately builds its own PrismaClient instead of importing
 * lib/db/client.ts: that module is `server-only` and belongs to the Next.js
 * runtime. The seed is a plain Bun script and must stay that way.
 */
import { PrismaClient } from "@prisma/client";
import { z } from "zod";

import { fixtureDataset } from "./data/fixture";
import { seedDatasetSchema, type SeedDataset } from "./schema";

const CHECK_ONLY = process.argv.includes("--check");

/**
 * The dataset the seed writes. §7 replaces this with the sourced content
 * dataset; until then it is the development fixture.
 */
const INPUT = fixtureDataset;

function validate(): SeedDataset {
  const parsed = seedDatasetSchema.safeParse(INPUT);

  if (!parsed.success) {
    console.error("Seed validation failed. Nothing was written.\n");
    console.error(z.prettifyError(parsed.error));
    process.exit(1);
  }

  return parsed.data;
}

async function write(prisma: PrismaClient, dataset: SeedDataset): Promise<void> {
  await prisma.$transaction(
    async (tx) => {
      // --- careers, then their children ---------------------------------
      const careerIdBySlug = new Map<string, string>();

      for (const career of dataset.careers) {
        const record = await tx.career.upsert({
          where: { slug: career.slug },
          create: {
            slug: career.slug,
            nameMn: career.nameMn,
            categoryMn: career.categoryMn,
            summaryMn: career.summaryMn,
            dayInLifeMn: career.dayInLifeMn,
            traitWeights: career.traitWeights,
            demandNow: career.demandNow,
            demandFuture: career.demandFuture,
            aiRisk: career.aiRisk,
            aiRiskNoteMn: career.aiRiskNoteMn,
            saturation: career.saturation,
            gradsPerYear: career.gradsPerYear,
            openingsPerYear: career.openingsPerYear,
            salaryStartMnt: career.salaryStartMnt,
            salaryMidMnt: career.salaryMidMnt,
            yearsOfStudy: career.yearsOfStudy,
            yearsToIndependence: career.yearsToIndependence,
            requiredEeshSubjects: career.requiredEeshSubjects,
            adjacentCareerIds: [],
            isActive: career.isActive,
          },
          update: {
            nameMn: career.nameMn,
            categoryMn: career.categoryMn,
            summaryMn: career.summaryMn,
            dayInLifeMn: career.dayInLifeMn,
            traitWeights: career.traitWeights,
            demandNow: career.demandNow,
            demandFuture: career.demandFuture,
            aiRisk: career.aiRisk,
            aiRiskNoteMn: career.aiRiskNoteMn,
            saturation: career.saturation,
            gradsPerYear: career.gradsPerYear,
            openingsPerYear: career.openingsPerYear,
            salaryStartMnt: career.salaryStartMnt,
            salaryMidMnt: career.salaryMidMnt,
            yearsOfStudy: career.yearsOfStudy,
            yearsToIndependence: career.yearsToIndependence,
            requiredEeshSubjects: career.requiredEeshSubjects,
            isActive: career.isActive,
          },
        });

        careerIdBySlug.set(career.slug, record.id);
      }

      // Adjacency needs every career to exist first, so it is a second pass.
      for (const career of dataset.careers) {
        const id = careerIdBySlug.get(career.slug);
        if (id === undefined) continue;

        const adjacentIds = career.adjacentCareerSlugs
          .map((slug) => careerIdBySlug.get(slug))
          .filter((value): value is string => value !== undefined);

        await tx.career.update({
          where: { id },
          data: { adjacentCareerIds: adjacentIds },
        });

        // Reality checks: upsert the listed ones, drop any left behind by an
        // earlier version of the content.
        for (const item of career.realityChecks) {
          await tx.realityCheck.upsert({
            where: { careerId_order: { careerId: id, order: item.order } },
            create: {
              careerId: id,
              order: item.order,
              questionMn: item.questionMn,
              factMn: item.factMn,
              weight: item.weight,
            },
            update: {
              questionMn: item.questionMn,
              factMn: item.factMn,
              weight: item.weight,
            },
          });
        }
        await tx.realityCheck.deleteMany({
          where: {
            careerId: id,
            order: { notIn: career.realityChecks.map((item) => item.order) },
          },
        });

        for (const step of career.roadmapSteps) {
          await tx.roadmapStep.upsert({
            where: { key: step.key },
            create: {
              key: step.key,
              careerId: id,
              gradeLevel: step.gradeLevel,
              category: step.category,
              titleMn: step.titleMn,
              detailMn: step.detailMn,
              resourceUrl: step.resourceUrl ?? null,
            },
            update: {
              careerId: id,
              gradeLevel: step.gradeLevel,
              category: step.category,
              titleMn: step.titleMn,
              detailMn: step.detailMn,
              resourceUrl: step.resourceUrl ?? null,
            },
          });
        }
      }

      // --- questions ------------------------------------------------------
      for (const question of dataset.questions) {
        const record = await tx.question.upsert({
          where: { key: question.key },
          create: {
            key: question.key,
            blockId: question.blockId,
            order: question.order,
            variant: question.variant,
            kind: question.kind,
            promptMn: question.promptMn,
            assetSvg: question.assetSvg ?? null,
            timeLimitSec: question.timeLimitSec ?? null,
            isActive: question.isActive,
          },
          update: {
            blockId: question.blockId,
            order: question.order,
            variant: question.variant,
            kind: question.kind,
            promptMn: question.promptMn,
            assetSvg: question.assetSvg ?? null,
            timeLimitSec: question.timeLimitSec ?? null,
            isActive: question.isActive,
          },
        });

        for (const option of question.options) {
          await tx.questionOption.upsert({
            where: {
              questionId_order: { questionId: record.id, order: option.order },
            },
            create: {
              questionId: record.id,
              order: option.order,
              labelMn: option.labelMn,
              assetSvg: option.assetSvg ?? null,
              traitDeltas: option.traitDeltas,
              isCorrect: option.isCorrect ?? null,
            },
            update: {
              labelMn: option.labelMn,
              assetSvg: option.assetSvg ?? null,
              traitDeltas: option.traitDeltas,
              isCorrect: option.isCorrect ?? null,
            },
          });
        }
        await tx.questionOption.deleteMany({
          where: {
            questionId: record.id,
            order: { notIn: question.options.map((option) => option.order) },
          },
        });
      }

      // --- universities and programmes -------------------------------------
      for (const university of dataset.universities) {
        const record = await tx.university.upsert({
          where: { key: university.key },
          create: {
            key: university.key,
            nameMn: university.nameMn,
            city: university.city,
            isPublic: university.isPublic,
            website: university.website ?? null,
          },
          update: {
            nameMn: university.nameMn,
            city: university.city,
            isPublic: university.isPublic,
            website: university.website ?? null,
          },
        });

        for (const programme of university.programs) {
          const careerIds = programme.careerSlugs
            .map((slug) => careerIdBySlug.get(slug))
            .filter((value): value is string => value !== undefined);

          await tx.program.upsert({
            where: { key: programme.key },
            create: {
              key: programme.key,
              universityId: record.id,
              careerIds,
              nameMn: programme.nameMn,
              tuitionMnt: programme.tuitionMnt,
              eeshThreshold: programme.eeshThreshold,
              durationYears: programme.durationYears,
              quotaNotes: programme.quotaNotes ?? null,
            },
            update: {
              universityId: record.id,
              careerIds,
              nameMn: programme.nameMn,
              tuitionMnt: programme.tuitionMnt,
              eeshThreshold: programme.eeshThreshold,
              durationYears: programme.durationYears,
              quotaNotes: programme.quotaNotes ?? null,
            },
          });
        }
      }

      // --- scholarships -----------------------------------------------------
      for (const scholarship of dataset.scholarships) {
        const careerIds = scholarship.careerSlugs
          .map((slug) => careerIdBySlug.get(slug))
          .filter((value): value is string => value !== undefined);

        await tx.scholarship.upsert({
          where: { key: scholarship.key },
          create: {
            key: scholarship.key,
            nameMn: scholarship.nameMn,
            country: scholarship.country,
            provider: scholarship.provider,
            coverageMn: scholarship.coverageMn,
            deadlineMonth: scholarship.deadlineMonth,
            eligibilityMn: scholarship.eligibilityMn,
            url: scholarship.url,
            careerIds,
          },
          update: {
            nameMn: scholarship.nameMn,
            country: scholarship.country,
            provider: scholarship.provider,
            coverageMn: scholarship.coverageMn,
            deadlineMonth: scholarship.deadlineMonth,
            eligibilityMn: scholarship.eligibilityMn,
            url: scholarship.url,
            careerIds,
          },
        });
      }

      // --- schools and classes ----------------------------------------------
      for (const school of dataset.schools) {
        const record = await tx.school.upsert({
          where: { key: school.key },
          create: {
            key: school.key,
            nameMn: school.nameMn,
            aimag: school.aimag,
            contactEmail: school.contactEmail,
          },
          update: {
            nameMn: school.nameMn,
            aimag: school.aimag,
            contactEmail: school.contactEmail,
          },
        });

        for (const klass of school.classes) {
          await tx.class.upsert({
            where: { code: klass.code },
            create: {
              schoolId: record.id,
              code: klass.code,
              gradeLevel: klass.gradeLevel,
              teacherName: klass.teacherName,
            },
            update: {
              schoolId: record.id,
              gradeLevel: klass.gradeLevel,
              teacherName: klass.teacherName,
            },
          });
        }
      }
    },
    { maxWait: 15_000, timeout: 180_000 },
  );
}

async function main(): Promise<void> {
  const dataset = validate();

  const counts = {
    questions: dataset.questions.length,
    options: dataset.questions.reduce((sum, q) => sum + q.options.length, 0),
    careers: dataset.careers.length,
    realityChecks: dataset.careers.reduce((sum, c) => sum + c.realityChecks.length, 0),
    roadmapSteps: dataset.careers.reduce((sum, c) => sum + c.roadmapSteps.length, 0),
    universities: dataset.universities.length,
    programs: dataset.universities.reduce((sum, u) => sum + u.programs.length, 0),
    scholarships: dataset.scholarships.length,
    schools: dataset.schools.length,
  };

  console.log(`Dataset "${dataset.kind}" is valid:`);
  for (const [name, count] of Object.entries(counts)) {
    console.log(`  ${name.padEnd(14)} ${count}`);
  }

  const unverified = [
    ...dataset.careers.filter((c) => c.needsVerification).map((c) => `career:${c.slug}`),
    ...dataset.universities.filter((u) => u.needsVerification).map((u) => `university:${u.key}`),
    ...dataset.scholarships.filter((s) => s.needsVerification).map((s) => `scholarship:${s.key}`),
  ];

  if (unverified.length > 0) {
    console.log(
      `\n${unverified.length} entries are flagged for human verification before launch (§7):`,
    );
    for (const entry of unverified) console.log(`  - ${entry}`);
  }

  if (CHECK_ONLY) {
    console.log("\n--check: validated only, nothing written.");
    return;
  }

  const prisma = new PrismaClient();
  try {
    await write(prisma, dataset);
  } finally {
    await prisma.$disconnect();
  }

  console.log("\nSeed written.");

  if (dataset.kind === "fixture") {
    console.log(
      [
        "",
        "WARNING: this is the development FIXTURE dataset.",
        "Its salaries, demand levels and AI-risk ratings are placeholders, not",
        "sourced figures. Do not point a production database at it — §7 replaces",
        "this file with the real content.",
      ].join("\n"),
    );
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
