/**
 * MirrorAI Unified Design System — Dark Cinematic
 * Single source of truth for all visual tokens.
 */

export const colors = {
  /** Primary background — near black */
  bg: "#0A0A0A",
  /** Card / panel backgrounds */
  surface: "#121212",
  /** Elevated surfaces */
  surface2: "#1A1A1A",
  /** Default border */
  border: "#242424",
  /** Active / focused border */
  borderActive: "rgba(212,175,55,0.4)",
  /** Primary accent — rich gold */
  gold: "#D4AF37",
  /** Gold at low opacity for backgrounds */
  goldDim: "rgba(212,175,55,0.08)",
  /** Primary text — warm off-white */
  text: "#E8E5E0",
  /** Secondary / dimmed text */
  textDim: "#8A8A8A",
  /** Muted / tertiary text */
  textMuted: "#555555",
  /** Pure white */
  white: "#FFFFFF",
  /** Pure black */
  black: "#000000",
  /** Error / destructive */
  danger: "#E85D5D",
  /** Success */
  success: "#5CB85C",
} as const;

/** White editorial palette for public pages */
export const editorialColors = {
  bg: "#FFFFFF",
  surface: "#FAFAFA",
  border: "#EEEEEE",
  text: "#1A1A1A",
  textDim: "#666666",
  textMuted: "#999999",
  gold: "#D4AF37",
} as const;

export const fonts = {
  /** Editorial display headings */
  display: "'Cormorant Garamond', Georgia, serif",
  /** Body / UI text */
  body: "'DM Sans', system-ui, sans-serif",
  /** Code / monospace */
  mono: "'JetBrains Mono', monospace",
} as const;

export const spacing = {
  pageMobile: "20px",
  pageDesktop: "48px",
  sectionMobile: "48px",
  sectionDesktop: "72px",
  cardMobile: "20px",
  cardDesktop: "28px",
} as const;

export const radius = {
  none: "0px",
  sm: "6px",
  md: "12px",
  lg: "16px",
} as const;

export const fragments = {
  goldBar: { width: 40, height: 2, background: colors.gold } as const,
  sectionHeading: {
    fontFamily: fonts.display,
    fontWeight: 300 as const,
    letterSpacing: "0.06em",
    color: colors.text,
  } as const,
  label: {
    fontFamily: fonts.body,
    fontSize: 10,
    fontWeight: 500 as const,
    letterSpacing: "0.2em",
    textTransform: "uppercase" as const,
    color: colors.textMuted,
  } as const,
  bodyText: {
    fontFamily: fonts.body,
    fontSize: 14,
    fontWeight: 400 as const,
    color: colors.textDim,
    lineHeight: 1.6,
  } as const,
  glass: {
    background: colors.surface,
    boxShadow: "0 2px 16px rgba(0,0,0,0.2)",
    border: `1px solid ${colors.border}`,
    borderRadius: radius.lg,
  } as const,
} as const;
