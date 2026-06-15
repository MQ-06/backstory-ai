"use client";

import {
  ArrowRight,
  BookOpen,
  FileCode2,
  Link2,
  ShieldCheck,
  Sparkles,
  Ticket,
  Video,
} from "lucide-react";
import Link from "next/link";

import { MarketingNav } from "@/components/marketing-nav";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const CITATIONS = [
  { icon: FileCode2, label: "payroll_calc.py:142", tone: "code" },
  { icon: Ticket, label: "JIRA-4821", tone: "ticket" },
  { icon: Video, label: "Interview @ 04:12", tone: "video" },
];

const FEATURES = [
  {
    icon: Sparkles,
    title: "Answer Receipts",
    description:
      "Every sentence links to proof — a line of code, a ticket, a doc section, or a timestamp in an interview.",
    className: "md:col-span-2",
  },
  {
    icon: ShieldCheck,
    title: "Honest refusal",
    description: "No evidence? Backstory says so. Trust is not configurable away.",
    className: "md:col-span-1",
  },
  {
    icon: BookOpen,
    title: "Expert capture",
    description: "Code-aware interviews preserve the why before your experts leave.",
    className: "md:col-span-1",
  },
  {
    icon: Link2,
    title: "Linked memory",
    description: "Git, tickets, and docs indexed per engagement — one tenant boundary, zero cross-leakage.",
    className: "md:col-span-2",
  },
];

export function MarketingPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0 bg-hero-glow" aria-hidden />
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-40" aria-hidden />

      <MarketingNav />

      <main className="relative pt-16">
        {/* Hero */}
        <section className="mx-auto max-w-6xl px-6 pb-24 pt-20 md:pt-28">
          <div className="grid items-center gap-14 lg:grid-cols-2 lg:gap-10">
            <div className="animate-fade-up">
              <Badge
                variant="secondary"
                className="mb-6 border border-primary/15 bg-primary/5 px-3 py-1 text-primary"
              >
                Memory layer for legacy systems
              </Badge>
              <h1 className="font-display text-4xl font-semibold leading-[1.08] tracking-tight text-balance sm:text-5xl lg:text-[3.25rem]">
                Code tells you <span className="text-muted-foreground">what.</span>
                <br />
                Backstory remembers <span className="text-primary">why.</span>
              </h1>
              <p className="mt-6 max-w-lg text-lg leading-relaxed text-muted-foreground">
                Cited answers from decades of commits, tickets, and departing experts — with receipts
                you can click, not vibes you have to trust.
              </p>
              <div className="mt-10 flex flex-wrap items-center gap-3">
                <Link
                  href="/sign-up"
                  className={cn(
                    buttonVariants({ size: "lg" }),
                    "h-11 px-6 shadow-lg shadow-primary/25",
                  )}
                >
                  Start free
                  <ArrowRight className="size-4" />
                </Link>
                <Link href="/sign-in" className={cn(buttonVariants({ size: "lg", variant: "outline" }), "h-11 px-6")}>
                  Log in
                </Link>
              </div>
              <p className="mt-6 text-xs text-muted-foreground">
                Built for modernization teams · Multi-tenant by engagement
              </p>
            </div>

            {/* Product preview card */}
            <div className="animate-fade-up animation-delay-150 lg:justify-self-end">
              <div className="relative mx-auto max-w-md lg:max-w-none">
                <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-primary/20 via-transparent to-evidence/15 blur-2xl" />
                <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-card/90 shadow-2xl shadow-primary/10 backdrop-blur-sm">
                  <div className="flex items-center gap-2 border-b border-border/80 bg-muted/40 px-4 py-3">
                    <div className="flex gap-1.5">
                      <span className="size-2.5 rounded-full bg-red-400/80" />
                      <span className="size-2.5 rounded-full bg-amber-400/80" />
                      <span className="size-2.5 rounded-full bg-emerald-400/80" />
                    </div>
                    <span className="ml-2 text-xs text-muted-foreground">Ask · Acme Payroll</span>
                  </div>
                  <div className="space-y-4 p-5">
                    <div className="rounded-xl bg-muted/50 p-3 text-sm text-muted-foreground">
                      Why does the month-end job fail on 31-day months?
                    </div>
                    <div className="space-y-3 rounded-xl border border-border/60 bg-background p-4">
                      <p className="text-sm leading-relaxed">
                        The batch uses a hard-coded{" "}
                        <span className="rounded bg-primary/10 px-1 font-mono text-xs text-primary">
                          days=30
                        </span>{" "}
                        assumption. Finance added a workaround in 2019; the ticket explains the
                        regulatory reason.
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {CITATIONS.map((c) => (
                          <span
                            key={c.label}
                            className={cn(
                              "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium",
                              c.tone === "code" && "border-primary/25 bg-primary/5 text-primary",
                              c.tone === "ticket" && "border-amber-500/25 bg-amber-500/5 text-amber-700 dark:text-amber-400",
                              c.tone === "video" && "border-evidence/30 bg-evidence/10 text-evidence",
                            )}
                          >
                            <c.icon className="size-3" />
                            {c.label}
                          </span>
                        ))}
                      </div>
                    </div>
                    <p className="text-center text-[10px] uppercase tracking-widest text-muted-foreground">
                      Answer Receipt · every claim cited
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features bento */}
        <section id="product" className="border-t border-border/60 bg-muted/30 py-24">
          <div className="mx-auto max-w-6xl px-6">
            <div className="mb-12 max-w-2xl">
              <h2 className="font-display text-3xl font-semibold tracking-tight">
                Not another chatbot on your repo.
              </h2>
              <p className="mt-3 text-muted-foreground">
                A serious instrument for teams who cannot afford wrong answers in production.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {FEATURES.map((f) => (
                <div
                  key={f.title}
                  className={cn(
                    "group rounded-2xl border border-border/70 bg-card p-6 transition-all duration-300",
                    "hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5",
                    f.className,
                  )}
                >
                  <div className="mb-4 flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary/15">
                    <f.icon className="size-5" />
                  </div>
                  <h3 className="font-display text-lg font-semibold">{f.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Trust */}
        <section id="trust" className="py-24">
          <div className="mx-auto max-w-6xl px-6">
            <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
              <div>
                <h2 className="font-display text-3xl font-semibold tracking-tight">
                  Trust is the product.
                </h2>
                <p className="mt-4 text-muted-foreground leading-relaxed">
                  Dual grounding gates, tenant-scoped retrieval, and refusal as a first-class UI state
                  — not an error buried in logs.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  { n: "0", label: "hallucinated claims shipped" },
                  { n: "100%", label: "citations on every answer" },
                  { n: "1", label: "tenant boundary per engagement" },
                  { n: "∞", label: "institutional memory preserved" },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-xl border border-border/70 bg-card/50 p-5 text-center"
                  >
                    <p className="font-display text-3xl font-semibold text-primary">{stat.n}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* How */}
        <section id="how" className="border-t border-border/60 bg-muted/30 py-24">
          <div className="mx-auto max-w-6xl px-6">
            <h2 className="font-display text-center text-3xl font-semibold tracking-tight">
              How it works
            </h2>
            <div className="mt-14 grid gap-8 md:grid-cols-3">
              {[
                { step: "01", title: "Connect sources", text: "Git, tickets, docs — indexed per engagement." },
                { step: "02", title: "Capture experts", text: "Archaeology Brief + interviews, time-coded to code." },
                { step: "03", title: "Ask with receipts", text: "Plain-language questions, cited answers or honest refusal." },
              ].map((item) => (
                <div key={item.step} className="relative text-center">
                  <span className="font-display text-5xl font-bold text-primary/15">{item.step}</span>
                  <h3 className="mt-2 font-display text-lg font-semibold">{item.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-24">
          <div className="mx-auto max-w-3xl px-6 text-center">
            <h2 className="font-display text-3xl font-semibold tracking-tight text-balance">
              Stop losing the why when people leave.
            </h2>
            <p className="mt-4 text-muted-foreground">
              Sign up, create an engagement, and start building memory for your next modernization.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link
                href="/sign-up"
                className={cn(buttonVariants({ size: "lg" }), "shadow-lg shadow-primary/20")}
              >
                Create account
              </Link>
              <Link href="/sign-in" className={buttonVariants({ size: "lg", variant: "outline" })}>
                Log in
              </Link>
            </div>
          </div>
        </section>

        <footer className="border-t border-border/60 py-8">
          <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 text-sm text-muted-foreground sm:flex-row">
            <span className="font-display font-medium text-foreground">Backstory</span>
            <span>© {new Date().getFullYear()} · Remembers why</span>
          </div>
        </footer>
      </main>
    </div>
  );
}
