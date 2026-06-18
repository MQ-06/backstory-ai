import { type LucideIcon } from "lucide-react";
import { type ReactNode } from "react";

import { cn } from "@/lib/utils";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-dashed border-border/80 bg-receipt/50 px-6 py-12 text-center shadow-soft",
        className,
      )}
    >
      <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-xl bg-amber/12 text-amber">
        <Icon className="size-6" />
      </div>
      <h3 className="font-display text-lg tracking-tight">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">{description}</p>
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
