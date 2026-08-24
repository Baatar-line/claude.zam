import type { ComponentPropsWithoutRef } from "react";

export function Card({ className = "", ...props }: ComponentPropsWithoutRef<"div">) {
  return (
    <div
      className={`rounded-2xl border border-line bg-paper-raised p-6 ${className}`}
      {...props}
    />
  );
}
