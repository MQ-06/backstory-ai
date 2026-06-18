"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { useTheme } from "next-themes";
import { type ReactNode } from "react";

export function ThemedClerkProvider({ children }: { children: ReactNode }) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <ClerkProvider
      appearance={{
        variables: {
          colorPrimary: isDark ? "#d4954a" : "#1A1410",
          colorText: isDark ? "#f0ebe3" : "#1A1410",
          colorBackground: isDark ? "#1e1a15" : "#FDFAF4",
          colorInputBackground: isDark ? "#2a2520" : "#F7F3EC",
          colorInputText: isDark ? "#f0ebe3" : "#1A1410",
          borderRadius: "0.625rem",
          fontFamily: "var(--font-sans), system-ui, sans-serif",
        },
      }}
    >
      {children}
    </ClerkProvider>
  );
}
