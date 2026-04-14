import { useRef, useEffect, useMemo } from "react";
import { useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

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
  if (ROUTE_DEPTH[pathname] !== undefined) return ROUTE_DEPTH[pathname];
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length >= 3 && segments[0] === "dashboard") return 2;
  if (segments.length >= 2 && segments[0] === "dashboard") return 1;
  return 0;
}

const SLIDE_DISTANCE = 40;
const DURATION = 0.15;
const EASE = [0.25, 0.46, 0.45, 0.94];

export function PageTransition({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const prevDepth = useRef(getDepth(location.pathname));
  const currentDepth = getDepth(location.pathname);

  const direction = useMemo(() => {
    return currentDepth - prevDepth.current;
  }, [currentDepth, location.pathname]);

  useEffect(() => {
    prevDepth.current = currentDepth;
  }, [currentDepth, location.pathname]);

  const enterX = direction > 0 ? SLIDE_DISTANCE : direction < 0 ? -SLIDE_DISTANCE : 0;

  return (
    <AnimatePresence mode="sync" initial={false}>
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, x: enterX }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -enterX * 0.4 }}
        transition={{ duration: DURATION, ease: EASE }}
        style={{ minHeight: "100vh", willChange: "transform, opacity" }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
