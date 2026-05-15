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
          DEFAULT: "var(--primary)",
          container: "var(--primary-container)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          container: "var(--secondary-container)",
        },
        tertiary: {
          DEFAULT: "var(--tertiary)",
          container: "var(--tertiary-container)",
        },
        surface: {
          DEFAULT: "var(--surface)",
          container: {
            DEFAULT: "var(--surface-container)",
            low: "var(--surface-container-low)",
            lowest: "var(--surface-container-lowest)",
            high: "var(--surface-container-high)",
          }
        },
        background: "var(--background)",
        "on-surface": {
          DEFAULT: "var(--on-surface)",
          variant: "var(--on-surface-variant)",
        },
        outline: {
          variant: "var(--outline-variant)",
        }
      },
      fontFamily: {
        display: ["var(--font-display)"],
        body: ["var(--font-body)"],
      },
      borderRadius: {
        "3xl": "var(--radius-xl)",
        "2xl": "var(--radius-lg)",
        "xl": "var(--radius-md)",
      },
      boxShadow: {
        ambient: "var(--shadow-ambient)",
      }
    },
  },
  plugins: [],
}
