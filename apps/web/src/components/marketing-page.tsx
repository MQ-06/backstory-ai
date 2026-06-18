"use client";

import {
  ArrowRight,
  BookOpen,
  Link2,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { HowStepper } from "@/components/marketing/how-stepper";
import { LiveDemo } from "@/components/marketing/live-demo";
import { ScrollReveal } from "@/components/marketing/scroll-reveal";
import { TickerBand } from "@/components/marketing/ticker-band";
import { TrustStats } from "@/components/marketing/trust-stats";
import { MarketingNav } from "@/components/marketing-nav";
import { Badge } from "@/components/ui/badge";
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
  const [activeFeature, setActiveFeature] = useState(0);

  return (
    <div className="marketing relative min-h-screen overflow-hidden bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0 bg-mesh-olive" aria-hidden />
      <div className="marketing-blob marketing-blob-1" aria-hidden />
      <div className="marketing-blob marketing-blob-2" aria-hidden />
      <div className="marketing-blob marketing-blob-3" aria-hidden />
      <div
        className="marketing-orb pointer-events-none absolute right-[8%] top-[22%] size-64 opacity-90"
        aria-hidden
      />

      <MarketingNav />

      <main className="relative pt-[5.25rem]">
        <section id="demo" className="mx-auto max-w-6xl px-6 pb-16 pt-16 md:pt-24">
          <div className="grid items-center gap-14 lg:grid-cols-2 lg:gap-16">
            <ScrollReveal className="relative">
              <div
                className="marketing-hero-accent absolute -left-3 top-2 bottom-2 w-1 rounded-full opacity-90"
                aria-hidden
              />
              <div className="pl-6">
                <Badge className="mb-7 w-fit border-0 bg-primary px-3.5 py-1.5 text-sm font-bold text-primary-foreground shadow-md shadow-primary/30">
                  Memory layer for legacy systems
                </Badge>
                <h1 className="text-[2.9rem] font-bold leading-[1.05] tracking-tight text-balance sm:text-5xl lg:text-[3.65rem]">
                  Code tells you <span className="text-muted-foreground">what.</span>
                  <br />
                  Backstory remembers{" "}
                  <span className="text-primary underline decoration-primary/30 decoration-4 underline-offset-4">
                    why.
                  </span>
                </h1>
                <p className="mt-7 max-w-lg text-lg leading-relaxed text-muted-foreground">
                  Cited answers from decades of commits, tickets, and departing experts — with
                  receipts you can click, not vibes you have to trust.
                </p>
                <div className="mt-10 flex flex-wrap items-center gap-3">
                  <Link
                    href="/sign-up"
                    className={cn(
                      buttonVariants({ size: "lg" }),
                      "h-12 bg-primary px-8 text-base font-bold text-primary-foreground shadow-xl shadow-primary/35 transition-all hover:scale-[1.02] hover:bg-primary/90 hover:shadow-2xl hover:shadow-primary/40",
                    )}
                  >
                    Start free
                    <ArrowRight className="size-4" />
                  </Link>
                  <Link
                    href="/sign-in"
                    className={cn(
                      buttonVariants({ size: "lg", variant: "outline" }),
                      "h-12 border-2 border-foreground/15 bg-white/60 px-8 text-base font-semibold backdrop-blur-sm hover:border-primary hover:bg-primary/5 dark:bg-black/20",
                    )}
                  >
                    Log in
                  </Link>
                </div>
                <p className="mt-7 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Try the demo → pick a scenario on the right
                </p>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={120}>
              <LiveDemo />
            </ScrollReveal>
          </div>
        </section>

        <TickerBand />

        <section id="product" className="border-t border-foreground/8 py-28">
          <div className="mx-auto max-w-6xl px-6">
            <ScrollReveal>
              <div className="mb-14 max-w-2xl">
                <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
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
                  className={cn(f.className, f.featured && "md:col-span-2")}
                >
                  <button
                    type="button"
                    onClick={() => setActiveFeature(index)}
                    className={cn(
                      "marketing-feature-card group h-full w-full rounded-2xl p-7 text-left transition-all duration-300",
                      activeFeature === index && "border-primary/40 ring-2 ring-primary/20",
                    )}
                  >
                    <div
                      className={cn(
                        "mb-5 flex size-12 items-center justify-center rounded-xl border transition-colors",
                        activeFeature === index || f.featured
                          ? "border-primary/30 bg-primary text-primary-foreground"
                          : "border-primary/20 bg-primary/10 text-primary group-hover:bg-primary/15",
                      )}
                    >
                      <f.icon className="size-5" />
                    </div>
                    <h3 className="text-xl font-bold tracking-tight">{f.title}</h3>
                    <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">
                      {f.description}
                    </p>
                  </button>
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
                  <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
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
              <h2 className="text-center text-3xl font-bold tracking-tight sm:text-4xl">
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
              <h2 className="text-3xl font-bold tracking-tight text-balance text-white sm:text-4xl">
                Stop losing the why when people leave.
              </h2>
              <p className="mt-5 text-lg text-muted-foreground">
                Sign up, create an engagement, and start building memory for your next modernization.
              </p>
              <div className="mt-10 flex flex-wrap justify-center gap-3">
                <Link
                  href="/sign-up"
                  className={cn(
                    buttonVariants({ size: "lg" }),
                    "h-12 bg-white px-8 font-bold text-[oklch(0.38_0.09_132)] shadow-xl transition-transform hover:scale-[1.02] hover:bg-white/90",
                  )}
                >
                  Create account
                </Link>
                <Link
                  href="/sign-in"
                  className={cn(
                    buttonVariants({ size: "lg", variant: "outline" }),
                    "h-12 border-2 border-white/30 bg-transparent px-8 font-semibold text-white hover:bg-white/10",
                  )}
                >
                  Log in
                </Link>
              </div>
            </div>
          </ScrollReveal>
        </section>

        <footer className="border-t border-foreground/10 bg-black py-10 text-white/60">
          <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 text-sm sm:flex-row">
            <span className="text-base font-bold text-white">Backstory</span>
            <span>© {new Date().getFullYear()} · Remembers why</span>
          </div>
        </footer>
      </main>
    </div>
  );
}
