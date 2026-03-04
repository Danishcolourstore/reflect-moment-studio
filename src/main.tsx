import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Apply saved ANDHAKAAR theme immediately to prevent flash
if (localStorage.getItem('andhakaar-mode') === 'on' || localStorage.getItem('theme') === 'dark') {
  document.documentElement.classList.add('dark');
}

// Register service worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').then(() => {
    console.log('SW registered');
  }).catch((err) => {
    console.log('SW registration failed:', err);
  });
}

createRoot(document.getElementById("root")!).render(<App />);
