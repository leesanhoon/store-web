import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      keyframes: {
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
      },
      colors: {
        brand: {
          primary: "#16A34A", // Forest Green (30%)
          accent: "#EA580C",  // Vibrant Orange (10%)
          emerald: "#059669",
          forest: "#064e3b",
          sage: "#86efac",
          light: "#f0fdf4",
        },
        surface: "#F9FAFB",   // Extra Light Gray (Base 60%)
        header: "#1F2937",    // Deep Gray for Typography
      },
      borderRadius: {
        "2xl": "1.5rem",
        "3xl": "2rem",
      },
      backdropBlur: {
        xs: "2px",
      },
      boxShadow: {
        soft: "0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.025)",
        "layered-sm": "0 1px 1px rgba(0,0,0,0.05), 0 2px 2px rgba(0,0,0,0.05), 0 4px 4px rgba(0,0,0,0.05)",
        "layered-md": "0 1px 1px rgba(0,0,0,0.05), 0 2px 2px rgba(0,0,0,0.05), 0 4px 4px rgba(0,0,0,0.05), 0 8px 8px rgba(0,0,0,0.05)",
        "layered-lg": "0 1px 1px rgba(0,0,0,0.04), 0 2px 2px rgba(0,0,0,0.04), 0 4px 4px rgba(0,0,0,0.04), 0 8px 8px rgba(0,0,0,0.04), 0 16px 16px rgba(0,0,0,0.04)",
      }
    },
  },
  plugins: [],
};
export default config;
