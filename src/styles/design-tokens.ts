/**
 * MirrorAI Unified Design System — White Editorial
 * Single source of truth for all visual tokens.
 * Import from here — never hardcode colors, fonts, or spacing in components.
 */

export const colors = {
  /** Primary background — pure white */
  bg: "#FFFFFF",
  /** Card / panel backgrounds */
  surface: "#FAFAFA",
  /** Elevated surfaces (modals, popovers) */
  surface2: "#F5F5F5",
  /** Default border */
  border: "#EEEEEE",
  /** Active / focused border */
  borderActive: "rgba(201,169,110,0.4)",
  /** Primary accent — warm gold */
  gold: "#C9A96E",
  /** Gold at low opacity for backgrounds */
  goldDim: "rgba(201,169,110,0.08)",
  /** Warm cream for light text on dark overlays */
  cream: "#1A1A1A",
  /** Primary text */
  text: "#1A1A1A",
  /** Secondary / dimmed text */
  textDim: "#666666",
  /** Muted / tertiary text */
  textMuted: "#999999",
  /** Pure white */
  white: "#FFFFFF",
  /** Pure black */
  black: "#000000",
  /** Error / destructive */
  danger: "#E85D5D",
  /** Success */
  success: "#5CB85C",
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
  /** Horizontal page padding */
  pageMobile: "20px",
  pageDesktop: "48px",
  /** Vertical section spacing */
  sectionMobile: "48px",
  sectionDesktop: "72px",
  /** Card internal padding */
  cardMobile: "20px",
  cardDesktop: "28px",
} as const;

export const radius = {
  /** Editorial / portfolio — sharp edges */
  none: "0px",
  /** Small UI elements */
  sm: "8px",
  /** Cards, modals */
  md: "16px",
  /** Large panels */
  lg: "20px",
} as const;

/** Common style fragments for quick composition */
export const fragments = {
  /** Gold underline accent bar */
  goldBar: { width: 40, height: 2, background: colors.gold } as const,
  /** Section heading style */
  sectionHeading: {
    fontFamily: fonts.display,
    fontWeight: 300 as const,
    letterSpacing: "0.06em",
    color: colors.text,
  } as const,
  /** Label style (tiny uppercase) */
  label: {
    fontFamily: fonts.body,
    fontSize: 10,
    fontWeight: 500 as const,
    letterSpacing: "0.2em",
    textTransform: "uppercase" as const,
    color: colors.textMuted,
  } as const,
  /** Body text */
  bodyText: {
    fontFamily: fonts.body,
    fontSize: 14,
    fontWeight: 400 as const,
    color: colors.textDim,
    lineHeight: 1.6,
  } as const,
  /** Soft card background */
  glass: {
    background: "#FFFFFF",
    boxShadow: "0 2px 16px rgba(0,0,0,0.04)",
    border: `1px solid ${colors.border}`,
    borderRadius: radius.lg,
  } as const,
} as const;
