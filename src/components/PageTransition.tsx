import { useRef, useEffect, useMemo } from "react";
import { useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

/**
 * Depth-based route hierarchy for determining slide direction.
 * Lower depth = closer to "home". Navigating deeper slides right→left,
 * navigating back slides left→right. Same depth cross-fades.
 */
const ROUTE_DEPTH: Record<string, number> = {
  "/home": 0,
  "/dashboard": 0,
  "/dashboard/events": 1,
  "/dashboard/cheetah-live": 1,
  "/dashboard/profile": 1,
  "/dashboard/billing": 1,
  "/dashboard/analytics": 1,
  "/dashboard/clients": 1,
  "/dashboard/branding": 1,
  "/dashboard/notifications": 1,
  "/dashboard/more": 1,
  "/dashboard/settings": 1,
};

function getDepth(pathname: string): number {
  // Exact match first
  if (ROUTE_DEPTH[pathname] !== undefined) return ROUTE_DEPTH[pathname];
  // Check prefix matches (e.g. /dashboard/events/xxx → depth 2)
  const segments = pathname.split("/").filter(Boolean);
  // /dashboard/events/:id → depth 2
  if (segments.length >= 3 && segments[0] === "dashboard") return 2;
  // /dashboard/xxx → depth 1
  if (segments.length >= 2 && segments[0] === "dashboard") return 1;
  // Default
  return 0;
}

// v2 §10 — forward 280ms, back 240ms, both ease-out spring
const SLIDE_DISTANCE = 100; // % of width handled via transform; px fallback for subtlety
const DURATION_FORWARD = 0.28;
const DURATION_BACK = 0.24;
const EASE = [0.32, 0.72, 0, 1]; // iOS-like spring

export function PageTransition({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const prevDepth = useRef(getDepth(location.pathname));
  const currentDepth = getDepth(location.pathname);

  const direction = useMemo(() => {
    const d = currentDepth - prevDepth.current;
    // Update ref after computing direction
    return d;
  }, [currentDepth, location.pathname]);

  useEffect(() => {
    prevDepth.current = currentDepth;
  }, [currentDepth, location.pathname]);

  // Forward (deeper) → slide in from right
  // Backward (shallower) → slide in from left
  // Same depth → cross-fade only
  const enterX = direction > 0 ? SLIDE_DISTANCE : direction < 0 ? -SLIDE_DISTANCE : 0;

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, x: enterX }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -enterX * 0.5 }}
        transition={{ duration: DURATION, ease: EASE }}
        style={{ minHeight: "100vh" }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
