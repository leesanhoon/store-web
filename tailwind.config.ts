import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          emerald: "#059669",
          forest: "#064e3b",
          sage: "#86efac",
          light: "#f0fdf4",
        },
        primary: {
          light: "#ECFDF5",
          DEFAULT: "#10B981",
          dark: "#065F46",
        },
        secondary: {
          light: "#F0FDF4",
          DEFAULT: "#15803D",
        },
        surface: "#FAFAF9",
      },
      borderRadius: {
        "2xl": "1.5rem",
        "3xl": "2rem",
      },
      backdropBlur: {
        xs: "2px",
      },
      boxShadow: {
        soft: "0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 10px 10px -5px rgba(0, 0, 0, 0.02)",
      }
    },
  },
  plugins: [],
};
export default config;
