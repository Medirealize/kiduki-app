import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-noto-sans-jp)", "sans-serif"],
      },
      fontSize: {
        base: ["1.125rem", { lineHeight: "1.75" }],
        lg: ["1.25rem", { lineHeight: "1.75" }],
        xl: ["1.5rem", { lineHeight: "1.5" }],
      },
      colors: {
        kiduki: {
          blue: "var(--color-kiduki-blue)",
          "blue-light": "var(--color-kiduki-blue-light)",
          "blue-muted": "var(--color-kiduki-blue-muted)",
          surface: "var(--color-kiduki-surface)",
          ink: "var(--color-kiduki-ink)",
          "ink-muted": "var(--color-kiduki-ink-muted)",
        },
      },
      minHeight: {
        touch: "2.75rem",
        "touch-lg": "3rem",
      },
    },
  },
  plugins: [],
};

export default config;
