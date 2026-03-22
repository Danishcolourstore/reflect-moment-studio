/**
 * MirrorAI Unified Design System
 * Single source of truth for all visual tokens.
 * Import from here — never hardcode colors, fonts, or spacing in components.
 */

export const colors = {
  /** Primary background — deep cinematic black */
  bg: "#0A0A0B",
  /** Card / panel backgrounds */
  surface: "#141416",
  /** Elevated surfaces (modals, popovers) */
  surface2: "#1C1C20",
  /** Default border */
  border: "#2A2830",
  /** Active / focused border */
  borderActive: "rgba(200,169,110,0.4)",
  /** Primary accent — gold */
  gold: "#C8A97E",
  /** Gold at low opacity for backgrounds */
  goldDim: "rgba(200,169,110,0.12)",
  /** Warm cream for light text on dark */
  cream: "#F5F0EA",
  /** Primary text */
  text: "#EDEBE6",
  /** Secondary / dimmed text */
  textDim: "#8A8680",
  /** Muted / tertiary text */
  textMuted: "#5E5A52",
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
  pageDesktop: "40px",
  /** Vertical section spacing */
  sectionMobile: "40px",
  sectionDesktop: "60px",
  /** Card internal padding */
  cardMobile: "16px",
  cardDesktop: "24px",
} as const;

export const radius = {
  /** Editorial / portfolio — sharp edges */
  none: "0px",
  /** Small UI elements */
  sm: "8px",
  /** Cards, modals */
  md: "12px",
  /** Large panels */
  lg: "16px",
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
  /** Glass card background */
  glass: {
    background: "rgba(20,20,22,0.8)",
    backdropFilter: "blur(24px)",
    WebkitBackdropFilter: "blur(24px)",
    border: `1px solid ${colors.border}`,
    borderRadius: radius.md,
  } as const,
} as const;
