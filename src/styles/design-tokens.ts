/**
 * MirrorAI Design Tokens — UI Parameter System v2
 *
 * Confident Clarity. Warm near-neutral palette, NO gold accent.
 * Two-voice typography: DM Sans (functional), Cormorant Garamond (display ≥22px, non-interactive).
 *
 * Tokens here mirror the CSS custom properties in src/index.css.
 * Use the CSS variables in stylesheets; use this file in TS/inline-styled components.
 *
 * RULES (locked):
 *   - No gold. Anywhere. Status, dots, active states all use --ink.
 *   - Cormorant restricted to display tier (≥22px, non-interactive).
 *   - Radius scale: sharp (2) / soft (6) / rounded (12) / pill (999).
 *   - Shadow scale: border / lift / float / modal — never invent values.
 *   - Spacing: 4px base, scale matches tailwind.config.ts exactly.
 */

export const colors = {
  // Surfaces — warm offset
  paper: "#FAFAF8",
  surface: "#FFFFFF",
  wash: "#F5F4F1",
  washStrong: "#EEECE8",
  washDeep: "#E0DDD8",
  rule: "#EEECE8",
  ruleStrong: "#E0DDD8",
  ruleActive: "#0A0A0A",

  // Ink (text)
  ink: "#0A0A0A",
  inkSecondary: "#2A2A28",
  inkMuted: "#6B6962",
  inkWhisper: "#A8A6A0",

  // Signals
  alert: "#C0392B",
  go: "#3D5A3A",

  // Dark surfaces — imagery-first only (Cheetah live, lightbox)
  obsidian: "#0A0A0A",
  obsidianInk: "#F5F4F1",

  // ─── Legacy aliases ─────────────────────────────────────────────────────
  bg: "#FAFAF8",
  border: "#EEECE8",
  borderHover: "#E0DDD8",
  borderActive: "#0A0A0A",
  hover: "#F5F4F1",
  text: "#0A0A0A",
  textMuted: "#A8A6A0",
  white: "#FFFFFF",
  black: "#0A0A0A",
  danger: "#C0392B",
  success: "#3D5A3A",
  darkBg: "#0A0A0A",
  darkText: "#F5F4F1",
  darkTextDim: "#6B6962",

  // Gold aliases — neutralized to ink. Kept only so legacy call-sites compile.
  gold: "#0A0A0A",
  goldInk: "#0A0A0A",
} as const;

export const fonts = {
  /** Editorial display — Fraunces variable serif, optical sizing. */
  display: "'Fraunces', 'Cormorant Garamond', Georgia, serif",
  /** UI & body — Inter Tight, premium SaaS feel with stylistic sets. */
  body: "'Inter Tight', 'DM Sans', -apple-system, BlinkMacSystemFont, 'SF Pro Text', system-ui, sans-serif",
  /** Mono — JetBrains Mono, tabular numerics. */
  mono: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
  /** Legacy serif italic alias. */
  serifItalic: "'Cormorant Garamond', 'Fraunces', Georgia, serif",
} as const;

/** Spacing scale — must match tailwind.config.ts theme.spacing exactly. */
export const space = {
  "0": 0,
  "px": 1,
  "0.5": 2,
  "1": 4,
  "2": 8,
  "3": 12,
  "4": 16,
  "5": 20,
  "6": 24,
  "7": 28,
  "8": 32,
  "9": 36,
  "10": 40,
  "11": 44,
  "12": 48,
  "14": 56,
  "16": 64,
  "20": 80,
  "24": 96,
} as const;

export const spacing = {
  pageMobile: "20px",
  pageDesktop: "32px",
  // Experience screens (gallery, onboarding): 48–96px
  sectionExperience: "48px",
  sectionExperienceLarge: "96px",
  // Tool screens (events, clients, settings): 32–48px
  sectionTool: "32px",
  sectionToolLarge: "48px",
  // Legacy aliases
  sectionMobile: "20px",
  sectionDesktop: "24px",
  sectionMajor: "48px",
  cardPad: "20px",
  fieldStack: "16px",
  labelInput: "6px",
  iconText: "8px",
  rowMin: "44px",
} as const;

/** Radius scale — v2 §5. Use these names everywhere. */
export const radius = {
  none: 0,
  sharp: 2,    // inputs, cards, primary buttons, table cells
  soft: 6,     // chips, tags, badges, contextual buttons
  rounded: 12, // mobile bottom sheet top corners
  pill: 999,
  full: 999,
} as const;

/** Shadow taxonomy — v2 §5/§9. Never invent new values. */
export const shadows = {
  none: "none",
  border: "inset 0 0 0 1px #E0DDD8",
  lift: "0 1px 4px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.06)",
  float: "0 2px 8px rgba(0,0,0,0.08), 0 8px 32px rgba(0,0,0,0.10)",
  modal: "0 8px 48px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.08)",
} as const;

/** Motion — v2 §7/§10 */
export const motion = {
  instant: "80ms cubic-bezier(0.4, 0, 0.2, 1)",
  fast: "160ms cubic-bezier(0.4, 0, 0.2, 1)",
  base: "240ms cubic-bezier(0.32, 0.72, 0, 1)",
  slow: "340ms cubic-bezier(0.32, 0.72, 0, 1)",
} as const;

/** Type fragments — v2 §2 size scale */
export const fragments = {
  /** Brand moment — Cormorant only here. ≥22px, non-interactive. */
  display: {
    fontFamily: fonts.display,
    fontWeight: 400 as const,
    fontSize: 36,
    lineHeight: 1.1,
    letterSpacing: "-0.01em",
    color: colors.ink,
  } as const,
  hero: {
    fontFamily: fonts.display,
    fontWeight: 300 as const,
    fontSize: 48,
    lineHeight: 1.05,
    letterSpacing: "-0.015em",
    color: colors.ink,
  } as const,
  h1: {
    fontFamily: fonts.body,
    fontWeight: 500 as const,
    fontSize: 28,
    lineHeight: 1.15,
    letterSpacing: "-0.01em",
    color: colors.ink,
  } as const,
  h2: {
    fontFamily: fonts.body,
    fontWeight: 500 as const,
    fontSize: 22,
    lineHeight: 1.2,
    letterSpacing: "-0.005em",
    color: colors.ink,
  } as const,
  sectionHeading: {
    fontFamily: fonts.body,
    fontWeight: 500 as const,
    fontSize: 17,
    lineHeight: 1.3,
    letterSpacing: "-0.005em",
    color: colors.ink,
  } as const,
  label: {
    fontFamily: fonts.body,
    fontSize: 12,
    fontWeight: 500 as const,
    letterSpacing: "0.04em",
    textTransform: "none" as const,
    color: colors.inkMuted,
  } as const,
  meta: {
    fontFamily: fonts.body,
    fontSize: 12,
    fontWeight: 400 as const,
    letterSpacing: "0",
    color: colors.inkMuted,
    fontVariantNumeric: "tabular-nums" as const,
  } as const,
  bodyText: {
    fontFamily: fonts.body,
    fontSize: 15,
    fontWeight: 400 as const,
    color: colors.ink,
    lineHeight: 1.55,
  } as const,
  bodySmall: {
    fontFamily: fonts.body,
    fontSize: 13,
    fontWeight: 400 as const,
    color: colors.ink,
    lineHeight: 1.5,
  } as const,
} as const;
