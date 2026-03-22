import { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";

const ease = [0.16, 1, 0.3, 1] as const;

const NAV_ITEMS = [
  { label: "Home", path: "/home" },
  { label: "Workspace", path: "/dashboard" },
  { label: "Events", path: "/dashboard/events" },
  { label: "Albums", path: "/dashboard/album-designer" },
  { label: "Website", path: "/dashboard/website-editor" },
];

const MORE_ITEMS = [
  { label: "Colour Store", path: "/colour-store" },
  { label: "Storybook", path: "/dashboard/storybook" },
  { label: "Analytics", path: "/dashboard/analytics" },
  { label: "Clients", path: "/dashboard/clients" },
  { label: "Billing", path: "/dashboard/billing" },
  { label: "Settings", path: "/dashboard/settings" },
  { label: "Profile", path: "/dashboard/profile" },
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
        fontFamily: '"DM Sans", sans-serif',
        fontSize: 11,
        fontWeight: 700,
        color: "#F0EDE8",
        letterSpacing: "0.2em",
        textShadow: "0 1px 8px rgba(0,0,0,0.8)",
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

  // Reset more panel when menu closes
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
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-[190]"
            style={{ background: "rgba(0,0,0,0.5)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={onClose}
          />

          {/* Drawer — slides from RIGHT like Naman Verma */}
          <motion.aside
            className="fixed top-0 right-0 z-[200] h-[100dvh] w-[82%] max-w-[360px] overflow-y-auto"
            style={{ background: "#0A0A0A" }}
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.45, ease }}
          >
            <div className="flex flex-col min-h-full px-8 pt-6 pb-10">
              {/* Top row */}
              <div className="flex items-center justify-between mb-10">
                <span
                  style={{
                    fontFamily: '"Cormorant Garamond", serif',
                    fontSize: 13,
                    fontWeight: 500,
                    color: "#E8C97A",
                    letterSpacing: "0.2em",
                  }}
                >
                  MirrorAI
                </span>
                <button
                  onClick={onClose}
                  style={{
                    fontFamily: '"DM Sans", sans-serif',
                    fontSize: 11,
                    fontWeight: 600,
                    color: "rgba(240,237,232,0.5)",
                    letterSpacing: "0.2em",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  CLOSE
                </button>
              </div>

              {/* Main nav — Naman Verma style */}
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
                                fontFamily: '"Cormorant Garamond", serif',
                                fontSize: 42,
                                fontWeight: isActive ? 600 : 300,
                                color: isActive ? "#F0EDE8" : "rgba(240,237,232,0.35)",
                                letterSpacing: "-0.01em",
                                lineHeight: 1.15,
                                display: "block",
                                transition: "color 0.2s ease",
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.color = "#F0EDE8")}
                              onMouseLeave={(e) =>
                                (e.currentTarget.style.color = isActive ? "#F0EDE8" : "rgba(240,237,232,0.35)")
                              }
                            >
                              {item.label}
                            </span>
                          </motion.button>
                        );
                      })}

                      {/* More button */}
                      <motion.button
                        className="block w-full text-left py-2 mt-2"
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: NAV_ITEMS.length * 0.06, duration: 0.4, ease }}
                        onClick={() => setShowMore(true)}
                      >
                        <span
                          style={{
                            fontFamily: '"Cormorant Garamond", serif',
                            fontSize: 42,
                            fontWeight: 300,
                            color: "rgba(240,237,232,0.2)",
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
                      {/* Back */}
                      <button
                        onClick={() => setShowMore(false)}
                        className="flex items-center gap-2 mb-8"
                        style={{
                          fontFamily: '"DM Sans", sans-serif',
                          fontSize: 10,
                          color: "rgba(240,237,232,0.3)",
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
                              fontFamily: '"Cormorant Garamond", serif',
                              fontSize: 36,
                              fontWeight: 300,
                              color: "rgba(240,237,232,0.5)",
                              letterSpacing: "-0.01em",
                              lineHeight: 1.2,
                              display: "block",
                              transition: "color 0.2s ease",
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.color = "#F0EDE8")}
                            onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(240,237,232,0.5)")}
                          >
                            {item.label}
                          </span>
                        </motion.button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </nav>

              {/* Bottom */}
              <div className="mt-auto pt-8 border-t" style={{ borderColor: "rgba(240,237,232,0.06)" }}>
                {studioName && (
                  <p
                    className="mb-3"
                    style={{
                      fontFamily: '"Cormorant Garamond", serif',
                      fontSize: 14,
                      color: "rgba(240,237,232,0.4)",
                      letterSpacing: "0.05em",
                    }}
                  >
                    {studioName}
                  </p>
                )}
                <button
                  onClick={handleSignOut}
                  style={{
                    fontFamily: '"DM Sans", sans-serif',
                    fontSize: 10,
                    color: "rgba(240,237,232,0.25)",
                    letterSpacing: "0.2em",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "#F0EDE8")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(240,237,232,0.25)")}
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
