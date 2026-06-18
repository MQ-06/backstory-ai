import { cn } from "@/lib/utils";

type HorizonKind = "past" | "leaving" | "deliver";

const HORIZON_CLASS: Record<HorizonKind, string> = {
  past: "bg-horizon-past/15 text-horizon-past border-horizon-past/25",
  leaving: "bg-horizon-leaving/15 text-horizon-leaving border-horizon-leaving/25",
  deliver: "bg-horizon-deliver/15 text-horizon-deliver border-horizon-deliver/25",
};

export function HorizonBadge({
  kind,
  children,
  className,
}: {
  kind: HorizonKind;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide",
        HORIZON_CLASS[kind],
        className,
      )}
    >
      {children}
    </span>
  );
}
