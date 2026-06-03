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
          DEFAULT: '#6C63FF',
          50: '#f3f2ff',
          100: '#ebe9fe',
          200: '#d9d6fe',
          300: '#bdb5fd',
          400: '#9d8cfb',
          500: '#6C63FF',
          600: '#5a4de8',
          700: '#4c3fd1',
          800: '#3f34aa',
          900: '#352e87',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
