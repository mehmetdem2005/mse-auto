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
        // Accent dolgusu üstündeki içerik (ADR-116): açıkta beyaz, koyuda ink — tema-duyarlı.
        onAccent: "rgb(var(--on-accent) / <alpha-value>)",
        text: "rgb(var(--text) / <alpha-value>)",
        muted: "rgb(var(--muted) / <alpha-value>)",
        muted2: "rgb(var(--muted2) / <alpha-value>)",
        pos: "rgb(var(--pos) / <alpha-value>)",
        neg: "rgb(var(--neg) / <alpha-value>)",
        warn: "rgb(var(--warn) / <alpha-value>)",
      },
      // Sabit tip ölçeği (web-design standardı): ara değer uydurulmaz, bu
      // adımlardan seçilir. Gövde satır-yüksekliği ≥1.45×, başlık ≈1.2×.
      fontSize: {
        overline: ["10px", { lineHeight: "14px", letterSpacing: "1.5px" }],
        caption: ["11px", { lineHeight: "15px" }],
        "body-sm": ["13px", { lineHeight: "19px" }],
        body: ["15px", { lineHeight: "22px" }],
        title: ["17px", { lineHeight: "22px" }],
        headline: ["22px", { lineHeight: "27px" }],
        display: ["26px", { lineHeight: "31px" }],
      },
    },
  },
  plugins: [],
};
