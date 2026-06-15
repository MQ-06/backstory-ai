import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { type ReactNode } from "react";

import { buttonVariants } from "@/components/ui/button";

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
    <div className="relative flex min-h-screen flex-col bg-background">
      <div className="pointer-events-none absolute inset-0 bg-hero-glow" aria-hidden />
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-30" aria-hidden />

      <header className="relative z-10 flex items-center justify-between px-6 py-5">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
            B
          </span>
          <span className="font-display text-lg font-semibold tracking-tight">Backstory</span>
        </Link>
        <Link href="/" className={buttonVariants({ variant: "ghost", size: "sm" })}>
          <ArrowLeft className="size-3.5" />
          Back to home
        </Link>
      </header>

      <div className="relative z-10 flex flex-1 items-center justify-center px-6 pb-12">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <h1 className="font-display text-2xl font-semibold tracking-tight">{title}</h1>
            <p className="mt-2 text-sm text-muted-foreground">{description}</p>
          </div>
          <div className="rounded-2xl border border-border/80 bg-card/80 p-1 shadow-xl shadow-primary/5 backdrop-blur-sm">
            <div className="rounded-xl bg-background p-4">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
