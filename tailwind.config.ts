import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        forensic: {
          dark: "#0a0d14",
          surface: "#111726",
          card: "#161f33",
          border: "#24324f",
          highlight: "#38bdf8",
          accent: "#f59e0b",
          danger: "#ef4444",
          success: "#10b981",
        },
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "glow-flow": "glowFlow 2s ease-in-out infinite alternate",
      },
      keyframes: {
        glowFlow: {
          "0%": { opacity: "0.4", transform: "scaleY(0.95)" },
          "100%": { opacity: "1", transform: "scaleY(1.05)" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
