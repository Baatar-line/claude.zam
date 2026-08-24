"use server";

/**
 * Server actions for the test flow (§5.2). Every mutation goes through
 * defineAction (§2 HARD RULE 5); see lib/actions/define-action.ts.
 */
import { z } from "zod";

import { getClientIp } from "@/lib/actions/client-ip";
import { ActionFailure, defineAction } from "@/lib/actions";
import { RATE_LIMITS } from "@/lib/actions/rate-limit";
import { getScoringCareers, getScoringQuestions, getTestContent } from "@/lib/content/test-content";
import { prisma } from "@/lib/db/client";
import { ALL_TRAITS } from "@/lib/scoring/traits";
import { detectInvalid, matchCareers, scoreTraits } from "@/lib/scoring";
import type { ScoringAnswer } from "@/lib/scoring/types";
import { clearSessionCookie, getSessionIdFromCookie, setSessionCookie } from "@/lib/session/cookie";
import { generateResumeCode, hashResumeCode } from "@/lib/session/crypto";
import {
  resumeCodeSchema,
  saveAnswerSchema,
  startSessionSchema,
} from "@/lib/validation/session";

function gradeToVariant(gradeLevel: number): "JUNIOR" | "SENIOR" {
  return gradeLevel <= 9 ? "JUNIOR" : "SENIOR";
}

export const startSession = defineAction({
  name: "test.startSession",
  input: startSessionSchema,
  handler: async (input) => {
    let chosenCareerId: string | null = null;

    if (input.entryPath === "VALIDATE") {
      const career = await prisma.career.findUnique({
        where: { slug: input.chosenCareerSlug },
      });
      if (!career) {
        throw new ActionFailure("INVALID_INPUT", "Сонгосон мэргэжил олдсонгүй, дахин сонгоно уу.", {
          chosenCareerSlug: ["Сонгосон мэргэжил олдсонгүй."],
        });
      }
      chosenCareerId = career.id;
    }

    const code = generateResumeCode();

    const session = await prisma.session.create({
      data: {
        entryPath: input.entryPath,
        gradeLevel: input.gradeLevel,
        variant: gradeToVariant(input.gradeLevel),
        chosenCareerId,
        region: input.region ?? null,
        resumeCodeHash: hashResumeCode(code),
      },
    });

    await setSessionCookie(session.id);

    return { resumeCode: code };
  },
});

export const loadTestContent = defineAction({
  name: "test.loadTestContent",
  input: z.object({}),
  handler: async () => {
    const sessionId = await getSessionIdFromCookie();
    if (sessionId === null) {
      throw new ActionFailure("FORBIDDEN", "Шалгалт олдсонгүй, шинээр эхлүүлнэ үү.");
    }

    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      select: { variant: true },
    });
    if (!session) {
      throw new ActionFailure("NOT_FOUND", "Шалгалт олдсонгүй, шинээр эхлүүлнэ үү.");
    }

    return getTestContent(session.variant);
  },
});

export const saveAnswer = defineAction({
  name: "test.saveAnswer",
  input: saveAnswerSchema,
  handler: async (input) => {
    const sessionId = await getSessionIdFromCookie();
    if (sessionId === null) {
      throw new ActionFailure("FORBIDDEN", "Шалгалт олдсонгүй, шинээр эхлүүлнэ үү.");
    }

    await prisma.answer.upsert({
      where: { sessionId_questionId: { sessionId, questionId: input.questionId } },
      create: {
        sessionId,
        questionId: input.questionId,
        optionId: input.optionId ?? null,
        rankOrder: input.rankOrder ?? [],
        sliderValue: input.sliderValue ?? null,
        elapsedMs: input.elapsedMs,
      },
      update: {
        optionId: input.optionId ?? null,
        rankOrder: input.rankOrder ?? [],
        sliderValue: input.sliderValue ?? null,
        elapsedMs: input.elapsedMs,
      },
    });

    return { ok: true as const };
  },
});

export const completeSession = defineAction({
  name: "test.completeSession",
  input: z.object({}),
  handler: async () => {
    const sessionId = await getSessionIdFromCookie();
    if (sessionId === null) {
      throw new ActionFailure("FORBIDDEN", "Шалгалт олдсонгүй, шинээр эхлүүлнэ үү.");
    }

    const session = await prisma.session.findUnique({ where: { id: sessionId } });
    if (!session) {
      throw new ActionFailure("NOT_FOUND", "Шалгалт олдсонгүй, шинээр эхлүүлнэ үү.");
    }

    const [answerRows, questions, careers] = await Promise.all([
      prisma.answer.findMany({ where: { sessionId } }),
      getScoringQuestions(session.variant),
      getScoringCareers(),
    ]);

    const answers: ScoringAnswer[] = answerRows.map((row) => ({
      questionId: row.questionId,
      optionId: row.optionId,
      rankOrder: row.rankOrder,
      sliderValue: row.sliderValue,
      elapsedMs: row.elapsedMs,
    }));

    const traitScores = scoreTraits(answers, questions);
    const matches = matchCareers(traitScores, careers);
    const validityFlags = detectInvalid(answers, questions);

    await prisma.$transaction(async (tx) => {
      for (const trait of ALL_TRAITS) {
        const value = traitScores[trait];
        await tx.traitScore.upsert({
          where: { sessionId_trait: { sessionId, trait } },
          create: {
            sessionId,
            trait,
            raw: Math.round(value.raw),
            normalized: value.normalized,
            percentile: null,
          },
          update: { raw: Math.round(value.raw), normalized: value.normalized },
        });
      }

      for (const match of matches) {
        await tx.careerMatch.upsert({
          where: { sessionId_careerId: { sessionId, careerId: match.careerId } },
          create: {
            sessionId,
            careerId: match.careerId,
            score: match.score,
            rank: match.rank,
            abilityScore: match.subScores.ability,
            interestScore: match.subScores.interest,
            personalityScore: match.subScores.personality,
            valueScore: match.subScores.value,
            reasonTraits: [...match.reasonTraits],
          },
          update: {
            score: match.score,
            rank: match.rank,
            abilityScore: match.subScores.ability,
            interestScore: match.subScores.interest,
            personalityScore: match.subScores.personality,
            valueScore: match.subScores.value,
            reasonTraits: [...match.reasonTraits],
          },
        });
      }

      await tx.session.update({
        where: { id: sessionId },
        data: { completedAt: new Date(), validityFlags },
      });
    });

    return { ok: true as const };
  },
});

export const resumeByCode = defineAction({
  name: "test.resumeByCode",
  input: resumeCodeSchema,
  rateLimit: {
    ...RATE_LIMITS.RESUME_CODE,
    key: async () => `ip:${await getClientIp()}`,
  },
  handler: async (input) => {
    const session = await prisma.session.findUnique({
      where: { resumeCodeHash: hashResumeCode(input.code) },
    });

    if (!session) {
      throw new ActionFailure("NOT_FOUND", "Ийм код олдсонгүй, кодоо шалгаад дахин оруулаарай.");
    }

    await setSessionCookie(session.id);

    if (session.completedAt !== null) {
      return { completed: true as const, answeredQuestionIds: [] as string[] };
    }

    const answered = await prisma.answer.findMany({
      where: { sessionId: session.id },
      select: { questionId: true },
    });

    return {
      completed: false as const,
      answeredQuestionIds: answered.map((row) => row.questionId),
    };
  },
});

export const abandonSession = defineAction({
  name: "test.abandonSession",
  input: z.object({}),
  handler: async () => {
    await clearSessionCookie();
    return { ok: true as const };
  },
});
