import type { ComponentPropsWithoutRef } from "react";

/** Caps line length for reading, with the page gutter baked in. */
export function Container({ className = "", ...props }: ComponentPropsWithoutRef<"div">) {
  return <div className={`mx-auto w-full max-w-3xl px-5 ${className}`} {...props} />;
}
