import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Input — luxury editorial primitive.
 * Zero radius. Gold border on focus. No ring. 44px height.
 */
const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-11 w-full border border-[var(--rule)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--ink)] placeholder:text-[var(--ink-whisper)] focus:border-[var(--gold)] focus:outline-none disabled:cursor-not-allowed disabled:opacity-40",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
