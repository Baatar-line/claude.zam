"use server";

/**
 * Server actions for the result flow (§5.3-§5.5).
 *
 * AUTH MODEL: a result page is reached by a resume code, not a login, and
 * may be opened on a device that never ran the test (a parent's phone, a
 * different browser). So every action here resolves its session through
 * `resolveSessionId`, which prefers the signed session cookie (cheap, no
 * rate limit) and falls back to hashing the code from the URL (rate-limited
 * like test.resumeByCode, since repeated wrong guesses here are the same
 * brute-force surface). The cookie path re-checks that the cookie's session
 * actually matches the code in the URL, so a browser that already holds
 * someone else's session cookie can never see a different code's results.
 */
import { z } from "zod";

import { getClientIp } from "@/lib/actions/client-ip";
import { ActionFailure, defineAction } from "@/lib/actions";
import { RATE_LIMITS, rateLimiter } from "@/lib/actions/rate-limit";
import { getCareerDetail, getRoadmapProgress } from "@/lib/content/results";
import { prisma } from "@/lib/db/client";
import { BAND_LABEL_MN, bandFor } from "@/lib/scoring/match-careers";
import { explainMatch } from "@/lib/scoring/explain-match";
import { ALL_TRAITS, TRAIT_GROUP, TRAIT_GROUP_LABEL_MN, TRAIT_LABEL_MN, type Trait } from "@/lib/scoring/traits";
import type { TraitDeltas, TraitScoreValue } from "@/lib/scoring/types";
import { getSessionIdFromCookie, setSessionCookie } from "@/lib/session/cookie";
import { hashResumeCode } from "@/lib/session/crypto";
import { updateSupplementarySchema } from "@/lib/validation/supplementary";

const codeSchema = z.object({ code: z.string().trim().length(6) });

async function resolveSessionId(code: string): Promise<string | null> {
  const hash = hashResumeCode(code);

  const cookieSessionId = await getSessionIdFromCookie();
  if (cookieSessionId !== null) {
    const owned = await prisma.session.findUnique({
      where: { id: cookieSessionId },
      select: { resumeCodeHash: true },
    });
    if (owned && owned.resumeCodeHash === hash) return cookieSessionId;
  }

  const ip = await getClientIp();
  const verdict = await rateLimiter.check(
    `result.resolve:ip:${ip}`,
    RATE_LIMITS.RESUME_CODE.limit,
    RATE_LIMITS.RESUME_CODE.windowMs,
  );
  if (!verdict.allowed) return null;

  const session = await prisma.session.findUnique({ where: { resumeCodeHash: hash } });
  if (!session) return null;

  await setSessionCookie(session.id);
  return session.id;
}

export const viewResult = defineAction({
  name: "result.viewResult",
  input: codeSchema,
  handler: async (input) => {
    const sessionId = await resolveSessionId(input.code);
    if (sessionId === null) {
      throw new ActionFailure("NOT_FOUND", "Ийм код олдсонгүй, кодоо шалгаад дахин оруулаарай.");
    }

    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        traitScores: true,
        chosenCareer: { select: { slug: true, nameMn: true } },
        careerMatches: {
          orderBy: { rank: "asc" },
          include: {
            career: {
              select: { slug: true, nameMn: true, categoryMn: true, summaryMn: true },
            },
          },
        },
      },
    });
    if (!session) {
      throw new ActionFailure("NOT_FOUND", "Ийм код олдсонгүй, кодоо шалгаад дахин оруулаарай.");
    }

    if (session.completedAt === null) {
      return { completed: false as const };
    }

    const traits = ALL_TRAITS.map((trait) => {
      const row = session.traitScores.find((candidate) => candidate.trait === trait);
      return {
        trait,
        group: TRAIT_GROUP[trait],
        groupLabelMn: TRAIT_GROUP_LABEL_MN[TRAIT_GROUP[trait]],
        labelMn: TRAIT_LABEL_MN[trait],
        normalized: row?.normalized ?? 50,
        measured: row?.measured ?? false,
      };
    });

    return {
      completed: true as const,
      entryPath: session.entryPath,
      gradeLevel: session.gradeLevel,
      validityFlags: session.validityFlags,
      chosenCareer: session.chosenCareer,
      mbtiType: session.mbtiType,
      iqScore: session.iqScore,
      traits,
      careerMatches: session.careerMatches.map((match) => ({
        slug: match.career.slug,
        nameMn: match.career.nameMn,
        categoryMn: match.career.categoryMn,
        summaryMn: match.career.summaryMn,
        score: match.score,
        band: bandFor(match.score),
        bandLabelMn: BAND_LABEL_MN[bandFor(match.score)],
        rank: match.rank,
      })),
    };
  },
});

export const updateSupplementary = defineAction({
  name: "result.updateSupplementary",
  input: updateSupplementarySchema,
  handler: async (input) => {
    const sessionId = await resolveSessionId(input.code);
    if (sessionId === null) {
      throw new ActionFailure("NOT_FOUND", "Ийм код олдсонгүй, кодоо шалгаад дахин оруулаарай.");
    }

    const session = await prisma.session.update({
      where: { id: sessionId },
      data: {
        ...(input.mbtiType !== undefined ? { mbtiType: input.mbtiType } : {}),
        ...(input.iqScore !== undefined ? { iqScore: input.iqScore } : {}),
      },
      select: { mbtiType: true, iqScore: true },
    });

    return session;
  },
});

const careerDetailSchema = z.object({ code: z.string().trim().length(6), slug: z.string().min(1) });

export const loadCareerDetail = defineAction({
  name: "result.loadCareerDetail",
  input: careerDetailSchema,
  handler: async (input) => {
    const sessionId = await resolveSessionId(input.code);
    if (sessionId === null) {
      throw new ActionFailure("NOT_FOUND", "Ийм код олдсонгүй, кодоо шалгаад дахин оруулаарай.");
    }

    const detail = await getCareerDetail(input.slug);
    if (!detail) {
      throw new ActionFailure("NOT_FOUND", "Энэ мэргэжил олдсонгүй.");
    }

    const [match, traitScoreRows, progress] = await Promise.all([
      prisma.careerMatch.findUnique({
        where: { sessionId_careerId: { sessionId, careerId: detail.career.id } },
      }),
      prisma.traitScore.findMany({ where: { sessionId } }),
      getRoadmapProgress(sessionId, detail.career.id),
    ]);

    let explanation: { topPositive: string[]; topGaps: string[] } = { topPositive: [], topGaps: [] };
    if (traitScoreRows.length > 0) {
      const traitScoreMap = {} as Record<Trait, TraitScoreValue>;
      for (const trait of ALL_TRAITS) {
        const row = traitScoreRows.find((candidate) => candidate.trait === trait);
        traitScoreMap[trait] = {
          raw: row?.raw ?? 0,
          normalized: row?.normalized ?? 50,
          measured: row?.measured ?? false,
        };
      }
      const result = explainMatch(traitScoreMap, {
        id: detail.career.id,
        slug: detail.career.slug,
        traitWeights: detail.career.traitWeights as TraitDeltas,
      });
      explanation = { topPositive: [...result.topPositive], topGaps: [...result.topGaps] };
    }

    return {
      career: {
        slug: detail.career.slug,
        nameMn: detail.career.nameMn,
        categoryMn: detail.career.categoryMn,
        summaryMn: detail.career.summaryMn,
        dayInLifeMn: detail.career.dayInLifeMn,
        demandNow: detail.career.demandNow,
        demandFuture: detail.career.demandFuture,
        aiRisk: detail.career.aiRisk,
        aiRiskNoteMn: detail.career.aiRiskNoteMn,
        saturation: detail.career.saturation,
        gradsPerYear: detail.career.gradsPerYear,
        openingsPerYear: detail.career.openingsPerYear,
        salaryStartMnt: detail.career.salaryStartMnt,
        salaryMidMnt: detail.career.salaryMidMnt,
        yearsOfStudy: detail.career.yearsOfStudy,
        yearsToIndependence: detail.career.yearsToIndependence,
        requiredEeshSubjects: detail.career.requiredEeshSubjects,
        realityChecks: detail.career.realityChecks.map((item) => ({
          order: item.order,
          questionMn: item.questionMn,
          factMn: item.factMn,
        })),
        roadmapSteps: detail.career.roadmapSteps.map((step) => ({
          id: step.id,
          gradeLevel: step.gradeLevel,
          category: step.category,
          titleMn: step.titleMn,
          detailMn: step.detailMn,
          resourceUrl: step.resourceUrl,
          done: progress.get(step.id) ?? false,
        })),
      },
      match: match
        ? {
            score: match.score,
            band: bandFor(match.score),
            bandLabelMn: BAND_LABEL_MN[bandFor(match.score)],
            subScores: {
              ability: match.abilityScore,
              interest: match.interestScore,
              personality: match.personalityScore,
              value: match.valueScore,
            },
          }
        : null,
      explanation: {
        topPositive: explanation.topPositive.map((trait) => TRAIT_LABEL_MN[trait as keyof typeof TRAIT_LABEL_MN]),
        topGaps: explanation.topGaps.map((trait) => TRAIT_LABEL_MN[trait as keyof typeof TRAIT_LABEL_MN]),
      },
      adjacentCareers: detail.adjacentCareers,
      programs: detail.programs.map((program) => ({
        nameMn: program.nameMn,
        durationYears: program.durationYears,
        tuitionMnt: program.tuitionMnt,
        eeshThreshold: program.eeshThreshold,
        quotaNotes: program.quotaNotes,
        university: {
          nameMn: program.university.nameMn,
          country: program.university.country,
          city: program.university.city,
          website: program.university.website,
        },
      })),
      scholarships: detail.scholarships.map((scholarship) => ({
        nameMn: scholarship.nameMn,
        country: scholarship.country,
        provider: scholarship.provider,
        coverageMn: scholarship.coverageMn,
        deadlineMonth: scholarship.deadlineMonth,
        eligibilityMn: scholarship.eligibilityMn,
        url: scholarship.url,
      })),
    };
  },
});

export const toggleRoadmapStep = defineAction({
  name: "result.toggleRoadmapStep",
  input: z.object({ code: z.string().trim().length(6), roadmapStepId: z.string().min(1), done: z.boolean() }),
  handler: async (input) => {
    const sessionId = await resolveSessionId(input.code);
    if (sessionId === null) {
      throw new ActionFailure("NOT_FOUND", "Ийм код олдсонгүй, кодоо шалгаад дахин оруулаарай.");
    }

    await prisma.roadmapProgress.upsert({
      where: { sessionId_roadmapStepId: { sessionId, roadmapStepId: input.roadmapStepId } },
      create: { sessionId, roadmapStepId: input.roadmapStepId, done: input.done },
      update: { done: input.done },
    });

    return { ok: true as const };
  },
});
