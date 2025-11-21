import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#000000",
        "background-elevated": "#0a0a0a",
        "background-card": "#111111",
        foreground: "#ffffff",
        "foreground-muted": "#e5e5e5",
        "foreground-subtle": "#a3a3a3",
        primary: "#dc2626",
        "primary-hover": "#ef4444",
        "primary-dark": "#991b1b",
        "primary-light": "#fca5a5",
        border: "#262626",
        "border-hover": "#404040",
        success: "#22c55e",
        warning: "#eab308",
        error: "#dc2626",
        info: "#3b82f6",
      },
      fontFamily: {
        heading: ["Orbitron", "sans-serif"],
        subheading: ["Rajdhani", "sans-serif"],
        sans: ["Inter", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
