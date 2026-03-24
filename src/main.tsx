import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Theme
const savedTheme = localStorage.getItem("mirrorai-theme") || localStorage.getItem("theme") || "dark";

const rootEl = document.documentElement;
rootEl.classList.remove("dark", "light", "editorial");

if (savedTheme === "light" || savedTheme === "classic") {
  rootEl.classList.add("light");
} else if (savedTheme === "editorial") {
  rootEl.classList.add("editorial");
} else {
  rootEl.classList.add("dark");
}

// Remove ALL service workers + cache
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.getRegistrations().then((regs) => {
    regs.forEach((reg) => reg.unregister());
  });

  if ("caches" in window) {
    caches.keys().then((keys) => {
      keys.forEach((key) => caches.delete(key));
    });
  }
}

// Platform detection
(function detectPlatformEarly() {
  const ua = navigator.userAgent;
  const el = document.documentElement;
  const hasTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;
  const hasFine = window.matchMedia("(pointer: fine)").matches;

  if (/iPad/.test(ua) || (/Macintosh/.test(ua) && hasTouch)) el.classList.add("platform-ios");
  else if (/iPhone|iPod/.test(ua)) el.classList.add("platform-ios");
  else if (/Android/.test(ua)) el.classList.add("platform-android");
  else if (/Mac/.test(ua)) el.classList.add("platform-macos");
  else if (/Win/.test(ua)) el.classList.add("platform-windows");

  if (/iPad/.test(ua) || (/Macintosh/.test(ua) && hasTouch)) el.classList.add("device-tablet");
  else if (/iPhone|iPod/.test(ua)) el.classList.add("device-phone");
  else if (/Android/.test(ua) && !/Mobile/.test(ua)) el.classList.add("device-tablet");
  else if (/Android/.test(ua)) el.classList.add("device-phone");
  else el.classList.add("device-desktop");

  if (hasTouch && hasFine) el.classList.add("input-hybrid");
  else if (hasTouch) el.classList.add("input-touch");
  else el.classList.add("input-mouse");
})();

// Render (NO QueryClientProvider)
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
