/**
 * Zod schemas for the test flow's server actions (§5.2), shared by the
 * client form and the server action boundary per lib/actions/define-action.
 */
import { z } from "zod";

export const entryPathSchema = z.enum(["EXPLORE", "VALIDATE"]);

export const startSessionSchema = z
  .object({
    gradeLevel: z.int().min(7).max(12),
    entryPath: entryPathSchema,
    chosenCareerSlug: z.string().min(1).optional(),
    region: z.string().trim().min(1).max(80).optional(),
  })
  .superRefine((value, ctx) => {
    if (value.entryPath === "VALIDATE" && value.chosenCareerSlug === undefined) {
      ctx.addIssue({
        code: "custom",
        path: ["chosenCareerSlug"],
        message: "Аль мэргэжлээ шалгуулахаа сонгоно уу.",
      });
    }
  });

/**
 * All three of optionId / rankOrder / sliderValue may be absent: a
 * TIMED_ABILITY item the countdown expired on is still saved, with no
 * option chosen, so it counts as attempted for block-coverage purposes
 * (§4 detectInvalid) rather than vanishing as if the student never saw it.
 */
export const saveAnswerSchema = z.object({
  questionId: z.string().min(1),
  optionId: z.string().min(1).optional(),
  rankOrder: z.array(z.int()).optional(),
  sliderValue: z.int().min(0).max(100).optional(),
  elapsedMs: z.int().min(0),
});

export const resumeCodeSchema = z.object({
  code: z.string().trim().length(6, "Код яг 6 тэмдэгттэй байх ёстой."),
});
