import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { type ReactNode } from "react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function AuthPanel({
  children,
  title = "Welcome back",
  description = "Sign in to your engagements and memory layer.",
}: {
  children: ReactNode;
  title?: string;
  description?: string;
}) {
  return (
    <div className="marketing relative flex min-h-screen flex-col bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0 bg-mesh-olive" aria-hidden />
      <div className="marketing-blob marketing-blob-1 opacity-70" aria-hidden />
      <div className="marketing-blob marketing-blob-3 opacity-50" aria-hidden />
      <div className="pointer-events-none absolute inset-0 bg-grid-fine opacity-30" aria-hidden />

      <header className="relative z-10 flex items-center justify-between px-6 py-5">
        <Link href="/" className="group flex items-center gap-3.5">
          <span
            className={cn(
              "marketing-logo-float marketing-logo-mark flex size-[3.25rem] items-center justify-center rounded-2xl",
              "text-2xl font-bold text-white",
            )}
          >
            B
          </span>
          <span className="text-[1.35rem] font-bold tracking-tight text-foreground">
            Backstory
          </span>
        </Link>
        <Link href="/" className={buttonVariants({ variant: "ghost", size: "sm" })}>
          <ArrowLeft className="size-3.5" />
          Back to home
        </Link>
      </header>

      <div className="relative z-10 flex flex-1 items-center justify-center px-6 pb-12">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
            <p className="mt-2 text-sm text-muted-foreground">{description}</p>
          </div>
          <div className="marketing-glass-card rounded-2xl p-1">
            <div className="rounded-xl bg-white/90 p-4 dark:bg-black/30">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
