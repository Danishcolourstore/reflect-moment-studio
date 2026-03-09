import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Apply saved theme immediately to prevent flash
const savedTheme = localStorage.getItem('mirrorai-theme') || localStorage.getItem('theme');
if (savedTheme === 'editorial') {
  document.documentElement.classList.add('editorial');
} else {
  document.documentElement.classList.add('dark');
}

// One-time cleanup of legacy service workers/caches that can keep stale UI in production
if ('serviceWorker' in navigator) {
  const cleanupKey = 'mirrorai_sw_cleanup_v2';
  if (!localStorage.getItem(cleanupKey)) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      registrations.forEach((registration) => {
        registration.unregister();
      });
    });

    if ('caches' in window) {
      caches.keys().then((keys) => {
        keys.forEach((key) => caches.delete(key));
      });
    }

    localStorage.setItem(cleanupKey, '1');
  }
}

createRoot(document.getElementById("root")!).render(<App />);
