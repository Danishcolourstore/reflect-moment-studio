import { useRef, useEffect, useMemo } from "react";
import { useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

const ROUTE_DEPTH: Record<string, number> = {
  "/home": 0,
  "/dashboard": 0,
  "/dashboard/events": 1,
  "/dashboard/cheetah-live": 1,
  "/dashboard/cheetah": 1,
  "/dashboard/profile": 1,
  "/dashboard/billing": 1,
  "/dashboard/analytics": 1,
  "/dashboard/clients": 1,
  "/dashboard/branding": 1,
  "/dashboard/notifications": 1,
  "/dashboard/more": 1,
  "/dashboard/settings": 1,
  "/dashboard/business": 1,
  "/dashboard/website-builder": 1,
};

function getDepth(pathname: string): number {
  if (ROUTE_DEPTH[pathname] !== undefined) return ROUTE_DEPTH[pathname];
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length >= 3 && segments[0] === "dashboard") return 2;
  if (segments.length >= 2 && segments[0] === "dashboard") return 1;
  if (segments.length >= 2 && segments[0] === "studio") return 1;
  return 0;
}

const DURATION_FORWARD = 0.28;
const DURATION_BACK = 0.24;
const DURATION_CROSS = 0.16;
const EASE = [0.32, 0.72, 0, 1];

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

  const isForward = direction > 0;
  const isBack = direction < 0;
  const isSameDepth = direction === 0;

  const duration = isSameDepth ? DURATION_CROSS : isForward ? DURATION_FORWARD : DURATION_BACK;
  const enterX = isForward ? 80 : isBack ? -40 : 0;

  return (
    <AnimatePresence mode="popLayout" initial={false}>
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, x: enterX }}
        animate={{ opacity: 1, x: 0 }}
        exit={{
          opacity: 0,
          x: isForward ? -40 : isBack ? 80 : 0,
          position: "absolute" as const,
          top: 0,
          left: 0,
          right: 0,
        }}
        transition={{ duration, ease: EASE }}
        style={{ minHeight: "100vh", willChange: "transform, opacity" }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
