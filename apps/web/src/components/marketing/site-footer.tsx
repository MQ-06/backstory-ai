export function MarketingSiteFooter() {
  return (
    <footer className="border-t border-border bg-archive-deep py-8 text-archive-deep-foreground/55">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-center gap-2 px-6 text-center text-sm sm:flex-row sm:gap-4">
        <span className="font-display text-base text-archive-deep-foreground">Backstory</span>
        <span className="hidden text-archive-deep-foreground/30 sm:inline" aria-hidden>
          ·
        </span>
        <span>© {new Date().getFullYear()} · Remembers why</span>
      </div>
    </footer>
  );
}
