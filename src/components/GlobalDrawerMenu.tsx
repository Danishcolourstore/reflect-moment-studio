import { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { label: "Home", path: "/home" },
  { divider: true },
  { label: "Grid Builder", path: "/studio/storybook" },
  { label: "Album", path: "/dashboard/album-designer" },
  { label: "Website", path: "/dashboard/website-builder" },
  { label: "Business Suite", path: "/dashboard/business" },
  { label: "Analytics", path: "/dashboard/analytics" },
  { label: "Clients", path: "/dashboard/clients" },
  { label: "Brand Studio", path: "/dashboard/branding" },
] as const;

export function useDrawerMenu() {
  const [open, setOpen] = useState(false);
  const toggle = useCallback(() => setOpen((o) => !o), []);
  const close = useCallback(() => setOpen(false), []);
  return { open, toggle, close, setOpen };
}

export function HamburgerButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="text-xs font-medium text-ink"
      aria-label="Menu"
    >
      Menu
    </button>
  );
}

export function DrawerMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    if (open) {
      setMounted(true);
      requestAnimationFrame(() => setAnimating(true));
    } else if (mounted) {
      setAnimating(false);
      const timer = setTimeout(() => setMounted(false), 280);
      return () => clearTimeout(timer);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const handleNav = (path: string) => {
    navigate(path);
    onClose();
  };

  const handleSignOut = async () => {
    await signOut();
    onClose();
    navigate("/login");
  };

  const isActive = (path: string) =>
    path === "/home"
      ? location.pathname === path
      : location.pathname.startsWith(path);

  if (!mounted) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={cn(
          "fixed inset-0 z-[190] bg-ink/30 backdrop-blur-sm transition-opacity duration-base ease-v2-spring",
          animating ? "opacity-100" : "opacity-0",
        )}
      />

      {/* Panel */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-[200] flex w-[80vw] max-w-[360px] flex-col",
          "border-r border-rule bg-paper",
          "transition-transform duration-base ease-v2-spring",
          animating ? "translate-x-0" : "-translate-x-full",
        )}
        style={{ height: "100dvh" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-rule px-6 py-4">
          <span className="font-serif text-lg text-ink">Mirror</span>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center text-ink-tertiary transition-colors hover:text-ink"
            aria-label="Close menu"
          >
            <X size={16} strokeWidth={1.5} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-4 pt-4">
          {NAV_ITEMS.map((item, i) => {
            if ("divider" in item) {
              return (
                <div key={`div-${i}`} className="my-3 h-px bg-rule" />
              );
            }
            const active = isActive(item.path);
            return (
              <button
                key={item.path}
                onClick={() => handleNav(item.path)}
                className={cn(
                  "flex w-full items-center rounded-lg px-3 py-3 text-left text-[15px] transition-colors duration-fast",
                  "active:scale-[0.98]",
                  active
                    ? "bg-wash-strong font-medium text-ink"
                    : "font-normal text-ink-muted hover:bg-wash hover:text-ink",
                )}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-rule px-6 py-4 space-y-1">
          <button
            onClick={() => handleNav("/dashboard/profile")}
            className="block w-full py-2 text-left text-sm text-ink transition-colors hover:text-ink-secondary active:scale-[0.98]"
          >
            Settings
          </button>
          <button
            onClick={handleSignOut}
            className="block w-full py-2 text-left text-sm text-ink-muted transition-colors hover:text-ink active:scale-[0.98]"
          >
            Sign out
          </button>
        </div>
      </aside>
    </>
  );
}
