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

// Register service worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' }).then((registration) => {
    registration.update();
    console.log('SW registered');
  }).catch((err) => {
    console.log('SW registration failed:', err);
  });
}

createRoot(document.getElementById("root")!).render(<App />);
