import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Apply saved theme immediately to prevent flash
const savedTheme = localStorage.getItem('mirrorai_theme');
if (savedTheme === 'dark' || localStorage.getItem('andhakaar-mode') === 'on') {
  document.documentElement.classList.add('dark');
} else if (savedTheme === 'blanc') {
  document.documentElement.setAttribute('data-theme', 'blanc');
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
