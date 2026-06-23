"use client";

import {
  ClerkLoaded,
  OrganizationSwitcher,
  UserButton,
} from "@clerk/nextjs";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

import { useEngagement } from "@/components/providers";
import { ThemeToggle } from "@/components/theme-toggle";
import { clerkAppearance } from "@/lib/clerk-appearance";

const PAGE_TITLES: Record<string, string> = {
  "/ask": "Ask",
  "/sources": "Sources",
  "/interviews": "Capture",
  "/admin": "Settings",
  "/library": "Library",
};

function pageTitle(pathname: string) {
  const match = Object.entries(PAGE_TITLES).find(([path]) => pathname.startsWith(path));
  return match?.[1] ?? "Workspace";
}

export function AtlasTopBar() {
  const pathname = usePathname();
  const { activeEngagement } = useEngagement();
  const title = pageTitle(pathname);
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const clerkLook = clerkAppearance(mounted ? resolvedTheme === "dark" : true);

  return (
    <header className="sticky top-0 z-40 flex h-12 shrink-0 items-center justify-between gap-4 border-b border-border/70 bg-background/90 px-4 backdrop-blur-md sm:px-6">
      <div className="flex min-w-0 items-center gap-2 text-sm">
        <Link
          href="/ask"
          className="font-semibold text-muted-foreground transition-colors hover:text-foreground lg:hidden"
        >
          Backstory
        </Link>
        <ChevronRight className="size-3.5 text-muted-foreground/50 lg:hidden" aria-hidden />
        <span className="text-muted-foreground">{title}</span>
        {activeEngagement ? (
          <>
            <ChevronRight className="size-3.5 text-muted-foreground/40" aria-hidden />
            <span className="truncate font-medium text-foreground">{activeEngagement.name}</span>
          </>
        ) : null}
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <ThemeToggle />
        <ClerkLoaded>
          <OrganizationSwitcher
            hidePersonal
            appearance={{
              ...clerkLook,
              elements: {
                ...clerkLook.elements,
                rootBox: "hidden sm:flex items-center",
              },
            }}
          />
          <UserButton appearance={clerkLook} />
        </ClerkLoaded>
      </div>
    </header>
  );
}
