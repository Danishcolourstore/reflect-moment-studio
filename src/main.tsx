import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

/* =========================================
   THEME SYSTEM (FIXED + ALIGNED WITH CSS)
   ========================================= */

const savedTheme = localStorage.getItem("mirrorai-theme") || localStorage.getItem("theme") || "default";

const root = document.documentElement;

/* Remove all possible theme classes */
root.classList.remove("versace", "classic", "darkroom");

/* Apply correct theme */
if (savedTheme === "classic") {
  root.classList.add("classic");
} else if (savedTheme === "versace") {
  root.classList.add("versace");
} else if (savedTheme === "darkroom") {
  root.classList.add("darkroom");
}
/* default = :root (no class needed) */

/* =========================================
   SERVICE WORKER (CLEAN + SAFE)
   ========================================= */

if ("serviceWorker" in navigator) {
  const cleanupKey = "mirrorai_sw_v3";

  if (!localStorage.getItem(cleanupKey)) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      registrations.forEach((registration) => registration.unregister());
    });

    if ("caches" in window) {
      caches.keys().then((keys) => {
        keys.forEach((key) => caches.delete(key));
      });
    }

    localStorage.setItem(cleanupKey, "1");
  }

  navigator.serviceWorker.register("/sw.js").catch(() => {});
}

/* =========================================
   PLATFORM DETECTION (UNCHANGED)
   ========================================= */

(function detectPlatformEarly() {
  const ua = navigator.userAgent;
  const el = document.documentElement;

  const hasTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;
  const hasFine = window.matchMedia("(pointer: fine)").matches;

  /* OS */
  if (/iPad/.test(ua) || (/Macintosh/.test(ua) && hasTouch)) el.classList.add("platform-ios");
  else if (/iPhone|iPod/.test(ua)) el.classList.add("platform-ios");
  else if (/Android/.test(ua)) el.classList.add("platform-android");
  else if (/Mac/.test(ua)) el.classList.add("platform-macos");
  else if (/Win/.test(ua)) el.classList.add("platform-windows");

  /* Device */
  if (/iPad/.test(ua) || (/Macintosh/.test(ua) && hasTouch)) el.classList.add("device-tablet");
  else if (/iPhone|iPod/.test(ua)) el.classList.add("device-phone");
  else if (/Android/.test(ua) && !/Mobile/.test(ua)) el.classList.add("device-tablet");
  else if (/Android/.test(ua)) el.classList.add("device-phone");
  else el.classList.add("device-desktop");

  /* Input */
  if (hasTouch && hasFine) el.classList.add("input-hybrid");
  else if (hasTouch) el.classList.add("input-touch");
  else el.classList.add("input-mouse");
})();

/* =========================================
   RENDER APP
   ========================================= */

createRoot(document.getElementById("root")!).render(<App />);
