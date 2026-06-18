"use client";

import {
  ArrowRight,
  BookOpen,
  Link2,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import Link from "next/link";

import { HowStepper } from "@/components/marketing/how-stepper";
import { LiveDemo } from "@/components/marketing/live-demo";
import { ScrollReveal } from "@/components/marketing/scroll-reveal";
import { TickerBand } from "@/components/marketing/ticker-band";
import { TrustStats } from "@/components/marketing/trust-stats";
import { MarketingNav } from "@/components/marketing-nav";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const FEATURES = [
  {
    icon: Sparkles,
    title: "Answer Receipts",
    description:
      "Every sentence links to proof — a line of code, a ticket, a doc section, or a timestamp in an interview.",
    className: "md:col-span-2",
    featured: true,
  },
  {
    icon: ShieldCheck,
    title: "Honest refusal",
    description: "No evidence? Backstory says so. Trust is not configurable away.",
    className: "md:col-span-1",
    featured: false,
  },
  {
    icon: BookOpen,
    title: "Expert capture",
    description: "Code-aware interviews preserve the why before your experts leave.",
    className: "md:col-span-1",
    featured: false,
  },
  {
    icon: Link2,
    title: "Linked memory",
    description: "Git, tickets, and docs indexed per engagement — one tenant boundary, zero cross-leakage.",
    className: "md:col-span-2",
    featured: false,
  },
] as const;

export function MarketingPage() {
  return (
    <div className="marketing relative min-h-screen overflow-hidden bg-background text-foreground">
      <MarketingNav />

      <main className="relative pt-16">
        <section id="demo" className="mx-auto max-w-6xl px-6 pb-16 pt-16 md:pt-24">
          <div className="grid items-center gap-14 lg:grid-cols-2 lg:gap-16">
            <ScrollReveal className="relative">
              <span className="stamp-badge stamp-badge--amber mb-6">
                Memory layer for legacy systems
              </span>
              <h1 className="font-display text-[2.75rem] leading-[1.08] tracking-tight text-balance sm:text-5xl lg:text-[3.5rem]">
                Code tells you what.{" "}
                <span className="text-amber">Backstory</span> remembers why.
              </h1>
              <p className="mt-6 max-w-lg text-lg leading-relaxed text-muted-foreground">
                Cited answers from decades of commits, tickets, and departing experts — with{" "}
                <strong className="font-semibold text-foreground">receipts you can click</strong>, not vibes
                you have to trust.
              </p>
              <div className="mt-10 flex flex-wrap items-center gap-3">
                <Link
                  href="/sign-up"
                  className={cn(
                    buttonVariants({ size: "lg" }),
                    "h-12 bg-ink px-8 text-base font-semibold text-receipt hover:bg-ink/90",
                  )}
                >
                  Start free
                  <ArrowRight className="size-4" />
                </Link>
                <Link
                  href="/sign-in"
                  className={cn(
                    buttonVariants({ size: "lg", variant: "outline" }),
                    "h-12 border-border bg-receipt px-8 text-base font-semibold hover:border-amber/40 hover:bg-amber/5",
                  )}
                >
                  Log in
                </Link>
              </div>
              <p className="mt-7 text-xs font-medium text-muted-foreground">
                — Try the demo — pick a scenario on the right
              </p>
            </ScrollReveal>

            <ScrollReveal delay={120}>
              <LiveDemo />
            </ScrollReveal>
          </div>
        </section>

        <TickerBand />

        <section id="product" className="border-t border-border/70 py-28">
          <div className="mx-auto max-w-6xl px-6">
            <ScrollReveal>
              <div className="mb-14 max-w-2xl">
                <h2 className="font-display text-3xl tracking-tight sm:text-4xl">
                  Not another chatbot on your repo.
                </h2>
                <p className="mt-4 text-lg text-muted-foreground">
                  A serious instrument for teams who cannot afford wrong answers in production.
                </p>
              </div>
            </ScrollReveal>
            <div className="grid gap-5 md:grid-cols-3">
              {FEATURES.map((f, index) => (
                <ScrollReveal
                  key={f.title}
                  delay={index * 80}
                  className={cn(f.className)}
                >
                  <div
                    className={cn(
                      "marketing-feature-card h-full rounded-2xl p-7",
                      f.featured && "marketing-feature-card--featured",
                    )}
                  >
                    <div
                      className={cn(
                        "mb-5 flex size-11 items-center justify-center rounded-xl border transition-colors",
                        f.featured
                          ? "border-amber/30 bg-amber text-ink"
                          : "border-border bg-parchment text-amber",
                      )}
                    >
                      <f.icon className="size-5" />
                    </div>
                    <h3 className="font-display text-xl tracking-tight">{f.title}</h3>
                    <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">
                      {f.description}
                    </p>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        <section id="trust" className="marketing-trust-band py-28">
          <div className="mx-auto max-w-6xl px-6">
            <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
              <ScrollReveal>
                <div>
                  <h2 className="font-display text-3xl tracking-tight sm:text-4xl">
                    Trust is the product.
                  </h2>
                  <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
                    Dual grounding gates, tenant-scoped retrieval, and refusal as a first-class UI
                    state — not an error buried in logs.
                  </p>
                </div>
              </ScrollReveal>
              <ScrollReveal delay={100}>
                <TrustStats />
              </ScrollReveal>
            </div>
          </div>
        </section>

        <section id="how" className="py-28">
          <div className="mx-auto max-w-6xl px-6">
            <ScrollReveal>
              <h2 className="text-center font-display text-3xl tracking-tight sm:text-4xl">
                How it works
              </h2>
              <p className="mx-auto mt-4 max-w-lg text-center text-muted-foreground">
                Click a step — same page, no maze of sub-routes.
              </p>
            </ScrollReveal>
            <ScrollReveal delay={80}>
              <HowStepper />
            </ScrollReveal>
          </div>
        </section>

        <section className="marketing-cta-band py-24">
          <ScrollReveal>
            <div className="mx-auto max-w-3xl px-6 text-center">
              <h2 className="font-display text-3xl tracking-tight text-balance sm:text-4xl">
                Stop losing the why when people leave.
              </h2>
              <p className="mt-5 text-lg opacity-80">
                Sign up, create an engagement, and start building memory for your next modernization.
              </p>
              <div className="mt-10 flex flex-wrap justify-center gap-3">
                <Link
                  href="/sign-up"
                  className={cn(
                    buttonVariants({ size: "lg" }),
                    "h-12 bg-ink px-8 font-semibold text-receipt hover:bg-ink/90",
                  )}
                >
                  Create account
                </Link>
                <Link
                  href="/sign-in"
                  className={cn(
                    buttonVariants({ size: "lg", variant: "outline" }),
                    "h-12 border-ink/30 bg-transparent px-8 font-semibold text-ink hover:bg-ink/5",
                  )}
                >
                  Log in
                </Link>
              </div>
            </div>
          </ScrollReveal>
        </section>

        <footer className="border-t border-border bg-archive-deep py-10 text-archive-deep-foreground/60">
          <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 text-sm sm:flex-row">
            <span className="font-display text-base text-archive-deep-foreground">Backstory</span>
            <span>© {new Date().getFullYear()} · Remembers why</span>
          </div>
        </footer>
      </main>
    </div>
  );
}
