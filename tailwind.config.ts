import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#172033",
        canvas: "#f7f8fc",
        brand: { 50: "#eef3ff", 100: "#dfe8ff", 500: "#5865f2", 600: "#4752d9", 700: "#3945ba" },
      },
      boxShadow: { soft: "0 12px 35px rgba(23, 32, 51, .08)" },
    },
  },
  plugins: [],
};

export default config;
