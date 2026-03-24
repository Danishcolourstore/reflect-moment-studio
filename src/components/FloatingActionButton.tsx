import { ReactNode, useState } from "react";
import { Plus, X, Upload, Image, Palette, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

interface FABAction {
  icon: ReactNode;
  label: string;
  onClick?: () => void;
  href?: string;
  variant?: "default" | "primary" | "accent";
}

interface FloatingActionButtonProps {
  className?: string;
}

/**
 * Mobile floating action button with expandable quick actions
 * FIXED: mobile visibility, z-index, safe area, positioning
 */
export function FloatingActionButton({ className }: FloatingActionButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const actions: FABAction[] = [
    {
      icon: <Upload className="h-5 w-5" />,
      label: "Upload Photos",
      href: "/dashboard/events",
      variant: "primary",
    },
    {
      icon: <Image className="h-5 w-5" />,
      label: "Create Gallery",
      href: "/dashboard/events",
    },
    {
      icon: <Palette className="h-5 w-5" />,
      label: "Design Grid",
      href: "/dashboard/grid-builder",
    },
    {
      icon: <Zap className="h-5 w-5" />,
      label: "AI Cull",
      href: "/dashboard/cheetah-live",
      variant: "accent",
    },
  ];

  const handleAction = (action: FABAction) => {
    if (action.onClick) {
      action.onClick();
    } else if (action.href) {
      navigate(action.href);
    }
    setIsOpen(false);
  };

  return (
    <div
      className={cn(
        "fixed bottom-24 right-4 z-[9999] md:bottom-28 lg:hidden pb-[env(safe-area-inset-bottom)]",
        className,
      )}
    >
      {/* Action buttons */}
      <div
        className={cn(
          "absolute bottom-16 right-0 flex flex-col-reverse gap-3 transition-all duration-300",
          isOpen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none",
        )}
      >
        {actions.map((action, index) => (
          <button
            key={index}
            onClick={() => handleAction(action)}
            className={cn(
              "flex items-center gap-3 pl-4 pr-5 py-3 rounded-full shadow-lg transition-all duration-200",
              "bg-card border border-border hover:bg-secondary",
              action.variant === "primary" && "bg-primary text-primary-foreground border-primary hover:bg-primary/90",
              action.variant === "accent" && "bg-accent text-accent-foreground border-accent hover:bg-accent/90",
            )}
            style={{ animationDelay: `${index * 50}ms` }}
          >
            {action.icon}
            <span className="text-sm font-medium whitespace-nowrap">{action.label}</span>
          </button>
        ))}
      </div>

      {/* Main FAB */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center justify-center w-14 h-14 rounded-full shadow-xl transition-all duration-300 active:scale-95",
          "bg-primary text-primary-foreground hover:bg-primary/90",
          isOpen && "rotate-45",
        )}
        aria-label={isOpen ? "Close menu" : "Open quick actions"}
      >
        {isOpen ? <X className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-background/60 backdrop-blur-sm"
          style={{ zIndex: -1 }}
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
