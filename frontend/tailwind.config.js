/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#0f1115",
        "bg-soft": "#161a22",
        card: "#1c2230",
        text: "#f2f4f8",
        muted: "#a2acc0",
        accent: "#22f4b3",
        "accent-2": "#ffb347",
        border: "rgba(255, 255, 255, 0.08)",
      },
      fontFamily: {
        sans: ["Space Grotesk", "system-ui", "sans-serif"],
        mono: ["IBM Plex Mono", "ui-monospace", "monospace"],
      },
    },
  },
  plugins: [],
};
