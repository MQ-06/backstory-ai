import { BookOpen, ShieldCheck, Sparkles } from "lucide-react";
import { type ReactNode } from "react";

const BULLETS = [
  {
    icon: Sparkles,
    title: "Answer Receipts",
    text: "Every claim backed by code, tickets, and video — clickable proof.",
  },
  {
    icon: ShieldCheck,
    title: "Honest refusal",
    text: "When memory lacks evidence, Backstory says so. No guessing.",
  },
  {
    icon: BookOpen,
    title: "Expert capture",
    text: "Code-aware interviews preserve the why before experts leave.",
  },
];

export function AuthPanel({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-primary p-10 text-primary-foreground lg:flex">
        <div className="absolute inset-0 bg-grid opacity-20" />
        <div className="relative">
          <p className="text-xl font-semibold tracking-tight">Backstory</p>
          <p className="mt-1 text-sm text-primary-foreground/80">Remembers why</p>
        </div>
        <div className="relative space-y-8">
          <div>
            <h1 className="text-3xl font-semibold leading-tight tracking-tight text-balance">
              Code tells you what.
              <br />
              Backstory remembers why.
            </h1>
            <p className="mt-4 max-w-md text-sm text-primary-foreground/85">
              The memory layer for legacy systems — cited answers from decades of history and
              departing experts.
            </p>
          </div>
          <ul className="space-y-4">
            {BULLETS.map((item) => (
              <li key={item.title} className="flex gap-3">
                <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-white/10">
                  <item.icon className="size-4" />
                </div>
                <div>
                  <p className="text-sm font-medium">{item.title}</p>
                  <p className="text-sm text-primary-foreground/75">{item.text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-xs text-primary-foreground/60">
          Built for modernization teams and regulated systems.
        </p>
      </div>
      <div className="flex items-center justify-center bg-background p-6 sm:p-10">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
