import { useEffect, useState } from "react";

export interface TabBarItem {
  id: string;
  label: string;
}

interface ScrollableTabBarProps {
  tabs: TabBarItem[];
  activeId: string;
  onChange: (id: string) => void;
  /** Grid Builder uses fixed dark chrome regardless of app theme */
  variant?: "auto" | "dark" | "light";
}

function resolveDark(variant: ScrollableTabBarProps["variant"]) {
  if (variant === "dark") return true;
  if (variant === "light") return false;
  return typeof document !== "undefined" && document.documentElement.classList.contains("dark");
}

export function ScrollableTabBar({
  tabs,
  activeId,
  onChange,
  variant = "auto",
}: ScrollableTabBarProps) {
  const [isDark, setIsDark] = useState(() => resolveDark(variant));

  useEffect(() => {
    if (variant !== "auto") {
      setIsDark(variant === "dark");
      return;
    }
    const root = document.documentElement;
    const observer = new MutationObserver(() => setIsDark(root.classList.contains("dark")));
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });
    setIsDark(root.classList.contains("dark"));
    return () => observer.disconnect();
  }, [variant]);

  const activeColor = isDark ? "#FFFFFF" : "#000000";
  const inactiveColor = "#555555";

  return (
    <div
      className="relative"
      style={{ borderBottom: "1px solid var(--border-default, #E8E6E1)" }}
    >
      <div
        className="studio-tabs-scroll flex"
        style={{
          overflowX: "auto",
          whiteSpace: "nowrap",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
      >
        {tabs.map((tab) => {
          const active = tab.id === activeId;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              style={{
                flexShrink: 0,
                padding: "12px 16px",
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 11,
                fontWeight: 500,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                background: "none",
                border: "none",
                borderBottom: active
                  ? `1.5px solid ${activeColor}`
                  : "1.5px solid transparent",
                color: active ? activeColor : inactiveColor,
                cursor: "pointer",
                marginBottom: -1,
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
      <div
        className="pointer-events-none absolute right-0 top-0 h-full"
        style={{
          width: 32,
          background: "linear-gradient(to left, var(--bg-primary, #FAFAF8), transparent)",
        }}
      />
    </div>
  );
}
