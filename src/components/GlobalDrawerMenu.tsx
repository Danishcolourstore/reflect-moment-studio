import { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { colors, fonts } from "@/styles/design-tokens";

const ease = [0.16, 1, 0.3, 1] as const;

const NAV_ITEMS = [
  { label: "Home", path: "/home" },
  { label: "Events", path: "/dashboard/events" },
  { label: "Portfolio", path: "/dashboard/website-editor" },
  { label: "Storybook", path: "/dashboard/storybook" },
];

const MORE_ITEMS = [
  { label: "Cheetah", path: "/dashboard/cheetah-live" },
  { label: "Retouch", path: "/colour-store" },
  { label: "Clients", path: "/dashboard/clients" },
  { label: "Analytics", path: "/dashboard/analytics" },
  { label: "Settings", path: "/dashboard/profile" },
  { label: "Billing", path: "/dashboard/billing" },
];

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
      className="cursor-pointer z-50"
      style={{
        background: "none",
        border: "none",
        fontFamily: fonts.body,
        fontSize: 11,
        fontWeight: 700,
        color: "#1A1A1A",
        letterSpacing: "0.2em",
      }}
      aria-label="Menu"
    >
      MENU
    </button>
  );
}

export function DrawerMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut, user } = useAuth();
  const [studioName, setStudioName] = useState("");
  const [showMore, setShowMore] = useState(false);

  useEffect(() => {
    if (!user) return;
    (supabase.from("profiles").select("studio_name") as any)
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }: any) => {
        if (data?.studio_name) setStudioName(data.studio_name);
      });
  }, [user]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) setShowMore(false);
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

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-[190]"
            style={{ background: "rgba(0,0,0,0.15)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={onClose}
          />

          <motion.aside
            className="fixed top-0 right-0 z-[200] h-[100dvh] w-[82%] max-w-[360px] overflow-y-auto"
            style={{ background: "#FFFFFF", boxShadow: "-8px 0 32px rgba(0,0,0,0.08)" }}
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.45, ease }}
          >
            <div className="flex flex-col min-h-full px-8 pt-6 pb-10">
              <div className="flex items-center justify-between mb-10">
                <span
                  style={{
                    fontFamily: fonts.display,
                    fontSize: 13,
                    fontWeight: 500,
                    color: colors.gold,
                    letterSpacing: "0.2em",
                  }}
                >
                  MirrorAI
                </span>
                <button
                  onClick={onClose}
                  style={{
                    fontFamily: fonts.body,
                    fontSize: 11,
                    fontWeight: 600,
                    color: "#999999",
                    letterSpacing: "0.2em",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  CLOSE
                </button>
              </div>

              <nav className="flex-1">
                <AnimatePresence mode="wait">
                  {!showMore ? (
                    <motion.div
                      key="main"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3, ease }}
                    >
                      {NAV_ITEMS.map((item, i) => {
                        const isActive = location.pathname === item.path;
                        return (
                          <motion.button
                            key={item.path}
                            className="block w-full text-left py-2"
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.06, duration: 0.4, ease }}
                            onClick={() => handleNav(item.path)}
                          >
                            <span
                              style={{
                                fontFamily: fonts.display,
                                fontSize: 42,
                                fontWeight: isActive ? 600 : 300,
                                color: isActive ? colors.gold : "#999999",
                                letterSpacing: "-0.01em",
                                lineHeight: 1.15,
                                display: "block",
                                transition: "color 0.2s ease",
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.color = "#1A1A1A")}
                              onMouseLeave={(e) =>
                                (e.currentTarget.style.color = isActive ? colors.gold : "#999999")
                              }
                            >
                              {item.label}
                            </span>
                          </motion.button>
                        );
                      })}

                      <motion.button
                        className="block w-full text-left py-2 mt-2"
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: NAV_ITEMS.length * 0.06, duration: 0.4, ease }}
                        onClick={() => setShowMore(true)}
                      >
                        <span
                          style={{
                            fontFamily: fonts.display,
                            fontSize: 42,
                            fontWeight: 300,
                            color: "#CCCCCC",
                            letterSpacing: "-0.01em",
                            lineHeight: 1.15,
                            display: "block",
                          }}
                        >
                          More
                        </span>
                      </motion.button>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="more"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3, ease }}
                    >
                      <button
                        onClick={() => setShowMore(false)}
                        className="flex items-center gap-2 mb-8"
                        style={{
                          fontFamily: fonts.body,
                          fontSize: 10,
                          color: "#999999",
                          letterSpacing: "0.2em",
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                        }}
                      >
                        ← BACK
                      </button>

                      {MORE_ITEMS.map((item, i) => (
                        <motion.button
                          key={item.path}
                          className="block w-full text-left py-2"
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.05, duration: 0.3, ease }}
                          onClick={() => handleNav(item.path)}
                        >
                          <span
                            style={{
                              fontFamily: fonts.display,
                              fontSize: 36,
                              fontWeight: 300,
                              color: "#666666",
                              letterSpacing: "-0.01em",
                              lineHeight: 1.2,
                              display: "block",
                              transition: "color 0.2s ease",
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.color = "#1A1A1A")}
                            onMouseLeave={(e) => (e.currentTarget.style.color = "#666666")}
                          >
                            {item.label}
                          </span>
                        </motion.button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </nav>

              <div className="mt-auto pt-8 border-t" style={{ borderColor: "#EEEEEE" }}>
                {studioName && (
                  <p
                    className="mb-3"
                    style={{
                      fontFamily: fonts.display,
                      fontSize: 14,
                      color: "#999999",
                      letterSpacing: "0.05em",
                    }}
                  >
                    {studioName}
                  </p>
                )}
                <button
                  onClick={handleSignOut}
                  style={{
                    fontFamily: fonts.body,
                    fontSize: 10,
                    color: "#999999",
                    letterSpacing: "0.2em",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "#1A1A1A")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "#999999")}
                >
                  SIGN OUT
                </button>
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
