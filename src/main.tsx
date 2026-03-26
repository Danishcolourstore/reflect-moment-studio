import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Apply saved theme immediately to prevent flash
const savedTheme = localStorage.getItem('mirrorai-theme') || localStorage.getItem('theme');
if (savedTheme === 'editorial') {
  document.documentElement.classList.add('editorial');
} else if (savedTheme === 'light') {
  document.documentElement.classList.add('light');
} else if (savedTheme === 'classic') {
  document.documentElement.classList.add('classic');
} else if (savedTheme === 'versace') {
  document.documentElement.classList.add('versace');
} else if (savedTheme === 'darkroom') {
  document.documentElement.classList.add('darkroom');
} else {
  document.documentElement.classList.add('dark');
}

// One-time cleanup of legacy service workers/caches that can keep stale UI in production
if ('serviceWorker' in navigator) {
  // Register performance-optimized service worker
  const cleanupKey = 'mirrorai_sw_v3';
  if (!localStorage.getItem(cleanupKey)) {
    // Clear old registrations first
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      registrations.forEach((registration) => registration.unregister());
    });
    if ('caches' in window) {
      caches.keys().then((keys) => {
        keys.forEach((key) => caches.delete(key));
      });
    }
    localStorage.setItem(cleanupKey, '1');
  }
  // Register new SW
  navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {});
}

// Apply platform classes early (before React hydration) to prevent FOUC
(function detectPlatformEarly() {
  const ua = navigator.userAgent;
  const el = document.documentElement;
  const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  const hasFine = window.matchMedia('(pointer: fine)').matches;

  // OS
  if (/iPad/.test(ua) || (/Macintosh/.test(ua) && hasTouch)) el.classList.add('platform-ios');
  else if (/iPhone|iPod/.test(ua)) el.classList.add('platform-ios');
  else if (/Android/.test(ua)) el.classList.add('platform-android');
  else if (/Mac/.test(ua)) el.classList.add('platform-macos');
  else if (/Win/.test(ua)) el.classList.add('platform-windows');

  // Device
  if (/iPad/.test(ua) || (/Macintosh/.test(ua) && hasTouch)) el.classList.add('device-tablet');
  else if (/iPhone|iPod/.test(ua)) el.classList.add('device-phone');
  else if (/Android/.test(ua) && !/Mobile/.test(ua)) el.classList.add('device-tablet');
  else if (/Android/.test(ua)) el.classList.add('device-phone');
  else el.classList.add('device-desktop');

  // Input
  if (hasTouch && hasFine) el.classList.add('input-hybrid');
  else if (hasTouch) el.classList.add('input-touch');
  else el.classList.add('input-mouse');
})();

createRoot(document.getElementById("root")!).render(<App />);
