import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Always white editorial theme — remove any dark classes
document.documentElement.classList.remove("dark", "light", "editorial", "classic", "versace", "darkroom", "accent-red");
localStorage.setItem('theme', 'light');
localStorage.setItem('mirrorai-theme', 'light');

// One-time cleanup of legacy service workers/caches
if ('serviceWorker' in navigator) {
  const cleanupKey = 'mirrorai_sw_v3';
  if (!localStorage.getItem(cleanupKey)) {
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
  navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {});
}

// Apply platform classes early
(function detectPlatformEarly() {
  const ua = navigator.userAgent;
  const el = document.documentElement;
  const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  const hasFine = window.matchMedia('(pointer: fine)').matches;

  if (/iPad/.test(ua) || (/Macintosh/.test(ua) && hasTouch)) el.classList.add('platform-ios');
  else if (/iPhone|iPod/.test(ua)) el.classList.add('platform-ios');
  else if (/Android/.test(ua)) el.classList.add('platform-android');
  else if (/Mac/.test(ua)) el.classList.add('platform-macos');
  else if (/Win/.test(ua)) el.classList.add('platform-windows');

  if (/iPad/.test(ua) || (/Macintosh/.test(ua) && hasTouch)) el.classList.add('device-tablet');
  else if (/iPhone|iPod/.test(ua)) el.classList.add('device-phone');
  else if (/Android/.test(ua) && !/Mobile/.test(ua)) el.classList.add('device-tablet');
  else if (/Android/.test(ua)) el.classList.add('device-phone');
  else el.classList.add('device-desktop');

  if (hasTouch && hasFine) el.classList.add('input-hybrid');
  else if (hasTouch) el.classList.add('input-touch');
  else el.classList.add('input-mouse');
})();

createRoot(document.getElementById("root")!).render(<App />);
