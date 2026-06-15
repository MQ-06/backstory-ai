import { cn } from "@/lib/utils";
import { type HTMLAttributes } from "react";

type BadgeVariant = "default" | "secondary" | "outline";

const variants: Record<BadgeVariant, string> = {
  default: "bg-primary/10 text-primary border-transparent",
  secondary: "bg-muted text-muted-foreground border-transparent",
  outline: "text-muted-foreground border-border",
};

export function Badge({
  className,
  variant = "default",
  ...props
}: HTMLAttributes<HTMLSpanElement> & { variant?: BadgeVariant }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
