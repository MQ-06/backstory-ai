"use client";

import Link from "next/link";

import { ATLAS_NAV, ATLAS_SETTINGS, isNavActive } from "@/components/atlas/nav-config";
import { cn } from "@/lib/utils";

export function AtlasMobileNav({ activePath }: { activePath: string }) {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 flex border-t border-border bg-background/95 px-1 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden"
      aria-label="Mobile"
    >
      {ATLAS_NAV.map((item) => {
        const active = isNavActive(activePath, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px] font-semibold transition-colors",
              active ? "text-foreground" : "text-muted-foreground",
            )}
            aria-current={active ? "page" : undefined}
          >
            <span
              className={cn(
                "flex size-8 items-center justify-center rounded-lg transition-colors",
                active && "bg-amber/15 text-amber",
              )}
            >
              <item.icon className={cn("size-[1.15rem]", active && "stroke-[2.5px]")} />
            </span>
            {item.shortLabel}
          </Link>
        );
      })}
      <Link
        href={ATLAS_SETTINGS.href}
        className={cn(
          "flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px] font-semibold transition-colors",
          isNavActive(activePath, ATLAS_SETTINGS.href) ? "text-foreground" : "text-muted-foreground",
        )}
        aria-label="Settings"
      >
        <span
          className={cn(
            "flex size-8 items-center justify-center rounded-lg",
            isNavActive(activePath, ATLAS_SETTINGS.href) && "bg-amber/15 text-amber",
          )}
        >
          <ATLAS_SETTINGS.icon className="size-[1.15rem]" />
        </span>
        More
      </Link>
    </nav>
  );
}
