import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium uppercase tracking-wider",
  {
    variants: {
      tone: {
        default: "bg-bg-subtle text-muted",
        paper: "bg-primary/12 text-primary",
        accent: "bg-accent/15 text-accent",
        hit: "bg-hit/15 text-hit",
        warn: "bg-warn/15 text-warn",
        ok: "bg-ok/15 text-ok",
      },
    },
    defaultVariants: { tone: "default" },
  },
);

export function Badge({
  className,
  tone,
  ...props
}: HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}
