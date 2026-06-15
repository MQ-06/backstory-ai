"use client";

import { usePathname } from "next/navigation";

import { AppShell } from "@/components/app-shell";

export function AppLayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return <AppShell activePath={pathname}>{children}</AppShell>;
}
