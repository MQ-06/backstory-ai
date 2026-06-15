import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";

import { AppProviders } from "@/components/providers";
import { ThemeProvider } from "@/components/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Backstory",
  description: "Code tells you what — Backstory remembers why.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={cn(inter.variable, jetbrainsMono.variable)}>
      <body className="min-h-screen font-sans antialiased">
        <ThemeProvider>
          <TooltipProvider>
            <ClerkProvider
              appearance={{
                variables: {
                  colorPrimary: "#1e3a5f",
                  borderRadius: "0.625rem",
                },
              }}
            >
              <AppProviders>{children}</AppProviders>
            </ClerkProvider>
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
