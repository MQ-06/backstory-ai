"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { buttonVariants } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "#product", id: "product", label: "Product" },
  { href: "#trust", id: "trust", label: "Trust" },
  { href: "#how", id: "how", label: "How it works" },
] as const;

export function MarketingNav() {
  const [active, setActive] = useState<string>("");

  useEffect(() => {
    const onScroll = () => {
      const offset = 140;
      let current = "";
      for (const link of NAV_LINKS) {
        const el = document.getElementById(link.id);
        if (el && el.getBoundingClientRect().top <= offset) {
          current = link.id;
        }
      }
      setActive(current);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="marketing-nav fixed inset-x-0 top-0 z-50">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="group flex items-center gap-3">
          <span className="brand-mark size-9 rounded-lg text-lg">B</span>
          <span className="font-display text-xl text-foreground">Backstory</span>
        </Link>

        <nav className="hidden items-center gap-9 text-sm md:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className={cn(
                "marketing-nav-link",
                active === link.id && "marketing-nav-link-active",
              )}
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link
            href="/sign-in"
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "border-border bg-transparent text-foreground hover:bg-muted",
            )}
          >
            Log in
          </Link>
          <Link
            href="/sign-up"
            className={cn(
              buttonVariants({ size: "sm" }),
              "bg-ink text-receipt hover:bg-ink/90",
            )}
          >
            Get started
          </Link>
        </div>
      </div>
    </header>
  );
}
