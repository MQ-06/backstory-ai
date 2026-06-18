"use client";

import { type ReactNode } from "react";

import { cn } from "@/lib/utils";

export function AnswerReceipt({
  children,
  className,
  perforated = true,
}: {
  children: ReactNode;
  className?: string;
  perforated?: boolean;
}) {
  return (
    <article
      className={cn(
        perforated ? "receipt-paper" : "rounded-xl border border-border bg-receipt shadow-receipt",
        "overflow-hidden",
        className,
      )}
    >
      <div className={cn(perforated && "receipt-paper-inner", !perforated && "p-0")}>
        {children}
      </div>
    </article>
  );
}

export function ReceiptFooter({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <footer
      className={cn(
        "border-t border-dashed border-border/80 bg-parchment/40 px-5 py-4 sm:px-6",
        className,
      )}
    >
      {children}
    </footer>
  );
}
