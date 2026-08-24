import type { ComponentPropsWithoutRef } from "react";

const VARIANT = {
  neutral: "border-line bg-line-soft text-ink-soft",
  accent: "border-accent bg-accent-soft text-ink",
} as const;

export function Callout({
  variant = "neutral",
  className = "",
  ...props
}: { variant?: keyof typeof VARIANT } & ComponentPropsWithoutRef<"div">) {
  return (
    <div
      className={`rounded-xl border px-4 py-3 text-sm ${VARIANT[variant]} ${className}`}
      {...props}
    />
  );
}
