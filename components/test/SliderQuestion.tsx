"use client";

import { useState } from "react";

import type { ClientQuestion } from "@/lib/content/test-content";

export function SliderQuestion({
  question,
  onAnswer,
  disabled = false,
}: {
  question: ClientQuestion;
  onAnswer: (value: number) => void;
  disabled?: boolean;
}) {
  const sorted = [...question.options].sort((a, b) => a.order - b.order);
  const left = sorted[0];
  const right = sorted[1];
  const [value, setValue] = useState(50);

  if (!left || !right) return null;

  return (
    <div>
      {/* No numeric readout by design (§5.2): the scale is the two labels,
          not a percentage the student would over-think. */}
      <input
        type="range"
        min={0}
        max={100}
        value={value}
        disabled={disabled}
        onChange={(event) => setValue(Number(event.target.value))}
        className="w-full accent-accent"
        aria-label={question.promptMn}
      />
      <div className="mt-2 flex justify-between text-sm font-medium text-ink-soft">
        <span className="max-w-[45%]">{left.labelMn}</span>
        <span className="max-w-[45%] text-right">{right.labelMn}</span>
      </div>

      <button
        type="button"
        disabled={disabled}
        onClick={() => onAnswer(value)}
        className="mt-5 w-full rounded-xl bg-accent px-5 py-3 text-lg font-semibold text-accent-ink transition-colors hover:bg-accent-hover disabled:opacity-40"
      >
        Баталгаажуулах
      </button>
    </div>
  );
}
