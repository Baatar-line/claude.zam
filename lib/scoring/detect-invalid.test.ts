import { describe, expect, it } from "vitest";

import { detectInvalid } from "./detect-invalid";
import { FIXTURE_QUESTIONS, GOLDEN_ANSWERS } from "./fixtures";
import type { ScoringAnswer } from "./types";

/** Answers every question by picking the option at the given position. */
function answerAllAt(position: number, elapsedMs = 6_000): ScoringAnswer[] {
  return FIXTURE_QUESTIONS.map((question) => {
    if (question.kind === "SLIDER") {
      return { questionId: question.id, sliderValue: 50, elapsedMs };
    }
    if (question.kind === "RANK") {
      return {
        questionId: question.id,
        rankOrder: question.options.map((option) => option.order),
        elapsedMs,
      };
    }
    const option = question.options[Math.min(position, question.options.length - 1)];
    return { questionId: question.id, optionId: option?.id ?? null, elapsedMs };
  });
}

describe("detectInvalid", () => {
  it("returns no flags for the golden answer set", () => {
    expect(detectInvalid(GOLDEN_ANSWERS, FIXTURE_QUESTIONS)).toEqual([]);
  });

  it("flags STRAIGHT_LINE when the same option position repeats", () => {
    const flags = detectInvalid(answerAllAt(0), FIXTURE_QUESTIONS);
    expect(flags).toContain("STRAIGHT_LINE");
  });

  it("returns INCOMPLETE for an empty answer set without throwing", () => {
    expect(() => detectInvalid([], FIXTURE_QUESTIONS)).not.toThrow();
    expect(detectInvalid([], FIXTURE_QUESTIONS)).toEqual(["INCOMPLETE"]);
    expect(detectInvalid([], [])).toEqual(["INCOMPLETE"]);
  });

  it("flags TOO_FAST when a block's median answer time is under 1.2s", () => {
    const flags = detectInvalid(answerAllAt(1, 400), FIXTURE_QUESTIONS);
    expect(flags).toContain("TOO_FAST");
  });

  it("does not flag TOO_FAST on a block with too few answers to judge", () => {
    const flags = detectInvalid(
      [
        { questionId: "ab1", optionId: "ab1.o1", elapsedMs: 200 },
        { questionId: "ab2", optionId: "ab2.o0", elapsedMs: 200 },
      ],
      FIXTURE_QUESTIONS,
    );
    expect(flags).not.toContain("TOO_FAST");
  });

  it("flags ATTENTION_FAILED only after two failed checks", () => {
    const base = GOLDEN_ANSWERS.filter(
      (answer) => answer.questionId !== "pe4" && answer.questionId !== "va3",
    );

    const oneFailed = detectInvalid(
      [
        ...base,
        { questionId: "pe4", optionId: "pe4.o0", elapsedMs: 3_000 },
        { questionId: "va3", optionId: "va3.o1", elapsedMs: 3_000 },
      ],
      FIXTURE_QUESTIONS,
    );
    expect(oneFailed).not.toContain("ATTENTION_FAILED");

    const twoFailed = detectInvalid(
      [
        ...base,
        { questionId: "pe4", optionId: "pe4.o0", elapsedMs: 3_000 },
        { questionId: "va3", optionId: "va3.o0", elapsedMs: 3_000 },
      ],
      FIXTURE_QUESTIONS,
    );
    expect(twoFailed).toContain("ATTENTION_FAILED");
  });

  it("flags INCOMPLETE when a block falls under 80 percent coverage", () => {
    const partial = GOLDEN_ANSWERS.filter(
      (answer) => !["in1", "in2", "in3"].includes(answer.questionId),
    );
    expect(detectInvalid(partial, FIXTURE_QUESTIONS)).toContain("INCOMPLETE");
  });

  it("returns flags in a fixed order", () => {
    const flags = detectInvalid(answerAllAt(0, 300), FIXTURE_QUESTIONS);
    const expectedOrder = ["STRAIGHT_LINE", "TOO_FAST", "ATTENTION_FAILED", "INCOMPLETE"];
    const positions = flags.map((flag) => expectedOrder.indexOf(flag));
    expect(positions).toEqual([...positions].sort((a, b) => a - b));
  });
});
