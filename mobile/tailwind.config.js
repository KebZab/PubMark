/** @type {import('tailwindcss').Config} */
// Design tokens mirror the web app's src/styles/theme.css so the mobile app
// reads as the same product. Primary teal (#14B8A6) is the source of truth.
module.exports = {
  content: ["./App.tsx", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Primary teal — matches --primary in the web theme
        primary: {
          DEFAULT: "#14B8A6",
          dark: "#0d9488",
          darker: "#0f766e",
          light: "#5eead4",
          surface: "#f0fdfa",
        },
        // Status colors — same semantics as the web app
        status: {
          approved: "#10b981", // emerald
          pending: "#f59e0b", // amber
          rejected: "#ef4444", // red
          vacant: "#22c55e", // green
          occupied: "#ef4444",
          unavailable: "#9ca3af",
        },
      },
    },
  },
  plugins: [],
};
