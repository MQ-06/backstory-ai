"use client";

import { Sparkles } from "lucide-react";
import { useState } from "react";

import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const STARTER_QUESTIONS = [
  "Why does the payroll job fail on months with 31 days?",
  "Who last changed the month-end batch retry logic?",
  "What tickets mention the banking API workaround?",
];

export default function AskPage() {
  const [question, setQuestion] = useState("");

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="Ask"
        description="Plain-language questions with Answer Receipts — every claim backed by proof. Ships in Sprint 2."
      />

      <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-1 shadow-card">
        <div className="rounded-xl bg-muted/40 p-6 sm:p-8">
          <div className="mb-4 flex items-center gap-2 text-primary">
            <Sparkles className="size-4" />
            <span className="text-sm font-medium">Memory query</span>
            <Badge variant="secondary" className="ml-auto text-xs">
              Sprint 2
            </Badge>
          </div>
          <Textarea
            className={cn(
              "min-h-[120px] resize-none border-0 bg-transparent text-base shadow-none",
              "focus-visible:ring-0 focus-visible:ring-offset-0",
              "placeholder:text-muted-foreground/70",
            )}
            placeholder="Why does the payroll job fail on months with 31 days?"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            disabled
          />
          <p className="mt-3 text-xs text-muted-foreground">
            Connect sources first — then ask across code, tickets, docs, and interviews.
          </p>
        </div>
      </div>

      <div className="mt-8">
        <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Starter questions
        </p>
        <div className="flex flex-wrap gap-2">
          {STARTER_QUESTIONS.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => setQuestion(q)}
              className={cn(
                "rounded-full border border-border bg-background px-3 py-1.5 text-left text-sm",
                "transition-colors hover:border-primary/40 hover:bg-accent",
                question === q && "border-primary/50 bg-accent",
              )}
            >
              {q}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
