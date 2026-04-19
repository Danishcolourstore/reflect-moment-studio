/**
 * MirrorAI Design System — Luxury Editorial
 * Single source of truth for all visual tokens.
 *
 * RULES (locked):
 *   - One gold only: #B8953F. Never #C8A97E.
 *   - Body muted text: #6B6962 (AA-passing). Never #94918B.
 *   - 11-value spacing scale. No ad-hoc values.
 *   - Zero radius except: avatar/icon-circle (full), toast (2), status dot (full).
 *
 * NOTE: The legacy aliases (`textDim`, `goldDim`, `goldSoft`, `brandGold`)
 * have been removed. Use `inkMuted` and `gold` directly. Aliases are how
 * the old palette leaked back in — never reintroduce them.
 */

export const colors = {
  // Surfaces
  paper: "#FAFAF8",         // app background
  surface: "#FFFFFF",       // cards, inputs
  wash: "#F4F3F0",          // hover surface, skeleton base
  rule: "#E8E6E1",          // borders, dividers
  ruleStrong: "#D6D3CC",    // hover borders, focus

  // Ink (text)
  ink: "#1A1917",           // primary
  inkMuted: "#6B6962",      // secondary (AA on white)
  inkWhisper: "#A8A6A0",    // placeholder/tertiary only

  // The one gold
  gold: "#B8953F",
  goldInk: "#8B6F2E",       // hover/pressed

  // Semantic
  alert: "#A3553A",
  go: "#5C7C5A",

  // Dark surfaces — imagery-first only (Cheetah live, lightbox)
  obsidian: "#0A0A0A",
  obsidianInk: "#F5F5F5",

  // ─── Minimal legacy aliases retained for non-token consumers only.
  // Do not add more. Do not reintroduce textDim / goldDim / brandGold.
  bg: "#FAFAF8",
  border: "#E8E6E1",
  borderHover: "#D6D3CC",
  borderActive: "#B8953F",
  hover: "#F4F3F0",
  text: "#1A1917",
  textMuted: "#A8A6A0",
  white: "#FFFFFF",
  black: "#1A1917",
  danger: "#A3553A",
  success: "#5C7C5A",
  darkBg: "#0A0A0A",
  darkText: "#F5F5F5",
  darkTextDim: "#6B6B6B",
} as const;

export const fonts = {
  display: "'Cormorant Garamond', Georgia, serif",
  body: "'DM Sans', system-ui, sans-serif",
} as const;

/** 11-value spacing scale. The only legal values. */
export const space = {
  "2": 2,
  "4": 4,
  "8": 8,
  "12": 12,
  "16": 16,
  "24": 24,
  "32": 32,
  "48": 48,
  "64": 64,
  "96": 96,
  "128": 128,
} as const;

export const spacing = {
  pageMobile: "24px",
  pageDesktop: "64px",
  sectionMobile: "48px",
  sectionDesktop: "64px",
  sectionMajor: "96px",
  cardPad: "24px",
  fieldStack: "20px",
  labelInput: "8px",
  iconText: "12px",
  rowMin: "56px",
} as const;

export const radius = {
  none: 0,
  toast: 2,
  full: 9999,
} as const;

export const motion = {
  fast: "120ms cubic-bezier(0.4, 0, 0.2, 1)",
  base: "220ms cubic-bezier(0.4, 0, 0.2, 1)",
  slow: "400ms cubic-bezier(0.4, 0, 0.2, 1)",
} as const;

export const fragments = {
  display: {
    fontFamily: fonts.display,
    fontWeight: 300 as const,
    fontSize: 56,
    lineHeight: 1.05,
    letterSpacing: "-0.01em",
    color: colors.ink,
  } as const,
  h1: {
    fontFamily: fonts.display,
    fontWeight: 300 as const,
    fontSize: 40,
    lineHeight: 1.1,
    letterSpacing: "-0.005em",
    color: colors.ink,
  } as const,
  sectionHeading: {
    fontFamily: fonts.display,
    fontWeight: 300 as const,
    letterSpacing: "0.03em",
    color: colors.ink,
  } as const,
  label: {
    fontFamily: fonts.body,
    fontSize: 11,
    fontWeight: 500 as const,
    letterSpacing: "0.12em",
    textTransform: "uppercase" as const,
    color: colors.inkMuted,
  } as const,
  meta: {
    fontFamily: fonts.body,
    fontSize: 12,
    fontWeight: 400 as const,
    letterSpacing: "0.01em",
    color: colors.inkMuted,
    fontVariantNumeric: "tabular-nums" as const,
  } as const,
  bodyText: {
    fontFamily: fonts.body,
    fontSize: 15,
    fontWeight: 400 as const,
    color: colors.ink,
    lineHeight: 1.6,
  } as const,
} as const;
