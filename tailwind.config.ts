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
        cream: {
          50: "#FEFDFB",
          100: "#FAF8F5",
          200: "#F5F0E8",
        },
        rose: {
          pastel: "#D4A5BB",
          light: "#F2E4EC",
          dark: "#8B5A72",
          hover: "#C48FAA",
        },
        lavender: {
          pastel: "#B8AACF",
          light: "#EDE8F5",
          dark: "#6B5A8B",
        },
        dark: "#1E1B24",
      },
      fontFamily: {
        heading: ["Playfair Display", "Georgia", "serif"],
        body: ["Inter", "system-ui", "sans-serif"],
      },
      borderRadius: {
        "4xl": "2rem",
        "5xl": "2.5rem",
      },
      boxShadow: {
        glass: "0 8px 32px rgba(180, 150, 180, 0.12)",
        float: "0 20px 60px rgba(180, 150, 180, 0.20)",
        card: "0 2px 12px rgba(180, 150, 180, 0.10), 0 0 1px rgba(180, 150, 180, 0.15)",
      },
      backdropBlur: {
        glass: "20px",
      },
    },
  },
  plugins: [],
};

export default config;
