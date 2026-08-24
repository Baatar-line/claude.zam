import type { ComponentPropsWithoutRef } from "react";

export function Checkbox({
  label,
  className = "",
  ...props
}: { label: string } & Omit<ComponentPropsWithoutRef<"input">, "type">) {
  return (
    <label className={`flex cursor-pointer items-start gap-3 ${className}`}>
      <input
        type="checkbox"
        className="mt-1 h-5 w-5 shrink-0 accent-accent"
        {...props}
      />
      <span className={props.checked ? "text-ink-faint line-through" : "text-ink"}>{label}</span>
    </label>
  );
}
