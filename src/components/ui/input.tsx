import * as React from "react";
import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Input — UI Parameter System v2 §5/§10
 *
 * 44px touch target (48px tall), 1px --rule-strong border, --radius-sharp.
 * Focus → 1px ink border, no ring.
 * Error → 1px alert border + inline icon+message slide-down (200ms).
 *
 * For auth & long-form fields use <FormInput> (bottom-rule only).
 */
interface InputProps extends React.ComponentProps<"input"> {
  error?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, ...props }, ref) => {
    const id = props.id || props.name;
    const errorId = error ? `${id}-error` : undefined;
    return (
      <div className="w-full">
        <input
          type={type}
          ref={ref}
          aria-invalid={error ? true : undefined}
          aria-describedby={errorId}
          className={cn(
            "flex h-11 w-full bg-[var(--surface)] px-3 py-2",
            "text-[15px] text-[var(--ink)] placeholder:text-[var(--ink-whisper)]",
            "border rounded-sharp",
            "transition-[border-color] duration-fast ease-v2-press",
            "focus:outline-none disabled:cursor-not-allowed disabled:opacity-50",
            error
              ? "border-[var(--alert)] focus:border-[var(--alert)]"
              : "border-[var(--rule-strong)] focus:border-[var(--ink)]",
            className,
          )}
          {...props}
        />
        {error && (
          <p
            id={errorId}
            role="alert"
            className="field-error mt-1.5 flex items-center gap-1.5 text-xs text-[var(--alert)]"
          >
            <AlertCircle className="h-3.5 w-3.5 shrink-0" strokeWidth={1.5} aria-hidden="true" />
            <span>{error}</span>
          </p>
        )}
      </div>
    );
  },
);
Input.displayName = "Input";

/**
 * FormInput — bottom-rule only. Auth, settings, creation drawers.
 * 48px height. Error pattern matches Input.
 */
const FormInput = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, ...props }, ref) => {
    const id = props.id || props.name;
    const errorId = error ? `${id}-error` : undefined;
    return (
      <div className="w-full">
        <input
          type={type}
          ref={ref}
          aria-invalid={error ? true : undefined}
          aria-describedby={errorId}
          className={cn(
            "flex h-12 w-full bg-transparent px-0 py-3",
            "text-[15px] text-[var(--ink)] placeholder:text-[var(--ink-whisper)]",
            "border-0 border-b transition-[border-color,padding] duration-fast ease-v2-press",
            "focus:outline-none focus:border-b-2 focus:pb-[11px]",
            "disabled:opacity-50",
            error
              ? "border-[var(--alert)] focus:border-[var(--alert)]"
              : "border-[var(--rule)] focus:border-[var(--ink)]",
            className,
          )}
          {...props}
        />
        {error && (
          <p
            id={errorId}
            role="alert"
            className="field-error mt-1.5 flex items-center gap-1.5 text-xs text-[var(--alert)]"
          >
            <AlertCircle className="h-3.5 w-3.5 shrink-0" strokeWidth={1.5} aria-hidden="true" />
            <span>{error}</span>
          </p>
        )}
      </div>
    );
  },
);
FormInput.displayName = "FormInput";

export { Input, FormInput };
