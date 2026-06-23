import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { type ReactNode } from "react";

import { buttonVariants } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";

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
      <header className="relative z-10 flex items-center justify-between gap-4 px-6 py-5">
        <Link href="/" className="group flex items-center gap-3">
          <span className="brand-mark size-10 rounded-lg text-xl">B</span>
          <span className="font-display text-xl text-foreground">Backstory</span>
        </Link>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link href="/" className={buttonVariants({ variant: "ghost", size: "sm" })}>
            <ArrowLeft className="size-3.5" />
            Back to home
          </Link>
        </div>
      </header>

      <div className="relative z-10 flex flex-1 items-center justify-center px-6 pb-12">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <h1 className="font-display text-2xl tracking-tight">{title}</h1>
            <p className="mt-2 text-sm text-muted-foreground">{description}</p>
          </div>
          <div className="rounded-2xl border border-border/80 bg-receipt p-6 shadow-card">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
