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
    <header className="marketing-glass-nav fixed inset-x-0 top-0 z-50">
      <div className="mx-auto flex h-[5.25rem] max-w-6xl items-center justify-between px-6">
        <Link href="/" className="group flex items-center gap-4">
          <span
            className={cn(
              "marketing-logo-float marketing-logo-mark flex size-14 items-center justify-center rounded-2xl",
              "text-[1.65rem] font-bold text-white",
            )}
          >
            B
          </span>
          <span className="text-xl font-bold tracking-tight text-white">Backstory</span>
        </Link>

        <nav className="hidden items-center gap-9 text-sm font-semibold md:flex">
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
              buttonVariants({ variant: "ghost", size: "sm" }),
              "text-white/80 hover:bg-white/10 hover:text-white",
            )}
          >
            Log in
          </Link>
          <Link
            href="/sign-up"
            className={cn(
              buttonVariants({ size: "sm" }),
              "bg-primary text-primary-foreground shadow-lg shadow-primary/40 hover:bg-primary/90",
            )}
          >
            Get started
          </Link>
        </div>
      </div>
    </header>
  );
}
