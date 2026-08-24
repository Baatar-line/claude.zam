-- CreateEnum
CREATE TYPE "MbtiType" AS ENUM ('INTJ', 'INTP', 'ENTJ', 'ENTP', 'INFJ', 'INFP', 'ENFJ', 'ENFP', 'ISTJ', 'ISFJ', 'ESTJ', 'ESFJ', 'ISTP', 'ISFP', 'ESTP', 'ESFP');

-- AlterTable
ALTER TABLE "Session" ADD COLUMN "mbtiType" "MbtiType",
ADD COLUMN "iqScore" INTEGER;

-- AlterTable
ALTER TABLE "University" ADD COLUMN "country" TEXT NOT NULL DEFAULT 'Монгол';
