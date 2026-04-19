/**
 * MirrorAI Design Tokens — Pixieset-Minimal Direction
 *
 * The product has ONE color: black. No gold, no warm paper, no second accent.
 * Cool neutral palette. Photography-first chrome.
 *
 * RULES (locked):
 *   - No gold. Anywhere. Status, dots, active states all use --ink.
 *   - No warm whites. Paper is #FFFFFF.
 *   - Spacing scale matches tailwind.config.ts exactly.
 *   - Radius: 0 everywhere. Exception: avatar / icon-button (full).
 *   - Cormorant restricted to wordmark, couple names, chapter markers,
 *     greeting lines. Everything else is DM Sans.
 *
 * Legacy aliases (`gold`, `goldDim`, `brandGold`, `borderActive`) are mapped
 * to neutral tokens so old call-sites don't crash. They render as ink/rule
 * and should be migrated out over time.
 */

export const colors = {
  // Surfaces — cool white, not warm
  paper: "#FFFFFF",
  surface: "#FFFFFF",
  wash: "#FCFCFC",
  washStrong: "#F7F7F7",
  rule: "#ECECEC",
  ruleStrong: "#D4D4D4",

  // Ink (text)
  ink: "#1A1A1A",
  inkMuted: "#6E6E6E",
  inkWhisper: "#A8A8A8",

  // Signals — barely used
  alert: "#8B3A2A",
  go: "#3D5A3A",

  // Dark surfaces — imagery-first only (Cheetah live, lightbox)
  obsidian: "#0A0A0A",
  obsidianInk: "#F5F5F5",

  // ─── Legacy aliases (do not use in new code) ────────────────────────────
  // Old gold references resolve to ink so the UI stays coherent.
  // Old warm-paper references resolve to white.
  bg: "#FFFFFF",
  border: "#ECECEC",
  borderHover: "#D4D4D4",
  borderActive: "#1A1A1A",   // was gold; now ink
  hover: "#FCFCFC",
  text: "#1A1A1A",
  textMuted: "#A8A8A8",
  white: "#FFFFFF",
  black: "#1A1A1A",
  danger: "#8B3A2A",
  success: "#3D5A3A",
  darkBg: "#0A0A0A",
  darkText: "#F5F5F5",
  darkTextDim: "#6B6B6B",

  // Gold aliases — neutralized to ink. Kept only so legacy call-sites compile.
  gold: "#1A1A1A",
  goldInk: "#1A1A1A",
} as const;

export const fonts = {
  display: "'Cormorant Garamond', Georgia, serif",
  body: "'DM Sans', system-ui, sans-serif",
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
  "24": 96,
} as const;

export const spacing = {
  pageMobile: "20px",
  pageDesktop: "32px",
  sectionMobile: "20px",
  sectionDesktop: "24px",
  sectionMajor: "48px",
  cardPad: "20px",
  fieldStack: "16px",
  labelInput: "6px",
  iconText: "8px",
  rowMin: "44px",
} as const;

export const radius = {
  none: 0,
  full: 9999,
} as const;

export const motion = {
  fast: "120ms cubic-bezier(0.4, 0, 0.2, 1)",
  base: "220ms cubic-bezier(0.4, 0, 0.2, 1)",
  slow: "400ms cubic-bezier(0.4, 0, 0.2, 1)",
} as const;

export const fragments = {
  /** Brand moment — Cormorant only here. */
  display: {
    fontFamily: fonts.display,
    fontWeight: 400 as const,
    fontSize: 28,
    lineHeight: 1.15,
    letterSpacing: "-0.01em",
    color: colors.ink,
  } as const,
  h1: {
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
    fontSize: 15,
    lineHeight: 1.3,
    letterSpacing: "-0.005em",
    color: colors.ink,
  } as const,
  label: {
    fontFamily: fonts.body,
    fontSize: 10,
    fontWeight: 500 as const,
    letterSpacing: "0.12em",
    textTransform: "uppercase" as const,
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
    fontSize: 13,
    fontWeight: 400 as const,
    color: colors.ink,
    lineHeight: 1.55,
  } as const,
} as const;
