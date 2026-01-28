/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./components/**/*.{js,vue,ts}",
    "./layouts/**/*.vue",
    "./pages/**/*.vue",
    "./plugins/**/*.{js,ts}",
    "./app.vue",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#549E54',
          hover: '#428042',
          light: '#e8f5e9',
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#549E54',
          600: '#428042',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        background: {
          light: '#f8f8f8',
          dark: '#121212',
        },
        sidebar: {
          light: '#ffffff',
          dark: '#1e1e1e',
        },
        card: {
          light: '#ffffff',
          dark: '#2a2a2a',
        },
        text: {
          light: '#333333',
          dark: '#e0e0e0',
        },
        subtext: {
          light: '#666666',
          dark: '#a0a0a0',
        },
        border: {
          light: '#e5e7eb',
          dark: '#404040',
        },
        row: {
          beige: '#F4ECDF',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '0.375rem',
      },
    },
  },
  plugins: [],
}
