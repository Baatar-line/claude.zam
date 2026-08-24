import Link from "next/link";
import type { ComponentPropsWithoutRef } from "react";

/**
 * The one interactive control every screen shares (§1). A anchor tag when
 * `href` is set, a real <button> otherwise, sharing one visual language so a
 * student cannot tell navigation and submission apart by looking.
 */
const VARIANT = {
  primary: "bg-accent text-accent-ink hover:bg-accent-hover",
  secondary: "bg-paper-raised text-ink border border-line hover:border-ink-faint",
  ghost: "text-ink hover:bg-line-soft",
} as const;

const SIZE = {
  md: "px-5 py-3 text-base",
  lg: "px-7 py-4 text-lg",
} as const;

type Variant = keyof typeof VARIANT;
type Size = keyof typeof SIZE;

const BASE =
  "inline-flex items-center justify-center gap-2 rounded-xl font-semibold " +
  "transition-colors disabled:opacity-50 disabled:pointer-events-none";

type CommonProps = {
  variant?: Variant;
  size?: Size;
  className?: string;
};

type ButtonAsButton = CommonProps &
  ComponentPropsWithoutRef<"button"> & { href?: undefined };

type ButtonAsLink = CommonProps &
  ComponentPropsWithoutRef<typeof Link> & { href: string };

export type ButtonProps = ButtonAsButton | ButtonAsLink;

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  ...props
}: ButtonProps) {
  const classes = `${BASE} ${VARIANT[variant]} ${SIZE[size]} ${className}`;

  if (props.href !== undefined) {
    const { href, ...rest } = props;
    return <Link href={href} className={classes} {...rest} />;
  }

  const { type = "button", ...rest } = props;
  return <button type={type} className={classes} {...rest} />;
}
