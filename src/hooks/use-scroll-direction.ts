import { useState, useEffect, useRef, useCallback } from "react";

type ChromeState = "visible" | "hidden";

interface ScrollDirectionState {
  headerState: ChromeState;
  navState: ChromeState;
  scrollY: number;
}

const HEADER_HIDE_THRESHOLD = 16;
const NAV_HIDE_THRESHOLD = 24;
const REVEAL_THRESHOLD = 8;
const TOP_ZONE = 100;

export function useScrollDirection(enabled: boolean): ScrollDirectionState {
  const [headerState, setHeaderState] = useState<ChromeState>("visible");
  const [navState, setNavState] = useState<ChromeState>("visible");
  const [scrollY, setScrollY] = useState(0);
  const lastY = useRef(0);
  const accumulatedDelta = useRef(0);
  const ticking = useRef(false);

  const onScroll = useCallback(() => {
    if (ticking.current) return;
    ticking.current = true;

    requestAnimationFrame(() => {
      const currentY = window.scrollY;
      const delta = currentY - lastY.current;

      setScrollY(currentY);

      if (currentY < TOP_ZONE) {
        setHeaderState("visible");
        setNavState("visible");
        accumulatedDelta.current = 0;
        lastY.current = currentY;
        ticking.current = false;
        return;
      }

      if (delta > 0) {
        accumulatedDelta.current = Math.max(0, accumulatedDelta.current) + delta;

        if (accumulatedDelta.current > HEADER_HIDE_THRESHOLD) {
          setHeaderState("hidden");
        }
        if (accumulatedDelta.current > NAV_HIDE_THRESHOLD) {
          setNavState("hidden");
        }
      } else if (delta < 0) {
        accumulatedDelta.current = Math.min(0, accumulatedDelta.current) + delta;

        if (Math.abs(accumulatedDelta.current) > REVEAL_THRESHOLD) {
          setHeaderState("visible");
          setNavState("visible");
        }
      }

      lastY.current = currentY;
      ticking.current = false;
    });
  }, []);

  useEffect(() => {
    if (!enabled) {
      setHeaderState("visible");
      setNavState("visible");
      return;
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [enabled, onScroll]);

  return { headerState, navState, scrollY };
}
