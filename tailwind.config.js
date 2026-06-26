/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        charcoal: {
          900: '#111111',
          800: '#1C1C1E',
          700: '#2A2A2A',
          600: '#3A3A3A',
        },
        amber: {
          400: '#FCD34D',
          500: '#F59E0B',
          600: '#D97706',
        },
      },
      keyframes: {
        kenburns: {
          '0%':   { transform: 'scale(1.0)' },
          '100%': { transform: 'scale(1.08)' },
        },
        slideUp: {
          '0%':   { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      animation: {
        kenburns: 'kenburns 8s ease-in-out infinite alternate',
        slideUp:  'slideUp 0.3s ease-out',
        fadeIn:   'fadeIn 0.2s ease-out',
      },
    },
  },
  plugins: [],
};
