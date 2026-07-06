/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'outfit': ["'Outfit'", '-apple-system', 'BlinkMacSystemFont', "'Segoe UI'", "'Roboto'", 'sans-serif'],
        'jakarta': ["'Plus Jakarta Sans'", '-apple-system', 'BlinkMacSystemFont', "'Segoe UI'", 'sans-serif'],
      },
      backgroundColor: {
        'glass': 'rgba(255, 255, 255, 0.7)',
        'glass-dark': 'rgba(0, 0, 0, 0.4)',
      },
      backdropBlur: {
        'md': '12px',
      },
      opacity: {
        '70': '0.7',
        '10': '0.1',
      },
    },
  },
  plugins: [],
}