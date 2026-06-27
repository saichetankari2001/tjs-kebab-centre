/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand:       '#f59e0b',
        'brand-lit': '#fbbf24',
        surface:     '#0f0f0f',
        card:        '#1a1a1a',
        card2:       '#222222',
        border:      '#2a2a2a',
        muted:       '#9ca3af',
      },
      fontFamily: {
        sans:    ['Inter', 'system-ui', 'sans-serif'],
        display: ['"Bebas Neue"', 'Impact', 'sans-serif'],
      },
      keyframes: {
        fadeIn:    { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp:   { from: { transform: 'translateY(40px)', opacity: '0' }, to: { transform: 'translateY(0)', opacity: '1' } },
        stampFill: { from: { transform: 'scale(0) rotate(-15deg)', opacity: '0' }, to: { transform: 'scale(1) rotate(0deg)', opacity: '1' } },
        shimmer:   { '0%': { backgroundPosition: '-400px 0' }, '100%': { backgroundPosition: '400px 0' } },
      },
      animation: {
        fadeIn:    'fadeIn 0.3s ease both',
        slideUp:   'slideUp 0.35s ease both',
        stamp:     'stampFill 0.4s cubic-bezier(0.34,1.56,0.64,1) both',
        shimmer:   'shimmer 1.4s linear infinite',
      },
    },
  },
  plugins: [],
};
