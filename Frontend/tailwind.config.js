/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#202738",
          hover: "#283144",
          dark: "#171D2B",
        },
        secondary: {
          DEFAULT: "#2B3F74",
          hover: "#385296",
          active: "#4e3ec8",
          subtle: "rgba(43, 63, 116, 0.15)",
        },
        tertiary: {
          DEFAULT: "#FFEEA8",
          hover: "#FFEEA8",
          subtle: "rgba(255, 238, 168, 0.15)",
        },
        orange: {
          DEFAULT: "#D72E2B",
          hover: "#BE2421",
          active: "#cc4948",
          subtle: "rgba(215, 46, 43, 0.15)",
        },
        background: "#202738",
        surface: {
          DEFAULT: "#283144",
          subtle: "#202738",
          deep: "#171D2B",
          hover: "#313C52",
          dark: "#121722",
          card: "rgba(255, 255, 255, 0.04)",
        },
        text: {
          DEFAULT: "#F7F8FC",
          muted: "#A4B0C6",
          subtle: "#71809B",
        },
        border: {
          subtle: "rgba(255, 255, 255, 0.12)",
          hover: "rgba(43, 63, 116, 0.4)",
          strong: "rgba(255, 238, 168, 0.4)",
          focus: "#2B3F74",
        },
        error: "#D72E2B",
        success: "#FFEEA8",
        warning: "#FFA502",
      },
      fontFamily: {
        sans: ["-apple-system", "BlinkMacSystemFont", "'Segoe UI'", "Roboto", "'Helvetica Neue'", "Arial", "sans-serif"],
        display: ["-apple-system", "BlinkMacSystemFont", "'Segoe UI'", "Roboto", "'Helvetica Neue'", "Arial", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
      borderRadius: {
        sm: "0.25rem",
        DEFAULT: "0.5rem",
        md: "0.5rem",
        lg: "0.75rem",
        xl: "1rem",
        "2xl": "1.25rem",
        "3xl": "1.5rem",
        full: "9999px",
      },
      boxShadow: {
        card: "0 2px 12px rgba(0, 0, 0, 0.06)",
        hover: "0 4px 14px rgba(0, 0, 0, 0.15)",
        lift: "0 4px 14px rgba(0, 0, 0, 0.15)",
      },
      zIndex: {
        base: "0",
        'sticky-nav': "100",
        overlay: "200",
        modal: "300",
        toast: "500",
      }
    },
  },
  plugins: [],
}
