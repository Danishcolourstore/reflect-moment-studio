import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    /* ─── UI PARAMETER SYSTEM v2 — Token-locked scales ────────────────────
       Spacing: 4px base (v1 stood — production-correct).
       Radius: 4-step token system (sharp/soft/rounded/pill) per §5.
       Shadow: 4-step taxonomy (border/lift/float/modal) per §5/§9.
       Drift dies at the build.
       ──────────────────────────────────────────────────────────────────── */
    spacing: {
      0: "0",
      px: "1px",
      0.5: "2px",
      1: "4px",
      2: "8px",
      3: "12px",
      4: "16px",
      5: "20px",
      6: "24px",
      7: "28px",
      8: "32px",
      9: "36px",
      10: "40px",
      11: "44px",
      12: "48px",
      14: "56px",
      16: "64px",
      20: "80px",
      24: "96px",
    },
    borderRadius: {
      none: "0",
      DEFAULT: "var(--radius-sharp)",     // 2px — primary surfaces
      sharp: "var(--radius-sharp)",       // 2px — cards, inputs, primary buttons
      sm: "var(--radius-sharp)",
      soft: "var(--radius-soft)",         // 6px — chips, tags, badges
      md: "var(--radius-soft)",
      rounded: "var(--radius-rounded)",   // 12px — mobile bottom sheets
      lg: "var(--radius-rounded)",
      xl: "var(--radius-rounded)",
      "2xl": "var(--radius-rounded)",
      "3xl": "var(--radius-rounded)",
      pill: "var(--radius-pill)",         // 999px — status dots, toggles
      full: "var(--radius-pill)",
    },
    boxShadow: {
      none: "none",
      DEFAULT: "var(--shadow-border)",
      border: "var(--shadow-border)",     // inset 1px — replaces border on cards
      lift: "var(--shadow-lift)",         // hover state
      float: "var(--shadow-float)",       // popovers, floating panels
      modal: "var(--shadow-modal)",       // modal dialogs
      sm: "var(--shadow-border)",
      md: "var(--shadow-lift)",
      lg: "var(--shadow-float)",
      xl: "var(--shadow-modal)",
      "2xl": "var(--shadow-modal)",
      inner: "var(--shadow-border)",
    },
    container: {
      center: true,
      padding: "20px",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ['"Inter Tight"', '"DM Sans"', '-apple-system', 'BlinkMacSystemFont', '"SF Pro Text"', 'system-ui', 'sans-serif'],
        display: ['"Fraunces"', '"Cormorant Garamond"', 'Georgia', 'serif'],
        serif: ['"Cormorant Garamond"', '"Fraunces"', 'Georgia', 'serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      fontSize: {
        // v2 §2 size scale
        "2xs": ["10px", { lineHeight: "1.4" }],
        xs: ["12px", { lineHeight: "1.4" }],
        sm: ["13px", { lineHeight: "1.5" }],
        base: ["15px", { lineHeight: "1.55" }],
        md: ["17px", { lineHeight: "1.5" }],
        lg: ["22px", { lineHeight: "1.3", letterSpacing: "-0.005em" }],
        xl: ["28px", { lineHeight: "1.15", letterSpacing: "-0.01em" }],
        "2xl": ["36px", { lineHeight: "1.1", letterSpacing: "-0.01em" }],
        "3xl": ["48px", { lineHeight: "1.05", letterSpacing: "-0.015em" }],
        "4xl": ["64px", { lineHeight: "1.0", letterSpacing: "-0.02em" }],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      transitionTimingFunction: {
        "v2-press": "cubic-bezier(0.4, 0, 0.2, 1)",
        "v2-spring": "cubic-bezier(0.32, 0.72, 0, 1)",
      },
      transitionDuration: {
        instant: "80ms",
        fast: "160ms",
        base: "240ms",
        slow: "340ms",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          from: { opacity: "0", transform: "translateY(4px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "skeleton-pulse": {
          "0%, 100%": { opacity: "0.5" },
          "50%": { opacity: "1" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.3s ease-out forwards",
        "skeleton-pulse": "skeleton-pulse 1200ms ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
