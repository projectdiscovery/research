/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#030b18',
          900: '#060d1a',
          800: '#0a1628',
          700: '#0d1f38',
          600: '#112240',
          500: '#162d52',
          400: '#1e3a5f',
          300: '#2a4d7a',
        },
        gold: {
          50: '#fdf8e7',
          100: '#faefc4',
          200: '#f5da7c',
          300: '#f0c040',
          400: '#d4af37',
          500: '#c9a227',
          600: '#b8972e',
          700: '#9a7d25',
          800: '#7c641e',
          900: '#5e4b16',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [],
}
