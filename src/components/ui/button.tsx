import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Button — luxury editorial primitive.
 * Zero radius (except `icon` size, which is the documented circular exception).
 * No ring focus, no scale, no translate, no shadow.
 */
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap focus:outline-none disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        // Primary — solid gold. The single strongest action on a page.
        default:
          "h-11 px-6 bg-[var(--gold)] text-[var(--paper)] uppercase tracking-[0.06em] font-medium text-[13px] border-0 hover:bg-[var(--gold-ink)] disabled:opacity-40 transition-colors duration-[120ms]",
        // Secondary — bordered, sentence case
        secondary:
          "h-11 px-6 bg-transparent text-[var(--ink)] border border-[var(--rule)] text-[13px] font-medium tracking-[0.06em] hover:border-[var(--rule-strong)] disabled:opacity-40 transition-colors duration-[120ms]",
        // Outline — alias of secondary for shadcn API parity
        outline:
          "h-11 px-6 bg-transparent text-[var(--ink)] border border-[var(--rule)] text-[13px] font-medium tracking-[0.06em] hover:border-[var(--rule-strong)] disabled:opacity-40 transition-colors duration-[120ms]",
        // Ghost — chromeless
        ghost:
          "h-11 px-6 bg-transparent text-[var(--ink)] border-0 text-[13px] font-medium tracking-[0.06em] hover:bg-[var(--wash)] disabled:opacity-40 transition-colors duration-[120ms]",
        // Destructive — bordered alert
        destructive:
          "h-11 px-6 bg-transparent text-[var(--alert)] border border-[var(--alert)] uppercase tracking-[0.06em] font-medium text-[13px] hover:bg-[rgba(163,85,58,0.06)] disabled:opacity-40 transition-colors duration-[120ms]",
        // Link — text only
        link:
          "h-11 px-2 bg-transparent text-[var(--ink)] underline underline-offset-2 decoration-1 text-[13px] font-medium hover:text-[var(--gold-ink)] disabled:opacity-40 transition-colors duration-[120ms]",
      },
      size: {
        default: "",
        lg: "",
        sm: "!h-8 !px-4 !text-[12px]",
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
