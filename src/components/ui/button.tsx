import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Button — UI Parameter System v2 §5
 *
 * Variants:
 *   default      → Primary: 48px, ink bg, white text, ALL CAPS, --radius-sharp
 *   secondary    → 48px, transparent, 1px ink border, ALL CAPS, --radius-sharp
 *   outline      → alias of secondary (shadcn API parity)
 *   soft         → 40px, wash-strong bg, --radius-soft (contextual/inline)
 *   ghost        → chromeless, hover underline
 *   destructive  → alert text/border, --radius-sharp
 *   link         → text + underline only
 *
 * Loading state: pass `loading` — replaces label with 16px spinner,
 * disables button immediately, spinner appears at 100ms.
 *
 * Active feedback: scale(0.97) over 80ms (v2 §10).
 */
const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2 whitespace-nowrap select-none",
    "focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ink)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--paper)]",
    "disabled:pointer-events-none disabled:opacity-35",
    "[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
    "transition-[background-color,border-color,opacity,transform] duration-fast ease-v2-press",
    "active:scale-[0.97] active:duration-instant",
  ].join(" "),
  {
    variants: {
      variant: {
        // Primary — solid ink, ALL CAPS, sharp
        default: [
          "h-12 px-7 bg-[var(--ink)] text-white border-0",
          "text-[13px] font-semibold tracking-[0.08em] uppercase",
          "rounded-sharp",
          "hover:bg-[var(--ink-secondary)]",
        ].join(" "),
        // Secondary — bordered, ALL CAPS, sharp
        secondary: [
          "h-12 px-7 bg-transparent text-[var(--ink)] border border-[var(--ink)]",
          "text-[13px] font-semibold tracking-[0.08em] uppercase",
          "rounded-sharp",
          "hover:bg-[var(--wash)]",
        ].join(" "),
        // Outline — alias of secondary
        outline: [
          "h-12 px-7 bg-transparent text-[var(--ink)] border border-[var(--ink)]",
          "text-[13px] font-semibold tracking-[0.08em] uppercase",
          "rounded-sharp",
          "hover:bg-[var(--wash)]",
        ].join(" "),
        // Soft — contextual, inline-card actions
        soft: [
          "h-10 px-5 bg-[var(--wash-strong)] text-[#3A3A38] border-0",
          "text-[13px] font-medium tracking-[0.04em]",
          "rounded-soft",
          "hover:bg-[var(--wash-deep)]",
        ].join(" "),
        // Ghost — chromeless
        ghost: [
          "h-12 px-3 bg-transparent text-[var(--ink)] border-0",
          "text-[13px] font-medium",
          "rounded-sharp",
          "hover:underline underline-offset-4",
        ].join(" "),
        // Destructive — alert
        destructive: [
          "h-12 px-7 bg-transparent text-[var(--alert)] border border-[var(--alert)]",
          "text-[13px] font-semibold tracking-[0.08em] uppercase",
          "rounded-sharp",
          "hover:bg-[rgba(192,57,43,0.04)]",
        ].join(" "),
        // Link — text only
        link: [
          "h-auto p-0 bg-transparent text-[var(--ink)] border-0",
          "underline underline-offset-2 decoration-1",
          "text-[13px] font-normal",
          "hover:opacity-70 active:scale-100",
        ].join(" "),
      },
      size: {
        default: "",
        lg: "!h-14 !px-8 !text-[14px]",
        sm: "!h-9 !px-3 !text-[12px] !tracking-[0.04em]",
        icon: "!h-11 !w-11 !p-0 !rounded-pill",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading = false, disabled, children, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    const showSpinner = loading;
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        {...props}
      >
        {showSpinner ? (
          <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.5} aria-hidden="true" />
        ) : (
          children
        )}
      </Comp>
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
