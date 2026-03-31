/** @type {import("tailwindcss").Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        accent: {
          500: "#a78bfa",
          600: "#8b5cf6",
          700: "#7c3aed",
        },
      },
      boxShadow: {
        premium: "0 18px 48px rgba(20, 20, 26, 0.45)",
      },
    },
  },
  plugins: [],
};
