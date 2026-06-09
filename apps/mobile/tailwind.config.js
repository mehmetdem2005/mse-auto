/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Aurora Day — aydınlık tema (8pt grid + Material/HIG ilhamı)
        ink: "#F5F7FB", // uygulama zemini (açık)
        panel: "#FFFFFF", // kartlar
        panel2: "#EEF2F8", // ikincil yüzey
        line: "#E2E8F0", // kenarlık
        accent: "#6366F1", // indigo (birincil)
        accent2: "#8B5CF6", // mor (vurgu/degrade)
        text: "#0F172A", // birincil metin (slate-900)
        muted: "#475569", // ikincil metin (slate-600) — küçük metinde de AA ≥4.5:1
        muted2: "#64748B", // yalnız büyük/dekoratif (AA için küçük metinde kullanma)
        pos: "#16A34A", // olumlu/yeşil
        neg: "#DC2626", // olumsuz/kırmızı
      },
    },
  },
  plugins: [],
};
