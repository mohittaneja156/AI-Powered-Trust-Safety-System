import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      screens:{
        xs: "320px",
        sm: "375px",
        sml: "500px",
        md: "667px",
        mdl: "768px",
        lg: "960px",
        lgl: "1024px",
        xl: "1280px",
      },
      colors: {
        primary: "#2563eb",
        primary_dark: "#1d4ed8",
        secondary: "#f59e0b",
        secondary_dark: "#d97706",
        accent: "#10b981",
        dark: "#1f2937",
        light: "#f8fafc",
        gray_light: "#f1f5f9",
        text_primary: "#1e293b",
        text_secondary: "#64748b",
        text_light: "#94a3b8",
      },
      fontFamily: {
        bodyFont: ["Poppins", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
