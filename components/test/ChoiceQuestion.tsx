"use client";

import { useEffect, useRef, useState } from "react";

import type { ClientQuestion } from "@/lib/content/test-content";

/**
 * Renders SINGLE, ATTENTION_CHECK and TIMED_ABILITY alike (§5.2): an
 * attention check must look identical to a plain question, and a timed
 * ability item is the same option list plus a countdown. Only the presence
 * of `question.timeLimitSec` turns the countdown on.
 */
export function ChoiceQuestion({
  question,
  onAnswer,
  onTimeout,
  disabled = false,
}: {
  question: ClientQuestion;
  onAnswer: (optionId: string) => void;
  onTimeout: () => void;
  disabled?: boolean;
}) {
  const limitSec = question.timeLimitSec;
  const [remaining, setRemaining] = useState(limitSec ?? 0);
  const timedOut = useRef(false);

  useEffect(() => {
    timedOut.current = false;
    if (limitSec === null || limitSec === undefined) return;

    setRemaining(limitSec);
    const startedAt = Date.now();
    const interval = setInterval(() => {
      const left = Math.max(0, limitSec - (Date.now() - startedAt) / 1000);
      setRemaining(left);
      if (left <= 0 && !timedOut.current) {
        timedOut.current = true;
        clearInterval(interval);
        onTimeout();
      }
    }, 100);

    return () => clearInterval(interval);
    // Re-arm the timer whenever a new question mounts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question.id]);

  return (
    <div>
      {limitSec !== null && limitSec !== undefined && (
        <div className="mb-4 h-1.5 w-full overflow-hidden rounded-full bg-line-soft">
          <div
            className="h-full rounded-full bg-accent transition-[width] duration-100 linear"
            style={{ width: `${(remaining / limitSec) * 100}%` }}
          />
        </div>
      )}

      <fieldset className="grid gap-3" disabled={disabled}>
        <legend className="sr-only">{question.promptMn}</legend>
        {question.options.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => onAnswer(option.id)}
            disabled={disabled}
            className="rounded-xl border border-line bg-paper-raised px-5 py-4 text-left text-lg text-ink transition-colors hover:border-accent hover:bg-accent-soft disabled:opacity-50"
          >
            {option.labelMn}
          </button>
        ))}
      </fieldset>
    </div>
  );
}
