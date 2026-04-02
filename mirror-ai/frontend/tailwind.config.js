/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        luxe: {
          950: "#040507",
          900: "#0A0C10",
          850: "#11151C",
          800: "#161C24",
          700: "#1F2732",
          600: "#2B3442",
          400: "#93A0B2",
          300: "#C2CEDD",
          200: "#D7DEE9",
          100: "#EEF2F8",
        },
        accent: {
          500: "#3CB8FF",
          400: "#5CC7FF",
          300: "#85D7FF",
        },
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(92,199,255,0.2), 0 10px 35px rgba(7,15,28,0.55)",
      },
      fontFamily: {
        sans: ["Inter", "SF Pro Display", "system-ui", "sans-serif"],
      },
      backgroundImage: {
        "luxury-gradient": "radial-gradient(circle at top right, rgba(60,184,255,0.15), transparent 35%), radial-gradient(circle at bottom left, rgba(92,199,255,0.08), transparent 45%)",
      },
    },
  },
  plugins: [],
};
