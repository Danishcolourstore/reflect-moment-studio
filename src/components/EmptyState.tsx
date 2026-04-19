/**
 * EmptyState — editorial empty state.
 * Typography and space only. No icons. No illustrations. No borders.
 *
 * Usage:
 *   <EmptyState>No events.</EmptyState>
 *   <EmptyState action={{ label: "Create event", onClick: openModal }}>No events.</EmptyState>
 *   <EmptyState action={{ label: "Browse", to: "/events", variant: "ghost" }}>
 *     No favorites.
 *   </EmptyState>
 */

import { ReactNode } from "react";
import { Link } from "react-router-dom";

interface ActionConfig {
  label: string;
  onClick?: () => void;
  to?: string;
  /** "primary" = solid gold (only action on page); "ghost" = bordered (other content exists). Default "ghost". */
  variant?: "primary" | "ghost";
}

interface EmptyStateProps {
  children: ReactNode;
  action?: ActionConfig;
  /** Vertical breathing room. "page" = 60vh (full surfaces); "panel" = 96px; "inline" = 64px. Default "panel". */
  size?: "page" | "panel" | "inline";
  className?: string;
}

const INK = "#1A1917";
const PAPER = "#FAFAF8";
const GOLD = "#1A1A1A";
const GOLD_INK = "#1A1A1A";
const RULE = "#E8E6E1";
const RULE_STRONG = "#D6D3CC";

const HEADING_STYLE: React.CSSProperties = {
  fontFamily: "'Cormorant Garamond', Georgia, serif",
  fontSize: 28,
  fontWeight: 300,
  color: INK,
  margin: 0,
  lineHeight: 1.2,
  letterSpacing: 0,
  textAlign: "center",
};

const BUTTON_BASE: React.CSSProperties = {
  height: 44,
  padding: "0 24px",
  fontFamily: "'DM Sans', sans-serif",
  fontSize: 13,
  fontWeight: 500,
  letterSpacing: "0.06em",
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  textDecoration: "none",
  transition: "background-color 120ms cubic-bezier(0.4, 0, 0.2, 1), border-color 120ms cubic-bezier(0.4, 0, 0.2, 1)",
};

function buttonStyle(variant: "primary" | "ghost"): React.CSSProperties {
  if (variant === "primary") {
    return {
      ...BUTTON_BASE,
      background: GOLD,
      color: PAPER,
      border: "none",
      textTransform: "uppercase",
    };
  }
  return {
    ...BUTTON_BASE,
    background: "transparent",
    color: INK,
    border: `1px solid ${RULE}`,
  };
}

function buttonHoverIn(variant: "primary" | "ghost") {
  return (e: React.MouseEvent<HTMLElement>) => {
    if (variant === "primary") e.currentTarget.style.background = GOLD_INK;
    else e.currentTarget.style.borderColor = RULE_STRONG;
  };
}

function buttonHoverOut(variant: "primary" | "ghost") {
  return (e: React.MouseEvent<HTMLElement>) => {
    if (variant === "primary") e.currentTarget.style.background = GOLD;
    else e.currentTarget.style.borderColor = RULE;
  };
}

export function EmptyState({ children, action, size = "panel", className }: EmptyStateProps) {
  const minHeightMap = { page: "60vh" as const, panel: undefined, inline: undefined };
  const paddingMap = { page: 0, panel: 96, inline: 64 };

  const containerStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 24,
    minHeight: minHeightMap[size],
    paddingTop: paddingMap[size],
    paddingBottom: paddingMap[size],
    width: "100%",
  };

  const variant = action?.variant ?? "ghost";

  return (
    <div className={className} style={containerStyle}>
      <h2 style={HEADING_STYLE}>{children}</h2>
      {action && (
        action.to ? (
          <Link
            to={action.to}
            style={buttonStyle(variant)}
            onMouseEnter={buttonHoverIn(variant)}
            onMouseLeave={buttonHoverOut(variant)}
          >
            {variant === "primary" ? action.label.toUpperCase() : action.label}
          </Link>
        ) : (
          <button
            type="button"
            onClick={action.onClick}
            style={buttonStyle(variant)}
            onMouseEnter={buttonHoverIn(variant)}
            onMouseLeave={buttonHoverOut(variant)}
          >
            {variant === "primary" ? action.label.toUpperCase() : action.label}
          </button>
        )
      )}
    </div>
  );
}

export default EmptyState;
