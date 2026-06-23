"use client";

import { useTheme } from "next-themes";
import { type ReactNode, useEffect, useState } from "react";

import { clerkAppearance } from "@/lib/clerk-appearance";

/** Applies theme-aware Clerk appearance to nested SignIn / SignUp. */
export function ClerkAuthForm({ children }: { children: ReactNode }) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const isDark = mounted ? resolvedTheme === "dark" : false;

  return (
    <div data-clerk-theme={isDark ? "dark" : "light"} className="[&_.cl-rootBox]:w-full">
      {children}
    </div>
  );
}

export function useClerkAppearance() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return clerkAppearance(mounted ? resolvedTheme === "dark" : false);
}
