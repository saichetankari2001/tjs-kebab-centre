/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand:        '#f59e0b',
        'brand-lit':  '#fbbf24',
        'brand-deep': '#d97706',
        'brand-hot':  '#ea580c',
        surface:      '#0d0600',
        card:         '#1a0d00',
        card2:        '#251500',
        border:       '#3a2000',
        muted:        '#9c8a72',
        'muted-warm': '#b89c7a',
      },
      fontFamily: {
        sans:    ['Inter', 'system-ui', 'sans-serif'],
        display: ['"Bebas Neue"', 'Impact', 'sans-serif'],
      },
      backgroundImage: {
        'warm-glow': 'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(245,158,11,0.08) 0%, transparent 60%)',
        'card-warm': 'linear-gradient(135deg, rgba(245,158,11,0.04) 0%, transparent 60%)',
      },
      boxShadow: {
        'brand-sm':  '0 0 0 1px rgba(245,158,11,0.15), 0 2px 8px rgba(245,158,11,0.08)',
        'brand-glow':'0 0 20px rgba(245,158,11,0.15)',
        'card':      '0 2px 12px rgba(0,0,0,0.4)',
      },
      keyframes: {
        fadeIn:    { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp:   { from: { transform: 'translateY(40px)', opacity: '0' }, to: { transform: 'translateY(0)', opacity: '1' } },
        slideIn:   { from: { transform: 'translateX(-20px)', opacity: '0' }, to: { transform: 'translateX(0)', opacity: '1' } },
        stampFill: { from: { transform: 'scale(0) rotate(-15deg)', opacity: '0' }, to: { transform: 'scale(1) rotate(0deg)', opacity: '1' } },
        shimmer:   { '0%': { backgroundPosition: '-400px 0' }, '100%': { backgroundPosition: '400px 0' } },
        pulse:     { '0%,100%': { opacity: '1' }, '50%': { opacity: '0.5' } },
      },
      animation: {
        fadeIn:    'fadeIn 0.3s ease both',
        slideUp:   'slideUp 0.4s cubic-bezier(0.16,1,0.3,1) both',
        slideIn:   'slideIn 0.4s cubic-bezier(0.16,1,0.3,1) both',
        stamp:     'stampFill 0.4s cubic-bezier(0.34,1.56,0.64,1) both',
        shimmer:   'shimmer 1.4s linear infinite',
      },
    },
  },
  plugins: [],
};
