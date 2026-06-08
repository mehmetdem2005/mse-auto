/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        ink: "#0a0c10",
        panel: "#12151b",
        panel2: "#171b22",
        line: "#242a33",
        accent: "#ffb020",
        text: "#e7eaef",
        muted: "#828c9a",
        pos: "#46c99a",
        neg: "#e5614d",
      },
    },
  },
  plugins: [],
};
