"use client";

import { useState } from "react";

import type { ClientQuestion } from "@/lib/content/test-content";

/**
 * Tap-to-rank rather than drag-and-drop (§5.2): HTML5 drag is unreliable on
 * the phone screens this ships to. Tapping in preference order, with tap-to-
 * remove for a mis-click, needs no pointer precision.
 */
export function RankQuestion({
  question,
  onAnswer,
  disabled = false,
}: {
  question: ClientQuestion;
  onAnswer: (rankOrder: number[]) => void;
  disabled?: boolean;
}) {
  const [ranked, setRanked] = useState<string[]>([]);

  const remaining = question.options.filter((option) => !ranked.includes(option.id));
  const isComplete = remaining.length === 0;

  const rankOf = (optionId: string): number => ranked.indexOf(optionId) + 1;

  return (
    <div>
      <ol className="mb-4 grid gap-2">
        {ranked.map((optionId) => {
          const option = question.options.find((candidate) => candidate.id === optionId);
          if (!option) return null;
          return (
            <li key={optionId}>
              <button
                type="button"
                disabled={disabled}
                onClick={() => setRanked((prev) => prev.filter((id) => id !== optionId))}
                className="flex w-full items-center gap-3 rounded-xl border border-accent bg-accent-soft px-5 py-3 text-left text-ink"
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-bold text-accent-ink">
                  {rankOf(optionId)}
                </span>
                <span className="flex-1">{option.labelMn}</span>
              </button>
            </li>
          );
        })}
      </ol>

      {remaining.length > 0 && (
        <div className="grid gap-2">
          {remaining.map((option) => (
            <button
              key={option.id}
              type="button"
              disabled={disabled}
              onClick={() => setRanked((prev) => [...prev, option.id])}
              className="rounded-xl border border-line bg-paper-raised px-5 py-4 text-left text-lg text-ink transition-colors hover:border-accent hover:bg-accent-soft disabled:opacity-50"
            >
              {option.labelMn}
            </button>
          ))}
        </div>
      )}

      <button
        type="button"
        disabled={disabled || !isComplete}
        onClick={() => onAnswer(ranked.map((id) => question.options.find((o) => o.id === id)?.order ?? 0))}
        className="mt-5 w-full rounded-xl bg-accent px-5 py-3 text-lg font-semibold text-accent-ink transition-colors hover:bg-accent-hover disabled:opacity-40"
      >
        Баталгаажуулах
      </button>
    </div>
  );
}
