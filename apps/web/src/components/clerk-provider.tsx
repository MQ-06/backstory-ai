"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { useTheme } from "next-themes";
import { type ReactNode, useEffect, useState } from "react";

import { clerkAppearance } from "@/lib/clerk-appearance";

export function ThemedClerkProvider({ children }: { children: ReactNode }) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const isDark = mounted ? resolvedTheme === "dark" : true;

  return (
    <ClerkProvider appearance={clerkAppearance(isDark)}>
      {children}
    </ClerkProvider>
  );
}
