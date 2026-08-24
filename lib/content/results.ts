/**
 * Read layer for the result flow (§5.3-§5.5).
 */
import "server-only";

import { prisma } from "@/lib/db/client";
import { hashResumeCode } from "@/lib/session/crypto";

export async function findSessionByResumeCode(code: string) {
  return prisma.session.findUnique({
    where: { resumeCodeHash: hashResumeCode(code) },
    include: {
      traitScores: true,
      chosenCareer: { select: { id: true, slug: true, nameMn: true } },
      careerMatches: {
        orderBy: { rank: "asc" },
        include: {
          career: {
            select: { id: true, slug: true, nameMn: true, categoryMn: true, summaryMn: true },
          },
        },
      },
    },
  });
}

export async function getCareerDetail(slug: string) {
  const career = await prisma.career.findUnique({
    where: { slug },
    include: {
      realityChecks: { orderBy: { order: "asc" } },
      roadmapSteps: { orderBy: [{ gradeLevel: "asc" }, { category: "asc" }] },
    },
  });
  if (!career) return null;

  const [adjacentCareers, programs, scholarships] = await Promise.all([
    career.adjacentCareerIds.length > 0
      ? prisma.career.findMany({
          where: { id: { in: career.adjacentCareerIds }, isActive: true },
          select: { slug: true, nameMn: true, categoryMn: true },
        })
      : Promise.resolve([]),
    prisma.program.findMany({
      where: { careerIds: { has: career.id } },
      include: { university: true },
      orderBy: { nameMn: "asc" },
    }),
    prisma.scholarship.findMany({
      where: { careerIds: { has: career.id } },
      orderBy: { nameMn: "asc" },
    }),
  ]);

  return { career, adjacentCareers, programs, scholarships };
}

export async function getRoadmapProgress(sessionId: string, careerId: string) {
  const rows = await prisma.roadmapProgress.findMany({
    where: { sessionId, roadmapStep: { careerId } },
    select: { roadmapStepId: true, done: true },
  });
  return new Map(rows.map((row) => [row.roadmapStepId, row.done]));
}
