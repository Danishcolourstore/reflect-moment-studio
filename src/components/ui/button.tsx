import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-[13px] font-medium tracking-[0.06em] ring-offset-background transition-colors duration-[120ms] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary focus-visible:ring-offset-0 disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        // Primary — solid gold. The single strongest action on a page.
        default: "bg-primary text-primary-foreground uppercase hover:bg-[#8B6F2E]",
        // Destructive — bordered, gold of caution
        destructive: "bg-transparent text-destructive border border-destructive uppercase hover:bg-destructive/5",
        // Secondary — bordered, sentence case
        outline: "border border-border bg-transparent text-foreground hover:border-[#D6D3CC]",
        secondary: "border border-border bg-transparent text-foreground hover:border-[#D6D3CC]",
        // Ghost — chromeless
        ghost: "text-foreground hover:bg-secondary",
        link: "text-foreground underline-offset-2 underline decoration-1 hover:text-[#8B6F2E]",
      },
      size: {
        // Two sizes only
        lg: "h-11 px-6 text-[13px]",      // 44px — primary page actions, mobile
        default: "h-11 px-6 text-[13px]", // alias of lg for backward compat
        sm: "h-8 px-4 text-[12px]",       // 32px — row actions, toolbars
        icon: "h-10 w-10 rounded-full",   // icon-only circular exception
      },
    },
    defaultVariants: {
      variant: "default",
      size: "lg",
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
