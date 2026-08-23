-- CreateEnum
CREATE TYPE "EntryPath" AS ENUM ('EXPLORE', 'VALIDATE');

-- CreateEnum
CREATE TYPE "SessionVariant" AS ENUM ('JUNIOR', 'SENIOR');

-- CreateEnum
CREATE TYPE "QuestionVariant" AS ENUM ('JUNIOR', 'SENIOR', 'BOTH');

-- CreateEnum
CREATE TYPE "QuestionKind" AS ENUM ('SINGLE', 'RANK', 'SLIDER', 'TIMED_ABILITY', 'ATTENTION_CHECK');

-- CreateEnum
CREATE TYPE "Trait" AS ENUM ('LOGIC', 'SPATIAL', 'VERBAL', 'NUMERIC', 'MEMORY', 'PROCESSING', 'REALISTIC', 'INVESTIGATIVE', 'ARTISTIC', 'SOCIAL', 'ENTERPRISING', 'CONVENTIONAL', 'OPENNESS', 'CONSCIENTIOUSNESS', 'EXTRAVERSION', 'AGREEABLENESS', 'STABILITY', 'STABILITY_V', 'INCOME', 'CREATIVITY', 'HELPING', 'AUTONOMY', 'PRESTIGE');

-- CreateEnum
CREATE TYPE "DemandLevel" AS ENUM ('HIGH', 'MEDIUM', 'LOW');

-- CreateEnum
CREATE TYPE "AiRisk" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "Saturation" AS ENUM ('SATURATED', 'BALANCED', 'UNDERSUPPLIED');

-- CreateEnum
CREATE TYPE "RoadmapCategory" AS ENUM ('SUBJECT', 'SKILL', 'ACTIVITY', 'EXPERIENCE', 'RESOURCE');

-- CreateEnum
CREATE TYPE "InvalidityFlag" AS ENUM ('STRAIGHT_LINE', 'TOO_FAST', 'ATTENTION_FAILED', 'INCOMPLETE');

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "entryPath" "EntryPath" NOT NULL,
    "gradeLevel" INTEGER NOT NULL,
    "variant" "SessionVariant" NOT NULL,
    "resumeCodeHash" TEXT,
    "chosenCareerId" TEXT,
    "classId" TEXT,
    "completedAt" TIMESTAMP(3),
    "region" TEXT,
    "validityFlags" "InvalidityFlag"[],

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Question" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "blockId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "variant" "QuestionVariant" NOT NULL,
    "kind" "QuestionKind" NOT NULL,
    "promptMn" TEXT NOT NULL,
    "assetSvg" TEXT,
    "timeLimitSec" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestionOption" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "labelMn" TEXT NOT NULL,
    "assetSvg" TEXT,
    "traitDeltas" JSONB NOT NULL,
    "isCorrect" BOOLEAN,

    CONSTRAINT "QuestionOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Answer" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "optionId" TEXT,
    "rankOrder" INTEGER[],
    "sliderValue" INTEGER,
    "elapsedMs" INTEGER NOT NULL,
    "answeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Answer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TraitScore" (
    "sessionId" TEXT NOT NULL,
    "trait" "Trait" NOT NULL,
    "raw" INTEGER NOT NULL,
    "normalized" INTEGER NOT NULL,
    "percentile" INTEGER,

    CONSTRAINT "TraitScore_pkey" PRIMARY KEY ("sessionId","trait")
);

-- CreateTable
CREATE TABLE "CareerMatch" (
    "sessionId" TEXT NOT NULL,
    "careerId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "rank" INTEGER NOT NULL,
    "abilityScore" INTEGER NOT NULL,
    "interestScore" INTEGER NOT NULL,
    "personalityScore" INTEGER NOT NULL,
    "valueScore" INTEGER NOT NULL,
    "reasonTraits" "Trait"[],
    "narrativeMn" TEXT,
    "narrativeHash" TEXT,

    CONSTRAINT "CareerMatch_pkey" PRIMARY KEY ("sessionId","careerId")
);

-- CreateTable
CREATE TABLE "RoadmapProgress" (
    "sessionId" TEXT NOT NULL,
    "roadmapStepId" TEXT NOT NULL,
    "done" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RoadmapProgress_pkey" PRIMARY KEY ("sessionId","roadmapStepId")
);

-- CreateTable
CREATE TABLE "Career" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nameMn" TEXT NOT NULL,
    "categoryMn" TEXT NOT NULL,
    "summaryMn" TEXT NOT NULL,
    "dayInLifeMn" TEXT NOT NULL,
    "traitWeights" JSONB NOT NULL,
    "demandNow" "DemandLevel" NOT NULL,
    "demandFuture" "DemandLevel" NOT NULL,
    "aiRisk" "AiRisk" NOT NULL,
    "aiRiskNoteMn" TEXT NOT NULL,
    "saturation" "Saturation" NOT NULL,
    "gradsPerYear" INTEGER,
    "openingsPerYear" INTEGER,
    "salaryStartMnt" INTEGER NOT NULL,
    "salaryMidMnt" INTEGER NOT NULL,
    "yearsOfStudy" DOUBLE PRECISION NOT NULL,
    "yearsToIndependence" DOUBLE PRECISION,
    "requiredEeshSubjects" TEXT[],
    "adjacentCareerIds" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Career_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RealityCheck" (
    "id" TEXT NOT NULL,
    "careerId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "questionMn" TEXT NOT NULL,
    "factMn" TEXT NOT NULL,
    "weight" INTEGER NOT NULL,

    CONSTRAINT "RealityCheck_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "University" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "nameMn" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "isPublic" BOOLEAN NOT NULL,
    "website" TEXT,

    CONSTRAINT "University_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Program" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "universityId" TEXT NOT NULL,
    "careerIds" TEXT[],
    "nameMn" TEXT NOT NULL,
    "tuitionMnt" INTEGER,
    "eeshThreshold" INTEGER,
    "durationYears" DOUBLE PRECISION NOT NULL,
    "quotaNotes" TEXT,

    CONSTRAINT "Program_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Scholarship" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "nameMn" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "coverageMn" TEXT NOT NULL,
    "deadlineMonth" INTEGER NOT NULL,
    "eligibilityMn" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "careerIds" TEXT[],

    CONSTRAINT "Scholarship_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoadmapStep" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "careerId" TEXT NOT NULL,
    "gradeLevel" INTEGER NOT NULL,
    "category" "RoadmapCategory" NOT NULL,
    "titleMn" TEXT NOT NULL,
    "detailMn" TEXT NOT NULL,
    "resourceUrl" TEXT,

    CONSTRAINT "RoadmapStep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "School" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "nameMn" TEXT NOT NULL,
    "aimag" TEXT NOT NULL,
    "contactEmail" TEXT NOT NULL,

    CONSTRAINT "School_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Class" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "gradeLevel" INTEGER NOT NULL,
    "teacherName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "teacherCodeHash" TEXT,

    CONSTRAINT "Class_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Session_resumeCodeHash_key" ON "Session"("resumeCodeHash");

-- CreateIndex
CREATE INDEX "Session_classId_idx" ON "Session"("classId");

-- CreateIndex
CREATE INDEX "Session_completedAt_idx" ON "Session"("completedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Question_key_key" ON "Question"("key");

-- CreateIndex
CREATE INDEX "Question_blockId_order_idx" ON "Question"("blockId", "order");

-- CreateIndex
CREATE INDEX "Question_variant_isActive_idx" ON "Question"("variant", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "QuestionOption_questionId_order_key" ON "QuestionOption"("questionId", "order");

-- CreateIndex
CREATE INDEX "Answer_sessionId_idx" ON "Answer"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "Answer_sessionId_questionId_key" ON "Answer"("sessionId", "questionId");

-- CreateIndex
CREATE INDEX "CareerMatch_sessionId_rank_idx" ON "CareerMatch"("sessionId", "rank");

-- CreateIndex
CREATE UNIQUE INDEX "Career_slug_key" ON "Career"("slug");

-- CreateIndex
CREATE INDEX "Career_isActive_idx" ON "Career"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "RealityCheck_careerId_order_key" ON "RealityCheck"("careerId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "University_key_key" ON "University"("key");

-- CreateIndex
CREATE UNIQUE INDEX "Program_key_key" ON "Program"("key");

-- CreateIndex
CREATE INDEX "Program_universityId_idx" ON "Program"("universityId");

-- CreateIndex
CREATE UNIQUE INDEX "Scholarship_key_key" ON "Scholarship"("key");

-- CreateIndex
CREATE UNIQUE INDEX "RoadmapStep_key_key" ON "RoadmapStep"("key");

-- CreateIndex
CREATE INDEX "RoadmapStep_careerId_gradeLevel_idx" ON "RoadmapStep"("careerId", "gradeLevel");

-- CreateIndex
CREATE UNIQUE INDEX "School_key_key" ON "School"("key");

-- CreateIndex
CREATE UNIQUE INDEX "Class_code_key" ON "Class"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Class_teacherCodeHash_key" ON "Class"("teacherCodeHash");

-- CreateIndex
CREATE INDEX "Class_schoolId_idx" ON "Class"("schoolId");

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_chosenCareerId_fkey" FOREIGN KEY ("chosenCareerId") REFERENCES "Career"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionOption" ADD CONSTRAINT "QuestionOption_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Answer" ADD CONSTRAINT "Answer_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Answer" ADD CONSTRAINT "Answer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Answer" ADD CONSTRAINT "Answer_optionId_fkey" FOREIGN KEY ("optionId") REFERENCES "QuestionOption"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TraitScore" ADD CONSTRAINT "TraitScore_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CareerMatch" ADD CONSTRAINT "CareerMatch_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CareerMatch" ADD CONSTRAINT "CareerMatch_careerId_fkey" FOREIGN KEY ("careerId") REFERENCES "Career"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoadmapProgress" ADD CONSTRAINT "RoadmapProgress_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoadmapProgress" ADD CONSTRAINT "RoadmapProgress_roadmapStepId_fkey" FOREIGN KEY ("roadmapStepId") REFERENCES "RoadmapStep"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RealityCheck" ADD CONSTRAINT "RealityCheck_careerId_fkey" FOREIGN KEY ("careerId") REFERENCES "Career"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Program" ADD CONSTRAINT "Program_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "University"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoadmapStep" ADD CONSTRAINT "RoadmapStep_careerId_fkey" FOREIGN KEY ("careerId") REFERENCES "Career"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Class" ADD CONSTRAINT "Class_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;
