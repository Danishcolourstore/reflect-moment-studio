import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// ✅ Apply saved theme immediately (FIXED)
const savedTheme = localStorage.getItem("mirrorai-theme") || localStorage.getItem("theme") || "dark";

const root = document.documentElement;

// Clean old theme classes
root.classList.remove("dark", "light", "editorial");

// Apply correct theme
if (savedTheme === "light" || savedTheme === "classic") {
  root.classList.add("light");
} else if (savedTheme === "editorial") {
  root.classList.add("editorial");
} else {
  root.classList.add("dark");
}

// ✅ Service worker cleanup + register
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

  navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {});
}

// ✅ Platform detection (unchanged)
(function detectPlatformEarly() {
  const ua = navigator.userAgent;
  const el = document.documentElement;
  const hasTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;
  const hasFine = window.matchMedia("(pointer: fine)").matches;

  // OS
  if (/iPad/.test(ua) || (/Macintosh/.test(ua) && hasTouch)) el.classList.add("platform-ios");
  else if (/iPhone|iPod/.test(ua)) el.classList.add("platform-ios");
  else if (/Android/.test(ua)) el.classList.add("platform-android");
  else if (/Mac/.test(ua)) el.classList.add("platform-macos");
  else if (/Win/.test(ua)) el.classList.add("platform-windows");

  // Device
  if (/iPad/.test(ua) || (/Macintosh/.test(ua) && hasTouch)) el.classList.add("device-tablet");
  else if (/iPhone|iPod/.test(ua)) el.classList.add("device-phone");
  else if (/Android/.test(ua) && !/Mobile/.test(ua)) el.classList.add("device-tablet");
  else if (/Android/.test(ua)) el.classList.add("device-phone");
  else el.classList.add("device-desktop");

  // Input
  if (hasTouch && hasFine) el.classList.add("input-hybrid");
  else if (hasTouch) el.classList.add("input-touch");
  else el.classList.add("input-mouse");
})();

// ✅ Render app
createRoot(document.getElementById("root")!).render(<App />);
