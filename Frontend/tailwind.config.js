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
          DEFAULT: "#2F3640",
          hover: "#353B48",
          dark: "#242A32",
        },
        secondary: {
          DEFAULT: "#6C5CE7",
          hover: "#5b4bd8",
          active: "#4e3ec8",
          subtle: "rgba(108, 92, 231, 0.15)",
        },
        tertiary: {
          DEFAULT: "#55E6C1",
          hover: "#45d4af",
          subtle: "rgba(85, 230, 193, 0.15)",
        },
        orange: {
          DEFAULT: "#FF7675",
          hover: "#e05a59",
          active: "#cc4948",
          subtle: "rgba(255, 118, 117, 0.15)",
        },
        background: "#2F3640",
        surface: {
          DEFAULT: "#353B48",
          subtle: "#2B313A",
          deep: "#242A32",
          hover: "#3F4956",
          dark: "#1E232A",
          card: "rgba(255, 255, 255, 0.04)",
        },
        text: {
          DEFAULT: "#F5F6FA",
          muted: "#A4B0BE",
          subtle: "#718093",
        },
        border: {
          subtle: "rgba(255, 255, 255, 0.12)",
          hover: "rgba(108, 92, 231, 0.4)",
          strong: "rgba(85, 230, 193, 0.4)",
          focus: "#6C5CE7",
        },
        error: "#FF7675",
        success: "#55E6C1",
        warning: "#FFA502",
      },
      fontFamily: {
        sans: ["-apple-system", "BlinkMacSystemFont", "'Segoe UI'", "Roboto", "'Helvetica Neue'", "Arial", "sans-serif"],
        display: ["-apple-system", "BlinkMacSystemFont", "'Segoe UI'", "Roboto", "'Helvetica Neue'", "Arial", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
      borderRadius: {
        DEFAULT: "0px",
        none: "0px",
        sm: "0px",
        md: "0px",
        lg: "0px",
        xl: "0px",
        "2xl": "0px",
        "3xl": "0px",
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
