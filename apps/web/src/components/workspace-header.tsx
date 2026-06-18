import { type ReactNode } from "react";

import { cn } from "@/lib/utils";

export function WorkspaceHeader({
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
    <header
      className={cn(
        "mb-8 flex flex-col gap-4 border-b border-border/70 pb-6 sm:flex-row sm:items-end sm:justify-between",
        className,
      )}
    >
      <div className="space-y-2">
        {eyebrow ? (
          <p className="section-label text-amber">{eyebrow}</p>
        ) : null}
        <h1 className="font-display text-3xl tracking-tight text-balance sm:text-[2rem]">{title}</h1>
        {description ? (
          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-[0.9375rem]">
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
  );
}
