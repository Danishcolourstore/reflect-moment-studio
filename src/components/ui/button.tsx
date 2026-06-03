import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2 whitespace-nowrap select-none",
    "focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--paper)]",
    "disabled:pointer-events-none disabled:opacity-35",
    "[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
    "transition-[background-color,border-color,opacity,transform] duration-fast ease-v2-press",
    "active:scale-[0.98] active:duration-instant",
  ].join(" "),
  {
    variants: {
      variant: {
        default: [
          "h-12 px-7 bg-[var(--ink)] text-[var(--paper)] border-0",
          "text-[13px] font-medium tracking-[0.02em]",
          "hover:bg-[var(--ink-secondary)]",
        ].join(" "),
        secondary: [
          "h-12 px-7 bg-transparent text-[var(--ink)] border border-[var(--rule-strong)]",
          "text-[13px] font-medium tracking-[0.02em]",
          "hover:bg-[var(--wash)] hover:border-[var(--rule-active)]",
        ].join(" "),
        outline: [
          "h-12 px-7 bg-transparent text-[var(--ink)] border border-[var(--rule-strong)]",
          "text-[13px] font-medium tracking-[0.02em]",
          "hover:bg-[var(--wash)] hover:border-[var(--rule-active)]",
        ].join(" "),
        soft: [
          "h-10 px-5 bg-[var(--wash-strong)] text-[var(--ink)] border-0",
          "text-[13px] font-medium tracking-[0.02em]",
          "hover:bg-[var(--wash-deep)]",
        ].join(" "),
        ghost: [
          "h-10 px-3 bg-transparent text-[var(--ink)] border-0",
          "text-[13px] font-medium",
          "hover:bg-[var(--wash)]",
        ].join(" "),
        destructive: [
          "h-12 px-7 bg-transparent text-[var(--alert)] border border-[var(--alert)]",
          "text-[13px] font-medium tracking-[0.02em]",
          "hover:bg-[rgba(168,97,91,0.06)]",
        ].join(" "),
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
        sm: "!h-9 !px-3 !text-[12px]",
        icon: "!h-11 !w-11 !p-0",
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
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        {...props}
      >
        {loading ? (
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
