import type { ComponentPropsWithoutRef } from "react";

const VARIANT = {
  neutral: "bg-line-soft text-ink-soft",
  accent: "bg-accent-soft text-accent-hover",
  strong: "bg-band-strong-soft text-band-strong",
  partial: "bg-band-partial-soft text-band-partial",
  divergent: "bg-band-divergent-soft text-band-divergent",
} as const;

export function Badge({
  variant = "neutral",
  className = "",
  ...props
}: { variant?: keyof typeof VARIANT } & ComponentPropsWithoutRef<"span">) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${VARIANT[variant]} ${className}`}
      {...props}
    />
  );
}
