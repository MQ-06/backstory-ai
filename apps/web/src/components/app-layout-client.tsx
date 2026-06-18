"use client";

import { usePathname } from "next/navigation";

import { AppShell } from "@/components/app-shell";

export function AppLayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const workspace = pathname.startsWith("/ask") ? "full" : "default";

  return (
    <AppShell activePath={pathname} workspace={workspace}>
      {children}
    </AppShell>
  );
}
