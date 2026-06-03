import { forwardRef } from "react";
import { cn } from "@/lib/utils";

interface FabProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode;
  label?: string;
}

/**
 * Floating Action Button — single source for all floating actions.
 *
 * Always round, no border, safe-area-aware positioning.
 * Place with Tailwind positioning classes on the consumer side:
 *   <Fab className="fixed bottom-[calc(80px+env(safe-area-inset-bottom))] right-5" ... />
 */
const Fab = forwardRef<HTMLButtonElement, FabProps>(
  ({ icon, label, className, ...props }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        className={cn(
          "z-50 flex h-14 w-14 items-center justify-center",
          "rounded-full bg-ink text-paper shadow-float",
          "transition-transform duration-fast active:scale-95",
          "md:hidden",
          className,
        )}
        {...props}
      >
        {icon}
        {label && <span className="sr-only">{label}</span>}
      </button>
    );
  },
);
Fab.displayName = "Fab";

export { Fab };
