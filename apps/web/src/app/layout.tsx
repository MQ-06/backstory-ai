import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import { Instrument_Sans, JetBrains_Mono } from "next/font/google";

import { AppProviders } from "@/components/providers";
import { ThemeProvider } from "@/components/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

import "./globals.css";

const instrumentSans = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Backstory — Remembers why",
  description: "Code tells you what — Backstory remembers why. Cited answers for legacy systems.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(instrumentSans.variable, jetbrainsMono.variable)}
    >
      <body className="min-h-screen font-sans antialiased">
        <ThemeProvider>
          <TooltipProvider>
            <ClerkProvider
              appearance={{
                variables: {
                  colorPrimary: "oklch(0.48 0.10 132)",
                  borderRadius: "0.75rem",
                  fontFamily: "var(--font-sans), system-ui, sans-serif",
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
