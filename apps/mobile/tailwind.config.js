/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Tema token'ları CSS değişkeni (ADR-063) — açık/koyu paletler src/theme'da.
        // rgb(var()) biçimi /10 gibi opaklık varyantlarını korur.
        ink: "rgb(var(--ink) / <alpha-value>)",
        panel: "rgb(var(--panel) / <alpha-value>)",
        panel2: "rgb(var(--panel2) / <alpha-value>)",
        line: "rgb(var(--line) / <alpha-value>)",
        accent: "rgb(var(--accent) / <alpha-value>)",
        accent2: "rgb(var(--accent2) / <alpha-value>)",
        text: "rgb(var(--text) / <alpha-value>)",
        muted: "rgb(var(--muted) / <alpha-value>)",
        muted2: "rgb(var(--muted2) / <alpha-value>)",
        pos: "rgb(var(--pos) / <alpha-value>)",
        neg: "rgb(var(--neg) / <alpha-value>)",
      },
    },
  },
  plugins: [],
};
