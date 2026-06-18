import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        background: "var(--background)",
        foreground: "var(--foreground)",
        ink: "var(--ink)",
        parchment: "var(--parchment)",
        receipt: "var(--receipt)",
        amber: {
          DEFAULT: "var(--amber)",
          foreground: "var(--ink)",
        },
        proof: "var(--proof)",
        archive: {
          deep: "var(--archive-deep)",
          "deep-foreground": "var(--archive-deep-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
        popover: {
          DEFAULT: "var(--popover)",
          foreground: "var(--popover-foreground)",
        },
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        destructive: {
          DEFAULT: "var(--destructive)",
          foreground: "var(--destructive-foreground)",
        },
        evidence: "var(--evidence)",
        refusal: {
          DEFAULT: "var(--refusal)",
          foreground: "var(--refusal-foreground)",
        },
        horizon: {
          past: "var(--horizon-past)",
          leaving: "var(--horizon-leaving)",
          deliver: "var(--horizon-deliver)",
        },
        sidebar: {
          DEFAULT: "var(--sidebar)",
          foreground: "var(--sidebar-foreground)",
          primary: "var(--sidebar-primary)",
          "primary-foreground": "var(--sidebar-primary-foreground)",
          accent: "var(--sidebar-accent)",
          "accent-foreground": "var(--sidebar-accent-foreground)",
          border: "var(--sidebar-border)",
          ring: "var(--sidebar-ring)",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        xl: "calc(var(--radius) + 4px)",
        "2xl": "calc(var(--radius) + 8px)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "Georgia", "serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      letterSpacing: {
        tightest: "-0.04em",
        archive: "0.16em",
      },
      boxShadow: {
        soft: "0 1px 3px color-mix(in srgb, var(--ink) 6%, transparent)",
        card: "0 1px 2px color-mix(in srgb, var(--ink) 5%, transparent), 0 12px 32px -16px color-mix(in srgb, var(--ink) 12%, transparent)",
        receipt:
          "0 1px 2px color-mix(in srgb, var(--ink) 4%, transparent), 0 8px 32px -12px color-mix(in srgb, var(--ink) 10%, transparent)",
        rail: "inset -1px 0 0 color-mix(in srgb, var(--ink) 6%, transparent)",
      },
      maxWidth: {
        prose: "65ch",
        workspace: "76rem",
      },
    },
  },
  plugins: [],
};

export default config;
