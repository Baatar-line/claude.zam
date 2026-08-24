import { z } from "zod";

import { IQ_SCORE_MAX, IQ_SCORE_MIN, MBTI_TYPES } from "@/lib/content/supplementary";

export const mbtiTypeSchema = z.enum(MBTI_TYPES);

/** Both fields optional and independent: a student may know one, both, or
 *  neither, and may clear a field they entered by mistake. */
export const updateSupplementarySchema = z.object({
  code: z.string().trim().length(6),
  mbtiType: mbtiTypeSchema.nullable().optional(),
  iqScore: z.int().min(IQ_SCORE_MIN).max(IQ_SCORE_MAX).nullable().optional(),
});
