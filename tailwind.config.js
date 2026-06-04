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
          50:  'rgba(108,99,255,0.08)',
          100: 'rgba(108,99,255,0.15)',
          200: 'rgba(108,99,255,0.25)',
          300: '#a78bfa',
          400: '#9d8cfb',
          500: '#6C63FF',
          600: '#5a4de8',
          700: '#4c3fd1',
          800: '#3f34aa',
          900: '#352e87',
        },
        surface: {
          DEFAULT: '#13131a',
          50:  '#1a1a26',
          100: '#1e1e2e',
          200: '#252535',
          300: '#2d2d42',
          400: '#3a3a52',
        },
        border: {
          DEFAULT: 'rgba(255,255,255,0.07)',
          light:   'rgba(255,255,255,0.12)',
          strong:  'rgba(108,99,255,0.3)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-mesh': `
          radial-gradient(ellipse at 20% 50%, rgba(108,99,255,0.08) 0%, transparent 50%),
          radial-gradient(ellipse at 80% 20%, rgba(167,139,250,0.06) 0%, transparent 50%),
          radial-gradient(ellipse at 50% 80%, rgba(99,102,241,0.05) 0%, transparent 50%)
        `,
      },
      boxShadow: {
        'glow':    '0 0 20px rgba(108,99,255,0.35), 0 0 60px rgba(108,99,255,0.1)',
        'glow-sm': '0 0 12px rgba(108,99,255,0.3)',
        'card':    '0 4px 24px rgba(0,0,0,0.4)',
        'card-hover': '0 8px 40px rgba(0,0,0,0.5), 0 0 20px rgba(108,99,255,0.15)',
        'modal':   '0 25px 80px rgba(0,0,0,0.7)',
      },
      animation: {
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'float':      'float 3s ease-in-out infinite',
        'slide-up':   'slide-up 0.4s ease-out forwards',
        'fade-in':    'fade-in 0.3s ease-out forwards',
        'shimmer':    'shimmer 1.8s infinite',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 10px rgba(108,99,255,0.3)' },
          '50%':       { boxShadow: '0 0 25px rgba(108,99,255,0.6), 0 0 50px rgba(108,99,255,0.2)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%':       { transform: 'translateY(-8px)' },
        },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
}
