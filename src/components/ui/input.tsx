import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Input — Pixieset-Minimal chrome primitive.
 * Used for search, filter, toolbar fields.
 * 36px height, 1px --rule-strong border, no radius, no ring.
 *
 * For auth & long-form fields use <FormInput> (bottom-rule only).
 */
const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-9 w-full border border-[var(--rule-strong)] bg-[var(--surface)] px-3 py-2 text-[13px] text-[var(--ink)] placeholder:text-[var(--ink-whisper)] focus:border-[var(--ink)] focus:outline-none disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

/**
 * FormInput — bottom-rule only. No box. The signal that this is a workshop.
 * Used in auth, settings, creation drawers.
 */
const FormInput = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-11 w-full bg-transparent border-0 border-b border-[var(--rule)] px-0 py-3 text-[15px] text-[var(--ink)] placeholder:text-[var(--ink-whisper)] focus:outline-none focus:border-b-2 focus:border-[var(--ink)] focus:pb-[11px] disabled:opacity-50 transition-colors",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
FormInput.displayName = "FormInput";

export { Input, FormInput };
