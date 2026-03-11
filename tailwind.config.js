
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
  './index.html',
  './src/**/*.{js,ts,jsx,tsx}'
],
  theme: {
    extend: {
      colors: {
        warm: {
          50: '#FCFCFA',
          100: '#FAFAF7',
          200: '#F0F0E8',
          300: '#E6E6D9',
          800: '#4A4A45',
          900: '#2D2D2A',
        },
        role: {
          coral: '#F4845F',
          sage: '#7CB69D',
          sky: '#6BB5E0',
          lavender: '#9B8EC4',
          amber: '#E8B960',
          mint: '#6DC5B2',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'warm': '0 4px 20px -2px rgba(74, 74, 69, 0.05)',
        'warm-lg': '0 10px 30px -5px rgba(74, 74, 69, 0.08)',
      }
    },
  },
  plugins: [],
}
