import { type ReactNode } from "react";

import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  description,
  action,
  eyebrow,
  className,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  eyebrow?: string;
  className?: string;
}) {
  return (
    <div className={cn("mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div className="space-y-2">
        {eyebrow ? <p className="section-label text-amber">{eyebrow}</p> : null}
        <h1 className="font-display text-2xl tracking-tight text-balance sm:text-3xl">{title}</h1>
        {description ? (
          <p className="max-w-prose text-base leading-relaxed text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
