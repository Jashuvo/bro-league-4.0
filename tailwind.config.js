/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'bro-primary': '#38003c',
        'bro-secondary': '#00ff87',
        'bro-accent': '#ff6b35',
        'bro-dark': '#1a1a1a',
        'bro-card': '#2a2a2a',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [require('daisyui')],
  daisyui: {
    themes: [
      {
        light: {
          ...require("daisyui/src/theming/themes")["light"],
          primary: "#38003c",
          secondary: "#00ff87",
          accent: "#ff6b35",
        },
        dark: {
          ...require("daisyui/src/theming/themes")["dark"],
          primary: "#38003c",
          secondary: "#00ff87",
          accent: "#ff6b35",
          "base-100": "#1a1a1a",
          "base-200": "#2a2a2a",
          "base-300": "#3a3a3a",
        },
      },
    ],
  },
}