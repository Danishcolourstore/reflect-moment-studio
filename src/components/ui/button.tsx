import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Button — Pixieset-Minimal primitive.
 * Black ink primary. No uppercase. No radius. No shadow. No ring focus.
 * Sentence case. Loading state replaces text with em-dash.
 */
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap focus:outline-none disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 transition-opacity duration-[120ms]",
  {
    variants: {
      variant: {
        // Primary — solid ink
        default:
          "h-11 px-5 bg-[var(--ink)] text-white border-0 text-[12px] font-medium tracking-[0.02em] hover:opacity-90 disabled:opacity-50",
        // Secondary — bordered, transparent
        secondary:
          "h-11 px-5 bg-transparent text-[var(--ink)] border border-[var(--rule-strong)] text-[12px] font-medium tracking-[0.02em] hover:border-[var(--ink)] disabled:opacity-50 transition-colors",
        // Outline — alias of secondary for shadcn API parity
        outline:
          "h-11 px-5 bg-transparent text-[var(--ink)] border border-[var(--rule-strong)] text-[12px] font-medium tracking-[0.02em] hover:border-[var(--ink)] disabled:opacity-50 transition-colors",
        // Ghost — chromeless, underline on hover
        ghost:
          "h-11 px-3 bg-transparent text-[var(--ink)] border-0 text-[12px] font-medium tracking-[0.02em] hover:underline underline-offset-4 disabled:opacity-50",
        // Destructive — bordered alert text
        destructive:
          "h-11 px-5 bg-transparent text-[var(--alert)] border border-[var(--alert)] text-[12px] font-medium tracking-[0.02em] hover:bg-[rgba(139,58,42,0.04)] disabled:opacity-50 transition-colors",
        // Link — text only
        link:
          "h-auto p-0 bg-transparent text-[var(--ink)] underline underline-offset-2 decoration-1 text-[13px] font-normal hover:opacity-70 disabled:opacity-50",
      },
      size: {
        default: "",
        lg: "",
        sm: "!h-9 !px-3 !text-[12px]",
        icon: "!h-11 !w-11 !p-0 !rounded-full",
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
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
