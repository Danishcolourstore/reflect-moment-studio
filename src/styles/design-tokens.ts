/**
 * MirrorAI Design System — Luxury Editorial
 * Single source of truth for all visual tokens.
 */

export const colors = {
  bg: "#FAFAF8",
  surface: "#FFFFFF",
  border: "#E8E6E1",
  borderHover: "#D4D1CB",
  hover: "#F4F3F0",
  gold: "#B8953F",
  text: "#1A1917",
  textDim: "#94918B",
  textMuted: "#C4C1BB",
  white: "#FFFFFF",
  black: "#1A1917",
  danger: "#A3553A",
  success: "#5C7C5A",
  /** Cull darkroom */
  darkBg: "#0A0A0A",
  darkText: "#F5F5F5",
  darkTextDim: "#6B6B6B",
} as const;

export const fonts = {
  display: "'Cormorant Garamond', Georgia, serif",
  body: "'DM Sans', system-ui, sans-serif",
} as const;

export const spacing = {
  pageMobile: "24px",
  pageDesktop: "48px",
  sectionMobile: "40px",
  sectionDesktop: "64px",
  cardGapMobile: "20px",
  cardGapDesktop: "32px",
} as const;

export const fragments = {
  sectionHeading: {
    fontFamily: fonts.display,
    fontWeight: 300 as const,
    letterSpacing: "0.03em",
    color: colors.text,
  } as const,
  label: {
    fontFamily: fonts.body,
    fontSize: 12,
    fontWeight: 400 as const,
    letterSpacing: "0.1em",
    textTransform: "uppercase" as const,
    color: colors.textDim,
  } as const,
  bodyText: {
    fontFamily: fonts.body,
    fontSize: 14,
    fontWeight: 400 as const,
    color: colors.textDim,
    lineHeight: 1.6,
  } as const,
} as const;
