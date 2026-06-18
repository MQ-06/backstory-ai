import { cn } from "@/lib/utils";

type StatusDotProps = {
  status?: "ready" | "partial" | "empty" | "loading";
  className?: string;
  label?: string;
};

const STATUS_CLASS = {
  ready: "bg-proof",
  partial: "bg-amber",
  empty: "bg-muted-foreground/40",
  loading: "bg-amber animate-pulse",
} as const;

export function StatusDot({ status = "empty", className, label }: StatusDotProps) {
  return (
    <span
      className={cn("inline-flex size-2 shrink-0 rounded-full", STATUS_CLASS[status], className)}
      role="status"
      aria-label={label ?? status}
    />
  );
}
