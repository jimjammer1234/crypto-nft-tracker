import type { Config } from "tailwindcss";

export default {
  darkMode: "class",
  content: ["./src/renderer/**/*.{html,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: { DEFAULT: "#0d0b14", surface: "#161320", elevated: "#1f1b2e" },
        border: "#2a2438",
        purple: { 400: "#a78bfa", 500: "#8b5cf6", 600: "#7c3aed" },
        blue: { 400: "#60a5fa", 500: "#3b82f6", 600: "#2563eb" },
        yellow: { 400: "#fde047", 500: "#facc15", 600: "#eab308" },
      },
    },
  },
  plugins: [],
} satisfies Config;
