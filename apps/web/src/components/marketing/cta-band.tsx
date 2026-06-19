"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { AnswerReceipt, ReceiptFooter } from "@/components/ask/answer-receipt";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const STEPS = [
  "Connect Git, tickets, or docs",
  "Ask with cited Answer Receipts",
  "Capture expert knowledge before exit",
] as const;

export function MarketingCtaBand() {
  return (
    <section className="marketing-cta-band relative overflow-hidden border-y border-border/70 py-20 md:py-28">
      <div className="cta-center-accent pointer-events-none absolute inset-x-0 top-0 mx-auto h-px w-24 bg-amber" aria-hidden />

      <div className="mx-auto grid max-w-5xl items-center gap-12 px-6 lg:grid-cols-2 lg:gap-14">
        {/* Copy — centered on mobile, left on desktop within centered grid */}
        <div className="mx-auto max-w-lg text-center lg:mx-0 lg:max-w-none lg:text-left">
          <p className="section-label mb-4 text-amber">Before they leave</p>
          <h2 className="font-display text-3xl leading-[1.12] tracking-tight text-balance sm:text-4xl lg:text-[2.5rem]">
            Stop losing the{" "}
            <span className="text-amber transition-colors hover:text-amber/80">why</span> when people
            leave.
          </h2>
          <p className="mt-5 text-base leading-relaxed text-muted-foreground sm:text-lg">
            One engagement. Connected sources. Receipts on every answer — or an honest refusal.
          </p>
          <p className="mt-8 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            No source, no claim
          </p>
        </div>

        {/* Receipt action card */}
        <AnswerReceipt
          className={cn(
            "cta-receipt-card mx-auto w-full max-w-md shadow-receipt lg:max-w-none",
            "transition-all duration-300 ease-out",
            "hover:-translate-y-1 hover:border-amber/25 hover:shadow-card",
          )}
        >
          <div className="px-6 py-5 sm:px-7 sm:py-6">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Start here
            </p>
            <p className="mt-3 font-display text-xl leading-snug sm:text-2xl">
              Create an account and index your first sources in minutes.
            </p>
            <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
              {STEPS.map((step) => (
                <li
                  key={step}
                  className="cta-check-item group flex items-center gap-2.5 rounded-md px-1 py-0.5 transition-colors hover:text-foreground"
                >
                  <span className="size-1.5 shrink-0 rounded-full bg-proof transition-transform duration-200 group-hover:scale-150" />
                  {step}
                </li>
              ))}
            </ul>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/sign-up"
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "group/btn h-11 flex-1 bg-ink text-receipt transition-all hover:bg-ink/90 hover:shadow-md",
                )}
              >
                Create account
                <ArrowRight className="size-4 transition-transform duration-200 group-hover/btn:translate-x-1" />
              </Link>
              <Link
                href="/sign-in"
                className={cn(
                  buttonVariants({ size: "lg", variant: "outline" }),
                  "h-11 flex-1 border-border transition-all hover:-translate-y-px hover:border-amber/40 hover:bg-amber/5",
                )}
              >
                Log in
              </Link>
            </div>
          </div>
          <ReceiptFooter className="px-6 py-3 sm:px-7">
            <p className="text-center font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground lg:text-left">
              Honest refusal always on
            </p>
          </ReceiptFooter>
        </AnswerReceipt>
      </div>
    </section>
  );
}
